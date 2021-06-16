import { v4 as uuidv4 } from "uuid";
import ws from "ws";
import { AssignRoleEvent, GameEvent, ErrorEvent } from "./game-event.js";
import { GameServer } from "./game-server.js";
import { Role, WerewolfStateMachine } from "./werewolf.js";

type GameId = string;

class WerewolfServer extends GameServer {
  games: Map<GameId, WerewolfStateMachine> = new Map();
  constructor() {
    super();
  }

  handleGameEvent(gameEvent: GameEvent, sender: ws): boolean {
    switch (gameEvent.eventType) {
      case "start-game":
        const gameId: GameId = uuidv4();
        function dummy(id:string): string { return ""}
        const stateMachine = new WerewolfStateMachine(gameId, dummy, "seed");
        this.games.set(gameId, stateMachine);

        const scenario = new Map([
          ["seer", 1],
          ["werewolf", 1],
        ]);

        //TODO filter by current room
        const clientIds = Array.from(this.clients.keys());
        const success = stateMachine.assignRoles(clientIds, scenario);
        if (success) {
          for (let [clientId, playerState] of stateMachine.players) {
            const assignRoleEvent = new AssignRoleEvent(
              clientId,
              gameId,
              Role.fromObject(playerState.role)
            );
            this.transmitGameEvent(clientId, assignRoleEvent);
          }
        } else {
          const errorEvent = new ErrorEvent("could not start game incorrect number of players.");
          this.transmitGameEventSocket(sender, errorEvent);
        }

        return true;
    }
    return false;
  }
}

export { WerewolfServer };
