import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember, StageChannel, VoiceChannel } from 'discord.js';
import Song from '../utilities/Song';
import { CommandData } from '../typings/CommandData';
import SpotifyService from '../utilities/SpotifyService';
import { search } from 'play-dl';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays audio.')
    .addStringOption(option => option.setName('query').setDescription('The audio you want to play.').setRequired(true))
    .toJSON(),
  
  async execute(interaction: CommandInteraction, { player }: CommandData) {
    await interaction.deferReply({ ephemeral: true });

    const channel = (interaction.member as GuildMember).voice.channel;
    if (!channel) return interaction.editReply({ content: 'You cannot run this command. (VOICE_CHANNEL_NOT_FOUND)' });
    if (channel instanceof StageChannel) return interaction.editReply({ content: 'You cannot run this command. (STAGE_CHANNEL_PROHIBITED)' });

    player.hook(channel as VoiceChannel);

    const query = interaction.options.getString('query', true);

    try {
      const results = await search(query, { source: { youtube: 'video' }, limit: 1 });

      if (results) {
        const result = results[0];

        if (!result.title) return interaction.editReply({ content: 'You cannot run this command. (NO_TITLE)' });

        const track = await SpotifyService.trackFromName(result.title) || await SpotifyService.trackFromName(query);
        const lyrics = await SpotifyService.lyricsFromTrack(track);

        if (!result.channel || !result.channel.name) return interaction.editReply({ content: 'You cannot run this command. (NO_CHANNEL)' });

        const title = track?.name ?? decodeURIComponent(result.title);
        const creator = (track?.artists && track?.artists[0].name) ?? decodeURIComponent(result.channel.name);
        const image = (track?.album?.images && track?.album?.images[0].url) ?? result.thumbnails[0].url;

        const song = new Song(
          title, 
          creator, 
          image,
          'YOUTUBE', 
          result.url,
          lyrics
        );

        player.append(song);
      
        return interaction.editReply({ content: result.url });
      } else {
        return interaction.editReply({ content: 'No videos found. (╯°□°）╯︵ ┻━┻' });
      }
    } catch (error) {
      console.error(error);
      return interaction.editReply({ content: 'You cannot run this command. (YT_SEARCH_EXCEPTION)' });
    }
  }
};