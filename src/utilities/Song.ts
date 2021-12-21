import { Lyrics } from '../typings/Lyrics';

export default class Song {
  /**
   * Creates a new song.
   * @param {string} platform - The platform/service the song was retrieved from.
   * @param {string} url - The url of the song.
   */
  constructor(
    public title: string, 
    public creator: string, 
    public art: string | undefined, 
    public platform: string, 
    public url: string,
    public lyrics: Lyrics | undefined
  ) {

  }
}