import {
  Client,
  Collection,
  CommandInteraction,
  Events,
  GatewayIntentBits,
} from "discord.js";
import { deploy_commands } from "./deploy";
import type { Command } from "./types/command";

const token = process.env.TOKEN;

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.commands = new Collection();
  await deploy_commands(client);

  client.once(Events.ClientReady, ready_client => {
    console.log(`Bot is running as ${ready_client.user.tag}`);
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isCommand()) {
      const execute = client.commands.get(interaction.commandName) as (
        interaction: CommandInteraction
      ) => Promise<void>;

      await execute(interaction);
    }
  });

  client.login(token);
}

main();
