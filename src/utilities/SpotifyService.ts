import fetch, { Response } from 'node-fetch';
import { Track } from '../typings/Track';

/**
 * Handles getting lyric data from Spotify.
 * 
 * Extended from @alexmercerind/spotify-lyrics-api
 */
export default class SpotifyService {
  static cookie = process.env.SPOTIFY_COOKIE;

  static async getAccessToken() {
    const tokenResponse = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
      'headers': {
        'accept': 'application/json',
        'accept-language': 'en',
        'app-platform': 'WebPlayer',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'spotify-app-version': '1.1.54.35.ge9dace1d',
        'cookie': SpotifyService.cookie,
      },
      'referrer': 'https://open.spotify.com/',
      'referrerPolicy': 'no-referrer-when-downgrade',
      'body': null,
      'method': 'GET'
    });

    const tokenJSON = <{ accessToken: string }> await tokenResponse.json();

    return tokenJSON.accessToken;
  }

  static async trackFromName(name: string) {
    const accessToken = await SpotifyService.getAccessToken();
    const trackResponse = await fetch(
      'https://api.spotify.com/v1/search?limit=1&type=track&q=' + name, {
        'headers': {
          'Authorization': `Bearer ${accessToken}`,
        },
        'body': null,
        'method': 'GET'
      }
    );
    const track = <{
      tracks: {
        items: Array<Track>
      }
    }> await trackResponse.json();

    return track.tracks.items[0];
  }

  static async lyricsFromTrack(track: { id: string }) {
    try {
      const accessToken = await SpotifyService.getAccessToken();

      const result = [];

      const trackId = track.id;

      const lyricsResponse = await fetch(
        'https://spclient.wg.spotify.com/color-lyrics/v1/track/' + trackId, {
          'headers': {
            'accept': 'application/json',
            'accept-language': 'en',
            'app-platform': 'WebPlayer',
            'Authorization': `Bearer ${accessToken}`,
            'sec-ch-ua-mobile': '?0',
          },
          'body': null,
          'method': 'GET'
        }
      );

      if (!(lyricsResponse instanceof Response)) console.error('No lyrics response from Spotify.');

      const responseJSON = <{
        lyrics: {
          lines: Array<{
            time: number,
            words: Array<{
              string: string
            }>  
          }>
        }
      }> await lyricsResponse.json();
  
      for (const line of responseJSON.lyrics.lines) {
        result.push({
          time: line?.time,
          words: line?.words[0]?.string,
        });
      }
  
      return result;
    } catch (error) {
      return undefined;
    }
  }
}