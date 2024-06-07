import {
  Client,
  Collection,
  CommandInteraction,
  Events,
  GatewayIntentBits,
} from "discord.js";
import type { Command } from "./types/command";
import fs from "node:fs/promises";
import path from "node:path";

const token = process.env.TOKEN;

async function main() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });

  client.commands = new Collection<string, Command>();

  // Carregar comandos
  const commandFiles = (
    await fs.readdir(path.resolve(__dirname, "commands"), { recursive: true })
  ).filter(file => file.endsWith(".ts"));

  for (const file of commandFiles) {
    const command: Command = await import(
      path.resolve(__dirname, "commands", file)
    );
    client.commands.set(command.data.name, command);
  }

  client.once(Events.ClientReady, readyClient => {
    console.log(`Bot is running as ${readyClient.user.tag}`);
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName) as Command;
    if (!command) {
      console.error("Comando não encontrado");
      return;
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply("Houve um erro ao executar esse comando!");
    }
  });

  await client.login(token);
}

main().catch(console.error);
