import { DiscordMessage } from "../helpers/lambda.interface";
import { checkForGame, checkGamePhase } from "../helpers/command.errorchecks";
import { gameSettings } from "../helpers/print.gameinfo";

export const name = 'config';
export const aliases = ['c'];
export const cooldown = 1;
export const description = 'Changes the configuration for the current game. Can only be used during the team formation phase.'
  + '\nArguments: '
  + '\n├─ threshold: Number of points a team needs to win. Must be a positive integer.'
  + '\n├─ async: Enables/disables timers for making guesses. Adding this parameter enables async play. Use \`sync\` to disable async play and enable timers.';
  + '\n└─ defenseTimer: Number of seconds the defending team has to make a counter guess. Must be a positive integer. Has no effect if the game is played asynchronously.';
export const guildOnly = true;
export const usage = '<threshold> <sync | async> [defenseTimer]';
export const args = true;
export function execute(message: DiscordMessage, args: string[]) {
  if (args.length !== 3 && args.length !== 2) {
    return message.reply(`Usage: !config ${usage}` + `\n${description}`);
  } else if (!checkForGame(message)) {
    return;
  } else if (!checkGamePhase(message.client.game, 'setup')) {
    return message.reply('this command can only be used during game setup.');
  } else {
    const thresholdArg = parseInt(args[0]);
    const asyncPlayArg = args[1] === 'async';
    const dGuessTimeArg = parseInt(args[2]);
    const threshold = isNaN(thresholdArg) ? undefined : thresholdArg;
    const dGuessTime = isNaN(dGuessTimeArg) ? undefined : dGuessTimeArg * 1000;
    message.client.game.setSettings({
      threshold: threshold,
      asyncPlay: asyncPlayArg,
      oGuessTime: 0,
      dGuessTime: dGuessTime
    });
    return message.channel.send('Changed the settings to:\n'
      + gameSettings(message.client.game));
  }
}