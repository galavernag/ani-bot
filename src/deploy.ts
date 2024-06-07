import { REST, Routes, type Client } from "discord.js";
import fs from "node:fs/promises";
import path from "node:path";
import type { Command } from "./types/command";

const rest = new REST().setToken(process.env.DISCORD_TOKEN || "");

export async function deploy_commands(client: Client) {
  console.log("Deploying commands");
  const commands = [];
  const commandsFiles = await fs.readdir(path.resolve(__dirname, "commands"), {
    recursive: true,
  });

  const botId = "1248444248639016960";

  for (const file of commandsFiles) {
    if (file.endsWith(".ts")) {
      const command = (await import(
        path.resolve(__dirname, "commands", file)
      )) as Command;

      // check if command has data and execute function
      if ("data" in command && "execute" in command) {
        rest.put(Routes.applicationCommands(botId), {
          body: [
            {
              ...command.data,
            },
          ],
        });
        client.commands.set(command.data.name, command.execute);
        console.log(`Command ${file} is deployed`);
      } else {
        console.log(
          `[WARNING] The command at ${file} is missing a required "data" or "execute" property.`
        );
      }
    }
  }
}
