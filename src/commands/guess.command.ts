import { sendNewRoundMessages } from '../helpers/newround';
import { LambdabotCommand } from '../helpers/lambda.interface';
import { InteractionReplyOptions, ChatInputCommandInteraction } from 'discord.js';
import { clue, currentClue, couldNotPin, noActiveGameMessage, gameNotInProgress, errorProcessingCommand, scoreboard } from '../helpers/print.gameinfo';
import { ScoringResults, OffenseScore } from '../models/scoring.results';
import { SlashCommandBuilder, userMention } from '@discordjs/builders';
import { Game } from '../models/game';
import { isUndefined } from 'lodash';

export class GuessCommand extends LambdabotCommand {
  isRestricted = false;
  hasChannelCooldown = true;
  isGuildOnly = true;
  cooldown?: 3;
  data = new SlashCommandBuilder()
    .setName('guess')
    .setDescription('Parent command for guessing')
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

  async execute(interaction: ChatInputCommandInteraction) {
    const game = this.gameManager.getGame(interaction.channelId);
    if (!game || game.status === 'finished') {
      return await interaction.reply(noActiveGameMessage);
    } else if (game.status !== 'playing') {
      return await interaction.reply(gameNotInProgress);
    }

    const subcmd = interaction.options.getSubcommand();
    switch(subcmd) {
      case 'clue':
        if (interaction.user.id === game.round.clueGiver) {
          return await interaction.reply(this.clueGiverCannotGuess);
        } else if (!game.round.oTeam.players.includes(interaction.user.id)) {
          return await interaction.reply(this.wrongTeamCannotGuess(game.offenseTeamNumber()));
        } else if (game.round.oGuess) {
          return await interaction.reply(this.alreadyGuessed(game.round.oGuess));
        } else if (isUndefined(game.currentClue)) {
          return await interaction.reply(this.noClueYet);
        } else {
          const guess = interaction.options.getInteger('number', true);
          if (guess < 1 || guess > 100) {
            return await interaction.reply(this.invalidInteger);
          } else {
            game.round.makeOGuess(guess);

            if (!game.asyncPlay) {
              await interaction.reply(this.counterPrompt(game));
              const timerTick = this.getDefenseTimerInterval(game.dGuessTime);
              let countdownCounter = 1;
              const timer = setInterval(async () => {
                if (game.round.dGuess !== undefined || countdownCounter === this.TIMER_DIVISION) {
                  clearInterval(timer);
                  const scoreResult = game.score(false);
                  await interaction.followUp(`Team ${game.defenseTeamNumber()} ran out of time!`
                    + `\nThe real answer was ${game.round.value}!`);
                  const closeRoundMsg = await this.closeRound(interaction, scoreResult);
                  return await interaction.followUp(closeRoundMsg);
                } else if (game.status === 'finished') {
                  // someone quit the game
                  clearInterval(timer);
                }
                countdownCounter++;
                return await interaction.followUp(`${(Math.floor(game.dGuessTime - timerTick * countdownCounter) / 1000)} seconds left!`);
              }, timerTick);
            } else {
              return await interaction.reply(this.counterPrompt(game));
            }
          }
        }
        break;
      case 'higher':
      case 'lower':
        const isPlayerOnDTeam = game.round.dTeam.players.includes(interaction.user.id);
        if (!isPlayerOnDTeam) {
          return await interaction.reply(this.wrongTeamCannotCounter(game.defenseTeamNumber()));
        } else if (!game.round.oGuess) {
          return await interaction.reply(this.noGuessYet);
        } else {
          const isHigher = subcmd === 'higher';
          game.round.makeDGuess(isHigher);

          const scoreResult = game.score();
          await interaction.reply(this.resolveGuessMessage(scoreResult, game));
          const roundResults = await this.closeRound(interaction, scoreResult);
          return await interaction.followUp(roundResults);
        }
      default:
        return await interaction.reply(errorProcessingCommand);
    }
    
  }

  TIMER_DIVISION = 4;

  async closeRound(interaction: ChatInputCommandInteraction, results: ScoringResults) {
    const game = this.gameManager.getGame(interaction.channelId);

    await interaction.followUp(this.pointChange(results, game));

    const catchup = results.offenseResult === OffenseScore.bullseye
      && game.offenseTeam.points < game.defenseTeam.points;

    // End the round
    game.endRound(catchup);

    // Check if the game has ended
    const winner = game.determineWinner();
    if (winner) {
      game.endGame();

      if (game.trackStats) {
        this.dbService.updateDatabase(game.team1.players,
          game.team2.players,
          game.id,
          interaction.channelId,
          game.team1.points,
          game.team2.points,
          game.outcomes);
      }

      const msg = this.gameEndScoreboard(game, winner);
      try {
        await game.pinnedInfo?.unpin();
        game.pinnedInfo = undefined;
        return msg;
      } catch (err) {
        console.log(err);
        return couldNotPin;
      }
    } else {
      if (game.team1.points > game.threshold
          && game.team2.points > game.threshold) {
        await interaction.followUp(this.closeGame);
      }

      if (catchup) {
        await interaction.followUp(this.catchupTriggered(game.offenseTeamNumber()));
      }

      game.newRound();
      return await sendNewRoundMessages(interaction, game, this.clueManager, this.lambdaClient.users);
    }
  }

  counterPrompt(game: Game) {
    const guess = game.round.oGuess;
    const givenClue = game.currentClue ? `\n${currentClue(game)}` : '';
    let response = `Team ${game.offenseTeamNumber()} guessed ${guess}.`
      + '\n' + clue(game.round, guess)
      + givenClue
      + `\nTeam ${game.defenseTeamNumber()} `
      + `(${game.defenseTeam.players.map(id => userMention(id)).join(', ')}), `
      + 'do you think the target is higher or lower?'
      + '\nUse the `/guess higher` and `/guess lower` commands  to respond.';

    if (!game.asyncPlay) {
      response += `\nYou have ${game.dGuessTime / 1000} seconds to answer!`;
    }
    return response;
  }

  resolveGuessMessage(scoreResult: ScoringResults, game: Game): string {
    const dGuess = game.round.dGuess ? 'higher' : 'lower';
    let response = `Team ${game.defenseTeamNumber()} thought the answer was ${dGuess}...`;
      
    const correctness = scoreResult.defenseResult
      ? '\n...and they were right!'
      : '\n...but they were wrong!';

    const accuracy = scoreResult.offenseResult === OffenseScore.bullseye
      ? `\n...but Team ${game.offenseTeamNumber()}'s guess was too good.`
      : undefined;

    const result = accuracy ?? correctness;

    response += result + `\nThe real answer was ${game.round.value}!`;
    return response;
  }

  catchupTriggered(teamNumber: number): string {
    return `Team ${teamNumber} is still behind after an excellent guess! They get to keep giving clues!`;
  }

  gameEndScoreboard(game: Game, winner: string) {
    return winner + ' has won the game!'
      + '\nFinal stats:'
      + `\nRounds played: ${game.roundCounter}` + '\n'
      + scoreboard(game);
  }

  pointChange(results: ScoringResults, game: Game): string {
    return `Team 1 gains ${results.team1PointChange} points! (total points: ${game.team1.points})`
    + `\nTeam 2 gains ${results.team2PointChange} points! (total points: ${game.team2.points})`
  }

  closeGame = 'Wow, this is a close game! Whichever team gets a lead first wins!';

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