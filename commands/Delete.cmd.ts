import { ArgsOf, Discord, On } from "discordx";

@Discord()
export abstract class Delete {

    @On("messageDelete")
    private async onMessageDelete([msg]: ArgsOf<"messageDelete">): Promise<void> {
        msg.channel.send(`I saw that <@${msg.author?.id}>! :eyes:`);
    }
}