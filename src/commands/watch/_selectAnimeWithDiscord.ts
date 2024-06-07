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

export async function selectAnimeWithDiscord(
  animes: Array<{ name: string; url: string }>,
  interaction: CommandInteraction
): Promise<string> {
  const animeNames = animes.map(anime => anime.name);

  const embed = new EmbedBuilder()
    .setTitle(
      `🔍 Resultado da busca por: ${
        interaction.options.data[0].value as string
      }`
    )
    .setColor("#FF69B4")
    .setImage(
      "https://media1.tenor.com/m/RBLgZ51nQpgAAAAC/anya-forger-stare.gif"
    )
    .setDescription(
      `${animeNames.map(anime_name => `• ${anime_name}`).join("\n\n")}
        
        ➡ Selecione o anime que deseja assistir
        `
    );

  const select = new StringSelectMenuBuilder()
    .setCustomId("starter")
    .setPlaceholder("🎥 Selecione um anime")
    .addOptions(
      animeNames.map(animeName =>
        new StringSelectMenuOptionBuilder()
          .setValue(animeName)
          .setLabel(animeName)
      )
    );

  const response = await interaction.editReply({
    embeds: [embed],
    components: [{ type: 1, components: [select] }],
  });

  const filter = (i: Interaction) =>
    i.isStringSelectMenu() && i.customId === "starter";

  const collector = response.createMessageComponentCollector({
    filter,
    time: 3_600_000,
  });

  return new Promise((resolve, reject) => {
    collector.on("collect", async i => {
      if (i.isStringSelectMenu()) {
        const selection = (i as StringSelectMenuInteraction).values[0];
        resolve(selection);
        await i.update({ components: [] }); // Desativar o menu após a seleção
      }
    });

    collector.on("end", async collected => {
      if (collected.size === 0) {
        await interaction.editReply("Tempo esgotado, tente novamente!");
        reject("Tempo esgotado");
      }
    });
  });
}
