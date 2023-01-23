import { Collection } from 'discord.js';
import { Game } from '../models/game';

export class GameManager {
  /** A collection of the client's games keyed by channelId */
  private readonly _games = new Collection<string, Game>();

  /** 
   * Adds a game to the client's collection of games. If a game 
   * already exists for the channel, it is overwritten.
   */
  addGame(channelId: string, game: Game) {
    this._games.set(channelId, game);
  }

  /** Removes a game from the client's collection of games */
  removeGame(channelId: string) {
    this._games.delete(channelId);
  }

  /** Retrieves a game from the client's collection of games */
  getGame(channelId: string): Game {
    return this._games.get(channelId);
  }

  /** Query for whether a channel has an entry in the client's collection of games */
  hasGame(channelId: string): boolean {
    return this._games.has(channelId);
  }

  /** Query for whether a channel has a finished game */
  checkForFinishedGame(channelId: string): boolean {
    return this._games.has(channelId) && this._games.get(channelId).status === 'finished';
  }

  /** Deletes all games from the collection of the client's games */
  resetCollection() {
    this._games.clear();
  }
}