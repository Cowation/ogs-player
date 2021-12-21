import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { CommandData } from '../typings/CommandData';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song.')
    .toJSON(),
  
  async execute(interaction: CommandInteraction, { player }: CommandData) {
    player.skip();

    return interaction.reply({ content: 'Skipped.', ephemeral: true });
  }
};