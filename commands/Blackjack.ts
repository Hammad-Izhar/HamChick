import { ButtonInteraction, CommandInteraction, Guild, GuildMember, MessageActionRow, MessageButton, MessageComponentInteraction, User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

type Suits = "♠" | "♣" | "♥" | "♦"
type Value = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A"
type Card = `\`${Value}${Suits}\`` | "`??`"

enum HandState {
    WON,
    LOST,
    TIE,
    NATURAL,
    ONGOING
}

type Hand = Card[]

type BlackjackGame = {
    bet: number[],
    dealerHand: Hand,
    dealerHandStatus: HandState,
    player: GuildMember,
    playerHands: Hand[],
    playerHandStatus: HandState[],
    doubleDowned: boolean[],
    activeHandNumber: number
}

type ButtonOptions = {
    isDoubleDownable: boolean,
    isSplitable: boolean
}

@Discord()
export abstract class Blackjack {

    private getHandValue(hand: Hand): number[] {
        const faceValue = (x: Value, aceValue: number) => {
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

    private getRandomCard(): Card {
        const suits: Suits[] = ["♠", "♣", "♥", "♦"];
        const vals: Value[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
        return `\`${vals[Math.floor(Math.random() * vals.length)]}${suits[Math.floor(Math.random() * suits.length)]}\``;
    }

    private getActiveHand(currGame: BlackjackGame) {
        return currGame.playerHands[currGame.activeHandNumber];
    }

    private setActiveHand(currGame: BlackjackGame, hand: Hand): BlackjackGame {
        const { playerHands, activeHandNumber } = currGame;
        playerHands[activeHandNumber] = hand;
        return {
            ...currGame,
            playerHands: playerHands
        };
    }

    private checkDoubleDownable(hand: Hand): boolean {
        const handValue = this.getHandValue(hand);
        return (hand.length === 2) && (handValue[0] >= 9) && (handValue[0] <= 11);
    }

    private checkSplittable(hand: Hand): boolean {
        const cleanedHand = hand
            .filter(x => x !== "`??`")
            .map(x => x.replaceAll("`", ""))
            .map(x => x.replaceAll(/[♠♣♦♥]/g, "") as Value);
        return (hand.length === 2) && cleanedHand[0] === cleanedHand[1];
    }

    private dealerBusts(currGame: BlackjackGame): BlackjackGame {
        return {
            ...currGame,
            playerHandStatus: currGame.playerHandStatus.map(x => x === HandState.ONGOING ? HandState.WON : x)
        };
    }

    private dealerStays(currGame: BlackjackGame): BlackjackGame {
        const { dealerHand, playerHands, playerHandStatus } = currGame;

        const dealerHandValue = this.getHandValue(dealerHand);
        const playerHandsValue = playerHands.map(this.getHandValue);
        const bestDealerValue = dealerHandValue[1] <= 21 ? dealerHandValue[1] : dealerHandValue[0];
        for (let i = 0; i < playerHands.length; i++) {
            if (playerHandStatus[i] === HandState.ONGOING) {
                const bestPlayerValue = playerHandsValue[i][1] <= 21 ? playerHandsValue[i][1] : playerHandsValue[i][0];
                if (bestDealerValue < bestPlayerValue) {
                    playerHandStatus[i] = HandState.WON;
                    continue;
                }
                if (bestDealerValue === bestPlayerValue) {
                    playerHandStatus[i] = HandState.TIE;
                    continue;
                }
                if (bestDealerValue > bestPlayerValue) {
                    playerHandStatus[i] = HandState.LOST;
                    continue;
                }
            }
        }
        return {
            ...currGame,
            playerHandStatus: playerHandStatus,
        };
    }

    private createPayout(currGame: BlackjackGame): string {
        const { bet, playerHandStatus } = currGame;
        const modifier = (status: HandState) => {
            if (status === HandState.WON) return 2;
            if (status === HandState.TIE) return 0;
            if (status === HandState.LOST) return -1;
            if (status === HandState.NATURAL) return 2.5;
            return Infinity;
        };
        const payout = bet.map((b, i) => b * modifier(playerHandStatus[i])).reduce((x, y) => x + y);

        if (payout === 0) {
            return "You broke even!";
        }
        return `${payout > 0 ? "Congrats!" : "Better luck next time!"} You ${payout > 0 ? "won" : "lost"} ${Math.abs(payout)} :coin:`;
    }

    private createScoreString(score: number[]): string {
        return `${score[1] === 21 ? score[1] : score[0]}${score[1] < 21 && score[0] !== score[1] ? ` or ${score[1]}` : ""}`;
    }

    private createHandString(currGame: BlackjackGame): string {
        const { bet, dealerHand, playerHands, player, playerHandStatus, activeHandNumber } = currGame;
        const dealerScoreString = this.createScoreString(this.getHandValue(dealerHand));
        let outputString =
            `HamChick's Hand: ${dealerHand.join(", ")}` +
            `\t\t (Value: ${dealerScoreString})\n`;
        for (let i = 0; i < playerHands.length; i++) {
            const playerScoreString = this.createScoreString(this.getHandValue(playerHands[i]));

            outputString +=
                `${i === activeHandNumber ? ":arrow_right: " : ""}<@${player.id}>'s Hand #${i + 1}: ` +
                `${playerHands[i].join(", ")} \t\t` +
                `(Value: ${playerScoreString}) \t\t (Bet: ${bet[i]})`;
            switch (playerHandStatus[activeHandNumber]) {
                case HandState.NATURAL:
                    outputString += " 🏆\n";
                    break;
                case HandState.WON:
                    outputString += " ✅\n";
                    break;
                case HandState.TIE:
                    outputString += " 😐\n";
                    break;
                case HandState.LOST:
                    outputString += " ❌\n";
                    break;
                case HandState.ONGOING:
                    outputString += "\n";
                    break;
            }
        }
        return outputString.trimEnd();
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
                const { activeHandNumber, playerHands, bet, doubleDowned, playerHandStatus: handStatus } = currGame;
                spectatorCollector.stop();
                await intr.deferUpdate();
                switch (intr.customId) {
                    case "hit-btn":
                        await this.hitPlayer(currGame, intr);
                        break;
                    case "stay-btn":
                        if (activeHandNumber === playerHands.length - 1) {
                            await this.hitAI(currGame, intr);
                            return;
                        }
                        currGame.activeHandNumber++;
                        await this.hitPlayer(currGame, intr);
                        break;
                    case "double-down-btn":
                        currGame.doubleDowned[activeHandNumber] = true;
                        currGame.bet[activeHandNumber] *= 2;
                        await this.hitPlayer(currGame, intr);
                        break;
                    case "split-btn":
                        playerHands[activeHandNumber] = [playerHands[activeHandNumber][0]];
                        playerHands.push([...playerHands[activeHandNumber]]);
                        bet.push(bet[activeHandNumber]);
                        doubleDowned.push(false);
                        handStatus.push(HandState.ONGOING);
                        const newGame = {
                            ...currGame,
                            playerHands: playerHands
                        };
                        await this.hitPlayer(newGame, intr);
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

    private async hitPlayer(currGame: BlackjackGame, ctx: CommandInteraction | ButtonInteraction): Promise<void> {
        const { activeHandNumber, playerHands, doubleDowned, playerHandStatus } = currGame;
        const activeHand = this.getActiveHand(currGame);
        activeHand.push(this.getRandomCard());
        const newGame = this.setActiveHand(currGame, activeHand);

        const activeHandValue = this.getHandValue(activeHand);

        // If the player busts on this hand, gets a value of 21, or doubledowned => move to next available hand
        if (activeHandValue[0] >= 21 || activeHandValue[1] === 21 || doubleDowned[activeHandNumber]) {
            if (activeHandValue[0] > 21) {
                playerHandStatus[activeHandNumber] = HandState.LOST;
            }
            if (activeHandValue[1] === 21 && activeHand.length === 2) {
                playerHandStatus[activeHandNumber] = HandState.NATURAL;
            }

            // If this was the last hand the player can play on it's the dealer's turn
            if (activeHandNumber === playerHands.length - 1) {
                await this.hitAI(newGame, ctx);
                return;
            }

            // Otherwise we play the next available hand
            newGame.activeHandNumber++;
            await this.hitPlayer(newGame, ctx);
        }

        const row = this.createButtons({
            isDoubleDownable: this.checkDoubleDownable(activeHand),
            isSplitable: this.checkSplittable(activeHand)
        });
        await ctx.editReply({
            content: this.createHandString(currGame),
            components: [row]
        });

        this.createMessageCollectors(newGame, ctx);
    }

    private async hitAI(currGame: BlackjackGame, ctx: CommandInteraction | ButtonInteraction): Promise<void> {
        // ctx will always be either deferred or replied
        const { dealerHand, playerHandStatus } = currGame;

        if (playerHandStatus.every(x => x === HandState.LOST || x === HandState.NATURAL)) {
            await ctx.editReply({
                content:
                    `${this.createHandString(currGame)}\n${this.createPayout(currGame)}`,
                components: []
            });
            return;
        }

        if (dealerHand[dealerHand.length - 1] === "`??`") {
            dealerHand.pop();
        }

        dealerHand.push(this.getRandomCard());
        const newGame = {
            ...currGame,
            dealerHand: dealerHand
        };

        const dealerHandValue = this.getHandValue(dealerHand);

        // The dealer busts
        if (dealerHandValue[0] > 21) {
            const bustedGame = this.dealerBusts(newGame);
            await ctx.editReply({
                content: `${this.createHandString(bustedGame)}\n${this.createPayout(bustedGame)}`,
                components: []
            });
        }

        // The dealer is forced to stay
        if ((17 <= dealerHandValue[0] && dealerHandValue[0] <= 21) || (17 <= dealerHandValue[1] && dealerHandValue[1] <= 21)) {
            const stayedGame = this.dealerStays(newGame);
            await ctx.editReply({
                content: `${this.createHandString(stayedGame)}\n${this.createPayout(stayedGame)}`,
                components: []
            });
        }

        // The dealer is forced to hit
        if (dealerHandValue[0] < 17 || dealerHandValue[1] < 17) {
            await ctx.editReply({
                content:
                    `${this.createHandString(newGame)}\n` +
                    "My turn!",
                components: []
            });
            setTimeout(async () => await this.hitAI(newGame, ctx), 1000);
            return;
        }
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

        await ctx.deferReply();
        const currGame: BlackjackGame = {
            bet: [bet],
            dealerHand: [this.getRandomCard(), "`??`"],
            dealerHandStatus: HandState.ONGOING,
            player: ctx.member as GuildMember,
            playerHands: [[this.getRandomCard()]],
            playerHandStatus: [HandState.ONGOING],
            doubleDowned: [false],
            activeHandNumber: 0,
        };
        await this.hitPlayer(currGame, ctx);
    }
}