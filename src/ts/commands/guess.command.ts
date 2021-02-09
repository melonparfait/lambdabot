import { sendNewRoundMessages } from '../helpers/newround';
import { DiscordMessage } from '../helpers/lambda.interface';
import { TextChannel, Collection, Message } from 'discord.js';
import { sendGameEndScoreboard, clue, currentClue } from '../helpers/print.gameinfo';
import { ScoringResults, OffenseScore } from '../models/scoring.results';
import { owner_id } from '../../../keys.json';

export const name = 'guess';
export const aliases = ['g'];
export const cooldown = 5;
export const description = 'Submits a guess for the guessing team';
export const guildOnly = true;
export const args = true;
export const usage = '<integer between 1 and 100>';
export function execute(message: DiscordMessage, args: string[]) {
  const game = message.client.games.get(message.channel.id);
  if (!game || game.status === 'finished') {
    return message.reply('no one has started a game yet. Use the `newgame` command to start one!');
  } else if (game.status !== 'playing') {
    return message.reply('it looks like the game isn\'t in progress yet.');
  } else if (message.author.id === game.round.clueGiver) {
    return message.reply('the clue giver cannot guess! No cheating!');
  } else if (!game.round.oTeam.players.includes(message.author.id)) {
    return message.reply(`only members from Team ${game.offenseTeamNumber()} can guess!`);
  } else if (game.round.oGuess) {
    return message.reply(`it looks like your team already guessed ${game.round.oGuess}.`);
  } else {
    const guess = parseInt(args[0], 10);
    if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
      return message.reply('give me an integer between 1 and 100 please.');
    } else {
      game.round.makeOGuess(guess);

      const givenClue = game.currentClue ? `\n${currentClue(game)}` : '';
      let response = `Team ${game.offenseTeamNumber()} guessed ${guess}.`
        + '\n' + clue(game.round, guess)
        + givenClue
        + `\nTeam ${game.defenseTeamNumber()} `
        + `(${game.defenseTeam.players.map(id => `<@${id}>`).join(', ')}), `
        + 'do you think the target is `!higher` or `!lower`?';

      if (!game.asyncPlay) {
        response += `\nYou have ${game.dGuessTime / 1000} seconds to answer!`;
      }

      message.channel.send(response);

      if (!game.asyncPlay) {
        let countdownCounter = 1;
        const timer = setInterval(() => {
          if (game.round.dGuess !== undefined || countdownCounter === (game.dGuessTime / TIMER_TICK)) {
            clearInterval(timer);
            return;
          }
          message.channel.send(`${(game.dGuessTime - TIMER_TICK * countdownCounter) / 1000} seconds left!`);
          countdownCounter++;
        }, TIMER_TICK);

        message.channel.awaitMessages(dTeamReply, { time: game.dGuessTime, max: 1, errors: ['time'] })
          .then((messages: Collection<string, Message>) => {
            clearInterval(timer);
            processReply(messages, message);
          })
          .catch((err) => {
            console.log('Timeout error: ', err);
            const scoreResult = game.score(false);
            message.channel.send(`Team ${game.defenseTeamNumber()} ran out of time!`
              + `\nThe real answer was ${game.round.value}!`);
            closeRound(message, scoreResult);
          });
      } else {
        message.channel.awaitMessages(dTeamReply, { max: 1 })
          .then((messages: Collection<string, Message>) => processReply(messages, message))
          .catch(err => {
            console.log(err);
            message.channel.send('Sorry, there was an error processing that reply. I notified the admin about this.');
            message.client.users.cache.get(owner_id).send(`Got an error: ${err}`)
              .catch(err => console.log(`Couldn't send this error: \n${err}`));
          });
      }
    }
  }
}

const TIMER_TICK = 30 * 1000;
const dTeamReply = (msg: DiscordMessage) => {
  const isBot = msg.author.bot;
  const isGuess = (msg.content.toLowerCase() === '!higher'
    || msg.content.toLowerCase() === '!lower');
  const isPlayerOnDTeam = msg.client.games.get(msg.channel.id).round.dTeam.players
    .includes(msg.author.id);
  return !isBot && isGuess && isPlayerOnDTeam;
};

function processReply(messages: Collection<string, Message>, message: DiscordMessage) {
  const game = message.client.games.get(message.channel.id);
  const isHigher = messages.last().content.toLowerCase() === '!higher';
  game.round.makeDGuess(isHigher);

  const scoreResult = game.score();
  const dGuess = isHigher ? 'higher' : 'lower';
  let response = `Team ${game.defenseTeamNumber()} thought the answer was ${dGuess}...`;

  const correctness = scoreResult.defenseResult
    ? '\n...and they were right!'
    : '\n...but they were wrong!';

  const accuracy = scoreResult.offenseResult === OffenseScore.bullseye
    ? `\n...but Team ${game.offenseTeamNumber()}'s guess was too good.`
    : undefined;

  const result = accuracy ?? correctness;

  response += result + `\nThe real answer was ${game.round.value}!`;

  message.channel.send(response);
  closeRound(message, scoreResult);
}

function closeRound(message: DiscordMessage, results: ScoringResults) {
  const game = message.client.games.get(message.channel.id);
  message.channel.send(`Team 1 gains ${results.team1PointChange} points! (total points: ${game.team1.points})`
    + `\nTeam 2 gains ${results.team2PointChange} points! (total points: ${game.team2.points})`);

  // End the round
  game.endRound();

  // Check if the game has ended
  const winner = game.determineWinner();
  if (winner) {
    game.endGame();
    message.client.finalizeGame(message.channel.id, game.trackStats);
    sendGameEndScoreboard(message.channel as TextChannel, game, winner);
    game.pinnedInfo.unpin().then(() => game.pinnedInfo = undefined)
      .catch(err => {
        message.channel.send('I couldn\'t unpin the game info to this channel. Do I have permission to manage messages on this channel?');
        console.log(err);
      });
  } else {
    if (game.team1.points > game.threshold
        && game.team2.points > game.threshold) {
      message.channel.send('Wow, this is a close game! Whichever team gets a lead first wins!');
    }
    game.newRound();
    sendNewRoundMessages(message.client, message.channel as TextChannel);
  }
}
