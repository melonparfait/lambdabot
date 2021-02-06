import { DiscordMessage } from '../helpers/lambda.interface';
import { checkForGame, checkGamePhase } from '../helpers/command.errorchecks';
import { gameSettings, updateGameInfo } from '../helpers/print.gameinfo';

export const name = 'config';
export const aliases = ['c'];
export const cooldown = 1;
export const description = 'Changes the configuration for the current game. Can only be used during the team formation phase.'
  + '\nArguments: '
  + '\n├─ threshold: Number of points a team needs to win. Must be a positive integer, or "`default`".'
  + '\n├─ async: Enables/disables timers for making guesses. Adding this parameter enables async play. Use `sync` to disable async play and enable timers.'
  + '\n└─ defenseTimer: Number of seconds the defending team has to make a counter guess. Must be a positive integer. Has no effect if the game is played asynchronously.';
export const guildOnly = true;
export const usage = '<threshold> <sync | async> [defenseTimer]';
export const args = true;
export function execute(message: DiscordMessage, args: string[]) {
  const channelId = message.channel.id;
  if (args.length !== 3 && args.length !== 2) {
    return message.reply(`Usage: \`!config\` ${usage}` + `\n${description}`);
  } else if (!checkForGame(message)) {
    return;
  } else if (!checkGamePhase(message.client.games.get(channelId), 'setup')) {
    return message.reply('this command can only be used during game setup.');
  } else {
    let threshold: number | 'default' = 'default';
    const parsedThreshold = parseInt(args[0]);
    if (!isNaN(parsedThreshold)) {
      if (parsedThreshold < 1) {
        return message.reply('please choose a threshold larger than 1.');
      } else if(parsedThreshold > 2147483647) {
        return message.reply('that\'ll take too long to play, please give a smaller number!');
      }
      threshold = parsedThreshold;
    }

    const asyncPlayArg = args[1] === 'async';

    const dGuessTimeArg = parseInt(args[2]);
    const dGuessTime = (isNaN(dGuessTimeArg) || dGuessTimeArg < 1) ? undefined : dGuessTimeArg * 1000;

    message.client.games.get(channelId).setSettings({
      threshold: threshold,
      asyncPlay: asyncPlayArg,
      oGuessTime: 0,
      dGuessTime: dGuessTime,
    });

    updateGameInfo(message);
    return message.channel.send('Changed the settings to:\n'
      + gameSettings(message.client.games.get(channelId)));
  }
}