"""Processa evidência sem interromper o loop de análise da câmera."""

import queue
import threading


class IncidentEvidenceWorker:
    def __init__(self, handler, *, max_pending=8, name="incidentes", on_error=None):
        self._handler = handler
        self._on_error = on_error
        self._queue = queue.Queue(maxsize=max_pending)
        self._stop_event = threading.Event()
        self._state_lock = threading.Lock()
        self._thread = threading.Thread(target=self._run, name=name, daemon=True)

    def start(self):
        self._thread.start()

    def submit(self, job):
        with self._state_lock:
            if self._stop_event.is_set():
                return False
            try:
                self._queue.put_nowait(job)
            except queue.Full:
                return False
        return True

    def stop(self):
        """Não espera inferência em andamento; cancela as tarefas ainda na fila."""
        with self._state_lock:
            self._stop_event.set()
            while True:
                try:
                    self._queue.get_nowait()
                    self._queue.task_done()
                except queue.Empty:
                    break

    def is_alive(self):
        return self._thread.is_alive()

    def join(self, timeout=None):
        self._thread.join(timeout)

    def _run(self):
        while not self._stop_event.is_set():
            try:
                job = self._queue.get(timeout=0.1)
            except queue.Empty:
                continue
            try:
                if not self._stop_event.is_set():
                    self._handler(job)
            except Exception as error:
                try:
                    if self._on_error:
                        self._on_error(error)
                    else:
                        print(f"[INCIDENTE] {self._thread.name}: falha ao processar evidência: {error}")
                except Exception:
                    pass
            finally:
                self._queue.task_done()
