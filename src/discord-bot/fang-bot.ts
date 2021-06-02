import Discord, { CategoryChannel, DiscordAPIError } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
const config = {
  botToken: process.env.DISCORD_BOT_TOKEN,
};
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
        console.log(interaction);
        interaction.reply("hello");
        break;
      case "kill":
        interaction.reply("Okay I'll send you a DM");
        break;
      case "start":
        if (!isModerator(interaction)) {
          interaction.reply(
            "Sorry we can't start the game because you don't have the moderator role."
          );
          break;
        }

        const cm = interaction.guild!.channels.cache;
        const werewolfVoiceChannel = cm.find(
          (c) => c.name === "werewolf" && !c.isText()
        )!;
        const players = werewolfVoiceChannel.members;
        const playersText = Array.from(
          players.mapValues((x) => x.nickname)
        ).join("\n");

        players?.forEach((player) => {
          player.createDM().then((dm) => {
            dm.send("This should be a DM.");
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
  return Array.from(roles.cache.values(), (r) =>
    r.name.toLowerCase()
  ).includes("moderator");
}
