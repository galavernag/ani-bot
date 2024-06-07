import { Client, Events, GatewayIntentBits } from "discord.js";

const token = process.env.TOKEN;

function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, ready_client => {
    console.log(`Bot is running as ${ready_client.user.tag}`);
  });

  client.login(token);
}

main();
