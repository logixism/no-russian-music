const badLanguages = ["ru"];
const badLetters = ["э", "ё", "ъ", "ы"];
const badWords = ["россия", "россии", "русский", "русская"];

function hasBadLetter(text: string) {
  return badLetters.some((ltr) => text.toLowerCase().includes(ltr));
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

async function main() {
  while (!Spicetify?.showNotification) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const player = Spicetify.Player;

  player.addEventListener("songchange", async () => {
    const trackData = player.data.item;
    const trackName = trackData.name;
    const trackArtists = trackData.artists;

    var languages;
    try {
      languages = (await getDetailedTrackInfo(trackData.uri))
        .language_of_performance;
    } catch (e) {
      languages = [];
    }

    if (
      hasBadLetter(trackName) ||
      trackArtists?.some((artist) => hasBadLetter(artist.name)) ||
      languages.some((lang: string) => badLanguages.includes(lang))
    ) {
      player.next();
      Spicetify.showNotification(
        `Skipped ${trackName} by ${
          trackArtists
            ? trackArtists.map((artist) => artist.name).join(", ")
            : "unknown artist"
        }`
      );
    }
  });
}

export default main;
