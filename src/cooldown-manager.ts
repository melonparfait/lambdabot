import { Collection, CommandInteraction } from 'discord.js';
import { NewCommand } from './helpers/lambda.interface';
import { default_cooldown } from '../config.json';

export interface CooldownCheckResult {
  onCooldown: boolean;
  timeLeft?: string;
}

export class CooldownManager {
  cooldowns = new Collection<string, Collection<string, Collection<string, number>>>();

  checkCooldown(interaction: CommandInteraction, command: NewCommand): CooldownCheckResult {
    const cooldownAmount = (command.cooldown || default_cooldown) * 1000;

    if (cooldownAmount !== 0) {
      const now = Date.now();

      if (!this.cooldowns.has(interaction.channelId)) {
        this.cooldowns.set(interaction.channelId, new Collection<string, Collection<string, number>>());
      }

      const channelCooldowns = this.cooldowns.get(interaction.channelId);

      if (command.channelCooldown) {
        return this.checkChannelCooldown(channelCooldowns, now, cooldownAmount, command);
      } else {
        return this.checkUserCooldown(channelCooldowns, now, cooldownAmount, interaction, command);
      }
    }
  }

  private checkChannelCooldown(channelCooldowns: Collection<string, Collection<string, number>>,
    now: number,
    cooldownAmount: number,
    command: NewCommand): CooldownCheckResult {
    if (!channelCooldowns.has('channel')) {
      channelCooldowns.set('channel', new Collection<string, number>());
      channelCooldowns.get('channel').set(command.name, now);
      setTimeout(() => channelCooldowns.get('channel').delete(command.name), cooldownAmount);
      return { onCooldown: false };
    } else {
      const cooldownForChannel = channelCooldowns.get('channel');
      const timestamp = cooldownForChannel.has(command.name) ? cooldownForChannel.get(command.name) : 0;
      const expirationTime = timestamp + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return {
          onCooldown: true,
          timeLeft: timeLeft.toFixed(1)
        };
      } else {
        cooldownForChannel.set(command.name, now);
        setTimeout(() => cooldownForChannel.delete(command.name), cooldownAmount);
        return { onCooldown: false };
      }
    }
  }

  private checkUserCooldown(channelCooldowns: Collection<string, Collection<string, number>>,
    now: number,
    cooldownAmount: number,
    interaction: CommandInteraction,
    command: NewCommand) {
    if (!channelCooldowns.has(interaction.user.id)) {
      channelCooldowns.set(interaction.user.id, new Collection<string, number>());
      channelCooldowns.get(interaction.user.id).set(command.name, now);
      setTimeout(() => channelCooldowns.get(interaction.user.id).delete(command.name), cooldownAmount);
      return { onCooldown: false };
    } else {
      const userCooldowns = channelCooldowns.get(interaction.user.id);
      if (!userCooldowns.has(command.name)) {
        userCooldowns.set(command.name, now);
        setTimeout(() => userCooldowns.delete(command.name), cooldownAmount);
        return { onCooldown: false };
      } else {
        const expirationTime = userCooldowns.get(command.name) + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return {
            onCooldown: true,
            timeLeft: timeLeft.toFixed(1)
          };
        } else {
          userCooldowns.set(command.name, now);
          setTimeout(() => userCooldowns.delete(command.name), cooldownAmount);
          return { onCooldown: false };
        }
      }
    }
  }
}
