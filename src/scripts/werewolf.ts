import { shuffleArray } from "./utils.js";
import { Role, roles } from "./role.js";
import { Team, IPointResult, IPlayerState, IDayResult } from "../interfaces.js";
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

  constructor(
    public gameId: string,
    public id2username: (id: string) => string | undefined,
    public seed: string | undefined
  ) {
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

  awardAmulate(id: string) {
    this.players.get(id)!.hasAmulate = true;
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
      console.log("Warning: the numbers of players don't match up ");
      return false;
    }

    shuffleArray(playerIds, this.seed);
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

  playerPointsToPlayer(p1Id: string, p2Id: string): IPointResult {
    const isFirstNight = this.history.length === 0;
    if (this.currentNight === undefined) {
      return {
        success: false,
        message: "You must perform the action at night.",
      };
    }

    const p2Name = this.id2username(p2Id)!;
    const checkingPlayerState = this.players.get(p1Id);
    const checkedPlayerState = this.players.get(p2Id);
    if (checkingPlayerState === undefined || checkedPlayerState === undefined) {
      return {
        success: false,
        message:
          "Error: Can't determine role for you or the player you pointed to.",
      };
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
          action: "kill",
          clientId: p1Id, // this can be ignored
          at: p2Id,
        });
      }
      return {
        success: true,
        message: `You want to eat ${p2Name}.`,
        pointer: checkingPlayerState,
        pointie: checkedPlayerState,
      };
    }

    // TODO
    // first check if player has already pointed this night
    if (this.playerHasPointedTonight(p1Id)) {
      return {
        success: false,
        message: "Sorry you've already done an action tonight.",
      };
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

    return {
      success: true,
      message: messageText,
      pointer: checkingPlayerState,
      pointie: checkedPlayerState,
    };
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

  nightActionsCompleted(): boolean {
    return this.nightWaitingOn().length === 0;
  }

  nightWaitingOn(): string[] {
    const waitingOn: string[] = [];
    const hasPerformedAction = (playerId: string) =>
      undefined !==
      this.currentNight?.events.find((p) => p.clientId === playerId);

    for (let [playerId, playerState] of this.players.entries()) {
      const role = playerState.role;
      if (playerState.alive) {
        if (role.nightlyAction && !hasPerformedAction(playerId)) {
          waitingOn.push(playerId);
        } else if (
          role.firstNightAction &&
          this.isFirstNight &&
          !hasPerformedAction(playerId)
        ) {
          waitingOn.push(playerId);
        }
      }
    }

    return waitingOn;
  }

  beginDay(): IDayResult {
    if (!this.nightActionsCompleted()) {
      const waitingList = this.nightWaitingOn();
      const waitingOn = waitingList.map(this.id2username).join("\n");
      return {
        success: false,
        message: `Not all players have completed their night actions. Still waiting on:\n${waitingOn}`,
        waitList: waitingList,
      };
    }

    this.isNight = false;

    const newDead: string[] = [];
    const deadStack: string[] = []; // for dealing with recursive kills
    const finalDeathList: string[] = [];

    const kills = this.currentNight?.events.filter((e) => e.action === "kill");
    kills?.forEach((kill) => {
      const targetId = kill.at;
      const target = this.players.get(targetId)!;

      // Here's the logic for getting killed by werewolf
      // the bodyguard can protect you from the werewolf
      if (!target.bodyguardProtected) {
        deadStack.push(targetId);
      }
    });

    while (deadStack.length > 0) {
      const targetId = deadStack.pop()!;
      const target = this.players.get(targetId)!;

      // Logic for recursive killing
      // TODO shorten this code if it's functionally correct
      const protectedByAngel = (target: IPlayerState): boolean => {
        if (target.angelProtected === undefined) return false;

        const angel = this.players.get(target.angelProtected)!;
        if (angel.alive) {
          return true;
        }

        return false;
      };

      if (
        !(target.hasAmulate && this.history.length <= 2) &&
        !protectedByAngel(target)
      ) {
        // kill target
        target.alive = false;
        finalDeathList.push(targetId);

        if (target.cupidLover) {
          deadStack.push(target.cupidLover);
        }

        if (target.whoreSleepover) {
          deadStack.push(target.whoreSleepover);
        }

        if (target.dopplegangedPlayer) {
          const doppleganger = this.players.get(target.dopplegangedPlayer)!;
          doppleganger.role = target.role;
          // TODO somehow notify the doppleganger of their new role in a better way
        }
      }
    }

    const infoMessage = this.info();

    let deathMessage = "";
    if (finalDeathList.length === 0) {
      deathMessage = "Begining day phase. Last night no one died.";
    } else {
      deathMessage =
        "Begining day phase. Last night the following players died:\n" +
        finalDeathList.map(this.id2username).join("\n");
    }

    this.history.push(this.currentNight!);
    this.currentNight = undefined;

    return {
      success: true,
      message: deathMessage + "\n\n" + infoMessage,
      newDead: finalDeathList,
    };
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

  get hasStarted(): boolean {
    return this.players.size > 0;
  }

  get isFirstNight(): boolean {
    return this.isNight && this.history.length === 0;
  }

  id2Role(id: string): Role | undefined {
    const roleId = this.players.get(id)?.role;
    return roleId ? Role.fromObject(roleId) : undefined;
  }

  info(): string | undefined {
    if (this.players.size === 0) {
      return undefined;
    }
    let infoMessage = "\nRoles:\n";
    for (let [playerId, playerState] of this.players.entries()) {
      const username = this.id2username(playerId);
      const deadString = playerState.alive ? "" : " (Dead)";
      infoMessage += `${username}${deadString}: ${playerState.role.name}\n`;
    }

    /*
    infoMessage += JSON.stringify(this.history, null, 2) + "\n";
    if (this.currentNight) {
      infoMessage += JSON.stringify(this.currentNight, null, 2);
    }
    */

    if ((this.currentNight?.events?.length ?? 0) !== 0) {
      infoMessage += "\nUpdates:";

      // @ts-ignore
      for (let event of this.currentNight.events) {
        // TODO werewolf pointing should be handled slightly differently

        const pointerRole = this.id2Role(event.clientId);
        const verb = pointerRole?.verb?.past ?? "pointed at";
        const pointieName = this.id2username(event.at);

        if (event.action === "kill") {
          infoMessage += `\nThe Werewolves want to kill ${pointieName}.`;
        } else if (!pointerRole?.isWerewolf()) {
          infoMessage += `\nThe ${pointerRole?.name} (${this.id2username(
            event.clientId
          )}) ${verb} ${pointieName}.`;
        }
      }
    }

    if (this.isGameOver()) {
      infoMessage += "\nGame Over.";
      infoMessage += `\nThe ${this.winningTeam()} team has won!`;
    }

    return infoMessage;
  }
}
