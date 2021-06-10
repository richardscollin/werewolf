import Discord, {
  CategoryChannel,
  DiscordAPIError,
  GuildApplicationCommandManager,
  GuildMember,
  GuildMemberRoleManager,
} from "discord.js";
import dotenv from "dotenv";
dotenv.config();
const config = {
  botToken: process.env.DISCORD_BOT_TOKEN,
};
import { WerewolfStateMachine, roles, Role } from "../scripts/werewolf.js";
const game = new WerewolfStateMachine("discord-game");
import { commands, Command } from "./commands.js";

// I'm using the beta api v13 which is unreleased (So I can use the slash command api)
// You can find the docs here
// https://deploy-preview-638--discordjs-guide.netlify.app/interactions/registering-slash-commands.html#global-commands

const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
});

client.once("ready", async () => {
  console.log("fangbot is ready");
  await client.application?.commands.set(commands);
  client.guilds.cache.forEach(async (guild) => {
    await guild?.commands.set(commands);
  });
  console.log("Commands updated");
});

client.on("interaction", async (interaction: Discord.Interaction) => {
  if (!interaction.isCommand()) {
    console.warn("received non-command interaction.");
    console.log("received non-command interaction.");
    return;
  }

  const commandInteraction = interaction as Discord.CommandInteraction;
  const command = commandInteraction.command;
  console.log(`Executing ${commandInteraction.commandName} command`);
  switch (commandInteraction.commandName as Command) {
    default:
      console.log(command);
      await commandInteraction.reply("I'm sorry. I don't understand.");
      break;

    case "point":
      await point(commandInteraction);
      break;

    case "start": {
      if (!moderatorCheck(commandInteraction)) {
        break;
      }

      let message = await startGame(commandInteraction);
      const gameInfo = game.info(id2username);

      if (gameInfo) {
        message += gameInfo;
      }
      await secretReply(interaction, message);
      break;
    }
    case "day": {
      if (!moderatorCheck(commandInteraction)) {
        break;
      }
      await day(commandInteraction);
      break;
    }
    case "night": {
      if (!moderatorCheck(commandInteraction)) {
        break;
      }
      await night(commandInteraction);
      console.log(commandInteraction.replied);
      break;
    }
  }
});

client.on("message", (message) => {
  console.log(
    `New message from ${message.author.username} to ${message.channel}.`
  );
});
client.login(config.botToken);

function isModerator(interaction: Discord.CommandInteraction): boolean {
  const roles = interaction.member?.roles;
  return (
    interaction.user.id === game.mod ||
    (roles !== undefined &&
      Array.from((roles as GuildMemberRoleManager).cache.values(), (r) =>
        r.name.toLowerCase()
      ).includes("moderator"))
  );
}

async function moderatorCheck(
  interaction: Discord.CommandInteraction
): Promise<boolean> {
  const isMod = isModerator(interaction);
  console.log(`isMod: ${isMod}`);
  if (!isMod) {
    await secretReply(
      interaction,
      "You must be a moderator to run that command (or launch it from a server channel)."
    );
    return false;
  }
  return true;
}

function parseRoleString(roleString: string): Map<string, number> | undefined {
  try {
    const result = new Map();
    const data = roleString.split(/[:, ]/).filter((x) => x !== "");
    for (let i = 0; i < data.length - 1; i += 2) {
      if (!roles.has(data[i])) {
        console.log(`Role ${data[i]} doesn't exist.`);
        throw Error();
      }
      result.set(data[i], parseInt(data[i + 1]));
    }
    return result;
  } catch {
    return undefined;
  }
}

