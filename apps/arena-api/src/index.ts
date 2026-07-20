import express from 'express';
import cors from 'cors';
import { Server, LobbyRoom } from 'colyseus';
import { createServer } from 'http';
import { monitor } from '@colyseus/monitor';
import { Encoder } from '@colyseus/schema';

// Increase buffer size to 100 KB to support 200+ chests in sandbox
Encoder.BUFFER_SIZE = 100 * 1024;

import { WebSocketTransport } from '@colyseus/ws-transport';
import { ArenaRoom } from './rooms/arena';
import { SandboxRoom } from './rooms/sandbox';

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

const server = createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: server
  })
});

// Register Room handlers
gameServer.define('arena', ArenaRoom)
  .filterBy(['matchMode', 'deviceType']);

gameServer.define('lobby', LobbyRoom);

if (process.env.NODE_ENV !== 'production') {
  // Register Sandbox for local testing
  gameServer.define('sandbox', SandboxRoom);
  
  // Register Colyseus monitor (development tool)
  app.use("/colyseus", monitor());
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'arena-api' });
});

gameServer.listen(port).then(() => {
  console.log(`Arena Game Server listening on port ${port}`);
}).catch(console.error);
