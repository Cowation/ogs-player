import { Guild } from 'discord.js';
import Player from '../utilities/Player';

export type CommandData = {
  guild: Guild;
  player: Player;
}