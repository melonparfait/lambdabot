# lambdabot
A Discord bot that hosts Wavelength games over chat.

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

***
# Under construction

## Running the Python bot
// TODO: Create a python version of this game
1. Make sure you have dependencies installed by running `pip install -r requirements.txt`
1. Start the bot with `python3 src/py/app.py`

If you want to use a [virtual environment](https://docs.python.org/3/tutorial/venv.html), create one with `python3 -m venv bot-env` and activate it before installing dependencies with either
* `source bot-env/bin/activate` (linux)
* `bot-env\Scripts\activate.bat` (windows)

You can leave the virtual environment with `deactivate`.
## Game tutorial
// TODO: Write a tutorial for how to play the game
