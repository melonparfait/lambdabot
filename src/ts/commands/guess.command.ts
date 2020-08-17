import { sendNewRoundMessages } from "../helpers/newround";
import { DiscordMessage } from "../helpers/lambda.interface";
import { TextChannel, Collection, Message } from "discord.js";
import { sendGameEndScoreboard, clue, currentClue } from "../helpers/print.gameinfo";

const TIMER_TICK = 30 * 1000;
const dTeamReply = (msg: DiscordMessage) => {
  const isBot = msg.author.bot;
  const isGuess = (msg.content.toLowerCase() === '!higher'
    || msg.content.toLowerCase() === '!lower');
  const isPlayerOnDTeam = msg.client.game.round.dTeam.players
    .includes(msg.author.id);
  return !isBot && isGuess && isPlayerOnDTeam;
}

function processReply(messages: Collection<string, Message>, message: DiscordMessage) {
  const game = message.client.game;
  const isHigher = messages.last().content.toLowerCase() === '!higher';
  game.round.makeDGuess(isHigher);

  const dGuess = isHigher ? 'higher' : 'lower';
  let response: string
  let wereTheyRight: boolean;
  if (isHigher) {
    wereTheyRight = game.round.value > game.round.oGuess;
  } else {
    wereTheyRight = game.round.value < game.round.oGuess;
  }

  const correctness = wereTheyRight
    ? '\n...and they were right! '
    : '\n...but they were wrong! ';
    
  const accuracy = Math.abs(game.round.oGuess - game.round.value) < 3
    ? `\n...but Team ${game.offenseTeamNumber()}'s guess was too good.`
    : undefined;
  
  const result = accuracy ?? correctness;

  response = `Team ${game.defenseTeamNumber()} thought the answer was ${dGuess}...`
    + result + `\nThe real answer was ${game.round.value}!`;

  message.channel.send(response);
  closeRound(message);
}

function closeRound(message: DiscordMessage) {
  message.client.game.endRound(message.channel as TextChannel);
  if (message.client.game.status !== 'finished') {
    sendNewRoundMessages(message.client, message.channel as TextChannel);
  } else {
    sendGameEndScoreboard(message.channel as TextChannel, message.client.game);
    message.channel.messages.fetchPinned()
      .then(messages => messages.forEach(message => message.unpin()))
      .catch(err => console.log(err));
  }
}

export const name = 'guess';
export const aliases = ['g'];
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
      
      const givenClue = game.currentClue ? `\n${currentClue(game)}` : '';
      let response = `Team ${game.offenseTeamNumber()} guessed ${guess}.`
        + '\n' + clue(game.round, guess)
        + givenClue
        + `\nTeam ${game.defenseTeamNumber()} `
        + `(${game.defenseTeam().players.map(id => `<@${id}>`).join(', ')}), `
        + `do you think the target is \`!higher\` or \`!lower\`?`;
      
      if (!game.asyncPlay) {
        response += `\nYou have ${game.dGuessTime / 1000} seconds to answer!`;
      }

      message.channel.send(response);

      if (!game.asyncPlay) {
        let countdownCounter = 1;
        const timer = setInterval(() =>  {
          if (game.round.dGuess !== undefined || countdownCounter === (game.dGuessTime/TIMER_TICK)) {
            clearInterval(timer);
            return;
          }
          message.channel.send(`${(game.dGuessTime - TIMER_TICK * countdownCounter) / 1000} seconds left!`)
          countdownCounter++;
        }, TIMER_TICK);
                
        message.channel.awaitMessages(dTeamReply, { time: game.dGuessTime, max: 1, errors: ['time'] })
          .then((messages: Collection<string, Message>) => {
            clearInterval(timer);
            processReply(messages, message);
          })
          .catch((err) => {
            console.log('Timeout error: ', err);
            message.channel.send(`Team ${game.defenseTeamNumber()} ran out of time!`
              + `\nThe real answer was ${game.round.value}!`);
            closeRound(message);
          });
      } else {
        message.channel.awaitMessages(dTeamReply, { max: 1 })
          .then((messages: Collection<string, Message>) => processReply(messages, message));
      }
    }
  }
}
