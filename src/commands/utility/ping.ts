import { CommandInteraction, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with pong!");

async function execute(interaction: CommandInteraction) {
  await interaction.reply("pong!");
}

export { data, execute };
