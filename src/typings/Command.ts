import { Interaction } from 'discord.js';
import { CommandData } from './CommandData';

export type Command = {
  data: unknown;
  execute: (interaction: Interaction, data: CommandData) => void;
}