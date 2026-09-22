
# Módulo de Histórico de Incidentes - Documentação Técnica (Dev)

Documentação técnica completa do módulo de **Histórico de Incidentes**, responsável pela listagem, filtragem, renderização gráfica e detalhamento de eventos de segurança, ergonomia e invasão de áreas.

---

## 1. Visão Geral do Módulo

O módulo gerencia a recuperação e exibição de registros de incidentes capturados por visões computacionais (câmeras). Ele aplica visualizações overlay via HTML5 Canvas em tempo real sobre frames do vídeo para destacar:

* **EPIs** (Equipamentos de Proteção Individual) ausentes ou em uso (Câmera Frontal).
* **Ergonomia/REBA** e **Detecção de Quedas** através da renderização de esqueleto corporal (Câmera Lateral).
* **Invasão de Zonas de Risco**.

---

## 2. Arquitetura e Estrutura de Arquivos

```text
src/
└── features/
    └── incidentesPage/
        ├── IncidentesPage.jsx         # Página principal (Gerenciador de estado e layout)
        ├── components/
        │   ├── index.js               # Exportações centralizadas dos componentes
        │   ├── IncidentCanvas.jsx     # Renderizador HTML5 Canvas para Overlays
        │   ├── IncidentCard.jsx       # Card da listagem em grid
        │   ├── IncidentFilters.jsx    # Barra de busca e filtros
        │   └── IncidentModal.jsx      # Modal detalhada via React Portal
        └── utils/
            └── skeletonUtils.js       # Constantes e algoritmo de renderização do esqueleto

```

---

## 3. Tipos e Estruturas de Dados

### `Incident` (Objeto Principal)

```typescript
interface Incident {
  timestamp: string | number;
  label: string;
  confidence: number;
  source: string; // Ex: 'frontal' | 'lateral'
  camera_id?: string;
  img_path: string;
  img_path_lateral?: string;
  details?: IncidentDetails;
}

interface IncidentDetails {
  epi?: Array<{
    label: string;      // Ex: "capacete_ausente" ou "óculos"
    confidence: number; // Ex: 0.95
    bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  }>;
  ergonomia?: Array<{
    pessoa_id?: number;
    reba_score?: number;
    reba_level?: string;
    queda?: boolean;
    bbox?: [number, number, number, number];
    keypoints?: Array<[number, number, number]>; // [x, y, confidence] (17 pontos)
  }>;
  zona?: Array<{
    pessoa_id?: number;
    invadiu: boolean;
    epis_ausentes?: string[];
  }>;
}

```

---

## 4. Componentes

### 4.1. `IncidentesPage` (`IncidentesPage.jsx`)

Container principal responsável por orquestrar a paginação, busca e filtros na API.

* **Estados Principais:**
* `all`: Lista completa dos incidentes retornados pelo serviço.
* `search`: Termo de busca textual por `label`.
* `filterSource`: Filtro por fonte/câmera.
* `filterAlert`: Booleano para filtrar apenas itens com alertas críticos.
* `page`: Índice da página atual.
* `selected`: Incidente selecionado para exibição na modal.
* **Paginação:**
* Constante `PAGE_SIZE = 20`.
* Recalcula a página atual e o total de páginas dinamicamente de acordo com os filtros aplicados.

---

### 4.2. `IncidentCanvas` (`IncidentCanvas.jsx`)

Componente responsável por desenhar a imagem base e projetar as marcações bounding box, métricas REBA e esqueleto dinamicamente no Canvas HTML5.

* **Props:**
* `imgUrl` (`string`): URL da imagem do frame.
* `details` (`IncidentDetails`): Objeto contendo bounding boxes, keypoints e labels.
* `source` (`'frontal' | 'lateral'`): Determina a lógica de renderização a ser executada.
* **Lógica de Renderização no Canvas:**

1. **Redimensionamento:** Ajusta a resolução nativa do canvas (`canvas.width`/`height`) para bater com a resolução nativa da imagem (`img.naturalWidth`/`height`).
2. **Câmera Frontal (`source === 'frontal'`):**

* Desenha a Bounding Box (`strokeRect`).
* Define cor vermelha (`#ef4444`) se `label` contiver "ausente"; caso contrário, verde (`#10b981`).
* Desenha tag superior preenchida com a porcentagem da confiança.

3. **Câmera Lateral (`source === 'lateral'`):**

