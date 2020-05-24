import { owner_id } from '../../../keys.json';

export const name = 'reload';
export const description = 'Reloads a command';
export const args = true;
export function execute(message, args) {
    if (message.author.id !== owner_id) {
        return message.channel.send('Sorry, you don\'t have permission to do that!');
    }

    const commandName = args[0].toLowerCase();
    const command = message.client.commands.get(commandName)
        || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    
    if (!command) {
        return message.channel.send(`There is no command with name or alias \`${commandName}\`, ${message.author}!`);
    }

    delete require.cache[require.resolve(`./${command.name}.js`)];
    
    try {
        const newCommand = require(`./${command.name}.js`);
        message.client.commands.set(newCommand.name, newCommand);
    } catch (error) {
        console.log(error);
        message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
    }

    message.channel.send(`Command \`${command.name}\` was reloaded!`);
}