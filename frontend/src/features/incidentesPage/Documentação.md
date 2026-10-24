# Histórico de Incidentes — documentação técnica

Atualizado em 07/10/2026 a partir do código do projeto `frontend/src/features/incidentesPage`.

## Visão geral

A página lista incidentes recebidos de `detectionService.list()`. O backend salva uma linha por causa detectada; `groupIncidentRows` reúne as linhas de um mesmo incidente em um card e compõe seu `label`. A página permite filtrar, selecionar incidentes em lote, abrir detalhes, exportar frames em ZIP e excluir incidentes.

## Arquitetura

| Arquivo | Responsabilidade |
| --- | --- |
| `IncidentesPage.jsx` | Carregamento, agrupamento, filtros, paginação, seleção e coordenação de download e exclusão. |
| `components/IncidentFilters.jsx` | Select de EPI/estado, chips removíveis, filtros de fonte e câmera, Só alertas, Selecionar todos, Downloads e Deletar selecionados. |
| `components/IncidentCard.jsx` | Prévia, seleção pelo clique no card, checkbox no canto superior esquerdo, realce e botões de detalhes e exclusão individual. |
| `components/IncidentModal.jsx` | Detalhes em portal, organizados por imagem e câmera. |
| `components/IncidentCameraDetails.jsx` | EPIs, REBA e zona exclusivos da câmera da imagem ao lado. |
| `utils/frameOverlayData.js` | Associação por `source`/`camera_id`, seleção do tracking por vista e compatibilidade com registros antigos. |
| `components/IncidentDownloadModal.jsx` | Portal com as três opções de exportação, quantidade selecionada e estados de processamento/erro. |
| `components/IncidentDeleteModal.jsx` | Confirmação de exclusão individual ou em lote, com estados de processamento/erro. |
| `components/IncidentCanvas.jsx` | Imagem e canvas da prévia de detalhes. |
| `utils/drawIncidentOverlays.js` | Mesma rotina de overlays usada no canvas da prévia e na exportação. |
| `utils/skeletonUtils.js` | Desenho do esqueleto COCO de 17 pontos. |
| `utils/groupIncidents.js` | Agrupamento e chave `incidentKey` baseada em caminho, timestamp e câmera. |
| `utils/incidentFiltering.js` | Opções de EPI, classificação do estado de alerta e predicados de filtro. |
| `utils/incidentExport.js` | Busca dos frames, renderização marcada, criação do ZIP e disparo do download. |
| `frontend/src/services/detectionService.js` | `list()` e `remove(ids)`, que chama `DELETE /api/detections`. |
| `backend/src/api/routes/detection.routes.js` | Rota de exclusão protegida por `authMiddleware`. |
| `backend/src/api/controllers/detection.controller.js` | Validação HTTP e resposta da exclusão. |
| `backend/src/api/services/detection.service.js` | Validação de IDs e remoção segura de frames órfãos. |
| `backend/src/api/repositories/detection.repository.js` | Deleção transacional de todas as linhas de cada incidente e checagem de referências. |

## Dados e classificação

O payload de `detectionService.list()` pode ser um array ou objeto com `data` ou `incidents`. Cada linha agora expõe seu `id` do SQLite, além de `timestamp`, `label`, `confidence`, `source`, `camera_id`, `img_path`, opcionalmente `img_path_lateral`, `criticidade` e `details`. `details` pode incluir `epi[]` (com `label`, `confidence`, `bbox`), `ergonomia[]` (REBA, queda, bbox, keypoints) e `zona[]` (invasão e geometria). A página usa `incidentKey` após o agrupamento; o `id` da primeira linha funciona como representante do card para a exclusão, enquanto o backend expande o grupo completo.

O Select oferece valores de EPI extraídos de `details.epi[].label` e dos rótulos agrupados, removendo sufixos como `AUSENTE` e `ERRADO`. Os estados disponíveis são **Segura**, **Atenção** e **Crítica**. A classificação usa `criticidade` ou `details.status`: `MONITORANDO` → Segura; `ALERTA_CRITICO`/`ALERTA_MULTIPLO` → Crítica; demais valores iniciados por `ALERTA` → Atenção. Registros antigos sem estado usam queda, invasão ou REBA ≥ 7 para Crítica; EPI ausente/errado ou REBA ≥ 4 para Atenção; caso contrário, Segura.

