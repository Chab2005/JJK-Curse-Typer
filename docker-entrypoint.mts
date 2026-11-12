// Point d'entrée Docker : lance node directement sur ce fichier TypeScript (Node 24 retire les types sans outil de build).
import { spawn } from 'node:child_process';

const env = { ...process.env };

function exec(command: string): Promise<void> {
  const child = spawn(command, { shell: true, stdio: 'inherit', env });
  return new Promise((resolve, reject) => {
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed rc=${code}`));
    });
  });
}

async function main() {
  // If running the web server then prerender pages
  if (process.argv.slice(-3).join(' ') === 'npm run start') {
    await exec('npx next build --experimental-build-mode generate');
  }

  // launch application
  await exec(process.argv.slice(2).join(' '));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
