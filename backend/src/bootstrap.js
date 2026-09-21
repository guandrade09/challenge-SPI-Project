// Carrega o .env antes de qualquer outro módulo ser avaliado. Import estático
// não serve aqui: em ESM, todo o grafo de imports é resolvido antes do corpo
// deste arquivo rodar, então um `import` normal do server.js leria
// process.env antes do .env existir. O import dinâmico abaixo só executa
// depois que loadEnvFile já rodou.
try {
  process.loadEnvFile();
} catch {
  // sem .env local (ex.: variáveis já exportadas no ambiente) — segue sem falhar
}

await import("./api/server.js");
