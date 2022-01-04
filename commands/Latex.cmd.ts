import { CommandInteraction } from "discord.js";
import { Discord, SimpleCommand, SimpleCommandMessage, SimpleCommandOption, Slash, SlashOption } from "discordx";
// import fetch from "node-fetch";

@Discord()
export abstract class Latex {
    // @Slash("latex", { description: "Format nice LaTeX equations!" })
    // private async latex(
    //     @SlashOption("eqn", { description: "The LaTeX equation to render" }) eqn: string,
    //     ctx: CommandInteraction): Promise<void> {
    //     console.log(eqn);
    //     // const response = await fetch(`https://chart.apis.google.com/chart?cht=tx&chl=${eqn}`);
    //     // console.log(response);
    // }

    @SimpleCommand("latex", {})
    private async latex(
        @SimpleCommandOption("eqn", { type: "STRING" }) eqn: string | undefined,
        ctx: SimpleCommandMessage) {
        if (!eqn) return ctx.message.reply("Please supply an equation!");

        ctx.message.reply(eqn);
    }
}