import { DiscordMessage, GamePhase } from './lambda.interface';
import { Game } from '../models/game';

export function checkGamePhase(game: Game, phase: GamePhase): boolean {
  return game.status === phase;
}