import * as http from 'http';
import * as debug from 'debug';
import { Namespace, Server as socketServer, Socket } from 'socket.io';
import { SocketService } from './services/socketService';
import Server from './server';

debug('ts-express:server');

const socketService = SocketService.Instance;

const port = normalizePort(process.env.PORT || 3000);
Server.express.set('port', port);

const server = http.createServer(Server.express);

// socketService.io = new socketServer(server);
const io = new socketServer(server);
socketService.facilityNsp = io.of('/facility');
socketService.facilityNsp.on('connection', (socket: Socket) => {
  // all facility connections are coming here
  // const facility: Namespace = socket.nsp; // current facility
  console.log('connection made to facility');
  socket.on('join queue', (queueId: string) => {
    console.log(`a socket joined room = queue-${queueId}`);
    socket.join(`queue-${queueId}`)
  });
  socket.on('leave queue', (queueId: string) => {
    console.log(`a socket left room = queue-${queueId}`);
    socket.leave(`queue-${queueId}`);
  });
  socket.on('join slot', (slotId: string) => {
    console.log(`a socket joined room = slot-${slotId}`);
    socket.join(`slot-${slotId}`)
  });
  socket.on('leave slot', (slotId: string) => {
    console.log(`a socket left room = slot-${slotId}`);
    socket.leave(`slot-${slotId}`);
  });
});
// facilityNsp.to('queue-xyz').emit('slot added');

Server.connectDB().then(((result: any) => {
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
})).catch((err: any) => console.error('error connecting db : ', err));



function normalizePort(val: number|string): number|string|boolean {
  let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;
  if (isNaN(port)) return val;
  else if (port >= 0) return port;
  else return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') throw error;
  let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
  switch(error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  let addr = server.address();
  let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`Listening on ${bind}`);
}