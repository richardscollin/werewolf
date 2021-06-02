import { shuffleArray } from "./utils.js";
import { Role, roles } from "./role.js";
import { Team, IPlayerState } from "../interfaces.js";
export { Role, IPlayerState, Team, roles };

export enum WerewolfGameState {
  Init,
  WaitForPlayers,
  AssignRoles,
  FirstNight,
  Day,
  DayWait,
  Vote,
  VoteWait,
  Lynch,
  LynchWait,
  LynchFinish,
  Night,
}

export type ClientId = string;

export class WerewolfStateMachine {
  currentState: WerewolfGameState;
  players: Map<ClientId, IPlayerState>;
  constructor(public gameId: string) {
    this.currentState = WerewolfGameState.Init;
    this.players = new Map<ClientId, IPlayerState>();
  }

  isGameOver(): boolean {
    return this.winningTeam() !== undefined;
  }

  winningTeam(): Team | undefined {
    let aliveWerewolfCount = 0;
    let aliveVillagerCount = 0;

    if (this.players.size === 0) {
      return undefined;
    }

    for (let [_, playerState] of this.players) {
      if (playerState.alive) {
        if (Role.fromObject(playerState.role).isWerewolf()) {
          aliveWerewolfCount++;
        } else {
          aliveVillagerCount++;
        }
      }
    }

    if (aliveWerewolfCount === 0) {
      return "villager";
    } else if (aliveWerewolfCount === aliveVillagerCount) {
      return "werewolf";
    } else {
      return undefined;
    }
  }

  assignRoles(playerIds: string[], roleCounts: Map<string, number>) {
    const newRoles: Role[] = [];
    let acc = 0;
    for (let [roleType, roleCount] of roleCounts) {
      acc += roleCount;
      const role: Role = roles.get(roleType)!;
      newRoles.push(...Array(roleCount).fill(role)); // Note this is a shallow copy. Should be okay for now
    }
    if (playerIds.length !== acc) {
      return false;
    }

    shuffleArray(playerIds);
    for (let i = 0; i < playerIds.length; i++) {
      this.players.set(playerIds[i], {
        role: newRoles[i],
        alive: true,
        hasAmulate: false,
      });
    }
    return true;
  }

  gameTick() {
    switch (this.currentState) {
      case WerewolfGameState.Init:
        // Do initialization
        this.currentState = WerewolfGameState.WaitForPlayers;
        break;

      case WerewolfGameState.WaitForPlayers:
        // Some external event will trigger a switch from WaitForPlayers to AssignRoles
        break;

      case WerewolfGameState.AssignRoles:
        break;

      case WerewolfGameState.FirstNight:
        // send each wolf list of wolves
        break;

      case WerewolfGameState.Day:
        // notify players about the last night
        break;

      case WerewolfGameState.DayWait:
        // wait for day timeout event
        // moderatator event
        // vote event
        break;

      case WerewolfGameState.Vote:
        break;

      case WerewolfGameState.VoteWait:
        break;

      case WerewolfGameState.Lynch:
        break;

      case WerewolfGameState.LynchWait:
        break;

      case WerewolfGameState.LynchFinish:
        break;

      case WerewolfGameState.Night:
        break;

      default:
        throw new Error(`Unknown Game State: ${this.currentState}`);
        break;
    }
  }
}
