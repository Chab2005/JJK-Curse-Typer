// Serveur Next personnalisé : un seul processus sert le site et les WebSocket de course
// (src/realtime), sans service temps réel tiers. `npm run dev` en local, `npm start` en prod (Railway).
import { createServer } from 'node:http';
import next from 'next';
import { attachRaceServer } from './src/realtime/attach';

const port = Number(process.env.PORT ?? 3000);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, port, hostname: 'localhost' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  // Avant le premier rendu : Next n'ajoute son propre écouteur d'upgrade (HMR) qu'à la première requête.
  attachRaceServer(server);
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} (${dev ? 'development' : 'production'}), race sockets on /ws/race/<code>`);
  });
});