## Coerência das imagens e detalhes no popup

Cada vista do popup reúne sua imagem, controles de marcações e detalhes da mesma câmera. `details.frames` descreve os slots de imagem `frontal` (imagem principal) e `lateral` (segunda imagem), com `source` real, `camera_id`, `width`, `height`, `sampled_at` e eventuais `analysis_errors`. Uma imagem principal pode pertencer à câmera lateral quando ela é a única do setor; `details.image_source` e `frames.frontal.source` identificam esse caso.

`getIncidentCameraDetails` seleciona EPI e zona pela câmera e utiliza `details.tracking[source]` como fonte de REBA, caixa e esqueleto. Isso evita mostrar o score agregado de uma vista junto das coordenadas de outra. A renderização usa as dimensões registradas para converter coordenadas à resolução da imagem. Imagem e canvas compartilham `object-contain` e a mesma resolução natural.

O orquestrador preserva cada resultado assíncrono junto ao frame analisado. Na confirmação, envia a evidência para um worker da própria câmera, com fila limitada a oito tarefas pendentes. Os alertas e marcações ao vivo continuam enquanto esse worker prepara o histórico. Ele salva o snapshot da análise que originou o incidente e calcula a camada complementar nesse mesmo snapshot, quando necessário. O veredito salvo considera apenas riscos presentes nessa evidência. Se a camada complementar falhar, ela fica vazia, e seu aviso aparece na câmera correspondente. Os dados faciais mais recentes não substituem o label `PESSOA` porque não comprovam a identidade no instante do snapshot.

Desde 07/10/2026, cada câmera cadastrada tem captura, análise, confirmação e persistência próprias, identificadas pelo `camera_id`. Duas câmeras do mesmo setor não precisam detectar juntas, nem a lateral depende de uma frontal conectada ou cadastrada. Os novos incidentes contêm a evidência da câmera que confirmou o risco; o suporte a duas imagens permanece para registros antigos. O frontend ao vivo também guarda pose, veredito e métricas por ID, para que um resultado da outra câmera não substitua o seu. A causa, os limites da fila e os testes estão descritos em `orquestrador/README.md`.

Registros antigos com duas imagens e EPI/zona sem identificação de câmera têm esses detalhes listados separadamente, sem marcações atribuídas por suposição. Coordenadas antigas calculadas sobre um frame diferente não podem ser corrigidas sem a imagem original daquela análise. A sincronização vale para novos incidentes após reiniciar o orquestrador.

## Estado e fluxo da página

| Estado | Uso |
| --- | --- |
| `all`, `loading` | Incidentes agrupados e carregamento inicial. |
| `activeFilters` | Chips `{key, type, value, label}` para EPI ou alerta; substitui a busca textual `search`. |
| `filterSource`, `filterCamera`, `filterAlert` | Filtros de fonte e câmera e botão Só alertas. |
| `page` | Índice da página; `PAGE_SIZE = 20`. |
| `selected` | Incidente aberto no modal de detalhes. |
| `selectedKeys` | Conjunto de chaves dos incidentes selecionados. |
| `downloadOpen`, `downloadBusy`, `downloadError` | Modal e andamento da exportação. |
| `deleteTargets`, `deleteBusy`, `deleteError`, `deleteNotice` | Incidentes a excluir, andamento, erro e aviso de limpeza incompleta de arquivos. |

O resultado `filtered` é calculado **antes** da paginação. Filtros da mesma categoria usam OU; entre EPI, estado, fonte, câmera e Só alertas usa-se E. Um chip clicado remove apenas seu filtro. Qualquer alteração de filtro limpa a seleção e volta à primeira página, impedindo exportação de itens fora do resultado atual. A paginação mostra somente a fatia de 20 itens; a seleção individual ou em lote pode abranger várias páginas.

