import { SlashCommandBuilder } from '@discordjs/builders';
import { AudioPlayerStatus } from '@discordjs/voice';
import { CommandInteraction } from 'discord.js';
import { CommandData } from '../typings/CommandData';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Toggle between paused and unpaused.')
    .toJSON(),

  async execute(interaction: CommandInteraction, { player }: CommandData) {
    const status = player.audioPlayer.state.status;

    if (!(status === AudioPlayerStatus.Paused || status === AudioPlayerStatus.Playing))
      return interaction.reply({ content: 'You cannot run this command. (PLAYER_STOPPED)', ephemeral: true });

    player.togglePaused();

    return interaction.reply({ content: `**${status === AudioPlayerStatus.Paused ? 'Unpaused' : 'Paused'}** the player.`, ephemeral: true });
  }
};