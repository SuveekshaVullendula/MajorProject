import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import http from 'http';

const PORT = 1234;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Yjs WebSocket Collaboration Server running');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('[collab] client connected:', req.url);
  setupWSConnection(ws, req);
});

server.listen(PORT, () => {
  console.log(`[collab] server listening on ws://localhost:${PORT}`);
});
