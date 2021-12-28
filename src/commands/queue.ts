import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { CommandData } from '../typings/CommandData';

export default {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Sends the current queue.')
    .toJSON(),

  async execute(interaction: CommandInteraction, { player }: CommandData) {
    let queueMessage = '**QUEUE:**';
    
    const queue = player.getQueue();
    const nowIndex = player.getNowPlayingIndex();

    for (const [index, song] of queue.entries()) {
      queueMessage += `\n${index === nowIndex ? `**${song.title}**` : song.title}`;
    } 

    return interaction.reply({ content: queueMessage, ephemeral: true });
  }
};