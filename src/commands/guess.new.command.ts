import { sendNewRoundMessages } from '../helpers/newround';
import { Command, DiscordMessage } from '../helpers/lambda.interface';
import { TextChannel, Collection, Message, CommandInteraction, InteractionReplyOptions, UserManager, CollectorFilter, Interaction } from 'discord.js';
import { sendGameEndScoreboard, clue, currentClue, couldNotPin, noActiveGameMessage, gameNotInProgress, errorProcessingCommand } from '../helpers/print.gameinfo';
import { ScoringResults, OffenseScore } from '../models/scoring.results';
import { SlashCommandBuilder, userMention } from '@discordjs/builders';
import { GameManager } from '../game-manager';
import { ClueManager } from '../clue-manager';
import { Game } from '../models/game';
import { DBService } from '../db.service';
import { isUndefined } from 'lodash';

export class GuessCommand implements Command {
  isRestricted = false;
  hasChannelCooldown = true;
  isGuildOnly = true;
  cooldown?: 3;
  data = new SlashCommandBuilder()
    .setName('guess')
    .setDescription('Parent command for guessing')
    .setDefaultPermission(true)
    .addSubcommand(subcommand => subcommand
      .setName('clue')
      .setDescription('Submits a guess for the guessing team')
      .addIntegerOption(option => option
        .setName('number')
        .setDescription('An integer between 1 and 100')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('higher')
      .setDescription('Submits a guess that the clue is higher than the guess from the other team'))
    .addSubcommand(subcommand => subcommand
      .setName('lower')
      .setDescription('Submits a guess that the clue is loser than the guess from the other team'));

  async execute(interaction: CommandInteraction, gameManager: GameManager,
      clueManager: ClueManager, userManager: UserManager, dbService: DBService) {
    const game = gameManager.getGame(interaction.channelId);
    const subcmd = interaction.options.getSubcommand();
    switch(subcmd) {
      case 'clue':
        if (!game || game.status === 'finished') {
          return interaction.reply(noActiveGameMessage);
        } else if (game.status !== 'playing') {
          return interaction.reply(gameNotInProgress);
        } else if (interaction.user.id === game.round.clueGiver) {
          return interaction.reply(this.clueGiverCannotGuess);
        } else if (!game.round.oTeam.players.includes(interaction.user.id)) {
          return interaction.reply(this.wrongTeamCannotGuess(game.offenseTeamNumber()));
        } else if (game.round.oGuess) {
          return interaction.reply(this.alreadyGuessed(game.round.oGuess));
        } else if (isUndefined(game.currentClue)) {
          return interaction.reply(this.noClueYet);
        } else {
          const guess = interaction.options.getInteger('number');
          if (guess < 1 || guess > 100) {
            return interaction.reply(this.invalidInteger);
          } else {
            game.round.makeOGuess(guess);
            interaction.reply(this.counterPrompt(game));
      
            if (!game.asyncPlay) {
              const timerTick = this.getDefenseTimerInterval(game.dGuessTime);
              let countdownCounter = 1;
              const timer = setInterval(async () => {
                if (game.round.dGuess !== undefined || countdownCounter === this.TIMER_DIVISION) {
                  clearInterval(timer);
                  const scoreResult = game.score(false);
                  interaction.channel.send(`Team ${game.defenseTeamNumber()} ran out of time!`
                    + `\nThe real answer was ${game.round.value}!`);
                  const closeRoundMsg = await this.closeRound(interaction, gameManager,
                    clueManager, userManager, scoreResult, dbService);
                  interaction.channel.send(closeRoundMsg);
                  return;
                } else if (game.status === 'finished') {
                  // someone quit the game
                  clearInterval(timer);
                }
                interaction.channel.send(`${(Math.floor(game.dGuessTime - timerTick * countdownCounter) / 1000)} seconds left!`);
                countdownCounter++;
              }, timerTick);
            }
          }
        }
        break;
      case 'higher':
      case 'lower':
        const isPlayerOnDTeam = game.round.dTeam.players.includes(interaction.user.id);
        if (!isPlayerOnDTeam) {
          interaction.reply(this.wrongTeamCannotCounter(game.defenseTeamNumber()));
        } else if (!game.round.oGuess) {
          interaction.reply(this.noGuessYet);
        } else {
          const isHigher = subcmd === 'higher';
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
      
          interaction.channel.send(response);
          const msg = await this.closeRound(interaction, gameManager, clueManager, userManager, scoreResult, dbService);
          interaction.reply(msg);
        }
        break;
      default:
        interaction.reply(errorProcessingCommand);
    }
    
  }

  TIMER_DIVISION = 4;

  async closeRound(interaction: CommandInteraction, gameManager: GameManager,
      clueManager: ClueManager, userManager: UserManager, results: ScoringResults, dbService: DBService) {
    const game = gameManager.getGame(interaction.channelId);

    interaction.channel.send(`Team 1 gains ${results.team1PointChange} points! (total points: ${game.team1.points})`
      + `\nTeam 2 gains ${results.team2PointChange} points! (total points: ${game.team2.points})`);

    // End the round
    game.endRound();

    // Check if the game has ended
    const winner = game.determineWinner();
    if (winner) {
      game.endGame();
      this.finalizeGame(interaction.channelId, gameManager, dbService, game.trackStats);
      sendGameEndScoreboard(interaction.channel, game, winner);
      try {
        await game.pinnedInfo.unpin();
        game.pinnedInfo = undefined;
      } catch (err) {
        interaction.reply(couldNotPin);
        console.log(err);
      }
    } else {
      if (game.team1.points > game.threshold
          && game.team2.points > game.threshold) {
        interaction.channel.send('Wow, this is a close game! Whichever team gets a lead first wins!');
      }
      game.newRound();
      return await sendNewRoundMessages(interaction, game, clueManager, userManager);
    }
  }

  finalizeGame(channelId: string, gameManager: GameManager, dbService: DBService, commit = true) {
    const game = gameManager.getGame(channelId);
    if (commit) {
      dbService.updateDatabase(game.team1.players,
        game.team2.players,
        game.id,
        channelId,
        game.team1.points,
        game.team2.points,
        game.outcomes);
    }
    gameManager.removeGame(channelId);
  }

  counterPrompt(game: Game) {
    const guess = game.round.oGuess;
    const givenClue = game.currentClue ? `\n${currentClue(game)}` : '';
    let response = `Team ${game.offenseTeamNumber()} guessed ${guess}.`
      + '\n' + clue(game.round, guess)
      + givenClue
      + `\nTeam ${game.defenseTeamNumber()} `
      + `(${game.defenseTeam.players.map(id => userMention(id)).join(', ')}), `
      + 'do you think the target is `!higher` or `!lower`?';

    if (!game.asyncPlay) {
      response += `\nYou have ${game.dGuessTime / 1000} seconds to answer!`;
    }
    return response;
  }

  getDefenseTimerInterval(dGuessTime: number) {
    return dGuessTime / this.TIMER_DIVISION;
  }

  noClueYet: InteractionReplyOptions = {
    content: 'The clue giver on your team hasn\'t given a clue yet!',
    ephemeral: true
  }

  noGuessYet: InteractionReplyOptions = {
    content: 'The opposing team hasn\'t made a guess yet!',
    ephemeral: true
  }

  clueGiverCannotGuess: InteractionReplyOptions = {
    content: 'You can\'t guess as the clue giver! No cheating!',
    ephemeral: true
  }

  wrongTeamCannotGuess(teamNumber: number): InteractionReplyOptions {
    return {
      content: `Sorry, only members from Team ${teamNumber} can guess!`,
      ephemeral: true
    }
  };

  wrongTeamCannotCounter(teamNumber: number): InteractionReplyOptions {
    return {
      content: `Sorry, only members from Team ${teamNumber} can try to guess higher or lower!`,
      ephemeral: true
    }
  };

  alreadyGuessed(guess: number): InteractionReplyOptions {
    return {
      content: `You can only guess once, and it looks like your team already guessed ${guess}.`,
      ephemeral: true
    }
  }

  invalidInteger: InteractionReplyOptions = {
    content: 'Sorry, you can only guess an integer between 1 and 100.',
    ephemeral: true
  }
}

module.exports = new GuessCommand();