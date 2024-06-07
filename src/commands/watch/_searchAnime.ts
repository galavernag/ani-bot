import type { CommandInteraction } from "discord.js";
import { searchAnimeOnPage } from "./_searchAnimeOnPage";

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
