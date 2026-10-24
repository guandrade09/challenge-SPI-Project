def build_incident_tracking(pessoas_frontal, pessoas_lateral, camera_ids=None):
    """Preserva coordenadas de cada vista sem misturar as poses do veredito."""
    return {
        source: [
            {
                "pessoa_id": person.get("pessoa_id"),
                "bbox": person.get("bbox"),
                "keypoints": person.get("keypoints"),
                "reba_score": person.get("reba_score"),
                "reba_level": person.get("reba_level"),
                "confianca": person.get("confianca_deteccao", person.get("confianca")),
                "queda": person.get("queda", False),
                "source": source,
                "camera_id": (camera_ids or {}).get(source),
            }
            for person in people
        ]
        for source, people in (("frontal", pessoas_frontal), ("lateral", pessoas_lateral))
    }


def synchronize_incident_view(*, epi_observation, pose_observation, current_frame,
                              prefer_epi, epi_enabled, pose_enabled,
                              run_epi, run_pose):
    """Todas as coordenadas retornadas pertencem à imagem de evidência escolhida.

    Os modelos assíncronos podem ter analisado instantes diferentes. Reutiliza o
    resultado do snapshot escolhido e calcula só a análise que falta nele.
    """
    selected = (epi_observation if prefer_epi and epi_observation else
                pose_observation or epi_observation)
    frame = selected["frame"] if selected else current_frame
    sampled_at = selected.get("sampled_at") if selected else None
    analysis_errors = {}

    if not epi_enabled:
        detections = []
    elif epi_observation and epi_observation["frame"] is frame:
        detections = epi_observation["detections"]
    else:
        try:
            detections = run_epi(frame)
        except Exception:
            detections = []
            analysis_errors["epi"] = "Análise de EPI indisponível nesta imagem."

    if not pose_enabled:
        raw, people = None, []
    elif pose_observation and pose_observation["frame"] is frame:
        raw, people = pose_observation["raw"], pose_observation["people"]
    else:
        try:
            raw, people = run_pose(frame)
        except Exception:
            raw, people = None, []
            analysis_errors["pose"] = "Análise de postura indisponível nesta imagem."

    return {"frame": frame, "sampled_at": sampled_at,
            "detections": detections, "raw": raw, "people": people,
            "analysis_errors": analysis_errors}