**Selecionar todos** inclui todos os resultados filtrados, inclusive os que estão em outras páginas. Quando todos estão selecionados, o botão muda para **Desmarcar todos** e o clique limpa a seleção. O card mostra checkbox no canto superior esquerdo e borda azul. Clicar na foto ou nas informações do card também alterna sua seleção; os botões **Detalhes** e **Deletar** são controles independentes e não alteram a seleção. O contador mostra quantos itens do resultado atual estão selecionados. Exportação e exclusão em lote recebem somente a interseção entre `selectedKeys` e `filtered`.

O filtro legado **Só alertas** permanece com sua regra anterior: invasão de zona, queda ou EPI ausente em `details`. Por isso, pode combinar-se com o novo estado de alerta e retornar zero itens. O filtro de fonte preserva as opções extraídas de `source`; o filtro de câmera usa `camera_id`.

## Props relevantes

| Componente | Props |
| --- | --- |
| `IncidentFilters` | `activeFilters`, `options`, `onAddFilter`, `onRemoveFilter`, `source`, `onSourceChange`, `sources`, `camera`, `cameras`, `onCameraChange`, `onlyAlerts`, `onToggleAlerts`, `selectedCount`, `filteredCount`, `allFilteredSelected`, `onToggleSelectAll`, `onOpenDownloads`, `onDeleteSelected`. |
| `IncidentCard` | `incident`, `onClick` (detalhes), `isSelected`, `onToggleSelect`, `onDelete`. |
| `IncidentDownloadModal` | `selectedCount`, `busy`, `error`, `onClose`, `onDownload(mode)`. |
| `IncidentDeleteModal` | `count`, `busy`, `error`, `onClose`, `onConfirm`. |
| `IncidentCanvas` | `imgUrl`, `details`, `source` (padrão `frontal`). |
| `IncidentModal` | `incident`, `onClose`. |

## Exportação

O botão **Downloads** abre um modal com **Baixar com Bounding Box**, **Baixar normal** e **Baixar ambos**. Sem incidentes selecionados, as três ações ficam desabilitadas. Durante a preparação, o modal indica o estado e bloqueia novos cliques. Falhas aparecem no modal; o ZIP só é oferecido após todos os frames serem processados.

Para cada incidente selecionado, `incidentExport` usa `streamService.imagePathToUrl` e busca o frame frontal; inclui também o lateral quando `img_path_lateral` está presente. A opção normal grava os bytes originais. A opção marcada desenha no canvas na resolução nativa e salva PNG. O desenho é o mesmo do modal: caixas de EPI, REBA/esqueleto e zona pertencentes à câmera de cada imagem. A imagem principal usa a fonte indicada em seus metadados, inclusive quando a câmera única é lateral. A opção **Baixar ambos** inclui as duas versões em pastas separadas:

```text
incidentes.zip
├── original/
│   ├── frame_0001_<timestamp>_frontal.jpg
│   └── frame_0001_<timestamp>_lateral.jpg
└── bounding_box/
    ├── frame_0001_<timestamp>_frontal.png
    └── frame_0001_<timestamp>_lateral.png
```

Cada opção isolada inclui apenas sua pasta. Os nomes contêm índice, timestamp tratado e vista para evitar colisões. `createZip` escreve ZIP sem compressão, pois as imagens já são comprimidas; não há nova dependência. O formato clássico usado limita a 65.535 arquivos e 4 GB. A implementação monta o ZIP em memória. A leitura de imagens requer que o servidor permita CORS para a origem do frontend; o backend atual configura `localhost:3300`.

## Exclusão individual e em lote

O botão **Deletar** fica ao lado de **Detalhes** em cada card. **Deletar selecionados** fica ao lado de **Downloads** e permanece desabilitado sem seleção. Ambos abrem uma confirmação antes da ação permanente. O modal bloqueia novos cliques durante a operação, mostra erros e permite cancelar antes de confirmar. O clique no botão de exclusão não seleciona o card.

`detectionService.remove(ids)` envia `DELETE /api/detections` com `{ ids: number[] }`. Cada ID é o da primeira linha do incidente agrupado. A rota exige token Bearer pelo `authMiddleware`. O backend valida IDs inteiros positivos, localiza os representantes e, em uma transação SQLite, remove **todas as linhas** com o mesmo `img_path`, `timestamp` e `camera_id`; para registros sem imagem, usa `timestamp`, `camera_id` e `label`. Se algum ID não existir, a transação é revertida e nenhum registro do lote é excluído. A resposta informa `deletedRows` e `deletedIncidents`.

