import { DiscordMessage, GamePhase } from "./lambda.interface";
import { Game } from "../models/game";

export function checkForGame(message: DiscordMessage): boolean {
  if (!message.client.game || message.client.game.status === 'finished') {
    message.reply('No one has started a game yet. Use the \`newgame\` command to start one!');
    return false;
  } else {
    return true;
  }
}

export function checkGamePhase(game: Game, phase: GamePhase): boolean {
  return game.status === phase;
}