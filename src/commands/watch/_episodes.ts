import * as cheerio from "cheerio";
import axios from "axios";

interface Episode {
  Number: string; // The episode number as a string, likely for display purposes
  Num: number; // The episode number as a numeric value, for sorting
  URL: string; // The URL to the episode
}

export async function getAnimeEpisodes(animeURL: string) {
  try {
    const response = await safeGet(animeURL);
    const $ = cheerio.load(response.data);

    const episodes = parseEpisodes($);
    sortEpisodesByNum(episodes);

    return episodes;
  } catch (err: any) {
    console.error(`Failed to get anime details: ${err.message}`);
    throw new Error(`Failed to get anime details: ${err.message}`);
  }
}

export async function safeGet(url: string) {
  try {
    const response = await axios.get(url);
    return response;
  } catch (err: any) {
    console.error(`Failed to fetch URL: ${err.message}`);
    throw new Error(`Failed to fetch URL: ${err.message}`);
  }
}

export function parseEpisodes($: cheerio.CheerioAPI) {
  const episodes: Episode[] = [];
  $("a.lEp.epT.divNumEp.smallbox.px-2.mx-1.text-left.d-flex").each(
    (i, element) => {
      const episodeNum = $(element).text().trim();
      const episodeURL = $(element).attr("href");

      if (!episodeNum || !episodeURL) {
        return;
      }

      const num = parseEpisodeNumber(episodeNum);
      if (num !== null) {
        episodes.push({
          Number: episodeNum,
          Num: num,
          URL: episodeURL,
        });
      }
    }
  );
  return episodes;
}

export function parseEpisodeNumber(episodeNum: string) {
  const numMatch = episodeNum.match(/\d+/);
  if (!numMatch) {
    console.error(
      `Error parsing episode number '${episodeNum}': No number found`
    );
    return 1; // Default to 1 if no number is found
  }
  return parseInt(numMatch[0], 10);
}

export function sortEpisodesByNum(episodes: Episode[]) {
  episodes.sort((a, b) => a.Num - b.Num);
}
