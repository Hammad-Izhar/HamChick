import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashChoice, SlashOption } from "discordx";

enum Themes {
    "3024 Night" = "3024-night",
    "A11y Dark" = "a11y-dark",
    "Blackboard" = "blackboard",
    "Base 16 (Dark)" = "base16-dark",
    "Base 16 (Light)" = "base16-light",
    "Cobalt" = "cobalt",
    "Duotone" = "duotone",
    "Hopscotch" = "hopscotch",
    "Lucario" = "lucario",
    "Material" = "material",
    "Monokai" = "monokai",
    "Night Owl" = "night-owl",
    "Nord" = "nord",
    "Oceanic Next" = "oceanic-next",
    "One Light" = "one-light",
    "One Dark" = "one-dark",
    "Panda" = "panda",
    "Paraiso" = "paraiso",
    "Seti" = "seti",
    "Shades of Purple" = "shades-of-purple",
    "Synthwave '84" = "synthwave-84",
    "Twilight" = "twilight",
    "Verminal" = "verminal",
    "VSCode" = "vscode",
    "Yeti" = "yeti",
}

enum Languages {
    "Automatic Detection" = "auto",
    "C" = "c",
    "Java" = "java",
    "JavaScript" = "javascript",
    "Scala" = "scala",
    "Python" = "python"
}

@Discord()
export abstract class Carbon {
    @Slash("carbon", { description: "Format code nicely!" })
    private async carbon(
        @SlashOption("code", { description: "The code to render" }) code: string,
        @SlashChoice(Themes)
        @SlashOption("theme", { description: "The theme to render the code in" }) theme: string,
        @SlashChoice(Languages)
        @SlashOption("lang", { description: "The programming language" }) lang: string,
        ctx: CommandInteraction): Promise<void> {
        const apiURL = `https://carbonnowsh.herokuapp.com/?code=${code}&theme=${theme}&language=${lang}`;

        ctx.reply(encodeURI(apiURL));
    }
}