export const mockDownloads = [
  {
    id: 1,
    fileName: "relatorio_epis_abril_2026.pdf",
    date: "2026-05-10",
    size: "2.4 MB",
    type: "Relatório Mensal",
    status: "completed"
  },
  {
    id: 2,
    fileName: "deteccoes_capacete_semana18.csv",
    date: "2026-05-08",
    size: "1.1 MB",
    type: "Dados CSV",
    status: "completed"
  },
  {
    id: 3,
    fileName: "analise_camera_setor_A.json",
    date: "2026-05-05",
    size: "856 KB",
    type: "JSON Logs",
    status: "completed"
  },
  {
    id: 4,
    fileName: "relatorio_infrações_Q1_2026.pdf",
    date: "2026-05-01",
    size: "3.2 MB",
    type: "Relatório Trimestral",
    status: "completed"
  }
];



export const cameras = [
  {
    id: 1,
    name: "Câmera Setor A - Entrada",
    status: "online",
    fps: 30,
    resolution: "1920x1080",
    detections: 156,
    uptime: 99.8
  },
  {
    id: 2,
    name: "Câmera Setor B - Produção",
    status: "online",
    fps: 30,
    resolution: "1920x1080",
    detections: 287,
    uptime: 99.5
  },
  {
    id: 3,
    name: "Câmera Setor C - Armazém",
    status: "warning",
    fps: 15,
    resolution: "1920x1080",
    detections: 94,
    uptime: 87.3
  },
  {
    id: 4,
    name: "Câmera Setor D - Saída",
    status: "offline",
    fps: 0,
    resolution: "1920x1080",
    detections: 0,
    uptime: 0
  }
];


export const teamMembers = [
  { id: 1, name: "Gabriel Lacerda", role: "Desenvolvedor Front-end", initials: "GL", githubUrl:"https://github.com/lacerdex", linkedinUrl:"https://www.linkedin.com/in/gabriellcarimatea/" },
  { id: 2, name: "Lucas Rodrigues", role: "Desenvolvedor Back-end", initials: "LR", githubUrl:"https://github.com/lusca04", linkedinUrl:"https://www.linkedin.com/in/lucas-santos-rodrigues-3a0132243/" },
  { id: 3, name: "Mayene G. Doria", role: "Tech Lead de Machine Learning", initials: "MG", githubUrl:"https://github.com/MayeneD", linkedinUrl:"https://linkedIn.com/in/maygdoria" },
  { id: 4, name: "Gustavo Andrade", role: "Analista de Machine Learning", initials: "GA", githubUrl:"https://github.com/guandrade09", linkedinUrl:"https://linkedin.com/in/gustavo-andrade-de-sousa" },
  { id: 5, name: "Thais Helena", role: "Analista de Machine Learning", initials: "TH", githubUrl:"//github.com/thiiss", linkedinUrl:"//br.linkedin.com/in/thais-helena-vieira" },
  { id: 6, name: "Geovana Carvalho", role: "Analista de Machine Learning", initials: "GC", githubUrl:"https://github.com/GeovanaPederneschi", linkedinUrl:"https://linkedin.com/in/geovana-pederneschi-09a99a298" }
];