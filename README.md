# OGs Player

OGs Player is open-source software. Please see `LICENSE` regarding usage.

_Plays tunes better._

## Features

- Streams at 48KHz with low latency and virtually zero unnecessary preprocessing overhead.
- Fetches Spotify synced lyrics for select songs.
- Connects to **OGs Link**, an elegant and powerful interface to control OGs Player.
- Includes meaningful, robust, type-safe abstractions and declarations.

## Deploying

Follow these instructions to deploy and run OGs Player.

1. Create a new `.env` file in the project root. (Instructions are labeled below)
2. Install all required dependencies using `npm install` .
3. Run `npm run deploy` to deploy all Discord slash commands.
4. `npm run compile` to compile all TypeScript files.
5. `npm run start` to start OGs Player.

## Environment Variables

OGs Player requires certain environment variables to be present in `.env` to function properly. Below is a template for the file.

```ini
CLIENT_ID=<DISCORD CLIENT ID>
BOT_TOKEN=<DISCORD BOT TOKEN>
YT_KEY=<YOUTUBE DATA API V3 KEY>
SPOTIFY_COOKIE=<SPOTIFY COOKIE>
```

**CLIENT_ID** - The client id associated with the Discord bot.

**BOT_TOKEN** - The bot token used for logging in to the Discord bot.

**YT_KEY** - A YouTube Data API v3 restricted API key generated at Google Cloud Console.

**SPOTIFY_COOKIE** - The `cookie` value in the request header of a request to a Spotify authentication endpoint. Use Chrome DevTools to retrieve this value.
