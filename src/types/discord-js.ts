import "discord.js";
import type { Collection } from "discord.js";

declare module "discord.js" {
  interface Client {
    commands: Collection<unknown, unknown>;
  }
}