Após confirmar a transação, o backend verifica cada caminho frontal/lateral removido. Só apaga o arquivo físico se nenhuma detecção restante o referenciar e se o caminho real estiver dentro de `backend/src/api/uploads`. Arquivos fora desse diretório não são apagados. Falhas nessa etapa não restauram as linhas já excluídas; a resposta retorna `filesNotRemoved`, e a página mostra um aviso. Isso evita apagar um frame compartilhado por outro incidente.

Na exclusão em lote, a página envia apenas os incidentes **selecionados no resultado filtrado**, inclusive os de outras páginas. Após sucesso, remove os cards da lista local, retira da seleção apenas os itens excluídos e fecha a confirmação. Se o incidente aberto em detalhes foi excluído, fecha também o modal de detalhes. Em erro, mantém os cards e a confirmação aberta com a mensagem do servidor.

## Dependências e serviços

React 19, `react-dom` (portais), `lucide-react`, Zustand (`useUiStore`), `detectionService.list()/remove()` e `streamService.imagePathToUrl()`. No backend, Express, SQLite e o middleware JWT existentes. O módulo não adicionou dependências. O build usa Vite 8 e o lint usa ESLint 9. O desenho do esqueleto reutiliza `skeletonUtils.js`.

## Validação realizada

- `npm run build` no frontend: **passou**. O Vite apresentou apenas aviso de bundle acima de 500 kB.
- ESLint direcionado aos arquivos frontend alterados nesta rodada: **passou**.
- Verificação de sintaxe dos arquivos backend alterados: **passou**.
- Em banco SQLite temporário: exclusão do grupo inteiro de linhas, lote com dois incidentes, reversão quando um ID não existe e preservação de arquivos ainda referenciados: **passaram**.
- Em diretório temporário: exclusão de arquivo órfão dentro de uploads e preservação de arquivo fora desse diretório: **passaram**.
- Na rota HTTP: requisição sem token retornou 401; corpo com ID inválido e token válido retornou 400. Nenhum dado real foi excluído.
- Verificações funcionais com dados sintéticos: filtros por EPI e alerta, composição com fonte e câmera, classificação do estado e resultado com 23 incidentes (mais de uma página de 20): **passaram**.
- ZIP sintético com arquivos nas duas pastas: geração, extração e conferência dos bytes: **passaram**. Com frames/canvas simulados, os fluxos **normal**, **bounding box** e **ambos** incluíram as vistas frontal e lateral nas pastas esperadas.
- `npm run lint` do frontend inteiro: **não passou** por erros já existentes em outros módulos (por exemplo, câmera, eventos, home, stores). Eles não foram alterados neste trabalho.
- Em 06/10/2026, o popup foi conferido no navegador com uma cópia local de um incidente salvo e com imagens sintéticas 4:3 e verticais. A separação de detalhes por câmera, a navegação e o alinhamento das marcações foram verificados. Nenhum incidente real foi alterado ou excluído.
- Em 07/10/2026, passaram 33 testes Python do orquestrador e 18 testes JavaScript do store de câmeras e das marcações dos incidentes. Os testes simularam uma câmera bloqueada, cadastro/remoção independente e evidência demorada com alertas ao vivo continuando. O build do frontend e o lint direcionado de estado/WebSocket/overlay também passaram. A captura RTSP física não fez parte dessa validação.

## Próximos passos sugeridos

1. Exercitar as três opções de download com dados reais, inclusive frames laterais e overlays de zona, e conferir visualmente os PNGs resultantes.
2. Para lotes grandes, gerar o ZIP no servidor ou por streaming para reduzir memória no navegador e contornar possíveis diferenças de CORS em outros ambientes.
3. Criar um ID de incidente agrupado no contrato da API para seleção e rastreabilidade mais robustas.
4. Adicionar testes automatizados de integração da página, com múltiplas páginas, mudança de filtros durante a seleção e falhas de carregamento de imagem.
5. Testar a exclusão com incidentes reais em ambiente de homologação e avaliar trilha de auditoria ou recuperação para operações permanentes.
