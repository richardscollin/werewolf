import Discord, {
  CategoryChannel,
  DiscordAPIError,
  GuildApplicationCommandManager,
  GuildMember,
  GuildMemberRoleManager,
} from "discord.js";
import dotenv from "dotenv";
import { StartGameEvent } from "../scripts/game-event.js";
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
  console.log("Commands updated");
});

client.on("interaction", async (interaction: Discord.Interaction) => {
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

      case "point":
        point(interaction);
        break;
      case "help":
        interaction.reply("Looks like you need some help.");
        break;
      case "start": {
        if (!isModerator(interaction, name)) break;
        startGame(interaction);
        const message = game.info(client);
        const dm = await interaction.user.createDM();
        dm.send(message);
        break;
      }
      case "day": {
        if (!isModerator(interaction, name)) break;
        day(interaction);
        break;
      }
      case "night": {
        if (!isModerator(interaction, name)) break;
        night(interaction);
        break;
      }
    }
  }
});

client.on("message", (message) => {
  console.log(`New message from ${message.author.username}`);
});
client.login(config.botToken);

function isModerator(
  interaction: Discord.CommandInteraction,
  command: string
): boolean | undefined {
  /* If returns undefined then the command was likely launched from a pm and we can't determine
  if they are a mod. /zmod commands must be launched from the server / guild context.
  */
  const roles = interaction.member?.roles;
  if (roles === undefined) {
    return undefined;
  }

  let mod = Array.from((roles as GuildMemberRoleManager).cache.values(), (r) =>
    r.name.toLowerCase()
  ).includes("moderator");

  if (command !== "start" && interaction.user.id === game.mod) {
    mod = true;
  }

  if (mod === undefined) {
    interaction.reply(
      "You are not the game moderator. (/start must be run from a server channel)"
    );
    return false;
  } else if (!mod) {
    interaction.reply(
      "Sorry you can't run this command because you aren't assigned the moderator role."
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

async function startGame(interaction: Discord.CommandInteraction) {
  let roleCounts: Map<string, number> | undefined;

  // @ts-ignore
  const roleString = interaction.options[0].options[0].value as string;
  roleCounts = parseRoleString(roleString);
  if (!roleCounts) {
    console.log(`Error in role string ${roleString}.`);
    await interaction.reply("Sorry there's an error in the role string.");
    return;
  }

  game.mod = interaction.user.id;

  roleCounts = roleCounts!;
  console.log(roleCounts);

  const cm = interaction.guild!.channels.cache;
  const werewolfVoiceChannel = cm.find(
    (c) => c.name.toLowerCase().includes("town square") && !c.isText()
  )!;
  console.log(
    `Using ${werewolfVoiceChannel.name} in ${werewolfVoiceChannel.guild.name}.`
  );
  const players = werewolfVoiceChannel.members;
  if (players.size === 0) {
    await interaction.reply(`Error no players in the werewolf voice channel.`);
    return;
  }

  let playerIds = Array.from(players.keys(), (id) => id.toString());
  console.log(playerIds);
  console.log(game.mod);

  // don't include the mod as a player
  playerIds = playerIds.filter((id) => id != game.mod);
  const id2username = (id: string) => id2user(client, id)?.username;

  let playersText = "";
  for (let playerId of playerIds) {
    playersText += id2username(playerId) + " ";
  }
  game.assignRoles(playerIds, roleCounts);
  /*
  if (!) {
    await interaction.reply(
      `Can't start the role. Number playerIds: ${playerIds.length}. number roleCounts ${roleCounts.size}`
    );
    return;
  }
  */

  /*
  await interaction.reply(
    `Starting a game with ${playerIds.length} players:\n${playersText}`
  );
  */

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
}

async function night(interaction: Discord.CommandInteraction) {
  await interaction.reply("The night phase has begun.");
  game.werewolves.forEach(async (wolf) => {
    const dm = await id2user(client, wolf)?.createDM();
    dm?.send(
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
      dm?.send("You must /point to a player for your action tonight.");
    }
  }

  game.beginNight();
}

function day(interaction: Discord.CommandInteraction) {
  interaction.reply("The night phase has begun.");
  game.beginDay();
}

async function point(interaction: Discord.CommandInteraction) {
  const options = interaction.options;
  const pointie = options[0].user as Discord.User;

  if (!game.isNight) {
    interaction.reply("Pointing is only allowed at night.");
    return;
  }

  const currentRole = game.id2Role(interaction.user.id);

  if (currentRole === undefined) {
    interaction.reply("You can only point when you have a role assigned.");
    return;
  }

  const responseMessage = game.playerPointsToPlayer(
    interaction.user.id,
    pointie.id,
    pointie.username
  );
  interaction.reply(responseMessage);

  if (currentRole.isWerewolf()) {
    game.werewolves.forEach(async (wolf) => {
      const dm = await id2user(client, wolf)?.createDM();
      dm?.send(`${interaction.user.username} pointed at ${pointie.username}.`);
    });
  }
}

function id2user(client: Discord.Client, id: string): Discord.User | undefined {
  return client.users.cache.get(id as `${bigint}`);
}
