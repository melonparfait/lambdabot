import { bot_prefix, default_cooldown } from '../../../config.json';

export const name = 'help';
export const aliases = [];
export const cooldown = 5;
export const description = 'List all of my commands or info about a specific command.';
export const guildOnly = false;
export const usage = '[command name]'
export function execute(message, args) {
    const data = [];
    const { commands } = message.client;

    if (!args.length) {
        data.push('Here\'s a list of all my commands:');
        data.push(commands
            .filter(command => command.name !== 'reload')
            .map(command => command.name).join(', '));
        data.push(`\nYou can send \`${bot_prefix}help [command name]\` to get info on a specific command!`);

        return message.author.send(data, { split: true })
            .then(() => {
                if (message.channel.type === 'dm') return;
                message.reply('I\'ve sent you a DM with all my commands!');
            })
            .catch(error => {
                console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
                message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
            });
    }

    const name = args[0].toLowerCase();
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

    if (!command) {
        return message.reply('that\'s not a valid command!');
    }

    data.push(`**Name:** ${command.name}`);

    if (command.aliases && command.aliases.length) {
        data.push(`**Aliases:** ${command.aliases.join(', ')}`);
    }
    if (command.description) {
        data.push(`**Description:** ${command.description}`);
    }
    if (command.usage) {
        data.push(`**Usage:** ${bot_prefix}${command.name} ${command.usage}`);
    }

    data.push(`**Cooldown:** ${command.cooldown || default_cooldown} second(s)`);

    message.channel.send(data, { split: true });
}