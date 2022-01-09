import { Message, TextChannel, User } from "discord.js";
import { Discord, SimpleCommand, SimpleCommandMessage } from "discordx";

type GuessingGame = {
    terminated: boolean,
    channel: TextChannel,
    author: User,
    response: Message,
    guesses: number[],
    target: number
}

@Discord()
export abstract class Guess {
    private isNumeric(n: any) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    private async getGuess(channel: TextChannel, author: User): Promise<Message | undefined> {
        const filter = (message: Message) => message.author === author && this.isNumeric(message.content);
        const messageCollection = await channel.awaitMessages({
            filter: filter,
            time: 10 * 1000,
            max: 1
        });
        return messageCollection.first();
    }

    private async userTimedOut(currGame: GuessingGame): Promise<GuessingGame> {
        let { author, guesses, response, target, } = currGame;
        let currentGuesses = [...guesses, target]
            .sort((a, b) => a - b)
            .map(x => x === target ? `**${x}**` : x);
        response = await response.edit(
            `Guesses: ${currentGuesses.toString().replaceAll(",", ", ")}\n` +
            `Previous Guess: ${guesses[guesses.length - 1] ?? "No Guess!"}\n` +
            `<@${author.id}> took too long to guess! :zzz: `);
        return { ...currGame, terminated: true };
    }

    private async guessOutOfBounds(currGame: GuessingGame, guessMessage: Message): Promise<GuessingGame> {
        let { guesses, response, target, } = currGame;
        let currentGuesses = [...guesses, target]
            .sort((a, b) => a - b)
            .map(x => x === target ? ":question:" : x);
        response = await response.edit(
            `Guesses: ${currentGuesses.toString().replaceAll(",", ", ")}\n` +
            `Previous Guess: ${guesses[guesses.length - 1]}\n` +
            "Please guess a number between 1 and 100.");
        await guessMessage.delete();
        return currGame;
    }

    private async repeatedGuess(currGame: GuessingGame, guessMessage: Message): Promise<GuessingGame> {
        let { guesses, response, target, } = currGame;
        let guess = parseInt(guessMessage.content);
        let currentGuesses = [...guesses, target]
            .sort((a, b) => a - b)
            .map(x => x === target ? ":question:" : x);
        response = await response.edit(
            `Guesses: ${currentGuesses.toString().replaceAll(",", ", ")}\n` +
            `Previous Guess: ${guesses[guesses.length - 1]}\n` +
            `You've already guessed ${guess}!`);
        await guessMessage.delete();
        return currGame;
    }

    private async winGame(currGame: GuessingGame, guessMessage: Message): Promise<GuessingGame> {
        let { guesses, response, target, } = currGame;
        let currentGuesses = [...guesses]
            .sort((a, b) => a - b)
            .map(x => x === target ? `**${x}**` : x);
        response = await response.edit(
            `Guesses: ${currentGuesses.toString().replaceAll(",", ", ")}\n` +
            `You got it in ${guesses.length} ${guesses.length == 1 ? "try" : "tries"} :partying_face:!`);
        await guessMessage.delete();
        return { ...currGame, terminated: true };
    }

    private async incorrectGuess(currGame: GuessingGame, guessMessage: Message): Promise<GuessingGame> {
        let { guesses, response, target, } = currGame;
        let currentGuesses = [...guesses, target]
            .sort((a, b) => a - b)
            .map(x => x === target ? ":question:" : x);
        response = await response.edit(
            `Guesses: ${currentGuesses.toString().replaceAll(",", ", ")}\n` +
            `Previous Guess: ${guesses[guesses.length - 1]}\n` +
            `The target is ${parseInt(guessMessage.content) < target ? ":arrow_up:" : ":arrow_down:"}`);
        await guessMessage.delete();
        return currGame;
    }

    private async updateGame(currGame: GuessingGame, guessMessage: Message | undefined): Promise<GuessingGame> {
        if (guessMessage === undefined) {
            return await this.userTimedOut(currGame);
        }
        let { guesses, target } = currGame;
        let guess = parseInt(guessMessage.content);
        if (guess > 100 || guess < 1) {
            return await this.guessOutOfBounds(currGame, guessMessage);
        } else if (guesses.includes(guess)) {
            return await this.repeatedGuess(currGame, guessMessage);
        } else if (guess === target) {
            let newGame = { ...currGame, guesses: [...guesses, guess] };
            return await this.winGame(newGame, guessMessage);
        } else {
            let newGame = { ...currGame, guesses: [...guesses, guess] };
            return await this.incorrectGuess(newGame, guessMessage);
        }
    }

    @SimpleCommand("guess")
    async guess(ctx: SimpleCommandMessage) {
        const channel = ctx.message.channel as TextChannel;
        const author = ctx.message.author;
        const target = Math.floor(Math.random() * 101);

        await ctx.message.delete();
        let response = await channel.send(
            "Guesses: :question:\n" +
            "Previous Guess: No Guess!\n" +
            `<@${ctx.message?.author?.id}> has initiated a guessing game! Please guess a number between 1 and 100 :thinking:`
        );

        let guessMessage = await this.getGuess(channel, author);
        let game = {
            terminated: false,
            channel: channel,
            author: author,
            response: response,
            guesses: [] as number[],
            target: target
        };
        while (1) {
            game = await this.updateGame(game, guessMessage);
            if (game.terminated) break;
            guessMessage = await this.getGuess(channel, author);
        }
    }
}