import {
  ButtonStyle,
  CommandInteraction,
  ButtonBuilder,
  ActionRowBuilder,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  type Interaction,
} from "discord.js";

import { searchAnime } from "./_animes";
import { getAnimeEpisodes } from "./_episodes";

import { Client } from "discord.js-selfbot-v13";
import { Streamer, streamLivestreamVideo } from "@dank074/discord-video-stream";

import axios from "axios";

const streamer = new Streamer(new Client());
await streamer.client.login(process.env.DISCORD_SELF_BOT_TOKEN);

const baseSiteURL = "https://animefire.plus/";

interface IAPIResponse {
  data: {
    src: string;
    label: string;
  }[];
}

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

  function getHigherQuality(quality1: string, quality2: string) {
    const quality1Value = parseInt(quality1.split("p")[0]);
    const quality2Value = parseInt(quality2.split("p")[0]);

    if (quality1Value > quality2Value) {
      return quality1;
    }

    return quality2;
  }

  try {
    const animeURL = await searchAnime(animeName, interaction);
    const episodes = await getAnimeEpisodes(animeURL);

    const embed = new EmbedBuilder()
      .setTitle(`🔍 Episódios de : ${animeName}`)
      .setColor("#FF69B4")
      .setImage(
        "https://media1.tenor.com/m/RBLgZ51nQpgAAAAC/anya-forger-stare.gif"
      )
      .setDescription(`${episodes.map(e => `• ${e.Number}`).join("\n\n")}`);

    const select = new StringSelectMenuBuilder()
      .setCustomId("episode_select")
      .setPlaceholder("🎥 Selecione um episódio")
      .addOptions(
        episodes.map(episode =>
          new StringSelectMenuOptionBuilder()
            .setValue(episode.URL)
            .setLabel(episode.Number)
        )
      );

    const response = await interaction.editReply({
      embeds: [embed],
      components: [{ type: 1, components: [select] }],
    });

    const filter = (i: Interaction) =>
      i.isStringSelectMenu() && i.customId === "episode_select";

    const collector = response.createMessageComponentCollector({
      filter,
      time: 3_600_000,
    });

    const episode_link = await new Promise(
      (resolve: (value: string) => void, reject) => {
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
      }
    );

    const { data: api_response } = await axios.get<IAPIResponse>(
      episode_link.replace("animes", "video")
    );

    let link_to_play: string = "";

    for (const quality of api_response.data) {
      // get next item from array and prevent if is undefined
      const next_quality = api_response.data.shift();

      if (next_quality) {
        if (
          getHigherQuality(quality.label, next_quality.label) === quality.label
        ) {
          link_to_play = quality.src;
        }
      } else {
        link_to_play = quality.src;
      }
    }

    //@ts-expect-error
    const voiceChannel = interaction.member?.voice.channel;

    await streamer.joinVoice(voiceChannel.guild.id, voiceChannel.id);

    const udp = await streamer.createStream({
      // stream options here
    });

    const previousButton = new ButtonBuilder()
      .setCustomId("previous")
      .setLabel("Previous")
      .setStyle(ButtonStyle.Primary);

    const pauseButton = new ButtonBuilder()
      .setCustomId("pause")
      .setLabel("Pause")
      .setStyle(ButtonStyle.Primary);

    const stopButton = new ButtonBuilder()
      .setCustomId("stop")
      .setLabel("Stop")
      .setStyle(ButtonStyle.Danger);

    const nextButton = new ButtonBuilder()
      .setCustomId("next")
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary);

    // Create the action row with the buttons
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      previousButton,
      pauseButton,
      stopButton,
      nextButton
    );

    udp.mediaConnection.setSpeaking(true);
    udp.mediaConnection.setVideoStatus(true);
    try {
      const res = await streamLivestreamVideo(link_to_play, udp);

      console.log("Finished playing video " + res);
    } catch (e) {
      console.log(e);
    } finally {
      udp.mediaConnection.setSpeaking(false);
      udp.mediaConnection.setVideoStatus(false);
    }
  } catch (error: any) {
    console.error(error);
    switch (error.message) {
      case "No anime found with the given name": // Editar a resposta diferida com a mensagem de erro
        await interaction.editReply(
          "Não foi encontrado nenhum anime com o nome informado!"
        );
        break;
      default:
        // Editar a resposta diferida com a mensagem de erro
        await interaction.editReply(
          "Houve um erro na execução do comando, tente novamente!"
        );
    }
  }
}

export { data, execute };
