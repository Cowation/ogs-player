import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { CommandData } from '../typings/CommandData';

export default {
  data: new SlashCommandBuilder()
    .setName('repeat')
    .setDescription('Set the repeat mode.')
    .addStringOption(option => option
      .setName('mode')
      .setDescription('The repeat mode you wish to set.')
      .addChoice('Off', 'off')
      .addChoice('Queue', 'queue')
      .addChoice('Track', 'track')
      .setRequired(true))
    .toJSON(),
  
  async execute(interaction: CommandInteraction, { player }: CommandData) {
    const mode = interaction.options.getString('mode', true);

    player.looping = mode;

    return interaction.reply({ content: `Set repeat mode to **${mode}**.`, ephemeral: true });
  }
};