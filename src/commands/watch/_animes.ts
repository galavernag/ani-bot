import {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  type CommandInteraction,
  type Interaction,
} from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
const baseSiteURL = "https://animefire.plus/";

// Busca pelo anime no site
export async function searchAnime(
  animeName: string,
  interaction: CommandInteraction
): Promise<string> {
  let currentPageURL = `${baseSiteURL}/pesquisar/${animeName
    .toLowerCase()
    .replaceAll(" ", "-")}`;

  while (true) {
    const { animeURL, nextPageURL } = await searchAnimeOnPage(
      currentPageURL,
      interaction
    );
    if (animeURL) {
      return animeURL;
    }
    if (!nextPageURL) {
      throw new Error("No anime found with the given name");
    }
    currentPageURL = baseSiteURL + nextPageURL;
  }
}

export function parseAnimes(
  $: cheerio.CheerioAPI
): Array<{ name: string; url: string }> {
  const animes: Array<{ name: string; url: string }> = [];
  $(".row.ml-1.mr-1 a").each((i, element) => {
    const name = $(element).text().trim();
    const url = $(element).attr("href");

    if (!name || !url) {
      return;
    }

    animes.push({ name, url });
  });
  return animes;
}

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
    .setCustomId("anime_select")
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
    i.isStringSelectMenu() && i.customId === "anime_select";

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

export async function searchAnimeOnPage(
  url: string,
  interaction: CommandInteraction
): Promise<{ animeURL: string; nextPageURL: string }> {
  const response = await axios.get(url);

  if (response.status !== 200) {
    if (response.status === 403) {
      throw new Error(
        "Connection refused: You need be in Brazil or use a VPN to access the server."
      );
    }
    throw new Error(
      `Search failed, the server returned the error: ${response.status}`
    );
  }

  const $ = cheerio.load(response.data);
  const animes = parseAnimes($);

  if (animes.length > 0) {
    const selectedAnimeName = await selectAnimeWithDiscord(animes, interaction);

    if (!selectedAnimeName) {
      throw new Error("No anime selected");
    }

    const selectedAnime = animes.find(
      anime => anime.name === selectedAnimeName
    );

    if (!selectedAnime) {
      throw new Error("No anime found with the given name");
    }

    return { animeURL: selectedAnime.url, nextPageURL: "" };
  }

  const nextPage = $(".pagination .next a").attr("href");
  return { animeURL: "", nextPageURL: nextPage || "" };
}
