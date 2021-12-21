/**
 * Deploys commands to the bot.
 */
import * as fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { URL } from 'url';

const commands: Array<unknown> = [];
const commandFiles = fs.readdirSync(new URL('./commands', import.meta.url)).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(new URL(`./commands/${file}`, import.meta.url).toString());
  commands.push(command.default.data);
}

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
  .then(() => console.log('Successfully deployed commands.'))
  .catch(console.error);
