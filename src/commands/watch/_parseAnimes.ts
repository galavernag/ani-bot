import * as cheerio from "cheerio";

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