* Calcula a cor REBA: Red ($\ge 7$), Orange ($\ge 4$), Green ($< 4$).
* Desenha a Bounding Box tracejada (`ctx.setLineDash([5, 3])`).
* Executa `drawSkeleton()` usando os `keypoints`.
* Âncora a tag com o ID da pessoa, pontuação REBA e indicador `⚠QUEDA`.

4. **Camada de Zona de Risco (`details.zona`):**

* Caso `invadiu === true`, desenha uma borda laranja pontilhada em toda a extensão do canvas e insere uma barra de alerta inferior.

---

### 4.3. `IncidentCard` (`IncidentCard.jsx`)

Componente individual para exibição simplificada do registro no Grid.

* **Props:**
* `incident` (`Incident`): Dados do incidente.
* `onClick` (`function`): Callback disparado ao clicar no card.
* **Comportamento Destaque de Alerta:**
* Aplica borda vermelha suave (`border-red-500/40`) se houver invasão de zona ou queda.
* Aplica borda amarela suave (`border-yellow-500/40`) se houver EPIs ausentes.

---

### 4.4. `IncidentFilters` (`IncidentFilters.jsx`)

Barra de controle de filtros de busca.

* **Props:**
* `search`: `string`
* `onSearchChange`: `(value: string) => void`
* `source`: `string`
* `onSourceChange`: `(value: string) => void`
* `sources`: `string[]` (Lista única de fontes extraída dinamicamente dos dados)
* `onlyAlerts`: `boolean`
* `onToggleAlerts`: `() => void`

---

### 4.5. `IncidentModal` (`IncidentModal.jsx`)

Modal exibida via **React Portal** (`createPortal` para `document.body`) com os detalhes aprofundados do incidente.

* **Funcionalidades:**
* Renderiza o `IncidentCanvas` para a visão frontal e, se disponível (`img_path_lateral`), renderiza o `IncidentCanvas` para a visão lateral.
* Painel lateral de métricas formatadas por categorias: EPIs Detectados, Ergonomia/REBA e Zonas de Risco.

---

## 5. Utilitários (`skeletonUtils.js`)

Módulo utilitário para desenho de esqueletos estruturados no formato COCO (17 keypoints).

### Constantes Exportadas

* `KP_CONF_THRESHOLD = 0.4`: Limiar de confiança mínimo para exibição de um ponto articular ou linha de conexão.
* `SKELETON_EDGES`: Matriz de pares indexados definindo as conexões entre articulações:

| Conexão                 | Pontos do Corpo                                 |
| ------------------------ | ----------------------------------------------- |
| `[0,1]`, `[0,2]`     | Nariz → Olhos                                  |
| `[1,3]`, `[2,4]`     | Olhos → Orelhas                                |
| `[5,6]`                | Ombro Esquerdo → Ombro Direito                 |
| `[5,7]`, `[7,9]`     | Braço Esquerdo (Ombro → Cotovelo → Pulso)    |
| `[6,8]`, `[8,10]`    | Braço Direito (Ombro → Cotovelo → Pulso)     |
| `[5,11]`, `[6,12]`   | Tronco (Ombros → Quadris)                      |
| `[11,12]`              | Quadril Esquerdo → Quadril Direito             |
| `[11,13]`, `[13,15]` | Perna Esquerda (Quadril → Joelho → Tornozelo) |
| `[12,14]`, `[14,16]` | Perna Direita (Quadril → Joelho → Tornozelo)  |

### `drawSkeleton(ctx, keypoints, rebaColor)`

* Itera sobre `SKELETON_EDGES` e traça as linhas caso a confiança de ambos os pontos seja maior ou igual a `KP_CONF_THRESHOLD`.
* Desenha um círculo preenchido em branco com borda colorida (`rebaColor`) sobre cada articulação válida.

---

## 6. Dependências Externa e Serviços

* **Bibliotecas Third-Party:**
* `lucide-react`: Ícones da interface (`Search`, `Filter`, `X`, `AlertTriangle`, `Shield`, `Activity`, `MapPin`, etc.).
* `React`: Hooks `useEffect`, `useRef`, `useCallback`, `useState`.
* **Serviços Globais Esperados:**
* `streamService.imagePathToUrl(path)`: Converte caminhos relativos em URLs absolutas para consumo no `<img />`.
* `detectionService.list()`: Promise contendo o payload `{ data: Incident[] }`.
* `useUiStore`: Store Zustand para controle do tema global (`theme`).
* `formatLabel`, `formatIncidentLabel`, `formatTs`: Funções utilitárias de formatação visual de textos e datas.
