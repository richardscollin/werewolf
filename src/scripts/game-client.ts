import { IMessage } from "../interfaces";
import {
  GameEvent,
  ChatEvent,
  NickChangeEvent,
  StartGameEvent,
  AuthNewClientEvent,
} from "./game-event";
import { v4 as uuidv4 } from "uuid";

abstract class GameClient {
  socket?: WebSocket;
  receiveChat?: (message: IMessage) => any;

  set clientId(id: string) {
    localStorage.setItem("clientId", id);
  }

  get clientId(): string {
    return (this.clientId = localStorage.getItem("clientId") || uuidv4());
  }

  set sessionKey(key: string | undefined) {
    localStorage.setItem("sessionKey", key!);
  }

  get sessionKey(): string | undefined {
    return localStorage.getItem("sessionKey") || undefined;
  }

  public get clientName(): string {
    if (localStorage.getItem("clientName") === null) {
      this.clientName =
        "Just a Villager#" + Math.floor(Math.random() * 1000).toString();
    }
    return localStorage.getItem("clientName")!;
  }

  public set clientName(name: string) {
    localStorage.setItem("clientName", name);
  }

  constructor() {}

  connect() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsBase = `${protocol}://${window.location.hostname}:${window.location.port}`;
    console.log(
      `connecting ${wsBase}/game/${this.clientId}/${this.sessionKey}`
    );

    this.socket = new WebSocket(
      `${wsBase}/game/${this.clientId}/${this.sessionKey}`
    );
    this.socket.onerror = console.error;
    this.socket.onopen = () => {
      console.log("canvas socket opened");
      this.socket!.onmessage = (event) => {
        const gameEvent = GameEvent.fromString(event.data);
        console.log(`received ${gameEvent.eventType}`);
        this._handleGameEvent(gameEvent);
      };
    };
    this.socket.onclose = () => {
      console.log("socket closed");
      this.socket = undefined;

      console.log("Attempting reconnect in 1 second");
      setTimeout(() => this.connect(), 1000);
    };
  }

  // returns true iff event properly recognized/handled
  abstract handleGameEvent(gameEvent: GameEvent): boolean;

  _handleGameEvent(gameEvent: GameEvent) {
    switch (gameEvent.eventType) {
      case "auth-new-client":
        console.log(`received auth-new event ${this.clientId}`);
        const authEvent = gameEvent as AuthNewClientEvent;

        this.clientId = authEvent.clientId;
        this.sessionKey = authEvent.sessionKey;

        break;
      case "chat":
        const chatEvent = gameEvent as ChatEvent;
        console.log("received chat event");
        if (this.receiveChat) {
          this.receiveChat({
            senderId: chatEvent.senderId,
            senderName: chatEvent.senderName,
            text: chatEvent.message,
            date: chatEvent.sendDate,
          });
        }
        break;
      case "nick-change":
        if (this.receiveChat) {
          const nickEvent = gameEvent as NickChangeEvent;
          this.receiveChat({
            senderId: "",
            senderName: "Werewolf Online",
            text: `${nickEvent.oldNick} changed their name to ${nickEvent.newNick}.`,
            date: nickEvent.sendDate,
          });
        }
        break;

      default:
        if (!this.handleGameEvent(gameEvent)) {
          console.error("Unknown game event");
          console.error(gameEvent);
        }
        break;
    }
  }

  sendGameEvent(gameEvent: GameEvent) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket?.send(JSON.stringify(gameEvent));
    } else {
      console.error(
        `Attempting sendGameEvent on closed socket. gameEvent: ${gameEvent}`
      );
    }
  }

  onMessage(text: string) {
    if (text.startsWith("/")) {
      // treat as special command
      if (text.startsWith("/nick")) {
        const newName = text.replace(/\/nick\s*/, "");
        const nickEvent = new NickChangeEvent(
          this.clientId,
          this.clientName,
          newName,
          new Date()
        );
        this.clientName = newName;
        this.sendGameEvent(nickEvent);
      } else if (text.startsWith("/start")) {
        console.log("starting game");
        const startEvent = new StartGameEvent();
        this.sendGameEvent(startEvent);
      } else {
        console.warn("Unrecognized chat command");
      }
    } else {
      this.sendChat(text);
    }
  }

  sendChat(text: string) {
    const chatEvent = new ChatEvent(
      this.clientId,
      this.clientName,
      text,
      new Date()
    );
    this.sendGameEvent(chatEvent);
  }

  welcome() {
    const welcomeInfo = {
      senderId: uuidv4(),
      senderName: "welcome",
      date: new Date(),
    };

    this.receiveChat!({
      ...welcomeInfo,
      text: `Hi ${this.clientName}! Welcome to Werewolf Online`,
    });
    this.receiveChat!({
      ...welcomeInfo,
      text: "Enter /nick <name> in chat to set your screen name",
    });
  }
}

export { GameClient };
