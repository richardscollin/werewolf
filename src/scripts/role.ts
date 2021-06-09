import { IRole, Team } from "../interfaces.js";

export class Role {
  constructor(
    public id: string,
    public name: string,
    public team: Team,
    public description: string
  ) {}

  static fromObject(object: IRole) {
    const { id, name, team, description } = object;
    return new Role(id, name, team, description);
  }

  /*
  Returns true iff a werewolf. Will return false for characters
  on the werewolf team that are not considered werewolves by the seer
  */
  isWerewolf(): boolean {
    return this.id.includes("wolf");
  }
}

export const rolesData: IRole[] = [
  {
    id: "alpha-wolf",
    name: "Alpha Wolf",
    team: "werewolf",
    description:
      "You are a werewolf, but you appear to be a villager to the seer(s).",
  },
  {
    id: "angel",
    name: "Angel",
    team: "villager",
    firstNightAction: true,
    description:
      "On the first night, choose someone to protect. As long as you are alive, they cannot die. If lynched, they reveal their role and stay alive.",
  },
  {
    id: "apprentice-seer",
    name: "Apprentice Seer",
    team: "villager",
    description: "Become the Seer if the Seer is killed.",
  },
  {
    id: "baker",
    name: "Baker",
    team: "villager",
    nightlyAction: true,
    description:
      "Each night, choose a player to  receive some bread. Bread protects them from being lynched on the following day.",
  },
  {
    id: "beholder",
    name: "Beholder",
    team: "villager",
    firstNightAction: true,
    description: "On the first night, learn who the seer(s) is/are.",
  },
  {
    id: "bodyguard",
    name: "Bodyguard",
    team: "villager",
    nightlyAction: true,
    description:
      "Each night, choose a different player to protect. That player cannot be killed that night. You cannot pick the same player two nights in a row.",
  },
  {
    id: "cupid",
    name: "Cupid",
    team: "villager",
    firstNightAction: true,
    description:
      "On the first night, choose two players to be lovers. They will both know who their lover is. If one of those players dies, the other dies from a broken heart.",
  },
  {
    id: "cursed",
    name: "Cursed",
    team: "villager",
    description:
      "You are a villager until attacked by werewolves/vampires, at which time you become a werewolf/vampire. (whichever attacked you)",
  },
  {
    id: "diseased",
    name: "Diseased",
    team: "villager",
    description:
      "If you are attacked by werewolves, the werewolves do not get to eat the following night.",
  },
  {
    id: "doppelganger",
    name: "Doppelgänger",
    team: undefined,
    firstNightAction: true,
    description:
      "Select a player the first night. If that player dies, you secretly take over their role.",
  },
  {
    id: "dream-wolf",
    name: "Dream Wolf",
    team: "werewolf",
    description:
      "If a werewolf dies, you replace them (you're not allowed to wake up until a werewolf dies.)",
  },
  {
    id: "drunk",
    name: "Drunk",
    team: "villager",
    description:
      "You are a villager until the third night, when you remember your real role.",
  },
  {
    id: "executioner",
    name: "Executioner",
    team: "villager",
    description:
      "If you are lynched, reveal your role and choose another player to die instead of you.",
  },
  {
    id: "golem",
    name: "Golem",
    team: "villager",
    description: "You cannot die at night.",
  },

  {
    id: "hoodlum",
    name: "Hoodlum",
    team: undefined,
    description:
      "Indicate two players on the first night. If they die and you are alive at the end of the game, you win.",
  },
  {
    id: "hunter",
    name: "Hunter",
    team: "villager",
    description: "If you are killed, take someone down with you.",
  },
  {
    id: "idiot",
    name: "Idiot",
    team: "villager",
    description: "Always vote for players to die.",
  },
  {
    id: "lone-wolf",
    name: "Lone Wolf",
    team: "werewolf",
    description:
      "You are a werewolf, but you only win if you are the last wolf team member alive.",
  },
  {
    id: "lycan",
    name: "Lycan",
    team: "villager",
    description:
      "You are a villager, but you appear to be a werewolf to the seer(s).",
  },
  {
    id: "mason",
    name: "Mason",
    team: "villager",
    description: "You know who the other Masons are.",
  },
  {
    id: "minion",
    name: "Minion",
    team: "werewolf",
    description:
      "Work with the werewolves (or vampires), but don’t wake up with them.",
  },
  {
    id: "old-hag",
    name: "Old Hag",
    team: "villager",
    nightlyAction: true,
    description:
      "At night, indicate a player who must leave the village during the next day.",
  },
  {
    id: "pacifist",
    name: "Pacifist",
    team: "villager",
    description: "Never vote for players to die.",
  },
  {
    id: "poison-wolf",
    name: "Poison Wolf",
    team: "werewolf",
    description:
      'You are a werewolf. Each night, choose a different player to poison. If they have a night power, it malfunctions." Prince, "You can\'t be lynched. If the town votes to lynch you, reveal your role and stay alive.',
  },
  {
    id: "seer",
    name: "Seer",
    team: "villager",
    nightlyAction: true,
    description:
      "Each night, you choose a player and learn if they are, a werewolf, a vampire, or on the villager team.",
  },
  {
    id: "sorcerer",
    name: "Sorcerer",
    team: "werewolf",
    nightlyAction: true,
    description:
      "You are a seer, but you are on the Werewolf team. You only know if you've found a werewolf, another seer, or something else.",
  },
  {
    id: "spellcaster",
    name: "Spellcaster",
    team: "villager",
    nightlyAction: true,
    description:
      "At night, indicate a player who must not use their voice the following day.",
  },
  {
    id: "tanner",
    name: "Tanner",
    team: undefined,
    description: "You only win if you are lynched.",
  },
  {
    id: "tough-guy",
    name: "Tough Guy",
    team: "villager",
    description: "You survive an extra day if attacked by werewolves at night.",
  },
  {
    id: "vampire",
    name: "Vampire",
    team: "vampire",
    nightlyAction: true,
    description:
      "Choose a player to kill each night. You win if all of the werewolves are dead and you are still alive.",
  },
  {
    id: "villager",
    name: "Villager",
    team: "villager",
    description: "Find the werewolves and kill them during the day.",
  },
  {
    id: "werewolf-hunter",
    name: "Werewolf Hunter",
    team: "werewolf",
    description:
      "You are a werewolf. If you are killed, take someone down with you.",
  },
  {
    id: "werewolf",
    name: "Werewolf",
    team: "werewolf",
    description:
      "Eat a villager each night. All the werewolves must agree on a target, or else the moderator will let the Alpha Wolf decide.",
  },
  {
    id: "whore",
    name: "Whore",
    team: "villager",
    nightlyAction: true,
    description:
      "Each night, choose a player to sleep with. If you choose a werewolf, a vampire, or their victim, you die. If the werewolves or vampires target you at night, you don’t die - you weren’t home.",
  },
  {
    id: "wolf-cub",
    name: "Wolf Cub",
    team: "werewolf",
    description:
      "You are a werewolf. If you die, the werewolves get two kills the following night.",
  },
  {
    id: "zombie-wolf",
    name: "Zombie Wolf",
    team: "werewolf",
    description:
      "You are a werewolf. Once per game, choose a player to become a werewolf.",
  },
];

export const roles = new Map(rolesData.map((o) => [o.id, o as Role]));
