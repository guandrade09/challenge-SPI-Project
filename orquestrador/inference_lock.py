"""Lock de inferência (fila da GPU) com prioridade por tarefa e medição de espera/uso.

Substitui o threading.Lock compartilhado por pose, EPI, facial e evidências de incidente.
Funciona igual (`with lock:`), com duas diferenças:

- Prioridade: quando a GPU libera, entra primeiro quem tem prioridade maior — pose (REBA,
  zona, queda), depois EPI, evidências de incidente e por último o reconhecimento facial,
  que segura a GPU 4–5x mais tempo por vez (~80–120ms) e não perde nada esperando (a
  identidade de uma pessoa não muda de um instante pro outro). A prioridade vem do nome da
  thread, então quem chama não muda. Quem espera mais que MAX_WAIT_S passa à frente de
  todos, pra nenhuma tarefa ficar sem GPU.
- Medição: guarda por tarefa quanto tempo esperou pra entrar e quanto tempo segurou a GPU.
"""
import re
import threading
import time
from collections import defaultdict

# "pose-22_0" → "pose-22", "Thread-12 (_capture_loop)" → "Thread (_capture_loop)"
_THREAD_SUFFIX = re.compile(r"_\d+$|-\d+(?= \()")

# Menor número = entra antes. Nomes vêm das threads criadas no orquestrador
# (ThreadPoolExecutor "pose-<câmera>"/"epi-<câmera>", "incident-camera-...", "facial-...").
_PRIORITIES = (("pose-", 0), ("epi-", 1), ("incident-", 2), ("facial", 3))
_DEFAULT_PRIORITY = 1
MAX_WAIT_S = 1.0


def _priority_of(thread_name: str) -> int:
    for prefix, priority in _PRIORITIES:
        if thread_name.startswith(prefix):
            return priority
    return _DEFAULT_PRIORITY


class InstrumentedLock:
    def __init__(self):
        self._cond = threading.Condition(threading.Lock())
        self._locked = False
        self._waiting = defaultdict(int)  # prioridade efetiva → threads esperando
        self._stats_lock = threading.Lock()
        self._stats = defaultdict(lambda: {"n": 0, "wait": [], "hold": []})
        self._local = threading.local()

    def acquire(self, blocking: bool = True, timeout: float = -1) -> bool:
        t0 = time.perf_counter()
        priority = _priority_of(threading.current_thread().name)
        deadline = None if timeout < 0 else t0 + timeout
        with self._cond:
            self._waiting[priority] += 1
            try:
                while True:
                    blocked_by_higher = any(n for p, n in self._waiting.items() if p < priority)
                    if not self._locked and not blocked_by_higher:
                        break
                    if not blocking:
                        return False
                    now = time.perf_counter()
                    if deadline is not None and now >= deadline:
                        return False
                    if priority > 0 and now - t0 >= MAX_WAIT_S:
                        # esperou demais: passa a contar como prioridade máxima
                        self._waiting[priority] -= 1
                        priority = 0
                        self._waiting[priority] += 1
                        continue
                    wait_for = MAX_WAIT_S if deadline is None else min(MAX_WAIT_S, deadline - now)
                    self._cond.wait(wait_for)
                self._locked = True
            finally:
                self._waiting[priority] -= 1
        self._local.wait_ms = (time.perf_counter() - t0) * 1000
        self._local.acquired_at = time.perf_counter()
        return True

    def release(self) -> None:
        hold_ms = (time.perf_counter() - self._local.acquired_at) * 1000
        wait_ms = self._local.wait_ms
        with self._cond:
            self._locked = False
            self._cond.notify_all()
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
        return self._locked

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
