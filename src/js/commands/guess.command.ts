import { sendNewRoundMessages } from "../helpers/newround";
import { sendGameEndScoreboard } from "../helpers/gameend";
import { DiscordMessage } from "../helpers/lambda.interface";
import { TextChannel } from "discord.js";

export const name = 'guess';
export const aliases = [];
export const cooldown = 5;
export const description = 'Submits a guess for the guessing team';
export const guildOnly = true;
export const args = true;
export const usage = '<integer between 1 and 100>'
export function execute(message: DiscordMessage, args: string[]) {
    const game = message.client.game;
    if (!game || game.status === 'finished') {
        return message.reply('no one has started a game yet. Use the \`newgame\` command to start one!');
    } else if (game.status !== 'playing') {
        return message.reply('it looks like the game isn\'t in progress yet.');
    // } else if (message.author.id === game.round.clueGiver
    //         || !game.round.oTeam.players.includes(message.author.id)) {
    //     return message.reply('you\'re not eligible to make a vote right now.');
    } else if (game.round.oGuess) {
        return message.reply(`it looks like your team already guessed ${game.round.oGuess}.`);
    } else {
        const guess = parseInt(args[0], 10);
        if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
            return message.reply('give me an integer between 1 and 100 please.');
        } else {
            game.round.makeOGuess(guess);
            message.channel.send(`Team ${game.guessingTeam()} guessed ${guess}.`
                + `\nTeam ${game.otherTeam()}, do you think the target is \`!higher\` or \`!lower\`?`
                + `\nYou have 2 minutes to answer!`)
            
            const dTeamReply = msg => {
                const isBot = msg.author.bot;
                const isGuess = (msg.content.toLowerCase() === '!higher'
                    || msg.content.toLowerCase() === '!lower');
                const isPlayerOnDTeam = game.round.dTeam.players
                    .includes(msg.author.id);
                return !isBot && isGuess && isPlayerOnDTeam;
            }

            var countdownCounter = 1;
            const timer = setInterval(() =>  {
                    if (countdownCounter === 3) {
                        clearInterval(timer)
                    }
                    countdownCounter++;
                    message.channel.send(`${(120000 - 30000 * countdownCounter) / 1000} seconds left!`)
                }, 30000);

            message.channel.awaitMessages(dTeamReply, { time: 120000, max: 1, errors: ['time'] })
                .then(messages => {
                    const isHigher = messages.last().content.toLowerCase() === '!higher';
                    game.round.makeDGuess(isHigher);
                    const dGuess = isHigher ? 'higher' : 'lower';
                    message.channel.send(`Team ${game.otherTeam()} thought the answer was ${dGuess}...`
                        + `\nThe real answer was ${game.round.value}!`);
                    game.endRound(message.channel);
                    if (game.status !== 'finished') {
                        sendNewRoundMessages(message.client, message.channel as TextChannel);
                    } else {
                        sendGameEndScoreboard(message.channel as TextChannel, game);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    message.channel.send(`Team ${game.otherTeam()} ran out of time!`
                        + `\nThe real answer was ${game.round.value}!`);
                    game.endRound(message.channel, false);
                    if (game.status !== 'finished') {
                        sendNewRoundMessages(message.client, message.channel as TextChannel);
                    } else {
                        sendGameEndScoreboard(message.channel as TextChannel, game);
                    }
                });
            } else {

            }



        }
    }
}