async function startGame(interaction: Discord.CommandInteraction): Promise<string> {
  let roleCounts: Map<string, number> | undefined;
  const roleString = interaction.options.get("roles")?.value as string;
  roleCounts = parseRoleString(roleString);
  if (!roleCounts) {
    console.log(`Error in role string ${roleString}.`);
    return "Sorry there's an error in the role string.";
  }

  game.mod = interaction.user.id;
  roleCounts = roleCounts!;
  console.log(roleCounts);

  const cm = interaction.guild!.channels.cache;
  const werewolfVoiceChannel = cm.find(
    (c) => c.name.toLowerCase().includes("town square") && !c.isText()
  )!;
  console.log(
    `${interaction.user.username} started a game in ${werewolfVoiceChannel.guild.name} #${werewolfVoiceChannel.name}.`
  );
  const players = werewolfVoiceChannel.members;
  if (players.size === 0) {
    return `Error no players in the werewolf voice channel.`;
  }

  let playerIds = Array.from(players.keys(), (id) => id.toString());

  // don't include the mod as a player
  // playerIds = playerIds.filter((id) => id !== game.mod);

  let playersText = "";
  for (let playerId of playerIds) {
    playersText += `- ${id2username(playerId)}\n`;
  }
  const started = game.assignRoles(playerIds, roleCounts);
  if (!started) {
    return (
      `Can't start the game. Number of players: ${playerIds.length}. Number of roles: ${roleCounts.size}.` +
      "\nPlayers:\n" +
      playersText
    );
  }

  const werewolfTeam = game.werewolves.map(id2username);
  const seerTeam = game.seers.map(id2username);
  const masonTeam = game.masons.map(id2username);

  for (let [playerId, playerState] of game.players) {
    const player = id2user(client, playerId);
    const dm = await player?.createDM();
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

    await dm?.send(message);
  }

  return `Starting a game with ${playerIds.length} players:\n${playersText}`;
}

async function night(interaction: Discord.CommandInteraction) {
  console.log("in night");
  console.log(interaction.replied);
  if (!game.hasStarted) {
    console.log("start a new game");
    await secretReply(interaction, "Start a new game first.");
    return;
  }

  console.log("the night phase has begun");
  await interaction.reply("Starting the night phase.");

  /*
  game.werewolves.forEach(async (wolf) => {
    const dm = await id2user(client, wolf)?.createDM();
    await dm?.send(
      `Waiting on you to point to a target using the /point command.` +
        `If all the wolves` +
        ` are pointing at the same player` +
        ` then they will be eaten. If the alpha wolf` +
        ` uses the kill command the pointing phase will be skipped.`
    );
  });

  for (let [playerId, player] of game.players.entries()) {
    if (player.role.nightlyAction) {
      const dm = await id2user(client, playerId)?.createDM();
      await dm?.send("You must /point to a player for your action tonight.");
    }
  }
  */

  game.beginNight();
}

function day(interaction: Discord.CommandInteraction) {
  interaction.reply("Starting the day phase.");
  game.beginDay();
}

async function point(interaction: Discord.CommandInteraction) {
  const options = interaction.options;
  const pointie = options.get("player")?.user as Discord.User;

  if (!game.isNight) {
    secretReply(interaction, "Pointing is only allowed at night.");
    return;
  }

  const currentRole = game.id2Role(interaction.user.id);

  if (currentRole === undefined) {
    secretReply(
      interaction,
      "You can only point when you have a role assigned."
    );
    return;
  }

  const responseMessage = game.playerPointsToPlayer(
    interaction.user.id,
    pointie.id,
    pointie.username
  );
  secretReply(interaction, responseMessage);

  if (currentRole.isWerewolf()) {
    game.werewolves.forEach(async (wolf) => {
      const dm = await id2user(client, wolf)?.createDM();
      dm?.send(`${interaction.user.username} pointed at ${pointie.username}.`);
    });
  }
}

async function secretReply(
  interaction: Discord.CommandInteraction,
  message: string
) {
  return interaction.reply({ ephemeral: true, content: message });
}

function id2user(client: Discord.Client, id: string): Discord.User | undefined {
  return client.users.cache.get(id as `${bigint}`);
}
function id2username(id: string): string | undefined {
  return id2user(client, id)?.username;
}
