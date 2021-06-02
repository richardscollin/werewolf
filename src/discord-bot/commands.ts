import Discord from "discord.js";

export type Command = "help" | "kill" | "lynch" | "point" | "start" | "vote";
export const commands: Discord.ApplicationCommandData[] = [
  {
    name: "help",
    description: "Explain all of the FangBot commands",
  },
  {
    name: "start",
    description:
      "start a new game from all the players in the #werewolf voice channel (gm only).",
    options: [
      {
        name: "number-wolves",
        type: "INTEGER",
        required: false,
        description: "the number of wolves",
      },
      {
        name: "include-alpha-wolf",
        type: "BOOLEAN",
        required: false,
        description: "whether or not to include the alpha wolf",
      },
    ],
  },
  {
    name: "kill",
    description: "kill a player",
    options: [
      {
        type: "USER",
        required: true,
        name: "player",
        description: "the player you'd like to kill",
      },
    ],
  },
  {
    name: "lynch",
    description: "nominate a player to lynch",
    options: [
      {
        type: "USER",
        required: true,
        name: "player",
        description: "the player you'd like to lynch",
      },
    ],
  },
  {
    name: "point",
    description: "point at a player",
    options: [
      {
        type: "USER",
        required: true,
        name: "player",
        description: "the player you want to point to",
      },
    ],
  },
  {
    name: "vote",
    description: "vote on whether or not you want to lynch a player",
    options: [
      {
        name: "your-vote",
        type: "STRING",
        required: true,
        description: "to lynch or not to lynch",
        choices: [
          {
            name: "Lynch",
            value: "lynch",
          },
          {
            name: "Don't lynch",
            value: "dont-lynch",
          },
        ],
      },
    ],
  },
];
