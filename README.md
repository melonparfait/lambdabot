# lambdabot

Lambdabot is a [Discord bot](https://discord.com/developers/docs/intro#bots-and-apps) that hosts an unofficial digital version of the [Wavelength](https://www.wavelength.zone/) board game. Lambdabot was created as a hobby project for personal and educational purposes.

## Prerequisites
1. [Create a bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) (you can skip this if you already have access to a bot)
1. Create a file called `keys.json` in the root directory of this repo and populate it with
```JSON
{
  "bot_token": "<YOUR_BOT_TOKEN>",
  "owner_id": "<YOUR_DISCORD_ID>"
}
```
3. Give the bot permission to Read, Send, and Manage Messages. It's recommended to create a channel just for interacting with this bot, as it generates a lot of messages.

## Running the TypeScript bot

1. Make sure you have [NodeJS](https://nodejs.org/en/) installed with a version >=12
2. Run `npm install`
3. Start the bot with `npm start`

## Game tutorial
// TODO: Write a tutorial for how to play the game
