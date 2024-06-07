import { REST, Routes } from "discord.js";
import fs from "node:fs/promises";
import path from "node:path";
import type { Command } from "./types/command";

const token = process.env.DISCORD_TOKEN || "";
const botId = "1248444248639016960";

const commandFiles = (
  await fs.readdir(path.resolve(__dirname, "commands"), { recursive: true })
).filter(cmd => cmd.endsWith(".ts") && !cmd.includes("_"));
const commands = [];

for (const file of commandFiles) {
  const command: Command = await import(
    path.resolve(__dirname, "commands", file)
  );
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log(`Deploying ${commands.length} commands`);

    const data = await rest.put(Routes.applicationCommands(botId), {
      body: commands,
    });
    console.log("Deployed successfully");
  } catch (error) {
    console.error(error);
  }
})();
