import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  type Interaction,
} from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";

import { parseAnimes } from "./_parseAnimes";
import { searchAnime } from "./_searchAnime";

const baseSiteURL = "https://animefire.plus/";

const data = new SlashCommandBuilder()
  .setName("watch")
  .setDescription("Start anime session")
  .addStringOption(option =>
    option.setName("name").setDescription("The anime name").setRequired(true)
  );

async function execute(interaction: CommandInteraction) {
  const animeName = interaction.options.data[0].value as string;

  // Diferir a resposta inicial
  await interaction.deferReply();

  try {
    const animeURL = await searchAnime(animeName, interaction);

    console.log(animeURL);
  } catch (error: any) {
    console.error(error);
    // Editar a resposta diferida com a mensagem de erro
    await interaction.editReply(
      "Houve um erro na execução do comando, tente novamente!"
    );
  }
}

export { data, execute };
