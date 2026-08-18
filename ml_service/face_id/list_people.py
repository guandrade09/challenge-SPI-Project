"""Lista as pessoas cadastradas e o histórico de cadastro de cada amostra.

Uso:
    python -m ml_service.face_id.list_people
    python -m ml_service.face_id.list_people "Nome da Pessoa"
"""
import sys

from ml_service.face_id.database import FaceDatabase


def main():
    database = FaceDatabase()
    name_filter = sys.argv[1] if len(sys.argv) > 1 else None

    rows = database.history(name_filter)
    if not rows:
        print("Nenhum cadastro encontrado.")
        return

    print(f"{'Nome':<20} {'Cadastrado em':<20} {'Por':<15}")
    print("-" * 55)
    for name, created_at, enrolled_by in rows:
        print(f"{name:<20} {created_at:<20} {enrolled_by:<15}")


if __name__ == "__main__":
    main()
