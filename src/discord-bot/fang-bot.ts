import Discord, { CategoryChannel, DiscordAPIError } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
const config = {
  botToken: process.env.DISCORD_BOT_TOKEN,
};

// The core game logic should be in the werewolf script
// and implemented in a way that supports both the discord bot
// and the website
import { WerewolfStateMachine, roles, Role } from "../scripts/werewolf.js";
const game = new WerewolfStateMachine("discord-game");

import { commands, Command } from "./commands.js";

// I'm using the beta api v13 which is unreleased (So I can use the slash command api)
// You can find the docs here
// https://deploy-preview-638--discordjs-guide.netlify.app/interactions/registering-slash-commands.html#global-commands

const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
});

client.once("ready", () => {
  console.log("fang-bot is ready");
  const guildIds = Array.from(client.guilds.cache.keys());
  const guildId = guildIds[0]; // for now only 1 guild

  client.guilds.cache
    .get(guildId)
    ?.commands.set(commands)
    .then(() => {
      console.log("Updated commands");
    })
    .catch(console.error);
});

client.on("interaction", async (interaction: Discord.Interaction) => {
  if (interaction.isCommand()) {
    const commandInteraction = interaction as Discord.CommandInteraction;
    const command = commandInteraction.command;
    const options = command?.options;
    const name = commandInteraction.commandName;

    console.log(`Executing ${name} command`);
    switch (name as Command) {
      case "help":
        interaction.reply(
          `The commands are: ${commands.map((c) => "/" + c.name).join(" ")}`
        );
        break;
      case "kill":
        interaction.reply("Okay I'll send you a DM");
        break;

      case "list":
        if (!isModerator(interaction)) {
          interaction.reply(
            "Sorry we can't start the game because you don't have the moderator role."
          );
          break;
        }
        interaction.reply(game.players.toString());
        console.log(game);
        break;
      case "start":
        if (!isModerator(interaction)) {
          interaction.reply(
            "Sorry we can't start the game because you don't have the moderator role."
          );
          break;
        }
        console.log(interaction.options);

        let roleCounts: Map<string, number> | undefined;
        if (interaction.options[0].name === "roles") {
          const roleString = interaction.options[0].value as string;
          roleCounts = parseRoleString(roleString);
          if (!roleCounts) {
            interaction.reply("Sorry there's an error in the role string.");
            break;
          }
        }
        roleCounts = roleCounts!;
        console.log(roleCounts);

        const cm = interaction.guild!.channels.cache;
        const werewolfVoiceChannel = cm.find(
          (c) => c.name === "werewolf" && !c.isText()
        )!;
        //console.log(werewolfVoiceChannel);
        const players = werewolfVoiceChannel.members;
        if (players.size === 0) {
          interaction.reply(`Error no players in the werewolf voice channel.`);
          break;
        }

        const playerIds = Array.from(players.keys(), (id) => id.toString());
        const playersText = Array.from(players, ([k, v]) => v.nickname).join(
          "\n"
        );

        game.assignRoles(playerIds, roleCounts);

        players?.forEach((player) => {
          player.createDM().then((dm) => {
            const x = game.players.get(player.id);
            dm.send(`Your role is ${x?.role.name}`);
          });
        });

        interaction.reply(
          `Starting a game with ${players?.size} players:\n${playersText}`
        );

        break;
      case "lynch":
        break;
      case "point":
        interaction.reply("You pointed at someone");
        break;
      case "vote":
        break;

      default:
        interaction.reply("I'm sorry. I don't understand.");
        break;
    }
  }
});
/*
client.on("message", (message) => {
  console.log({message})
})
*/
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
