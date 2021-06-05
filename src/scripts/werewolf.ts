import { shuffleArray } from "./utils.js";
import { Role, roles } from "./role.js";
import { Team, IPlayerState } from "../interfaces.js";
import { DiscordAPIError } from "discord.js";
export { Role, IPlayerState, Team, roles };
export type ClientId = string;

type Action = string;
export interface INightEvent {
  action: Action;
  clientId: string;
  at: string;
}

export interface INight {
  events: INightEvent[];
}

export class WerewolfStateMachine {
  mod?: string; // id of the game moderator
  players: Map<ClientId, IPlayerState>;
  history: INight[];
  currentNight?: INight;
  isNight: boolean;

  constructor(public gameId: string) {
    this.players = new Map<ClientId, IPlayerState>();
    this.history = [];
    this.isNight = false;
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

  /*
  Implements a generic night action for all non-werewolf players

  this method is stateful. it updates the night actions array

  The logic within is specific for the pointing characters role
  for example if the pointer is seer then it will check them
  if they are a bodyguard it will protect that player

  returns a message to display to the pointer
  */
  playerPointsToPlayer(p1Id: string, p2Id: string, p2Name: string): string {
    const isFirstNight = this.history.length === 0;
    if (this.currentNight === undefined) {
      return "You must perform the action at night.";
    }

    const checkingPlayerState = this.players.get(p1Id);
    const checkedPlayerState = this.players.get(p2Id);
    if (checkingPlayerState === undefined || checkedPlayerState === undefined) {
      const error = `Error: Can't determine role for you or the player you pointed to.`;
      return error;
    }

    const checkingRole = Role.fromObject(checkingPlayerState.role);
    const checkedRole = Role.fromObject(checkedPlayerState.role);

    let messageText = `Your are ${checkingRole.name}.`;

    if (checkingRole.isWerewolf()) {
      const numWolves = this.werewolves.length;
      const wolfPoint = this.currentNight.events.find(
        (x) => x.clientId === p1Id
      );
      if (wolfPoint) {
        wolfPoint.at = p2Id;
      } else {
        this.currentNight.events.push({
          action: "point",
          clientId: p1Id,
          at: p2Id,
        });
      }

      const sameTargetCount = this.currentNight.events.filter(
        (ne) => this.id2Role(ne.clientId)?.isWerewolf() && ne.at === p2Id
      ).length;

      if (sameTargetCount === numWolves) {
        // TODO notify wolves
        this.currentNight.events.push({
          action: "eat",
          clientId: p1Id, // this can be ignored
          at: p2Id,
        });
      }

      return `You want to eat ${p2Name}.`;
    }

    // TODO
    // first check if player has already pointed this night
    if (this.playerHasPointedTonight(p1Id)) {
      return "Sorry you've already done an action tonight.";
    }

    switch (checkingRole.id) {
      case "angel":
        if (isFirstNight) {
          messageText += `You have choosen to guard ${p2Name}. As long as you are alive, they cannot die. If lynched, they reveal their role and stay alive.`;
        } else {
          messageText += "You can only perform your action on the first night.";
        }
        checkedPlayerState.angelProtected = p1Id;
        break;

      case "apprentice-seer":
        messageText +=
          "You are still only an apprentice. The seer must die before you can use your powers.";
        break;

      case "baker":
        if (this.preventRepeatedTarget(p1Id, p2Id)) {
          messageText +=
            "You cannot target the same player two nights in a row.";
          break;
        }

        messageText += `You placed the bread in front of ${p2Name}`;
        this.currentNight.events.push({
          action: "point",
          clientId: p1Id,
          at: p2Id,
        });
        break;

      case "bodyguard":
        // check that the player you are trying to protect isn't the
        // same as the previous night

        if (this.preventRepeatedTarget(p1Id, p2Id)) {
          messageText +=
            "You cannot target the same player two nights in a row.";
          break;
        }

        this.players.get(p2Id)!.bodyguardProtected = true;
        messageText += `You are protecting ${p2Name}`;
        this.currentNight.events.push({
          action: "point",
          clientId: p1Id,
          at: p2Id,
        });
        break;
      case "cupid":
        if (isFirstNight) {
          const loversCount = this.currentNight.events.map(
            (x) => x.clientId === p1Id
          ).length;

          if (loversCount < 2) {
            messageText += `You pointed at ${p2Name}.`;
            this.currentNight.events.push({
              action: "point",
              clientId: p1Id,
              at: p2Id,
            });
            if (loversCount === 1) {
              // now it's 2 total
              const lovers = this.currentNight.events
                .filter((x) => x.clientId === p1Id)
                .map((x) => x.at);
              const [l1, l2] = lovers;

              this.players.get(l1)!.cupidLover = l2;
              this.players.get(l2)!.cupidLover = l1;
            }
          } else {
            messageText += "You've already added two lovers.";
          }
        } else {
          messageText += "You can only perform your action on the first night.";
        }
        break;

      case "doppelganger":
        if (isFirstNight) {
          messageText += `You have choosen to copy ${p2Name}'s role. When they die you will secretly copy their role.`;

          this.currentNight.events.push({
            action: "point",
            clientId: p1Id,
            at: p2Id,
          });
          checkedPlayerState.dopplegangedPlayer = p1Id;
        } else {
          messageText += "You can only perform your action on the first night.";
        }
        break;

      case "sorcerer":
      case "seer":
        const isWolf =
          checkedRole.isWerewolf() && checkedRole.id !== "alpha-wolf";
        messageText += `They are ${!isWolf ? "not " : ""} a werewolf.`;

        if (checkingRole.id === "sorcerer") {
          messageText += ` And they are ${
            checkedRole.id !== "seer" ? "not" : ""
          } the seer.`;
        }

        this.currentNight.events.push({
          action: "point",
          clientId: p1Id,
          at: p2Id,
        });
        break;

      case "old-hag":
        if (this.preventRepeatedTarget(p1Id, p2Id)) {
          messageText +=
            "You cannot target the same player two nights in a row.";
          break;
        }

        messageText += `You are casting ${p2Name} away`;
        this.currentNight.events.push({
          action: "point",
          clientId: p1Id,
          at: p2Id,
        });
        checkedPlayerState.oldhagCastAway = true;

      case "spellcaster":
        if (this.preventRepeatedTarget(p1Id, p2Id)) {
          messageText +=
            "You cannot target the same player two nights in a row.";
          break;
        }

        messageText += `You are silencing ${p2Name}`;
        this.currentNight.events.push({
          action: "point",
          clientId: p1Id,
          at: p2Id,
        });
        checkedPlayerState.spellcasterSilenced = true;
        break;

      case "villager":
        messageText += "Close your eyes.";
        break;

      case "whore":
        if (this.preventRepeatedTarget(p1Id, p2Id)) {
          messageText +=
            "You cannot target the same player two nights in a row.";
          break;
        }

        messageText += `You want to sleep with ${p2Name}. Have fun! 🍆💦`;
        this.currentNight.events.push({
          action: "point",
          clientId: p1Id,
          at: p2Id,
        });
        checkedPlayerState.whoreSleepover = p1Id;
        break;

      default:
        messageText += "This players role is still unimplemented.";
        break;
    }

    return messageText;
  }

  preventRepeatedTarget(pointer: string, pointie: string): boolean {
    /*
    several roles do not allow repeating the action on the same player
    2 nights in a row. This is the logic for that
    */
    if (this.history.length > 0) {
      const prevNight = this.history[this.history.length - 1];
      const prevPoint = prevNight.events.find(
        (ne) => ne.clientId === pointer && ne.action === "point"
      );
      if (prevPoint && prevPoint.at === pointie) {
        return true;
      }
    }
    return false;
  }

  playerHasPointedTonight(playerId: string): boolean {
    return (
      this.currentNight?.events.find(
        (nightEvent) =>
          nightEvent.clientId === playerId && nightEvent.action === "point"
      ) !== undefined
    );
  }

  toJSON() {
    return JSON.stringify({
      players: Object.fromEntries(this.players),
    });
  }

  beginNight() {
    this.isNight = true;
    this.currentNight = { events: [] };
  }

  beginDay() {
    this.isNight = false;

    const kills = this.currentNight?.events.filter((e) => e.action === "kill");
    kills?.forEach((kill) => {
      const targetId = kill.at;
      const target = this.players.get(targetId)!;

      if (
        !target.bodyguardProtected &&
        !(target.hasAmulate && this.history.length <= 2) // TODO double check obo
      ) {
        target;
      }
    });

    this.history.push(this.currentNight!);
    this.currentNight = undefined;
  }

  get werewolves(): string[] {
    return Array.from(this.players.entries(), ([k, v]) => {
      if (Role.fromObject(v.role).isWerewolf()) {
        return k;
      }
    }).filter((it) => it) as string[];
  }

  get seers(): string[] {
    return Array.from(this.players.entries(), ([k, v]) => {
      if (v.role.id === "seer") {
        return k;
      }
    }).filter((it) => it) as string[];
  }

  get masons(): string[] {
    return Array.from(this.players.entries(), ([k, v]) => {
      if (v.role.id === "mason") {
        return k;
      }
    }).filter((it) => it) as string[];
  }

  id2Role(id: string) : Role  | undefined {
    const roleId = this.players.get(id)?.role;
    return roleId ? Role.fromObject(roleId) : undefined;
  }
}
