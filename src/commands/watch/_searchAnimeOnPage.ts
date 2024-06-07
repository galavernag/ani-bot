import axios from "axios";
import * as cheerio from "cheerio";
import { parseAnimes } from "./_parseAnimes";
import { selectAnimeWithDiscord } from "./_selectAnimeWithDiscord";
import type { CommandInteraction } from "discord.js";

// Busca pelo anime na página
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
