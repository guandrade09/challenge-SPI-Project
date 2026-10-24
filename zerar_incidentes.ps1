$root    = Split-Path -Parent $MyInvocation.MyCommand.Path
$db      = "$root\backend\src\api\config\database.sqlite"
$imgsNew = "$root\backend\src\api\uploads\imgens"
$imgsOld = "$root\backend\src\uploads"

if (-not (Test-Path $db)) {
    Write-Host "Banco nao encontrado - nada a fazer."
    exit 0
}

# Apaga registros da tabela detections via Python (sqlite3 built-in, sem deps externas)
Write-Host "Zerando tabela detections..."
python -c "
import sqlite3
con = sqlite3.connect(r'$db')
cur = con.execute('DELETE FROM detections')
con.commit()
print(f'  {cur.rowcount} registros removidos.')
con.close()
"

# Apaga fotos
Write-Host "Removendo fotos..."
$removed = $false
foreach ($path in @($imgsNew, $imgsOld)) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path
        Write-Host "  Removido: $path"
        $removed = $true
    }
}
if (-not $removed) { Write-Host "  Nenhuma pasta de fotos encontrada." }

Write-Host "Pronto. Cameras, zonas e usuarios intactos."
