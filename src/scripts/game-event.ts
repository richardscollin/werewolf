import { GameServer } from "./game-server.js";
import { Role } from "./werewolf.js";

type GameEventType =
  | "auth-new-client"
  | "chat"
  | "end-day"
  | "nick-change"
  | "players-ready"
  | "assign-role"
  | "start-game";

export abstract class GameEvent {
  constructor(public eventType: GameEventType) {}

  static fromString(data: string): GameEvent {
    try {
      return JSON.parse(data) as GameEvent;
    } catch {
      throw new Error("Invalid GameEvent: " + data);
    }
  }
}
export class AuthNewClientEvent extends GameEvent {
  constructor(public clientId: string, public sessionKey: string) {
    super("auth-new-client");
  }
}

export class ChatEvent extends GameEvent {
  constructor(
    public senderId: string,
    public senderName: string,
    public message: string,
    public sendDate: Date
  ) {
    super("chat");
  }
}

export class NickChangeEvent extends GameEvent {
  constructor(
    public clientId: string,
    public oldNick: string,
    public newNick: string,
    public sendDate: Date
  ) {
    super("nick-change");
  }
}

export class PlayersReadyEvent extends GameEvent {
  constructor() {
    super("players-ready");
  }
}

export class StartGameEvent extends GameEvent {
  gameId?: string;

  constructor() {
    super("start-game");
  }
}

export class AssignRoleEvent extends GameEvent {
  constructor(
    public clientId: string,
    public gameId: string,
    public role: Role
  ) {
    super("assign-role");
  }
}
