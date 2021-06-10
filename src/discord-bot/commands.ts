import Discord from "discord.js";

export type Command = "help" | "point" | "start" | "day" | "night";

export const commands: Discord.ApplicationCommandData[] = [
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
        required: false,
        type: "STRING",
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
