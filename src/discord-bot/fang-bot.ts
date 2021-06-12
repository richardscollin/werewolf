import Discord from "discord.js";
import dotenv from "dotenv";
dotenv.config();
const config = {
  botToken: process.env.DISCORD_BOT_TOKEN,
};
import {
  WerewolfStateMachine,
  roles,
  Role,
  IPlayerState,
} from "../scripts/werewolf.js";
const game = new WerewolfStateMachine("discord-game", id2username, undefined);
import { commands, Command } from "./commands.js";

// I'm using the beta api v13 which is unreleased (So I can use the slash command api)
// You can find the docs here
// https://deploy-preview-638--discordjs-guide.netlify.app/interactions/registering-slash-commands.html#global-commands

const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
});

client.once("ready", async () => {
  console.log("fangbot is ready");
  // console.log(Array.from(roles.keys()).join(","));
  // await client.application?.commands.set(commands);
  await client.application?.commands.set([]);
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

    case "as":
      if (!moderatorCheck(commandInteraction)) {
        break;
      }
      await pointAs(commandInteraction);
      break;

    case "point":
      await point(commandInteraction, interaction.user.id);
      break;

    case "start": {
      if (!moderatorCheck(commandInteraction)) {
        break;
      }

      await secretReply(
        interaction,
        "Starting game ... (Message will update after all players are DM'ed)"
      );

      let message = await startGame(commandInteraction);
      const gameInfo = game.info();

      if (gameInfo) {
        message += "\n" + gameInfo;
      }

      await interaction.editReply(message);
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
  /*
  console.log(
    `New message from ${message.author.username} to ${message.channel}.`
  );
  */
});
client.login(config.botToken);

function isModerator(interaction: Discord.CommandInteraction): boolean {
  const roles = interaction.member?.roles;
  return (
    interaction.user.id === game.mod ||
    (roles !== undefined &&
      Array.from(
        (roles as Discord.GuildMemberRoleManager).cache.values(),
        (r) => r.name.toLowerCase()
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

function parseRoleString(roleString?: string): Map<string, number> | undefined {
  if (roleString === undefined) return undefined;
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

async function startGame(
  interaction: Discord.CommandInteraction
): Promise<string> {
  const includeGM = interaction.options.get("include-gm")?.value as
    | boolean
    | undefined;

  console.log(`includeGM: ${includeGM}`);
  const cm = interaction.guild!.channels.cache;
  const werewolfVoiceChannel = cm.find(
    (c) => c.name.toLowerCase().includes("town square") && !c.isText()
  )!;
  //(c.name.toLowerCase().includes("town square") && !c.isText())

  if (werewolfVoiceChannel === undefined) {
    return "Unable to find a werewolf enabled voice channel.";
  }

  let players = werewolfVoiceChannel.members;
  if (includeGM !== true) {
    players = players.filter((player) => player.id !== interaction.user.id);
  }

  const playerIds = Array.from(players.keys(), (id) => id.toString());
  const playersText = playerIds
    .map((playerId) => `- ${id2username(playerId)}`)
    .join("\n");

  let roleString = interaction.options.get("roles")?.value as string;
  let roleCounts = parseRoleString(roleString);
  if (!roleCounts) {
    console.log(`Error in role string ${roleString}.`);
    return "Sorry there's an error in the role string.";
  }

  console.log(roleCounts);
  console.log(
    `${interaction.user.username} started a game in ${werewolfVoiceChannel.guild.name} #${werewolfVoiceChannel.name}.`
  );
  if (players.size === 0) {
    return `Error no players in the werewolf voice channel.`;
  }

  game.mod = interaction.user.id;
  const started = game.assignRoles(playerIds, roleCounts);
  if (!started) {
    let acc = Array.from(roleCounts.values()).reduce((a, b) => a + b, 0);
    return (
      `Can't start the game. Number of players: ${playerIds.length}. Number of roles: ${acc}.` +
      "\nPlayers:\n" +
      playersText
    );
  }

  const werewolfTeam = game.werewolves.map(id2username).join("\n") || "No one";
  const seerTeam = game.seers.map(id2username).join("\n") || "No one";
  const masonTeam = game.masons.map(id2username).join("\n") || "No one";

  for (let [playerId, playerState] of game.players) {
    const player = id2user(client, playerId)!;
    const role = Role.fromObject(playerState.role);
    await sendRole(player, role, werewolfTeam, seerTeam, masonTeam);
  }

  return `Starting a game with ${playerIds.length} players:\n${playersText}\n`;
}

async function night(interaction: Discord.CommandInteraction) {
  if (!game.hasStarted) {
    await interaction.reply("Start a game before running the /night command.");
    return;
  }
  console.log("Starting the night phase.");
  await interaction.reply("Starting the night phase.");

  for (let [playerId, player] of game.players.entries()) {
    if (
      player.role.nightlyAction ||
      (player.role.firstNightAction && game.isFirstNight)
    ) {
      const dm = await id2user(client, playerId)?.createDM();

      await dm?.send(
        `/point to the player you would like to ${player.role.verb?.present}.` +
          "You have to run the command from a channel in the server and NOT in this direct message."
      );
    }
  }

  game.beginNight();
}

async function day(interaction: Discord.CommandInteraction) {
  const message = game.beginDay();
  await secretReply(interaction, message);
}

async function pointAs(interaction: Discord.CommandInteraction) {
  const options = interaction.options;
  const as = options.get("as")?.user as Discord.User;
  const pointie = options.get("player")?.user as Discord.User;

  return point(interaction, as.id);
}

async function point(
  interaction: Discord.CommandInteraction,
  pointerId: string
) {
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

  const responseMessage = game.playerPointsToPlayer(pointerId, pointie.id);
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

async function sendRole(
  player: Discord.User,
  role: Role,
  werewolfTeam: string,
  seerTeam: string,
  masonTeam: string
) {
  const fields = [
    {
      name: role.name,
      value: role.description,
      inline: true,
    },
  ];

  let extra = undefined;
  if (role.team === "werewolf") {
    extra = {
      name: "Werewolves",
      value: werewolfTeam,
      inline: false,
    };
  }
  if (role.id === "beholder") {
    extra = {
      name: "Seer",
      value: seerTeam,
      inline: false,
    };
  } else if (role.id === "mason") {
    extra = {
      name: "Masons",
      value: masonTeam,
      inline: false,
    };
  }
  if (extra) {
    fields.push(extra);
  }

  const roleEmbed = new Discord.MessageEmbed({
    title: "Your Role",
    fields,
    files: [`public/svg/images/werewolf-icons_${role.id}.png`],
    thumbnail: { url: `attachment://werewolf-icons_${role.id}.png` },
  });

  const dm = await player?.createDM();

  await dm?.send({ embed: roleEmbed });
}
