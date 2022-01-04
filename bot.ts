import path from "path";
import "reflect-metadata";
import dotenv from "dotenv";
import { Client } from "discordx";
import { importx } from "@discordx/importer";
import { Intents, Interaction, } from "discord.js";

dotenv.config();

async function run() {
    const client = new Client({
        botId: "HamChick",
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGES],
        botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
        simpleCommand: {
            prefix: "!",
        },
    });

    client.once("ready", async () => {
        console.log(`Logged in as ${client.user?.tag}!`);
        await client.initApplicationCommands();
        await client.initApplicationPermissions();
        console.log(`${client.user?.tag} is ready to rock and roll!`);
    });

    client.on("interactionCreate", (interaction: Interaction) => {
        console.log(`Got interaction! ${interaction}`);
        client.executeInteraction(interaction);
    });

    await importx(path.join(__dirname, "commands", "**/*.cmd.{ts, js}"));
    await client.login(process.env.TOKEN ?? "");
};

run();