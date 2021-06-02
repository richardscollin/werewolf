import Discord from "discord.js";

export type Command = "help" | "kill" | "lynch" | "point" | "vote" | "zmod";
export type ModCommand = "start" | "night" | "day" | "info";

export const commands: Discord.ApplicationCommandData[] = [
  {
    name: "help",
    description: "Explain all of the FangBot commands",
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
  {
    name: "zmod",
    description: "the moderator commands",
    options: [
      {
        name: "info",
        type: "SUB_COMMAND",
        description: "get game info",
      },
      {
        name: "day",
        type: "SUB_COMMAND",
        description: "begin the day phase",
      },
      {
        name: "night",
        type: "SUB_COMMAND",
        description: "begin the night phase",
      },
      {
        name: "start",
        type: "SUB_COMMAND",
        description:
          "start a new game from all the players in the #werewolf voice channel (gm only).",
        options: [
          {
            name: "roles",
            description:
              "A space or command seperated list containing the number of each role to use",
            required: false,
            type: "STRING",
          },
        ],
      },
    ],
  },
];
