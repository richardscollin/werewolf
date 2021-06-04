import Discord, {
  CategoryChannel,
  DiscordAPIError,
  GuildApplicationCommandManager,
} from "discord.js";
import dotenv from "dotenv";
import { StartGameEvent } from "../scripts/game-event.js";
dotenv.config();
const config = {
  botToken: process.env.DISCORD_BOT_TOKEN,
};

// The core game logic should be in the werewolf script
// and implemented in a way that supports both the discord bot
// and the website
import { WerewolfStateMachine, roles, Role } from "../scripts/werewolf.js";
const game = new WerewolfStateMachine("discord-game");

import { commands, ModCommand, Command } from "./commands.js";

// I'm using the beta api v13 which is unreleased (So I can use the slash command api)
// You can find the docs here
// https://deploy-preview-638--discordjs-guide.netlify.app/interactions/registering-slash-commands.html#global-commands

const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
});

client.once("ready", () => {
  console.log("fang-bot is ready");
  for (let [guildId, guild] of client.guilds.cache.entries()) {
    console.log("Updating");
    console.log(guild.name);
    client.guilds.cache
      .get(guildId)
      ?.commands.set(commands)
      .then(() => {
        console.log("Updated commands");
      })
      .catch(console.error);
  }
});

client.on("interaction", async (interaction: Discord.Interaction) => {
  try {
    if (interaction.isCommand()) {
      const commandInteraction = interaction as Discord.CommandInteraction;
      const command = commandInteraction.command;
      const options = commandInteraction.options;
      const name = commandInteraction.commandName;

      console.log(`Executing ${name} command`);
      switch (name as Command) {
        default:
          console.log(command);
          interaction.reply("I'm sorry. I don't understand.");
          break;

        case "help":
          interaction.reply(
            `The commands are: ${commands.map((c) => "/" + c.name).join(" ")}`
          );
          break;
        case "kill":
          interaction.reply("Okay I'll send you a DM");
          break;

        case "lynch":
          break;
        case "point":
          point(interaction);
          break;
        case "vote":
          break;
        case "zmod":
          if (!isModerator(interaction)) {
            interaction.reply(
              "Sorry you can't run this command because you aren't assigned the moderator role."
            );
            break;
          }
          const subcommand = options[0].name;
          console.log(`Executing ${subcommand} subcommand`);
          switch (subcommand as ModCommand) {
            case "day":
              day(interaction);
              break;
            case "night":
              night(interaction);
              break;
            case "info":
              let infoMessage = "Roles:\n";
              for (let [playerId, playerState] of game.players.entries()) {
                // @ts-ignore
                const username = client.users.cache.get(playerId)?.username;
                infoMessage += `${username}: ${playerState.role.name}`;
              }
              const dm = await interaction.user.createDM();
              dm.send(infoMessage);
              interaction.reply("DM'd");
              break;
            case "start":
              startGame(interaction);
              break;
          }
          interaction.reply("done");

          break;
      }
    }
  } catch (e) {
    console.error(e);
  }
});

client.on("message", (message) => {
  console.log({message})
})

client.login(config.botToken);

function isModerator(interaction: Discord.CommandInteraction): boolean {
  const roles = interaction.member!.roles as Discord.GuildMemberRoleManager;
  return Array.from(roles.cache.values(), (r) => r.name.toLowerCase()).includes(
    "moderator"
  );
}

function parseRoleString(roleString: string): Map<string, number> | undefined {
  try {
    const result = new Map();
    const data = roleString.split(/[:, ]/).filter((x) => x !== "");
    for (let i = 0; i < data.length - 1; i++) {
      if (!roles.has(data[i])) {
        throw Error();
      }
      result.set(data[i], parseInt(data[i + 1]));
    }
    return result;
  } catch {
    return undefined;
  }
}

async function startGame(interaction: Discord.CommandInteraction) {
  let roleCounts: Map<string, number> | undefined;

  // @ts-ignore
  const roleString = interaction.options[0].options[0].value as string;
  roleCounts = parseRoleString(roleString);
  if (!roleCounts) {
    interaction.reply("Sorry there's an error in the role string.");
    return;
  }

  roleCounts = roleCounts!;
  console.log(roleCounts);

  const cm = interaction.guild!.channels.cache;
  console.log(cm);
  cm.forEach(x => console.log(x));
  const werewolfVoiceChannel = cm.find(
    (c) =>
      (c.name.toLowerCase() === "table 1" ||
        c.name.toLowerCase() === "werewolf") &&
      !c.isText()
  )!;
  console.log(werewolfVoiceChannel);
  const players = werewolfVoiceChannel.members;
  if (players.size === 0) {
    interaction.reply(`Error no players in the werewolf voice channel.`);
    return;
  }

  const playerIds = Array.from(players.keys(), (id) => id.toString());
  const playersText = Array.from(players, ([k, v]) => v.nickname).join("\n");

  game.assignRoles(playerIds, roleCounts);

  const id2username = (id: string) => {
    // @ts-ignore
    const user = client.users.cache.get(id);
    return user?.username;
  };
  const werewolfTeam = game.werewolves.map(id2username);
  const seerTeam = game.seers.map(id2username);
  const masonTeam = game.masons.map(id2username);

  for (let [playerId, playerState] of game.players) {
    // @ts-ignore
    const player = client.users.cache.get(playerId)!;
    const dm = await player.createDM();
    let message = `Your role is ${playerState.role.name}.\n`;
    message += playerState.role.description;

    if (playerState.role.team === "werewolf") {
      message += `\nThe wolves are: ${werewolfTeam.join(" ")}`;
    }

    if (playerState.role.id === "beholder") {
      message += `\nThe seer is ${seerTeam.join(" ")}`;
    } else if (playerState.role.id === "mason") {
      message += `\nThe masons are: ${masonTeam.join(" ")}`;
    }
    dm.send(message);
  }

  interaction.reply(
    `Starting a game with ${players?.size} players:\n${playersText}`
  );
}

function night(interaction: Discord.CommandInteraction) {
  interaction.reply("The night phase has begun.");

  game.werewolves.forEach(async (wolf) => {
    // @ts-ignore
    const dm = await client.users.cache.get(wolf)?.createDM();
    dm?.send(
      `Waiting on you to point to a target. If all the wolves` +
        ` are pointing at the same player` +
        ` then they will be eaten. If the alpha wolf` +
        ` uses the kill command the pointing phase will be skipped.`
    );
  });

  game.beginNight();
}

function day(interaction: Discord.CommandInteraction) {
  interaction.reply("The night phase has begun.");
  game.beginDay();
}

async function point(interaction: Discord.CommandInteraction) {
  const options = interaction.options;
  const pointie = (options![0] as any).user as Discord.User;

  if (!game.isNight) {
    interaction.reply("Pointing is only allowed at night.");
  }

  const responseMessage = game.playerPointsToPlayer(
    interaction.user.id,
    pointie.id,
    pointie.username
  );
  interaction.reply(responseMessage);

  const currentRole = game.id2Role(interaction.user.id);
  if (currentRole.isWerewolf()) {
    game.werewolves.forEach(async (wolf) => {
      // @ts-ignore
      const dm = await client.users.cache.get(wolf)?.createDM();
      dm?.send(`${interaction.user.username} pointed at ${pointie.username}.`);
    });
  }
}
