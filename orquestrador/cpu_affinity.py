import os


def compute_orchestrator_cores() -> list[int]:
    total = os.cpu_count() or 1
    half = max(1, total // 2)
    return list(range(half, total)) or [total - 1]


def apply() -> list[int]:
    cores = compute_orchestrator_cores()
    n = len(cores)

    for var in ("OMP_NUM_THREADS", "MKL_NUM_THREADS", "OPENBLAS_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
        os.environ.setdefault(var, str(n))

    try:
        import psutil
        psutil.Process().cpu_affinity(cores)
        print(f"[CPU] Orquestrador fixado nos núcleos {cores} ({n}/{os.cpu_count()} lógicos)")
    except (ImportError, AttributeError, NotImplementedError, OSError) as e:
        print(f"[CPU] Aviso: não foi possível fixar afinidade de CPU ({e}); seguindo sem pinning.")

    return cores
