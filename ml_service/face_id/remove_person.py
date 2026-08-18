"""Remove uma pessoa e todas as suas amostras cadastradas.

Uso:
    python -m ml_service.face_id.remove_person "Nome da Pessoa"
"""
import sys

from ml_service.face_id.database import FaceDatabase


def main():
    if len(sys.argv) < 2:
        print('Uso: python -m ml_service.face_id.remove_person "Nome da Pessoa"')
        return

    name = sys.argv[1].strip()
    database = FaceDatabase()

    if name not in database.names():
        print(f"'{name}' não está cadastrado. Pessoas cadastradas: {', '.join(database.names()) or '(nenhuma)'}")
        return

    amostras = len(database.history(name))
    confirm = input(f"Remover '{name}' e suas {amostras} amostras? (s/N) ").strip().lower()
    if confirm != "s":
        print("Cancelado.")
        return

    database.remove(name)
    print(f"✓ '{name}' removido do cadastro.")


if __name__ == "__main__":
    main()
