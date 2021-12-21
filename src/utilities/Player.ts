import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, joinVoiceChannel, PlayerSubscription } from '@discordjs/voice';
import { Guild, VoiceChannel } from 'discord.js';
import * as play from 'play-dl';
import Song from './Song';

import { io } from '..';
import { Socket } from 'socket.io';
import Timer from './Timer';

/**
 * Handles all functionality related to audio dispatching
 * and updates to settings for a server.
 */
export default class Player {
  id: string;
  guild: Guild;
  audioPlayer: AudioPlayer;
  subscription: PlayerSubscription | undefined;

  private queue: Array<Song>;
  private nowIndex: number;
  private nowResource: AudioResource | undefined;

  private timers: Array<Timer>;
  private nowLyricIndex: number;

  looping: string;
  volume: number;
  
  /**
   * Initializes a Player attached to a id.
   * @constructor
   * @param {string} id
   * @param {Guild} guild
   */
  constructor(id: string, guild: Guild) {
    this.id = id;
    this.guild = guild;
    this.queue = [];
    this.looping = 'off';
    this.audioPlayer = createAudioPlayer();
    this.nowIndex = -1;
    this.volume = 100;

    this.timers = [];
    this.nowLyricIndex = -1;

    // When song is paused / resumed, do the same for lyric timers.
    this.audioPlayer.on('stateChange', (oldState, newState) => {
      if (newState.status === AudioPlayerStatus.Paused) {
        for (const timer of this.timers) {
          timer.pause();
        }
      } else if (oldState.status === AudioPlayerStatus.Paused && newState.status === AudioPlayerStatus.Playing) {
        for (const timer of this.timers) {
          timer.resume();
        }
      }
    });

    // When song has finished
    this.audioPlayer.on('stateChange', (oldState, newState) => {
      if (oldState.status !== AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Idle) {
        this.forward(false);
      }
    });
  }

