// start.js
import { spawn } from 'child_process';

console.log('🚀 Iniciando o FrontEnd do SPI-CHALLENGER...');

// Executa o comando 'npm run dev'
const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  console.log(`Processo finalizado com código: ${code}`);
});