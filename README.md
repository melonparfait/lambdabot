# lambdabot
A Discord bot that hosts Wavelength games over chat. There is both a Javascript (TODO: and a Python implementation).

## Prerequisites
1. [Create a bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) (you can skip this if you already have access to a bot)
1. Replace the placeholder in `keys.json` with the bot token.

## Running the Python bot
1. Make sure you have dependencies installed by running `pip install -r requirements.txt`
1. Start the bot with `python3 src/py/app.py`

If you want to use a [virtual environment](https://docs.python.org/3/tutorial/venv.html), create one with `python3 -m venv bot-env` and activate it before installing dependencies with either
* `source bot-env/bin/activate` (linux)
* `bot-env\Scripts\activate.bat` (windows)

You can leave the virtual environment with `deactivate`.

## Running the TypeScript bot

1. Make sure you have [NodeJS](https://nodejs.org/en/) installed with a version >=12
2. Run `npm install`
3. Start the bot with `npm start`