  /**
   * Connects to a voice channel.
   * @param {VoiceChannel} channel 
   */
  hook(channel: VoiceChannel) {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: this.id,
      adapterCreator: this.guild.voiceAdapterCreator
    });

    this.subscription = connection.subscribe(this.audioPlayer);
  }

  /**
   * Plays a song.
   * @param {Song} song 
   */
  private async play(song: Song) {
    let resource: AudioResource;

    this.stopLyrics();

    switch (song.platform) {
    case 'YOUTUBE': {
      const stream = await play.stream(song.url, { quality: 2 });
      resource = createAudioResource(stream.stream, { 
        inputType: stream.type,
        inlineVolume: true
      });

      break;
    }
    default: {
      throw new Error('An error occurred. (INVALID_PLATFORM)');
    }
    }

    const scaledDecimal = (this.volume / 100) * 0.2;
    resource.volume?.setVolume(scaledDecimal);

    // For progress indicators and lyric syncing
    // this.stopwatch = setInterval(() => {
    //   if (!this.getPaused()) {
    //     if (song.lyrics) {
    //       if (this.nowLyricIndex + 1 < song.lyrics.length && (song.lyrics[this.nowLyricIndex + 1].time <= this.nowTime)) {
    //         this.nowLyricIndex++;
    //         this.sync('LYRIC');
    //       }
    //     }

    //     this.nowTime += 200;
    //   }
    // }, 200);

    // EXPERIMENTAL!!! Uses setTimeout to determine when lyrics are synced
    this.startLyrics(song);

    this.nowResource = resource;
    this.audioPlayer.play(resource);

    // SOCKET EMITTER
    this.sync('PLAYING');
    this.sync('PAUSED');
  }

  /**
   * Moves the queue based on the current player options.
   * @param {boolean} manual - Whether the queue is being manually moved.
   */
  private forward(manual: boolean) {
    if (this.nowIndex === -1) return;
    const nextOutOfBounds = this.nowIndex + 1 >= this.queue.length;

    if (this.looping === 'queue' && nextOutOfBounds) {
      this.nowIndex = 0;
    } else if ((this.looping === 'off' && nextOutOfBounds) || (manual && nextOutOfBounds)) {
      this.nowIndex = -1;
    } else if (this.looping === 'track' && !manual) {
      // nothing xd
    } else {
      this.nowIndex += 1;
    }

    if (this.nowIndex === -1) {
      this.stop();
    } else {
      this.play(this.queue[this.nowIndex]);
    }
  }

  /**
   * Gets the paused state of the player.
   */
  getPaused() {
    const status = this.audioPlayer.state.status;
    const paused = status === AudioPlayerStatus.Paused;

    return paused;
  }

  /**
   * Toggles the paused state of the player.
   */
  togglePaused() {
    const status = this.audioPlayer.state.status;
    const paused = status === AudioPlayerStatus.Paused;

    if (paused) {
      this.audioPlayer.unpause();
    } else {
      this.audioPlayer.pause();
    }

    this.sync('PAUSED');
  }

  /**
   * Starts lyric timers based on the passed song object.
   * 
   * A lyric timer will send an event notifying when a
   * certain lyric is being sung.
   * 
   * If no lyrics are found, nothing will occur.
   */
  startLyrics(song: Song) {
    if (song.lyrics) {
      for (const lyric of song.lyrics) {
        const timer = new Timer(() => {
          this.nowLyricIndex++;
          this.sync('LYRIC');
          this.timers.shift();
        }, lyric.time);

        this.timers.push(timer);
      }
    }
  }

  /**
   * Stops all lyric timers and resets the nowLyricIndex.
   */
  stopLyrics() {
    for (const timer of this.timers) {
      if (!timer.timer) continue;

      clearTimeout(timer.timer);
    }

    this.timers = [];
    this.nowLyricIndex = -1;
  }

  /**
   * Gets the stopped state of the player.
   */
  getStopped() {
    return this.nowIndex = -1;
  }

  /**
   * Stops the current song and clears the queue.
   */
  stop() {
    this.audioPlayer.stop();
    this.queue = [];
    this.nowIndex = -1;
    this.nowResource = undefined;

    this.stopLyrics();

    this.sync('PLAYING');
  }

  /**
   * Skips the current song.
   */
  skip() {
    this.forward(true);
  }

  /**
   * Add a song to the end of the queue.
   * @param {Song} song 
   */
  append(song: Song) {
    const wasEmpty = (this.queue.length === 0);

    this.queue.push(song);

    if (wasEmpty) {
      this.nowIndex = 0;
      this.play(song);
    }
  }

  /**
   * Gets the currently playing song.
   * @returns {Song}
   */
  getNowPlaying() {
    if (this.nowIndex === -1) {
      return undefined;
    } else {
      return this.queue[this.nowIndex];
    }
  }

  /**
   * Sets the volume of the player.
   * @param {number} percent 
   */
  setVolume(percent: number) {
    const status = this.audioPlayer.state.status;
    const scaledDecimal = (percent / 100) * 0.2;
    this.volume = percent;

    this.sync('VOLUME');

    if (status === AudioPlayerStatus.Paused || status === AudioPlayerStatus.Playing)
      this.nowResource?.volume?.setVolume(scaledDecimal);
  }

  /**
   * Emits to a socket room with up-to-date
   * data based on player state.
   * @param {string} event 
   * @param {Socket} socket 
   */
  sync(event: string, socket?: Socket) {
    const destination = socket ? socket : io.to(this.id);

    switch (event) {
    case 'PLAYING': {
      // nowPlaying will return undefined if not playing.
      // client will interpret an undefined song param
      // as a stop event.
      destination.emit('PLAYING', this.getNowPlaying());

      break;
    }
    case 'PAUSED': {
      destination.emit('PAUSED', this.getPaused());

      break;
    }
    case 'VOLUME': {
      destination.emit('VOLUME', this.volume);

      break;
    }
    case 'LYRIC': {
      destination.emit('LYRIC', this.nowLyricIndex);

      break;
    }
    }
  }
}