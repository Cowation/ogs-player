import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { CommandData } from '../typings/CommandData';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops the current song and clears the queue.')
    .toJSON(),
  
  async execute(interaction: CommandInteraction, { player }: CommandData) {
    player.stop();

    return interaction.reply({ content: 'Stopped.', ephemeral: true });
  }
};