import Discord from "discord.js";

export type Command = "as" | "help" | "point" | "start" | "day" | "night";

export const commands: Discord.ApplicationCommandData[] = [
  {
    name: "as",
    description: "Run point to a player as another player. (for testing; gm only)",
    options: [
      {
        type: "USER",
        required: true,
        name: "as",
        description: "the player you want to pretend to be",
      },
      {
        type: "USER",
        required: true,
        name: "player",
        description: "the player you want to point to",
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
    name: "start",
    description:
      "start a new game from all the players in the #werewolf voice channel (gm only).",
    options: [
      {
        name: "roles",
        description:
          "A space or command seperated list containing the number of each role to use",
        required: true,
        type: "STRING",
      },
      {
        name: "include-gm",
        description:
          "Assign the game master a role in the game. Defaults to false. (Useful for testing).",
        required: false,
        type: "BOOLEAN",
      },
    ],
  },
  {
    name: "day",
    description: "begin the day phase (gm only)",
  },
  {
    name: "night",
    description: "begin the night phase (gm only)",
  },
];
