import { createServer } from '../../server/index.js';
import { io as ioClient, Socket } from 'socket.io-client';

export interface TestServer {
  port: number;
  close: () => Promise<void>;
}

export interface MessageRecord {
  event: string;
  payload: any;
  timestamp: number;
}

export class TestClient {
  socket: Socket;
  messages: MessageRecord[] = [];
  private lastState: any = null;

  constructor(socket: Socket) {
    this.socket = socket;

    // Record all messages
    socket.onAny((event: string, ...args: any[]) => {
      if (event !== 'connect' && event !== 'disconnect') {
        this.messages.push({
          event,
          payload: args[0],
          timestamp: Date.now()
        });

        // Track last state_update
        if (event === 'state_update') {
          this.lastState = args[0];
        }
      }
    });
  }

  async emitWithAck(event: string, data: any, timeoutMs: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for ack on ${event}`));
      }, timeoutMs);

      this.socket.emit(event, data, (response: any) => {
        clearTimeout(timer);
        resolve(response || {});
      });
    });
  }

  async waitForState(predicate: (state: any) => boolean, timeoutMs: number = 5000): Promise<any> {
    // Check if current state already matches
    if (this.lastState && predicate(this.lastState)) {
      return this.lastState;
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout waiting for state'));
      }, timeoutMs);

      const handler = (state: any) => {
        if (predicate(state)) {
          clearTimeout(timer);
          this.socket.off('state_update', handler);
          resolve(state);
        }
      };

      this.socket.on('state_update', handler);
    });
  }

  getLastState(): any {
    return this.lastState;
  }

  close() {
    this.socket.close();
  }
}

export async function startServer(judge: (players: any[]) => Promise<string>, timeScale: number = 0.1): Promise<TestServer> {
  const result = await createServer({
    port: 0,
    judge,
    timeScale
  });

  return {
    port: result.port,
    close: result.close
  };
}

export function connectClient(port: number): TestClient {
  const socket = ioClient(`http://localhost:${port}`, {
    transports: ['websocket']
  });
  return new TestClient(socket);
}

export async function waitForConnect(client: TestClient, timeoutMs: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (client.socket.connected) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Timeout waiting for connection'));
    }, timeoutMs);

    client.socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}
