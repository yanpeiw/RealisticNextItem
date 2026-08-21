# RealisticNextItem

A desktop overlay for League of Legends that watches your live game and recommends the best item to buy next — based on your champion, the enemy team's champions, their gold and likely power spikes, the game phase, and how the lane matchup tends to play out. It's advisory only: the overlay surfaces a recommendation and the reasoning behind it, and you still make every purchase decision yourself.

## Why

Item builds matter as much as mechanics, but figuring out the *right* next item mid-game means tracking five enemies' gold, items, and power spikes at once — while also playing the game. RealisticNextItem does that tracking for you and turns it into one clear recommendation with a short explanation, so you can make the call in the two seconds you have before a back.

## How it works

- **Live game data** comes from Riot's official [Live Client Data API](https://developer.riotgames.com/docs/lol#game-client-api) (`http://127.0.0.1:2999`), which is available locally, with no auth, only while a match is running. It's the same information any player could see by tabbing into the scoreboard and shop — nothing hidden or fog-of-war.  
- **Static reference data** (champion stats, item costs/effects, default build paths) is cached from Riot's Data Dragon per patch, so the app works without a network round-trip mid-game.  
- **Lane matchup data** is precomputed offline from a sample of ranked matches (via Riot's Match-V5 API) into a small per-role matchup table — win-rate deltas and common winning-side item timings for each champion pairing. This is a batch job that runs separately from the live app; the overlay only ever reads the precomputed table, it never calls Match-V5 itself.  
- A **recommendation engine** scores candidate items each tick on affordability, damage-type matchup, specific enemy threats (healing, hard CC, burst), win-condition fit, game phase, power-spike urgency, and the matchup signal above — and always surfaces the 1–2 reasons behind its top pick.

See `docs/design-doc.md` for the full breakdown, including the architecture diagram and scoring model.

## Compliance

This project only reads from Riot's official Live Client Data API and never sends input to the game — no auto-buy, no auto-click, nothing that removes a player's own decisions. That keeps it in "stats overlay" territory (similar to tools like Porofessor or Blitz's in-game overlay) rather than anything that would be treated as third-party cheating software. Per Riot's developer policies, this project isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends.

## Roadmap

Build order, cheapest-to-validate first:

1. **Recommendation engine, offline.** Core scoring logic validated against static fixture game states, no live game or UI required.  
2. **Matchup pipeline.** Offline Match-V5 pull \+ aggregation script producing a first real matchup table for the most-played champion in each role.  
3. **Live poller.** Wire the same engine to the real Live Client Data API during an actual game.  
4. **Minimal overlay window.** Transparent, always-on-top, click-through window showing the top recommendation.  
5. **Polish.** Alternates list, power-spike ETAs, hotkeys, settings, per-patch data refresh.

## Planned stack

- App shell: Electron \+ TypeScript  
- UI: React  
- Recommendation engine: framework-free TypeScript module, unit tested against fixture data  
- Data: Live Client Data API (real-time) \+ Data Dragon/Community Dragon (static, per-patch) \+ a self-computed Match-V5 matchup table (static, per-patch)

## Disclaimer

RealisticNextItem isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc.  
