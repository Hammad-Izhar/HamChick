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

type ButtonOptions = {
    isDoubleDownable: boolean,
    isSplitable: boolean
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

    private faceValue(x: Value, aceValue: 1 | 11): number {
        if (x === "J" || x === "Q" || x === "K") {
            return 10;
        } else if (x === "A") {
            return aceValue;
        } else {
            return parseInt(x);
        }
    }

    private getValue(hand: Card[]): number[] {

        const cleanedHand = hand
            .filter(x => x !== "`??`")
            .map(x => x.replaceAll("`", ""))
            .map(x => x.replaceAll(/[♠♣♦♥]/g, "") as Value);
        return [
            cleanedHand.map(x => this.faceValue(x, 1)).reduce((x, y) => x + y, 0),
            cleanedHand.map(x => this.faceValue(x, 11)).reduce((x, y) => x + y, 0)
        ];
    }

    private checkDoubleDownable(hand: number[]): boolean {
        return (hand[0] >= 9) && (hand[0] <= 11);
    }

    private checkSplittable(hand: Card[]): boolean {
        const cleanedHand = hand
            .filter(x => x !== "`??`")
            .map(x => x.replaceAll("`", ""))
            .map(x => x.replaceAll(/[♠♣♦♥]/g, "") as Value);
        return this.faceValue(cleanedHand[0], 1) == this.faceValue(cleanedHand[1], 1);
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

    private createButtons(options: ButtonOptions): MessageActionRow {
        const { isDoubleDownable, isSplitable } = options;
        const hit = new MessageButton()
            .setLabel("Hit")
            .setEmoji("👏")
            .setStyle("DANGER")
            .setCustomId("hit-btn");
        const stay = new MessageButton()
            .setLabel("Stay")
            .setEmoji("🤚")
            .setStyle("PRIMARY")
            .setCustomId("stay-btn");
        const doubledown = new MessageButton()
            .setLabel("Double Down")
            .setEmoji("⏬")
            .setStyle("SECONDARY")
            .setDisabled(true)
            .setCustomId("double-down-btn");
        const split = new MessageButton()
            .setLabel("Split")
            .setEmoji("✌")
            .setStyle("SECONDARY")
            .setDisabled(true)
            .setCustomId("split-btn");

        if (isDoubleDownable) doubledown.setStyle("SUCCESS").setDisabled(false);
        if (isSplitable) split.setStyle("SUCCESS").setDisabled(false);

        return new MessageActionRow().addComponents(stay, hit, doubledown, split);
    }

    private async handleWin(currGame: BlackjackGame, doubleDowned: boolean, ctx: ButtonInteraction): Promise<void> {
        const { bet } = currGame;
        await ctx.editReply({
            content:
                `${this.createHandString(currGame, WinningPlayer.PLAYER)}\n` +
                `Congratulations! Here's your payout of ${bet * (doubleDowned ? 4 : 2)} :coin:!`,
            components: []
        });
        return;
    }

    private async handleTie(currGame: BlackjackGame, doubleDowned: boolean, ctx: ButtonInteraction): Promise<void> {
        const { bet } = currGame;
        await ctx.editReply({
            content:
                `${this.createHandString(currGame, WinningPlayer.NONE)}\n` +
                `Better luck next time, it's a tie! Here's your ${bet * (doubleDowned ? 2 : 1)} :coin: back.`,
            components: []
        });
        return;
    }

    private async handleLoss(currGame: BlackjackGame, doubleDowned: boolean, ctx: ButtonInteraction): Promise<void> {
        const { bet } = currGame;
        await ctx.editReply({
            content:
                `${this.createHandString(currGame, WinningPlayer.HAMCHICK)}\n` +
                `Better luck next time! We'll be taking that bet of ${bet * (doubleDowned ? 2 : 1)} :coin:`,
            components: []
        });
        return;
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
                if (!intr.isButton()) return;
                spectatorCollector.stop();
                await intr.deferUpdate();
                switch (intr.customId) {
                    case "hit-btn":
                        await this.hitPlayer(currGame, false, intr);
                        break;
                    case "stay-btn":
                        await this.hitAI(currGame, false, intr);
                        break;
                    case "double-down-btn":
                        console.log("Double Down");
                        await this.hitPlayer(currGame, true, intr);
                        break;
                    case "split-btn":
                        console.log("Split");
                        await this.hitSplit(currGame, intr);
                        break;
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

    private async hitPlayer(currGame: BlackjackGame, doubleDowned: boolean, ctx: ButtonInteraction): Promise<void> {
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
            await this.handleLoss(newGame, doubleDowned, ctx);
            return;
        }

        // The player has a value of 21 or has double-downed their bet
        if (playerValue[0] === 21 || playerValue[1] === 21 || doubleDowned) {
            // Since ctx has been deferred above, hitAI will always be called with a deferred or replied ctx
            await this.hitAI(newGame, true, ctx);
            return;
        }

        const row = this.createButtons({ isDoubleDownable: false, isSplitable: false });
        await ctx.editReply({
            content:
                `Bet: ${bet} :coin:\n` +
                `${this.createHandString(newGame, WinningPlayer.NONE)}\n` +
                "Getting Closer!",
            components: [row]
        });

        this.createMessageCollectors(newGame, ctx);
    }

    private async hitAI(currGame: BlackjackGame, doubleDowned: boolean, ctx: ButtonInteraction): Promise<void> {
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
            await this.handleWin(newGame, doubleDowned, ctx);
        }

        // The dealer is forced to stay
        if ((17 <= dealerHandValue[0] && dealerHandValue[0] <= 21) || (17 <= dealerHandValue[1] && dealerHandValue[1] <= 21)) {
            const bestDealerValue = dealerHandValue[1] <= 21 ? dealerHandValue[1] : dealerHandValue[0];
            const bestPlayerValue = playerHandValue[1] <= 21 ? playerHandValue[1] : playerHandValue[0];

            if (bestDealerValue > bestPlayerValue) {
                await this.handleLoss(newGame, doubleDowned, ctx);
                return;
            }
            if (bestDealerValue === bestPlayerValue) {
                await this.handleTie(newGame, doubleDowned, ctx);
                return;
            }
            if (bestDealerValue < bestPlayerValue) {
                await this.handleWin(newGame, doubleDowned, ctx);
                return;
            }
        }

        // The dealer is forced to hit
        if (dealerHandValue[0] < 17 || dealerHandValue[1] < 17) {
            await ctx.editReply({
                content:
                    `${this.createHandString(newGame, WinningPlayer.NONE)}\n` +
                    "My turn!",
                components: []
            });
            setTimeout(async () => await this.hitAI(newGame, doubleDowned, ctx), 1000);
            return;
        }
    }

    private async hitSplit(currGame: BlackjackGame, ctx: ButtonInteraction): Promise<void> {

    }

    @Slash("blackjack", { description: "Play Blackjack 🃏" })
    private async blackjack(
        @SlashOption("bet", { description: "bet amount" })
        bet: number,
        ctx: CommandInteraction): Promise<void> {

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
        await ctx.deferReply();

        if (playerValue[1] === 21) {
            await ctx.editReply(
                `${this.createHandString(currGame, WinningPlayer.PLAYER)}\n` +
                `Incredible! That's a natural blackjack. Your payout is ${Math.floor(bet * 2.5)} :coin:!`
            );
            return;
        }

        const row = this.createButtons({
            isDoubleDownable: this.checkDoubleDownable(playerValue),
            isSplitable: this.checkSplittable(playerHand)
        });
        await ctx.editReply({
            content:
                `It's Blackjack Time! Bet: ${bet} :coin:\n` +
                `${this.createHandString(currGame, WinningPlayer.NONE)}`,
            components: [row]
        });

        this.createMessageCollectors(currGame, ctx);
    }
}