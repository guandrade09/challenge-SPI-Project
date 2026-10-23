"""Lock de inferência (fila da GPU) que mede espera e uso por tipo de tarefa.

Substitui o threading.Lock compartilhado por pose, EPI, facial e evidências de incidente.
Funciona igual (`with lock:`), e guarda por nome de thread quanto tempo cada tarefa
esperou pra entrar na fila e quanto tempo segurou a GPU — é o que explica atraso de REBA/EPI
quando a inferência em si é rápida mas a fila está disputada.
"""
import re
import threading
import time
from collections import defaultdict

# "pose-22_0" → "pose-22", "Thread-12 (_capture_loop)" → "Thread (_capture_loop)"
_THREAD_SUFFIX = re.compile(r"_\d+$|-\d+(?= \()")


class InstrumentedLock:
    def __init__(self):
        self._lock = threading.Lock()
        self._stats_lock = threading.Lock()
        self._stats = defaultdict(lambda: {"n": 0, "wait": [], "hold": []})
        self._local = threading.local()

    def acquire(self, blocking: bool = True, timeout: float = -1) -> bool:
        t0 = time.perf_counter()
        ok = self._lock.acquire(blocking, timeout)
        if ok:
            self._local.wait_ms = (time.perf_counter() - t0) * 1000
            self._local.acquired_at = time.perf_counter()
        return ok

    def release(self) -> None:
        hold_ms = (time.perf_counter() - self._local.acquired_at) * 1000
        wait_ms = self._local.wait_ms
        self._lock.release()
        name = _THREAD_SUFFIX.sub("", threading.current_thread().name)
        with self._stats_lock:
            s = self._stats[name]
            s["n"] += 1
            s["wait"].append(wait_ms)
            s["hold"].append(hold_ms)

    def __enter__(self):
        self.acquire()
        return self

    def __exit__(self, *exc):
        self.release()

    def locked(self) -> bool:
        return self._lock.locked()

    def snapshot_and_reset(self, window_s: float) -> dict:
        """Resumo por tarefa desde a última chamada: usos/s, % do tempo segurando a GPU,
        espera e uso (p50/p95/máx em ms)."""
        with self._stats_lock:
            stats, self._stats = self._stats, defaultdict(lambda: {"n": 0, "wait": [], "hold": []})

        def q(values, p):
            values = sorted(values)
            return round(values[int(p * (len(values) - 1))], 1)

        return {
            name: {
                "por_s": round(s["n"] / window_s, 2),
                "ocupacao_pct": round(sum(s["hold"]) / (window_s * 1000) * 100, 1),
                "espera_p50": q(s["wait"], .5), "espera_p95": q(s["wait"], .95), "espera_max": q(s["wait"], 1),
                "uso_p50": q(s["hold"], .5), "uso_p95": q(s["hold"], .95), "uso_max": q(s["hold"], 1),
            }
            for name, s in stats.items() if s["n"]
        }
