import { Client, Collection, Guild, Intents, Interaction } from 'discord.js';
import { Command } from './typings/Command';
import { Server } from 'socket.io';
import { URL } from 'url';
import express from 'express';
import http from 'http';

import * as fs from 'fs';
import PlayerService from './utilities/PlayerService';

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES
  ]
});
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const commands = new Collection<string, Command>();
const commandFiles = fs.readdirSync(new URL('./commands', import.meta.url)).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  import(new URL(`./commands/${file}`, import.meta.url).toString())
    .then(command => commands.set(command.default.data.name, command.default));
}

client.on('ready', async () => {
  console.log('Bot is ready!');

  // Initialize all players before accepting sockets
  const guilds = await client.guilds.cache;
  guilds.forEach(async (guild) => {
    console.log(`Found ${guild.name}`);

    PlayerService.createPlayer(guild.id, guild);
  });

  client.user?.setActivity({ name: 'songs', type: 'LISTENING' });

  // Accept incoming sockets
  io.on('connection', (socket) => {
    console.log('New socket connection!');

    socket.on('INIT', (id: string) => {
      const player = PlayerService.getPlayer(id);

      if (player) {
        console.log('found player');
        socket.join(id);
      
        player.sync('PLAYING');
        player.sync('PAUSED');
        player.sync('VOLUME');
        player.sync('LYRIC');

        socket.on('EMIT_PAUSED', () => {
          player.togglePaused();
        });

        socket.on('EMIT_SKIP', () => {
          player.skip();
        });

        socket.on('EMIT_VOLUME', (volume: number) => {
          console.log('volume called');
          player.setVolume(volume);
        });
      }
    });
  });

  server.listen(3000, () => {
    console.log('Link server now listening on port 3000.');
  });
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;
  
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: 'You cannot run this command. (NON_GUILD_EXEC)', ephemeral: true });

  const player = PlayerService.getPlayer(interaction.guild.id);
  if (!player) return interaction.reply({ content: 'You cannot run this command. (PLAYER_NOT_INITIALIZED)', ephemeral: true });

  const command = commands.get(interaction.commandName);
  const options = { guild: guild, player: player };

  if (!command) return;

  try {
    await command.execute(interaction, options);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an issue running the command. (COMMAND_NOT_FOUND)', ephemeral: true });
  }
});

client.on('guildCreate', (guild: Guild) => {
  console.log(`Found ${guild.name}`);
  PlayerService.createPlayer(guild.id, guild);
});

client.on('guildDelete', (guild: Guild) => {
  console.log(`Removed ${guild.name}`);
  PlayerService.deletePlayer(guild.id);
});

client.login(process.env.BOT_TOKEN);

export { io };