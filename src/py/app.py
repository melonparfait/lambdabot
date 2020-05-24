import discord
from discord.ext import commands
import json

with open('../../keys.json') as f:
    keys = json.load(f)

with open('../../config.json') as f:
    conf = json.load(f)

bot = commands.Bot(command_prefix=conf['bot_prefix'])

@bot.event
async def on_ready():
    print('Logged in as {0} ({1})'.format(bot.user.name, bot.user.id))

@bot.command()
async def ping(ctx):
    await ctx.send('pong!')

@bot.command()
async def echo(ctx, *args):
    await ctx.send('{}'.format(' '.join(args)))

@bot.command()
async def version(ctx):
    await ctx.send('λ-bot Python')

bot.run(keys['bot_token'])