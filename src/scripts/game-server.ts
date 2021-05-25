import ws from "ws";
import { randomUUID, randomBytes, timingSafeEqual } from "crypto";
import { AuthNewClientEvent, GameEvent } from "./game-event.js";
import { v4 as uuidv4 } from "uuid";

type ClientId = string;
type SessionKey = string;

interface IConnectionInfo {
  clientId: ClientId;
  sessionKey: SessionKey;
  socket: ws;
}

// Game server keeps track of all the clients and which clients
// are connected to what room

abstract class GameServer {
  wss: ws.Server;
  clients: Map<ClientId, IConnectionInfo>;

  constructor() {
    this.wss = new ws.Server({ noServer: true });
    this.wss.on("connection", this.onConnection.bind(this));
    this.clients = new Map();
  }

  authenticateMessage(socket: any, gameEvent: GameEvent) {}

  // returns true iff event properly recognized/handled
  abstract handleGameEvent(gameEvent: GameEvent): boolean;

  private serverHandleGameEvent(gameEvent: GameEvent) {
    // here we handle the base game event types like chat, etc.
    // and pass game specific events to the subclass
    switch (gameEvent.eventType) {
      case "chat":
        this.broadcastGameEvent(gameEvent);
        break;
      case "nick-change":
        this.broadcastGameEvent(gameEvent);
        break;
      default:
        if (!this.handleGameEvent(gameEvent)) {
          console.warn(`Unhandled game event ${gameEvent.eventType}`);
        }
        break;
    }
  }

  onConnection(socket: ws, req: any, client: any) {
    console.log("on connection");
    const url: string = req.url as string;
    const urlParts: string[] = url.split("/", 4);
    const [_, urlType, newClientId, newSessionKey]: string[] = urlParts;

    if (newSessionKey === "undefined") {
      console.log("generating a new client");
      if (!this.clients.has(newClientId)) {
        // generate a new session key and transmit it
        const connectionInfo: IConnectionInfo = {
          clientId: newClientId,
          sessionKey: uuidv4(),
          socket: socket,
        };
        this.clients.set(newClientId, connectionInfo);
        const authEvent = new AuthNewClientEvent(
          newClientId,
          connectionInfo.sessionKey
        );
        this.transmitGameEvent(newClientId, authEvent);
      } else {
        // attempting to generate a new session on an existing key
        // let the client know and send them new credentials
        // TODO

        console.error(
          `Attempting to connect with and existing client ${newClientId} w/o knowing key.`
        );
      }
    } else if (this.clients.has(newClientId)) {
      const storedSessionKey = this.clients.get(newClientId)?.sessionKey ?? "";

      console.log(newSessionKey);
      console.log(storedSessionKey);
      if (
        timingSafeEqual(
          Buffer.from(newSessionKey),
          Buffer.from(storedSessionKey)
        )
      ) {
        console.log("passed auth key check");
        const connectionInfo: IConnectionInfo = this.clients.get(newClientId)!;
        // TODO maybe also close old socket
        connectionInfo.socket.close();
        connectionInfo.socket = socket;
        
        // then they're authenticated
      } else {
        console.log("didn't pass auth");
      }
    } else {
      console.log("likely server has reset");
      console.log("renewing sessionkey");
      const connectionInfo: IConnectionInfo = {
        clientId: newClientId,
        sessionKey: uuidv4(),
        socket: socket,
      };
      this.clients.set(newClientId, connectionInfo);
      const authEvent = new AuthNewClientEvent(
        newClientId,
        connectionInfo.sessionKey
      );
      this.transmitGameEvent(newClientId, authEvent);
    }

    socket.on("message", (data: Buffer) => {
      const gameEvent = JSON.parse(data.toString()) as GameEvent;
      this.serverHandleGameEvent(gameEvent);
    });
  }

  transmitGameEvent(clientId: string, gameEvent: GameEvent) {
    const connectionInfo = this.clients.get(clientId);

    // get reference to client for that host
    if (connectionInfo?.socket?.readyState === ws.OPEN) {
      connectionInfo.socket.send(JSON.stringify(gameEvent));
    } else {
      console.log("attempting send on bad socket")
      console.log(connectionInfo);
    }
  }

  broadcastGameEvent(gameEvent: GameEvent) {
    Array.from(this.wss.clients).forEach((it) => {
      if (it.readyState === ws.OPEN) {
        it.send(JSON.stringify(gameEvent));
      }
    });
  }
}

export { GameServer };
