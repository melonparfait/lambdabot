import { Collection, CommandInteraction } from 'discord.js';
import { LambdabotCommand } from '../helpers/lambda.interface';
import { default_cooldown } from '../../config.json';

export interface CooldownCheckResult {
  onCooldown: boolean;
  timeLeft?: string;
}

export class CooldownManager {
  cooldowns = new Collection<string, Collection<string, Collection<string, number>>>();

  checkCooldown(interaction: CommandInteraction, command: LambdabotCommand): CooldownCheckResult {
    const cooldownAmount = (command.cooldown || default_cooldown) * 1000;

    if (cooldownAmount !== 0) {
      const now = Date.now();

      if (!this.cooldowns.has(interaction.channelId)) {
        this.cooldowns.set(interaction.channelId, new Collection<string, Collection<string, number>>());
      }

      const channelCooldowns = this.cooldowns.get(interaction.channelId);

      if (command.hasChannelCooldown) {
        return this.checkChannelCooldown(channelCooldowns, now, cooldownAmount, command.data.name);
      } else {
        return this.checkUserCooldown(channelCooldowns, now, cooldownAmount, interaction, command.data.name);
      }
    }
  }

  private checkChannelCooldown(channelCooldowns: Collection<string, Collection<string, number>>,
    now: number,
    cooldownAmount: number,
    commandName: string): CooldownCheckResult {
    if (!channelCooldowns.has('channel')) {
      channelCooldowns.set('channel', new Collection<string, number>());
      channelCooldowns.get('channel').set(commandName, now);
      setTimeout(() => channelCooldowns.get('channel').delete(commandName), cooldownAmount);
      return { onCooldown: false };
    } else {
      const cooldownForChannel = channelCooldowns.get('channel');
      const timestamp = cooldownForChannel.has(commandName) ? cooldownForChannel.get(commandName) : 0;
      const expirationTime = timestamp + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return {
          onCooldown: true,
          timeLeft: timeLeft.toFixed(1)
        };
      } else {
        cooldownForChannel.set(commandName, now);
        setTimeout(() => cooldownForChannel.delete(commandName), cooldownAmount);
        return { onCooldown: false };
      }
    }
  }

  private checkUserCooldown(channelCooldowns: Collection<string, Collection<string, number>>,
    now: number,
    cooldownAmount: number,
    interaction: CommandInteraction,
    commandName: string) {
    if (!channelCooldowns.has(interaction.user.id)) {
      channelCooldowns.set(interaction.user.id, new Collection<string, number>());
      channelCooldowns.get(interaction.user.id).set(commandName, now);
      setTimeout(() => channelCooldowns.get(interaction.user.id).delete(commandName), cooldownAmount);
      return { onCooldown: false };
    } else {
      const userCooldowns = channelCooldowns.get(interaction.user.id);
      if (!userCooldowns.has(commandName)) {
        userCooldowns.set(commandName, now);
        setTimeout(() => userCooldowns.delete(commandName), cooldownAmount);
        return { onCooldown: false };
      } else {
        const expirationTime = userCooldowns.get(commandName) + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return {
            onCooldown: true,
            timeLeft: timeLeft.toFixed(1)
          };
        } else {
          userCooldowns.set(commandName, now);
          setTimeout(() => userCooldowns.delete(commandName), cooldownAmount);
          return { onCooldown: false };
        }
      }
    }
  }
}
