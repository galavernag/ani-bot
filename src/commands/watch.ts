import { CommandInteraction, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("watch")
  .setDescription("Start anime session");

async function execute(interaction: CommandInteraction) {
  await interaction.reply("watchhhh!");
}

export { data, execute };
