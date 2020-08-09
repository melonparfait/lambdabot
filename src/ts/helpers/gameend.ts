import { TextChannel } from "discord.js";
import { Game } from "../models/game";
import { scoreboard } from "./print.gameinfo";

export function sendGameEndScoreboard(channel: TextChannel, game: Game) {
  channel.send(game.winner + ' has won the game!'
    + '\nFinal stats:'
    + `\nRounds played: ${game.clueCounter}`
    + scoreboard(game));
}