import os


def _windows_efficiency_classes() -> dict[int, int]:
    """Classe de eficiência por núcleo lógico no Windows (maior = núcleo P, mais rápido).
    Vazio se não for Windows ou a consulta falhar."""
    if os.name != "nt":
        return {}
    try:
        import ctypes
        import ctypes.wintypes as wt

        kernel32 = ctypes.windll.kernel32
        size = wt.DWORD(0)
        kernel32.GetLogicalProcessorInformationEx(0, None, ctypes.byref(size))  # RelationProcessorCore
        buf = ctypes.create_string_buffer(size.value)
        if not kernel32.GetLogicalProcessorInformationEx(0, buf, ctypes.byref(size)):
            return {}
        classes, offset = {}, 0
        while offset < size.value:
            entry_size = ctypes.c_uint32.from_buffer(buf, offset + 4).value
            efficiency = ctypes.c_ubyte.from_buffer(buf, offset + 9).value
            mask = ctypes.c_uint64.from_buffer(buf, offset + 32).value  # GroupMask[0].Mask
            for i in range(64):
                if mask >> i & 1:
                    classes[i] = efficiency
            offset += entry_size
        return classes
    except Exception:
        return {}


def compute_orchestrator_cores() -> list[int]:
    total = os.cpu_count() or 1

    # CPU híbrida (Intel 12ª geração+): a metade "de cima" dos núcleos lógicos são os
    # núcleos E (econômicos, ~50% mais lentos medido num i5-13420H). Nesse caso o
    # orquestrador usa todos os núcleos P — o backend Node (que fixa a metade de baixo,
    # ver backend/src/api/utils/cpuAffinity.js) usa pouca CPU, e afinidade não é exclusiva.
    classes = _windows_efficiency_classes()
    if classes and len(set(classes.values())) > 1:
        fastest = max(classes.values())
        p_cores = sorted(i for i, c in classes.items() if c == fastest and i < total)
        if p_cores:
            return p_cores

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
