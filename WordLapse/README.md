# Word Lapse v8

Replace your existing `WordLapse` folder with this folder, or replace **both** `script.js` and `dictionary.js`.

## Fixes
- The final letter registers as soon as the pointer enters its cell (no need to hover at its center).
- Coalesced pointer movement is still tracked; drawing happens once per pointer event instead of once per intermediate sample.
- Only the exact highlighted word is checked when the pointer is released.
- The dictionary is now a more conservative tagged English lexicon, filtering proper nouns and many acronyms; no word list is perfect.
- Debug in browser console: `wordLapseHasWord('toe')`, `wordLapseSelection()`.

Open `index.html` locally or serve with `python3 -m http.server 8000`.
