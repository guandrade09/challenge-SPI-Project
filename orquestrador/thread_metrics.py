import os
import threading
from datetime import datetime, timedelta, timezone

import psutil
import requests

THREAD_NAME = "machineLearning_processor"
COLLECT_INTERVAL_SECONDS = 100
BATCH_INTERVAL_SECONDS = 300
THREADS_URL = "http://localhost:3000/api/threads"

_BRASILIA_TZ = timezone(timedelta(hours=-3))


def _format_brasilia_timestamp():
    now = datetime.now(_BRASILIA_TZ)
    return now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}-03:00"


class MLThreadMetricsService:
    def __init__(self):
        self._process = psutil.Process()
        self._metrics = []
        self._lock = threading.Lock()
        self._collect_timer = None
        self._batch_timer = None

    def start(self):
        self._process.cpu_percent(interval=None)  # descarta a primeira leitura (sempre 0.0)
        self._collect_metric()
        self._schedule_collect()
        self._schedule_batch()

    def stop(self):
        if self._collect_timer:
            self._collect_timer.cancel()
        if self._batch_timer:
            self._batch_timer.cancel()

    def _schedule_collect(self):
        self._collect_timer = threading.Timer(COLLECT_INTERVAL_SECONDS, self._on_collect_tick)
        self._collect_timer.daemon = True
        self._collect_timer.start()

    def _on_collect_tick(self):
        self._collect_metric()
        self._schedule_collect()

    def _schedule_batch(self):
        self._batch_timer = threading.Timer(BATCH_INTERVAL_SECONDS, self._on_batch_tick)
        self._batch_timer.daemon = True
        self._batch_timer.start()

    def _on_batch_tick(self):
        self._send_metrics_batch()
        self._schedule_batch()

    def _get_current_cpu_load(self):
        cpu_percent = self._process.cpu_percent(interval=None) / (os.cpu_count() or 1)
        return round(cpu_percent, 2)

    def _get_process_loaded(self):
        return os.cpu_count() or 1

    def _collect_metric(self):
        metric = {
            "timestamp": _format_brasilia_timestamp(),
            "thread_name": THREAD_NAME,
            "quantity_of_cpu_ind_percentage": self._get_current_cpu_load(),
            "process_loaded": self._get_process_loaded(),
        }
        with self._lock:
            self._metrics.append(metric)
            if len(self._metrics) > 1000:
                self._metrics.pop(0)

    def _send_metrics_batch(self):
        with self._lock:
            metrics = list(self._metrics)

        if not metrics:
            print("[ML THREAD METRICS] Nenhuma métrica para enviar no batch de 5 minutos.")
            return

        total_process_loaded = sum(m["process_loaded"] for m in metrics)
        avg_cpu_load = sum(m["quantity_of_cpu_ind_percentage"] for m in metrics) / len(metrics)

        payload = {
            "thread_name": THREAD_NAME,
            "timestamp": metrics[-1]["timestamp"],
            "quantity_of_cpu_ind_percentage": round(avg_cpu_load, 2),
            "process_loaded": total_process_loaded,
        }

        try:
            response = requests.post(THREADS_URL, json=payload, timeout=10)
            response.raise_for_status()
            with self._lock:
                del self._metrics[: len(metrics)]
        except requests.RequestException as e:
            print(f"[ML THREAD METRICS] Falha ao enviar batch de métricas: {e}")


ml_thread_metrics_service = MLThreadMetricsService()
