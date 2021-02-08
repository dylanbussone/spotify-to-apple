const fs = require("fs");
const SpotifyWebApi = require("spotify-web-api-node");

const spotifyUser = "dbuss1";

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

function setSpotifyAccessToken() {
  return spotifyApi.clientCredentialsGrant().then(
    function (data) {
      spotifyApi.setAccessToken(data.body["access_token"]);
    },
    function (err) {
      console.log("Something went wrong when retrieving an access token", err);
    }
  );
}

async function main() {
  await setSpotifyAccessToken();

  spotifyApi.getUserPlaylists(spotifyUser).then(async function (playlists) {
    for (playlist of playlists.body.items) {
      const playlistTracks = [];
      const limit = 100;
      let offset = 0;
      let reachedEndOfPlaylist = false;

      console.log(`\nFetching Spotify playlist: ${playlist.name}`);

      while (!reachedEndOfPlaylist) {
        const data = await spotifyApi.getPlaylistTracks(playlist.id, {
          offset,
          limit,
          fields: "items",
        });
        const tracks = data.body.items;
        for (track of tracks) {
          playlistTracks.push({
            spotifyId: track.track.id,
            name: track.track.name,
            album: track.track.album,
            artists: track.track.artists,
          });
        }
        reachedEndOfPlaylist = tracks.length === 0;
        offset += limit;
      }
      fs.writeFileSync(
        `json/${playlist.name}.json`,
        JSON.stringify(playlistTracks)
      );
      console.log(`Found ${playlistTracks.length} tracks.`);
    }
  });
}

main();
