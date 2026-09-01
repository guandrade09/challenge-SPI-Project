# Realtime Detection Service

Serviço Node.js para monitoramento em tempo real de detecções no banco de dados SQLite.

## Visão geral

Este serviço monitora continuamente a tabela `detections` do banco de dados e detecta novas entradas em tempo real, mantendo uma fila circular de até 20 detecções mais recentes.

## Funcionalidades

- **Monitoramento contínuo**: Verifica novas detecções a cada 150ms
- **Fila circular**: Mantém histórico de até 20 detecções (remove a mais antiga quando cheia)
- **Detecção por ID**: Usa IDs auto-increment para identificar novas entradas
- **Logs em tempo real**: Exibe labels de novas detecções no console
- **Conexão SQLite**: Integra com o banco de dados da API principal

## Como executar

### Comando principal
```bash
node -e "import('./backend/src/services/realtime-service.js').then(m => m.default.start()).catch(console.error)"
```

### Em background (recomendado)
```bash
node -e "import('./backend/src/services/realtime-service.js').then(m => m.default.start()).catch(console.error)" &
```

### Para desenvolvimento/teste (com timeout)
```bash
node -e "import('./backend/src/services/realtime-service.js').then(m => { m.default.start(); setTimeout(() => m.default.stop(), 5000); }).catch(console.error)"
```

## Funcionamento

1. **Inicialização**: Conecta ao banco e identifica o último ID de detecção
2. **Polling**: A cada 150ms verifica se há novos registros (ID > último conhecido)
3. **Processamento**: Para cada nova detecção:
   - Adiciona à fila circular
   - Exibe log: `[TEMPO REAL] Nova detecção: {label}`
   - Atualiza o último ID conhecido
4. **Limpeza**: Remove detecções antigas quando fila atinge 20 itens

## Estrutura da fila

```javascript
[
  { id: 25, timestamp: "2026-05-04T...", label: "capacete" },
  { id: 26, timestamp: "2026-05-04T...", label: "luva" },
  // ... até 20 itens
]
```

## Integração

### Com a API
O serviço monitora a mesma tabela `detections` usada pela API Express em `backend/src/api/`.

### Com WebSockets/SSE (futuro)
O código está preparado para integração com WebSockets ou Server-Sent Events:

```javascript
// Exemplo de integração com Socket.IO
sendRealtimeUpdate(label) {
  if (this.io) {
    this.io.emit('new-detection', { label });
  }
}
```

## Configuração

- **Intervalo**: 150ms (configurável na linha 18)
- **Tamanho máximo da fila**: 20 itens (configurável na linha 6)
- **Banco de dados**: SQLite em `backend/src/api/config/database.sqlite`

## Dependências

- Node.js com suporte a ES modules
- SQLite3 e sqlite (através do import de `../api/utils/connection.js`)

## Logs de exemplo

```
Iniciando serviço de detecções em tempo real...
Último ID inicializado: 30
Serviço iniciado. Verificando novas detecções a cada 150ms.
[TEMPO REAL] Nova detecção: capacete
[TEMPO REAL] Nova detecção: luva
```

## Parada graceful

O serviço responde a sinais SIGINT e SIGTERM para parada limpa:

```bash
# Pressione Ctrl+C para parar
```

## Troubleshooting

### Serviço não inicia
- Verifique se o banco `database.sqlite` existe
- Confirme que está executando do diretório raiz do projeto
- Use `node -c backend/src/services/realtime-service.js` para verificar sintaxe

### Não detecta novas detecções
- Verifique se a API está salvando corretamente no banco
- Confirme que o serviço está rodando (veja logs de inicialização)
- Teste inserindo manualmente no banco e veja se aparece

### Performance
- 150ms é otimizado para responsividade vs carga no banco
- Para sistemas críticos, considere reduzir ainda mais ou usar triggers do banco</content>
<parameter name="filePath">c:\Users\lucas\OneDrive\Área de Trabalho\challenge-SPI-Project\challenge-SPI-Project\backend\src\services\README.md