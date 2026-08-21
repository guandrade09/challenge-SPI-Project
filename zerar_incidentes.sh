#!/usr/bin/env bash
# Zera só o histórico de incidentes: tabela detections + fotos.
# Câmeras, zonas e usuários são preservados.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_PATH="$SCRIPT_DIR/backend/src/api/config/database.sqlite"

# Dois locais de upload: o correto (api/uploads) e o legado (src/uploads, bug de path antigo)
IMGS_NEW="$SCRIPT_DIR/backend/src/api/uploads/imgens"
IMGS_OLD="$SCRIPT_DIR/backend/src/uploads"

if [ ! -f "$DB_PATH" ]; then
  echo "Banco não encontrado — nada a fazer."
  exit 0
fi

echo "Zerando tabela detections..."
# Roda de dentro do backend para encontrar o better-sqlite3 local
cd "$SCRIPT_DIR/backend"
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./src/api/config/database.sqlite', (err) => {
  if (err) { console.error('Erro ao abrir banco:', err.message); process.exit(1); }
});
db.run('DELETE FROM detections', function(err) {
  if (err) { console.error('Erro ao deletar:', err.message); process.exit(1); }
  console.log('  ' + this.changes + ' registros removidos.');
  db.close();
});
"
cd "$SCRIPT_DIR"

echo "Removendo fotos..."
removed=0
if [ -d "$IMGS_NEW" ]; then
  rm -rf "$IMGS_NEW"
  echo "  Removido: backend/src/api/uploads/imgens"
  removed=1
fi
if [ -d "$IMGS_OLD" ]; then
  rm -rf "$IMGS_OLD"
  echo "  Removido: backend/src/uploads (legado)"
  removed=1
fi
[ "$removed" -eq 0 ] && echo "  Nenhuma pasta de fotos encontrada."

echo "Pronto. Câmeras, zonas e usuários intactos."
