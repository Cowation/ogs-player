import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { CommandData } from '../typings/CommandData';

export default {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the current volume (as a percentage).')
    .addNumberOption(option => option.setName('percent').setDescription('The volume percentage you wish to set.').setRequired(true))
    .toJSON(),
  
  async execute(interaction: CommandInteraction, { player }: CommandData) {
    const percent = interaction.options.getNumber('percent', true);

    player.setVolume(percent);

    return interaction.reply({ content: `Set the volume to **${percent}%**.`, ephemeral: true });
  }
};