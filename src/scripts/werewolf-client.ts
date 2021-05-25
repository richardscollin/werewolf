import { IMessage } from "../interfaces.js";
import { GameClient } from "./game-client";
import {
  GameEvent,
  ChatEvent,
  NickChangeEvent,
  StartGameEvent,
  AuthNewClientEvent,
  AssignRoleEvent,
} from "./game-event";
import { v4 as uuidv4 } from "uuid";
import { Role } from "./werewolf";

export class WerewolfClient extends GameClient {
  role?: Role;
  onGameStateChange?: () => any;
  // returns true iff event properly recognized/handled
  handleGameEvent(gameEvent: GameEvent): boolean {
    const welcomeInfo = {
      senderId: uuidv4(),
      senderName: "welcome",
      date: new Date(),
    };

    switch (gameEvent.eventType) {
      case "assign-role":
        console.log("assign role event");
        const assignRoleEvent = gameEvent as AssignRoleEvent;
        this.receiveChat!({
          ...welcomeInfo,
          text: `You are a ${assignRoleEvent.role.name}`,
        });
        this.role = assignRoleEvent.role;
        if (this.onGameStateChange) this.onGameStateChange();

        return true;
    }
    return false;
  }
}
