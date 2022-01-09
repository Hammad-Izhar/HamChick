import { CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

@Discord()
export abstract class Latex {
    @Slash("latex", { description: "Format nice LaTeX equations!" })
    private async latex(
        @SlashOption("eqn", { description: "The LaTeX equation to render" }) eqn: string,
        ctx: CommandInteraction): Promise<void> {
        const apiURL = "https://latex.codecogs.com/png.image?";

        ctx.reply(`${apiURL}${encodeURIComponent("\\color{white}" + eqn)}`);
    }
}