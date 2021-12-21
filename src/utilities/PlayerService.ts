import { Guild } from 'discord.js';
import Player from './Player';

/**
 * Handles the creation and management of players.
 */
export default class PlayerService {
  static players: Array<Player> = [];

  /**
   * Creates a player and attaches it to a guild.
   * @param {string} id 
   * @returns {Player} The created player.
   */
  static createPlayer(id: string, guild: Guild) {
    const player = new Player(id, guild);
    this.players.push(player);

    return player;
  }
  
  /**
   * Removes a player from OGs Player.
   * @param {string} id 
   */
  static deletePlayer(id: string) {
    const deleteIndex = this.players.findIndex(player => player.id === id);
    if (deleteIndex > -1) {
      this.players.slice(deleteIndex, 1);
    }
  }

  /**
   * Gets a player from an id.
   * @param {string} id 
   * @returns {Player}
   */
  static getPlayer(id: string) {
    return this.players.find(player => player.id === id);
  }
}