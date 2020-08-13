import { sendNewRoundMessages } from "../helpers/newround";
import { DiscordMessage } from "../helpers/lambda.interface";
import { TextChannel } from "discord.js";
import { sendGameEndScoreboard, clue } from "../helpers/print.gameinfo";

const TIMER_TICK = 30 * 1000;
const dTeamReply = (msg: DiscordMessage) => {
  const isBot = msg.author.bot;
  const isGuess = (msg.content.toLowerCase() === '!higher'
    || msg.content.toLowerCase() === '!lower');
  const isPlayerOnDTeam = msg.client.game.round.dTeam.players
    .includes(msg.author.id);
  return !isBot && isGuess && isPlayerOnDTeam;
}

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
  } else if (message.author.id === game.round.clueGiver
      || !game.round.oTeam.players.includes(message.author.id)) {
    return message.reply('you\'re not eligible to make a vote right now.');
  } else if (game.round.oGuess) {
    return message.reply(`it looks like your team already guessed ${game.round.oGuess}.`);
  } else {
    const guess = parseInt(args[0], 10);
    if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
      return message.reply('give me an integer between 1 and 100 please.');
    } else {
      game.round.makeOGuess(guess);
      let response = `Team ${game.guessingTeam()} guessed ${guess}.`
        + '\n' + clue(game.round, guess)
        + `\nTeam ${game.otherTeam()}, do you think the target is \`!higher\` or \`!lower\`?`;
      if (!game.asyncPlay) {
        response += `\nYou have ${game.dGuessTime / 1000} seconds to answer!`;
      }

      message.channel.send(response);

      if (!game.asyncPlay) {
        let countdownCounter = 1;
        const timer = setInterval(() =>  {
          if (game.round.dGuess !== undefined || countdownCounter === 3) {
            clearInterval(timer);
            return;
          }
          message.channel.send(`${(game.dGuessTime - TIMER_TICK * countdownCounter) / 1000} seconds left!`)
          countdownCounter++;
        }, TIMER_TICK);
                
        message.channel.awaitMessages(dTeamReply, { time: game.dGuessTime, max: 1, errors: ['time'] })
          .then(messages => {
            const isHigher = messages.last().content.toLowerCase() === '!higher';
            game.round.makeDGuess(isHigher);
            const dGuess = isHigher ? 'higher' : 'lower';
            message.channel.send(`Team ${game.otherTeam()} thought the answer was ${dGuess}...`
              + `\nThe real answer was ${game.round.value}!`);
            game.endRound(message.channel as TextChannel);
            if (game.status !== 'finished') {
              sendNewRoundMessages(message.client, message.channel as TextChannel);
            } else {
              sendGameEndScoreboard(message.channel as TextChannel, game);
            }
          }).catch((err) => {
            console.log(err);
            message.channel.send(`Team ${game.otherTeam()} ran out of time!`
              + `\nThe real answer was ${game.round.value}!`);
            game.endRound(message.channel as TextChannel, false);
            if (game.status !== 'finished') {
              sendNewRoundMessages(message.client, message.channel as TextChannel);
            } else {
              sendGameEndScoreboard(message.channel as TextChannel, game);
            }
          });
      } else {
        message.channel.awaitMessages(dTeamReply, { max: 1 })
          .then(messages => {
            const isHigher = messages.last().content.toLowerCase() === '!higher';
            game.round.makeDGuess(isHigher);
            const dGuess = isHigher ? 'higher' : 'lower';
            message.channel.send(`Team ${game.otherTeam()} thought the answer was ${dGuess}...`
              + `\nThe real answer was ${game.round.value}!`);
            game.endRound(message.channel as TextChannel);
            if (game.status !== 'finished') {
              sendNewRoundMessages(message.client, message.channel as TextChannel);
            } else {
              sendGameEndScoreboard(message.channel as TextChannel, game);
            }
          });
      }
    }
  }
}
