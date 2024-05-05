const { queryNpvArtist } = Spicetify.GraphQL.Definitions;

const badLanguages = ["ru"];
const badLetters = ["э", "ё", "ъ", "ы"];
const badWords = ["россия", "россии", "русский", "русская", "russia"];

function hasBadLetter(text: string) {
  if (!text) return false;
  return badLetters.some((ltr) => text.toLowerCase().includes(ltr));
}

function hasBadWord(text: string) {
  if (!text) return false;
  return badWords.some((wrd) => text.toLowerCase().includes(wrd));
}

function base62ToBase16(base62: string) {
  const base62Chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const base16Chars = "0123456789abcdef";

  let base10 = BigInt(0);
  let power = BigInt(0);

  for (let i = base62.length - 1; i >= 0; i--) {
    const char = base62[i];
    const index = BigInt(base62Chars.indexOf(char));
    base10 += index * 62n ** power;
    power++;
  }

  let base16 = "";
  while (base10 > 0n) {
    const remainder = base10 % 16n;
    base16 = base16Chars[Number(remainder)] + base16;
    base10 = base10 / 16n;
  }

  return base16 || "0";
}

async function getDetailedTrackInfo(uri: string) {
  return await Spicetify.CosmosAsync.get(
    `https://spclient.wg.spotify.com/metadata/4/track/${base62ToBase16(
      uri.replace("spotify:track:", "")
    )}?market=from_token`
  );
}

async function getDetailedArtistInfo(trackUri: string, artistUri: string) {
  return (
    await Spicetify.GraphQL.Request(queryNpvArtist, {
      trackUri: trackUri,
      artistUri: artistUri,
      enableRelatedVideos: false,
      enableCredits: true,
    })
  ).data.artistUnion;
}

async function main() {
  while (!Spicetify?.showNotification) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const player = Spicetify.Player;

  player.addEventListener("songchange", async () => {
    const trackData = player.data.item;
    const trackName = trackData.name;
    let trackArtists = [];

    for (const artist of trackData.artists) {
      trackArtists.push(await getDetailedArtistInfo(trackData.uri, artist.uri));
    }

    let skipReasons = [];

    // check for bad letters in track name
    if (hasBadLetter(trackName)) {
      skipReasons.push("bad letter in track name");
    }

    // check for bad letters or words in artist biography
    if (
      trackArtists?.some((artist) =>
        hasBadLetter(artist.profile.biography.text)
      ) ||
      trackArtists?.some((artist) => hasBadWord(artist.profile.biography.text))
    ) {
      skipReasons.push("bad letter/word in biography");
    }

    // check for bad letters in artist name
    if (trackArtists?.some((artist) => hasBadLetter(artist.profile.name))) {
      skipReasons.push("bad letter in artist name");
    }

    // check for bad song language
    try {
      const langs = (await getDetailedTrackInfo(trackData.uri))
        .language_of_performance;

      if (langs.some((lang: string) => badLanguages.includes(lang)))
        skipReasons.push("bad language");
    } catch (e) {}

    // alert the user if the song was skipped
    if (skipReasons.length > 0) {
      player.next();
      Spicetify.showNotification(
        `Skipped ${trackName}, reason: ${skipReasons.join(", ")}`
      );
    }
  });
}

export default main;
