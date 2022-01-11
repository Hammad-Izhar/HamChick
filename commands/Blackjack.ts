import { assert } from "console";
import { ButtonInteraction, CommandInteraction, Interaction, MessageActionRow, MessageButton, MessageComponentInteraction, User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

type Suits = "♠" | "♣" | "♥" | "♦"
type Value = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A"
type Card = `\`${Value}${Suits}\`` | "`??`"
type BlackjackGame = {
    bet: number,
    dealerHand: Card[],
    playerHand: Card[],
    player: User,

}

enum WinningPlayer {
    PLAYER,
    HAMCHICK,
    NONE
}

@Discord()
export abstract class Blackjack {

    private getRandomCard(): Card {
        const suits: Suits[] = ["♠", "♣", "♥", "♦"];
        const vals: Value[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
        return `\`${vals[Math.floor(Math.random() * vals.length)]}${suits[Math.floor(Math.random() * suits.length)]}\``;
    }

    private getValue(hand: Card[]): number[] {
        const faceValue = (x: Value, aceValue: 1 | 11) => {
            if (x === "J" || x === "Q" || x === "K") {
                return 10;
            } else if (x === "A") {
                return aceValue;
            } else {
                return parseInt(x);
            }
        };

        const cleanedHand = hand
            .filter(x => x !== "`??`")
            .map(x => x.replaceAll("`", ""))
            .map(x => x.replaceAll(/[♠♣♦♥]/g, "") as Value);
        return [
            cleanedHand.map(x => faceValue(x, 1)).reduce((x, y) => x + y, 0),
            cleanedHand.map(x => faceValue(x, 11)).reduce((x, y) => x + y, 0)
        ];
    }

    private createScoreString(score: number[]): string {
        return `${score[1] === 21 ? score[1] : score[0]}${score[1] < 21 && score[0] !== score[1] ? ` or ${score[1]}` : ""}`;
    }

    private createHandString(currGame: BlackjackGame, winningPlayer: WinningPlayer): string {
        const { player, dealerHand, playerHand } = currGame;
        const dealerScore = this.createScoreString(this.getValue(dealerHand));
        const playerScore = this.createScoreString(this.getValue(playerHand));
        switch (winningPlayer) {
            case WinningPlayer.NONE:
                return (
                    `HamChick's Hand: ${dealerHand.join(", ")} \t\t(${dealerScore})\n` +
                    `<@${player?.id}>'s Hand: ${playerHand.join(", ")} \t\t(${playerScore})`
                );
            case WinningPlayer.HAMCHICK:
                return (
                    `**HamChick's Hand: ${dealerHand.join(", ")} \t\t(${dealerScore})\n**` +
                    `<@${player?.id}>'s Hand: ${playerHand.join(", ")} \t\t(${playerScore})`
                );
            case WinningPlayer.PLAYER:
                return (
                    `HamChick's Hand: ${dealerHand.join(", ")} \t\t(${dealerScore})\n` +
                    `**<@${player?.id}>'s Hand: ${playerHand.join(", ")} \t\t(${playerScore})**`
                );
        }
    }

    private createButtons(ctx: Interaction): MessageActionRow {
        const hitButton = new MessageButton()
            .setLabel("Hit")
            .setEmoji("👏")
            .setStyle("DANGER")
            .setCustomId("hit-btn");
        const stayButton = new MessageButton()
            .setLabel("Stay")
            .setEmoji("🤚")
            .setStyle("PRIMARY")
            .setCustomId("stay-btn");
        return new MessageActionRow().addComponents(hitButton, stayButton);
    }

    private async createMessageCollectors(currGame: BlackjackGame, ctx: CommandInteraction | ButtonInteraction): Promise<void> {
        if (ctx.channel) {
            const { player } = currGame;
            const prevReply = await ctx.fetchReply();
            const playerFilter = (x: MessageComponentInteraction) => x.user.id === player?.id && x.message.id === prevReply.id;
            const spectatorFilter = (x: MessageComponentInteraction) => x.user.id !== player?.id && x.message.id === prevReply.id;
            const playerCollector = ctx.channel.createMessageComponentCollector({
                filter: playerFilter,
                time: 1 * 60 * 1000,
                max: 1,
            });
            const spectatorCollector = ctx.channel.createMessageComponentCollector({
                filter: spectatorFilter,
                time: 1 * 60 * 1000,
            });

            playerCollector.on("collect", async (intr) => {
                if (intr.isButton() && intr.customId === "hit-btn") {
                    spectatorCollector.stop();
                    await intr.deferUpdate();
                    await this.hitPlayer(currGame, intr);
                    return;
                }
                if (intr.isButton() && intr.customId === "stay-btn") {
                    spectatorCollector.stop();
                    await intr.deferUpdate();
                    await this.hitAI(currGame, intr);
                    return;
                }
            });

            playerCollector.on("end", async (_, reason) => {
                if (reason === "time") {
                    if (ctx.isButton() || ctx.isCommand()) {
                        ctx.editReply({
                            content: `<@${player.id}> took too long to respond!`,
                            components: []
                        });
                    }
                    return;
                }
                console.log(reason);
            });

            spectatorCollector.on("collect", async (intr) => {
                await intr.reply({
                    ephemeral: true,
                    content: "I'm sorry but you aren't the current player!"
                });
                return;
            });
        }
    }

    private async handleWin(currGame: BlackjackGame, ctx: ButtonInteraction): Promise<void> {
        const { bet } = currGame;
        await ctx.editReply({
            content:
                `${this.createHandString(currGame, WinningPlayer.PLAYER)}\n` +
                `Congratulations! Here's your payout of ${bet * 2} :coin:!`,
            components: []
        });
        return;
    }

    private async handleTie(currGame: BlackjackGame, ctx: ButtonInteraction): Promise<void> {
        const { bet } = currGame;
        await ctx.editReply({
            content:
                `${this.createHandString(currGame, WinningPlayer.NONE)}\n` +
                `Better luck next time, it's a tie! Here's your ${bet} :coin: back.`,
            components: []
        });
        return;
    }

    private async handleLoss(currGame: BlackjackGame, ctx: ButtonInteraction): Promise<void> {
        const { bet } = currGame;
        await ctx.editReply({
            content:
                `${this.createHandString(currGame, WinningPlayer.HAMCHICK)}\n` +
                `Better luck next time! We'll be taking that bet of ${bet} :coin:`,
            components: []
        });
        return;
    }

    private async hitPlayer(currGame: BlackjackGame, ctx: ButtonInteraction): Promise<void> {
        const { bet, playerHand } = currGame;
        playerHand.push(this.getRandomCard());
        const newGame = {
            ...currGame,
            playerHand: playerHand
        };

        const playerValue = this.getValue(playerHand);
        // The player has busted since the minimum value of the player's hand is greater than 21
        if (playerValue[0] > 21) {
            // Since ctx has been deferred above, handleLoss will always be called with a deferred or replied ctx
            await this.handleLoss(newGame, ctx);
            return;
        }

        // The player has a value of 21 one way or another
        if (playerValue[0] === 21 || playerValue[1] === 21) {
            // Since ctx has been deferred above, hitAI will always be called with a deferred or replied ctx
            await this.hitAI(newGame, ctx);
            return;
        }

        const row = this.createButtons(ctx);
        await ctx.editReply({
            content:
                `Bet: ${bet} :coin:\n` +
                `${this.createHandString(newGame, WinningPlayer.NONE)}\n` +
                "Getting Closer!",
            components: [row]
        });

        this.createMessageCollectors(newGame, ctx);
    }

    private async hitAI(currGame: BlackjackGame, ctx: ButtonInteraction): Promise<void> {
        // ctx will always be either deferred or replied
        const { dealerHand, playerHand } = currGame;

        if (dealerHand[dealerHand.length - 1] === "`??`") {
            dealerHand.pop();
        }
        dealerHand.push(this.getRandomCard());
        const newGame = {
            ...currGame,
            dealerHand: dealerHand
        };

        const dealerHandValue = this.getValue(dealerHand);
        const playerHandValue = this.getValue(playerHand);

        // The dealer busts
        if (dealerHandValue[0] > 21) {
            await this.handleWin(newGame, ctx);
        }

        // The dealer is forced to stay
        if ((17 <= dealerHandValue[0] && dealerHandValue[0] <= 21) || (17 <= dealerHandValue[1] && dealerHandValue[1] <= 21)) {
            const bestDealerValue = dealerHandValue[1] <= 21 ? dealerHandValue[1] : dealerHandValue[0];
            const bestPlayerValue = playerHandValue[1] <= 21 ? playerHandValue[1] : playerHandValue[0];

            if (bestDealerValue > bestPlayerValue) {
                await this.handleLoss(newGame, ctx);
                return;
            }
            if (bestDealerValue === bestPlayerValue) {
                await this.handleTie(newGame, ctx);
                return;
            }
            if (bestDealerValue < bestPlayerValue) {
                await this.handleWin(newGame, ctx);
                return;
            }
        }

        // The dealer is forced to hit
        if (dealerHandValue[0] < 17 || dealerHandValue[1] < 17) {
            // if (ctx.replied) {
            await ctx.editReply({
                content:
                    `${this.createHandString(newGame, WinningPlayer.NONE)}\n` +
                    "My turn!",
                components: []
            });
            setTimeout(async () => await this.hitAI(newGame, ctx), 1000);
            return;
            // }
            // await ctx.update({
            //     content:
            //         `${this.createHandString(newGame, WinningPlayer.NONE)}\n` +
            //         "My turn!",
            //     components: []
            // });
            // setTimeout(async () => await this.hitAI(newGame, ctx), 1000);
            // return;
        }
    }

    @Slash("blackjack", { description: "Play Blackjack 🃏" })
    private async blackjack(
        @SlashOption("bet", { description: "bet amount" })
        bet: number,
        ctx: CommandInteraction): Promise<void> {

        console.log(ctx.id);
        if (ctx.member === null || ctx.channel === null) {
            await ctx.reply("Is anyone there?");
            return;
        }

        const currGame: BlackjackGame = {
            bet: bet,
            player: ctx.member.user as User,
            dealerHand: [this.getRandomCard(), "`??`"],
            playerHand: [this.getRandomCard(), this.getRandomCard()]
        };

        const { playerHand } = currGame;
        const playerValue = this.getValue(playerHand);
        const row = this.createButtons(ctx);

        await ctx.deferReply();

        if (playerValue[1] === 21) {
            await ctx.editReply(
                `${this.createHandString(currGame, WinningPlayer.PLAYER)}\n` +
                `Incredible! That's a natural blackjack. Your payout is ${Math.floor(bet * 1.5)} :coin:!`
            );
            return;
        }

        await ctx.editReply({
            content:
                `It's Blackjack Time! Bet: ${bet} :coin:\n` +
                `${this.createHandString(currGame, WinningPlayer.NONE)}`,
            components: [row]
        });

        this.createMessageCollectors(currGame, ctx);
    }
}