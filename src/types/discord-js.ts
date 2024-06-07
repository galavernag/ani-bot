import "discord.js";
import type { Collection, CommandInteraction } from "discord.js";

declare module "discord.js" {
  interface Client {
    commands: Collection<unknown, unknown>;
  }
}
