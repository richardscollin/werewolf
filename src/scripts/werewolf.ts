import { shuffleArray } from "./utils.js";
import { Role, roles } from "./role.js";
import { Team, IPlayerState } from "../interfaces.js";
export { Role, IPlayerState, Team, roles };
export type ClientId = string;

export class WerewolfStateMachine {
  players: Map<ClientId, IPlayerState>;
  constructor(public gameId: string) {
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
    for (let [roleType, roleCount] of roleCounts.entries()) {
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

  toJSON() {
    return JSON.stringify({
      players: Object.fromEntries(this.players),
    });
  }

  get werewolves() : string[] {
    return Array.from(this.players.entries(), ([k, v]) => {
      if (Role.fromObject(v.role).isWerewolf()) {
        return k;
      }
    }).filter((it) => it) as string[];
  }
}
