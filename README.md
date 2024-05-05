# No ᵣussian Music
Automatically skip ᵣussian content in Spotify

## How it works
No ᵣussian Music skips songs if:
- [x] the song name has one of the following letters in it: ["э", "ё", "ъ", "ы"]
- [x] one of the artists' name's has one of the following letters in it: ["э", "ё", "ъ", "ы"]
- [x] the song is marked as sang in russian language by spotify
- [ ] one of the artist's bios feature one of the bad words (["россия", "россии", "русский", "русская"]) or one of the bad letters

### Installation
Notes:
- Must have Node.js and npm/yarn installed
- Must have [spicetify](https://spicetify.app/) installed

Windows:
```ps
git clone https://github.com/logixism/no-russian-music.git
cd no-russian-music
npm install
npm run build
spicetify apply
```

### Contributing
[https://spicetify.app/docs/development/spicetify-creator](https://spicetify.app/docs/development/spicetify-creator)
