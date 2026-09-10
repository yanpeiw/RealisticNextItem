# Project Brain: LoL Item Advisor

This document is the complete product and engineering specification for the **LoL Item Advisor** MVP. Read it fully before writing code. Treat the decisions and constraints below as authoritative unless a technical blocker makes one impossible.

## 1. Product summary

LoL Item Advisor is a Windows-first desktop overlay for League of Legends. During a match, it reads supported local game data, evaluates the player's champion, inventory, available gold, game phase, allied composition, enemy composition, and visible enemy items, then presents:

1. One primary item recommendation.
2. Two viable alternatives for different strategies.
3. A concise explanation of why each item is useful and what tradeoff it makes.

The product is a **decision-support tool**, not an autopilot. It must help players understand itemization instead of telling them that only one answer is correct.

The MVP uses a deterministic scoring engine. It does not require an LLM, machine-learning model, remote backend, Riot account login, or cloud database.

## 2. Product goal

League of Legends itemization changes throughout a match. Static build guides often cannot respond to:

- An enemy team dealing mostly physical or magic damage.
- An opponent purchasing healing, shields, armor, or magic resistance.
- The player's current gold and available component purchases.
- Whether the player needs immediate survivability or a later power spike.
- The player's current inventory and redundant stats.
- Different strategic preferences, such as safer defense versus higher damage.

The advisor should reduce the effort required to compare these tradeoffs while preserving the player's final decision.

## 3. Target user

The initial user is a new or intermediate League of Legends player who understands basic gameplay but struggles to adapt a build to changing match conditions.

The MVP is not designed for professional play, automated coaching, opponent scouting, or predicting hidden information.

## 4. MVP decisions

- **Operating system:** Windows 10 and Windows 11 first.
- **Game mode:** Summoner's Rift only.
- **Queues:** Normal Draft and Ranked Solo/Duo initially.
- **Desktop framework:** Electron.
- **Frontend:** React and TypeScript.
- **Build tooling:** Vite through `electron-vite`.
- **State management:** Zustand.
- **Runtime validation:** Zod.
- **Local settings:** `electron-store`.
- **Static game data:** Riot Data Dragon.
- **Live match data:** Riot Live Client Data API served locally by the active game.
- **Recommendation system:** Deterministic weighted scoring.
- **Backend:** Electron main process only; no remote server in the MVP.
- **Distribution:** Windows installer built with `electron-builder`.
- **Testing:** Vitest, React Testing Library, and Playwright using mock match data.

## 5. Non-goals for the MVP

Do not build the following yet:

- A mobile application.
- A website or user-account system.
- Cloud synchronization.
- A social or leaderboard system.
- Machine-learning or LLM-generated recommendations.
- Match-history analysis.
- Opponent rank, MMR, or hidden-player analysis.
- Automatic purchases, clicks, inputs, or game-client control.
- Memory reading, process injection, packet inspection, screen scraping, or OCR.
- The unsupported League Client API.
- Monetization, advertisements, subscriptions, or payments.
- Support for every champion before the scoring engine is validated.

## 6. Riot policy and game-integrity constraints

These constraints are mandatory:

1. Use only Riot-supported data sources for the MVP: Data Dragon and the local Live Client Data API.
2. Never inject code into League of Legends, hook the game process, inspect game memory, automate inputs, or modify game files.
3. Never use information that is hidden from the player or unavailable through normal gameplay.
4. Do not calculate hidden cooldowns, enemy positions, hidden inventory changes, MMR, or other undisclosed information.
5. Never label a recommendation as mandatory, guaranteed, or objectively correct.
6. Always provide multiple choices and preserve player agency.
7. Every recommendation must include its reasoning and at least one tradeoff.
8. Do not imitate Riot's interface or imply that this is an official Riot product.
9. Display Riot's required third-party-product disclaimer in the About screen and onboarding.
10. Register the product in the Riot Developer Portal and request review before public distribution.

Riot's current policy states that products should increase the diversity of game decisions and may highlight important decisions while offering multiple choices. It also prohibits unfair advantages, hidden game-session information, and applications that dictate player decisions. See [Riot's general policies](https://developer.riotgames.com/policies/general) and [League of Legends developer policy](https://developer.riotgames.com/docs/lol).

Required disclaimer:

> LoL Item Advisor isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties, are trademarks or registered trademarks of Riot Games, Inc.

Policy compliance is ultimately determined by Riot. Keep live recommendations private or in a limited test until Riot has reviewed the intended user flow.

## 7. Supported data sources

### 7.1 Riot Live Client Data API

During an active match, the game exposes a local HTTPS service at:

```text
https://127.0.0.1:2999/liveclientdata/
```

Riot documents the Live Client Data API as a local API for gathering data during an active game. The MVP should use narrow endpoints rather than requesting all game data on every poll.

Use:

```text
GET /liveclientdata/activeplayer
GET /liveclientdata/playerlist
GET /liveclientdata/gamestats
```

Optional after the base system works:

```text
GET /liveclientdata/eventdata
```

The API and endpoint schemas are documented in [Riot's League of Legends developer documentation](https://developer.riotgames.com/docs/lol#game-client-api_live-client-data-api).

The API uses a self-signed certificate. Create an HTTPS agent that disables certificate verification **only** for requests to the exact loopback host `127.0.0.1:2999`. Never disable TLS verification globally and never set `NODE_TLS_REJECT_UNAUTHORIZED=0`.

### 7.2 Data Dragon

Use Data Dragon for patch-versioned static data and approved game assets:

- Item names, IDs, icons, prices, descriptions, tags, and stat fields.
- Champion names, IDs, icons, and basic static data.
- Supported localized strings.

At startup:

1. Request `https://ddragon.leagueoflegends.com/api/versions.json`.
2. Choose the newest valid version.
3. Request the versioned item and champion JSON files.
4. Cache them locally.
5. Fall back to the last successful cache or a bundled snapshot when offline.
6. Display the active Data Dragon version in Settings/About.

Data Dragon is updated manually by Riot and may briefly lag behind a live patch, so the UI must not claim perfect patch synchronization. See [Riot's Data Dragon documentation](https://developer.riotgames.com/docs/lol#data-dragon).

### 7.3 Curated local configuration

Data Dragon does not contain every design judgment needed by the advisor. Store explainable, version-controlled configuration files for:

- Champion archetypes and stat preferences.
- Damage profiles.
- Crowd-control threat ratings.
- Item categories and mutually exclusive groups.
- Item exclusions and known stat waste.
- Human-readable explanation templates.

These files must be reviewable JSON or TypeScript data, not opaque model output.

## 8. Initial champion scope

The first working recommendation engine should support ten champions, two per role:

| Role | Champions |
| --- | --- |
| Top | Garen, Darius |
| Jungle | Warwick, Amumu |
| Mid | Ahri, Annie |
| Bottom | Jinx, Ashe |
| Support | Leona, Lux |

If the active champion is unsupported, show a clear unsupported state and a static view of Riot-provided item data. Do not generate an unreliable dynamic recommendation.

The architecture must allow additional champion profiles to be added without changing the scoring-engine code.

## 9. Core user flow

### First launch

1. Show a brief explanation of what the app reads and does not read.
2. Display the Riot third-party disclaimer.
3. Let the user choose a global overlay shortcut.
4. Explain that the app works only while a supported League match is active.
5. Open the compact overlay in its default position.

### Waiting state

- Show `Waiting for a League match`.
- Poll the local API every two seconds.
- Do not show repeated connection errors to the user.
- Provide a **Try demo match** button that starts the mock-data adapter.

### Active match

1. Detect the local Live Client Data API.
2. Validate every API response with Zod.
3. Convert raw responses into a normalized `GameSnapshot`.
4. Recompute only when relevant snapshot fields change.
5. Display the primary recommendation and two alternatives.
6. Update recommendations after meaningful gold, inventory, game-time, or visible composition changes.

### Match end

- Detect loss of the local game API after several failed polls.
- Clear all in-memory match data.
- Return to the waiting state.
- Preserve only user settings and non-sensitive application preferences.

## 10. Overlay requirements

The overlay should be informative without covering important gameplay.

### Window behavior

- Transparent and frameless.
- Always on top.
- Default size approximately `380 x 210` pixels.
- Draggable from a dedicated header region.
- Resizable within safe minimum and maximum bounds.
- Remembers its last position and size.
- Validates its saved position when monitors change.
- Can be hidden and restored with a configurable global shortcut.
- Supports a click-through mode with a separate shortcut to restore interaction.
- Must not inject into or modify the game window.
- Document that borderless-windowed League mode may be required if exclusive fullscreen prevents the overlay from appearing.

Suggested default shortcuts:

```text
Ctrl+Shift+Space: Show or hide overlay
Ctrl+Shift+O: Toggle click-through mode
```

### Compact recommendation card

Display:

- Item icon and name.
- Total price and remaining gold needed.
- Recommendation label, such as `Best overall`, `Safer defense`, or `Earlier power spike`.
- Two short reasons.
- One short tradeoff.
- Current data version.

Do not display fake probability or confidence percentages.

### Expanded details

When expanded, display:

- Relevant item stats.
- Component path.
- Scoring-factor breakdown.
- Why each alternative differs from the primary option.
- The inputs used to produce the recommendation.

## 11. Recommendation-engine design

The recommendation engine must be a pure TypeScript module. It cannot import Electron, React, Zustand, Node filesystem APIs, network clients, or window APIs.

### Inputs

- Normalized current-player state.
- Current inventory.
- Current gold.
- Game time and derived game phase.
- Champion profile.
- Allied champion profiles.
- Enemy champion profiles.
- Visible enemy items.
- Static item catalog.
- Optional player strategy preference.

### Output

```ts
type RecommendationSet = {
  snapshotHash: string;
  generatedAt: number;
  primary: ItemRecommendation;
  alternatives: [ItemRecommendation, ItemRecommendation];
};

type ItemRecommendation = {
  itemId: number;
  score: number;
  label: "best_overall" | "safer_defense" | "earlier_spike" | "higher_damage" | "team_utility";
  reasons: ReasonCode[];
  tradeoffs: TradeoffCode[];
  goldNeeded: number;
  componentPath: number[];
  factorScores: Record<ScoringFactor, number>;
};
```

Return structured reason codes from the engine. The UI is responsible for converting codes into readable text.

### Initial scoring model

Score each valid candidate on a 100-point scale before penalties:

| Factor | Maximum points | Purpose |
| --- | ---: | --- |
| Champion fit | 30 | Rewards stats and effects that fit the champion's role and scaling |
| Enemy counter value | 25 | Responds to visible physical, magic, healing, shielding, tank, burst, and crowd-control threats |
| Affordability | 15 | Rewards purchases that can be completed or meaningfully advanced with current gold |
| Inventory synergy | 10 | Complements existing items and avoids redundant effects |
| Game-phase value | 10 | Adjusts for early, middle, and late-game power timing |
| Build-path quality | 5 | Rewards useful components and smoother next purchases |
| Team utility | 5 | Rewards missing utility that benefits the allied composition |

Suggested penalties:

| Condition | Penalty |
| --- | ---: |
| Not purchasable or unavailable on Summoner's Rift | Exclude |
| Already owned and not meaningfully stackable | Exclude |
| Mutually exclusive with an owned item | Exclude |
| Major wasted-stat mismatch | -25 |
| Redundant unique effect | -20 |
| Poor build path for current gold | -10 |
| Conflicts with selected strategy | -10 |

Weights must live in configuration rather than being scattered through conditional statements.

### Game phases

Use a simple initial definition:

```text
Early: game time < 14 minutes
Mid:   14-28 minutes
Late:  > 28 minutes
```

These values must be configurable.

### Producing diverse alternatives

Do not simply return the three highest scores if they serve the same purpose.

1. Select the highest valid score as the primary option.
2. Select the best defensive or lower-risk option that is meaningfully different.
3. Select the best power-spike, damage, or utility option that is meaningfully different.
4. Apply a diversity penalty when two recommendations share the same strategic category.
5. Guarantee that all three item IDs are unique.

### Explainability

For each recommendation:

1. Sort positive scoring factors by contribution.
2. Select the top two player-relevant reasons.
3. Select the most important downside or opportunity cost.
4. Render the result through deterministic text templates.

Example:

```text
Randuin's Omen
Best overall

Why:
- Three visible enemies rely heavily on physical damage.
- Its defensive stats complement your current health items.

Tradeoff:
- Delays your next damage power spike.
```

Never generate explanations with an LLM in the MVP.

## 12. Domain models

```ts
type Team = "ORDER" | "CHAOS";
type Role = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";
type GamePhase = "EARLY" | "MID" | "LATE";

type GameSnapshot = {
  capturedAt: number;
  gameTimeSeconds: number;
  gameMode: string;
  mapNumber: number;
  activePlayer: PlayerSnapshot;
  allies: PlayerSnapshot[];
  enemies: PlayerSnapshot[];
};

type PlayerSnapshot = {
  championName: string;
  team: Team;
  role?: Role;
  level: number;
  currentGold?: number;
  itemIds: number[];
  stats?: {
    attackDamage?: number;
    abilityPower?: number;
    armor?: number;
    magicResist?: number;
    maxHealth?: number;
  };
};

type ChampionProfile = {
  championName: string;
  supportedRoles: Role[];
  damageProfile: {
    physical: number;
    magic: number;
    trueDamage: number;
  };
  threatTags: Array<"BURST" | "SUSTAINED" | "HEALING" | "SHIELDING" | "HARD_CC" | "TANK">;
  desiredStatsByPhase: Record<GamePhase, Record<string, number>>;
  itemCategoryPreferences: Record<string, number>;
  excludedItemIds: number[];
};
```

Do not persist Riot IDs, summoner names, opponent identities, chat, or full raw API responses.

## 13. Application architecture

Use a strict separation between Electron's privileged main process and the unprivileged renderer.

```text
src/
  main/
    index.ts
    windows/
      overlay-window.ts
    ipc/
      register-handlers.ts
    services/
      live-client-service.ts
      data-dragon-service.ts
      settings-service.ts
    adapters/
      live-client-adapter.ts
      mock-game-adapter.ts
  preload/
    index.ts
    api.ts
  renderer/
    src/
      app/
      components/
      features/
        overlay/
        recommendations/
        settings/
      stores/
        game-store.ts
        ui-store.ts
      styles/
  shared/
    domain/
      game-snapshot.ts
      item.ts
      recommendation.ts
    engine/
      recommend-items.ts
      score-item.ts
      build-context.ts
      explain.ts
    schemas/
      live-client-schemas.ts
      ipc-schemas.ts
    config/
      champions/
      scoring.ts
      item-overrides.ts
    utils/
tests/
  fixtures/
  unit/
  integration/
  e2e/
```

### Main process responsibilities

- Create and manage the overlay window.
- Poll the local Live Client Data API.
- Download and cache Data Dragon files.
- Validate external data.
- Normalize raw data into shared domain models.
- Persist only user settings and overlay position.
- Send sanitized snapshots to the renderer through typed IPC.

### Preload responsibilities

Expose a minimal typed API using `contextBridge`:

```ts
type AdvisorDesktopApi = {
  subscribeToGameState(callback: (state: PublicGameState) => void): () => void;
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
  setClickThrough(enabled: boolean): Promise<void>;
  startMockMatch(scenarioId: string): Promise<void>;
  stopMockMatch(): Promise<void>;
};
```

Do not expose arbitrary IPC, filesystem access, shell commands, or raw Electron APIs.

### Renderer responsibilities

- Render the overlay and settings UI.
- Store transient UI state in Zustand.
- Run or display recommendations from sanitized snapshots.
- Never call the local game API directly.
- Never access Node APIs.

### Recommendation-engine responsibilities

- Build match context from a normalized snapshot.
- Filter invalid candidates.
- Score candidates deterministically.
- Select a diverse top-three set.
- Produce structured reasons and tradeoffs.
- Remain pure and unit-testable.

## 14. IPC events

Use a small allowlisted IPC surface:

```text
advisor:game-state-changed
advisor:get-settings
advisor:update-settings
advisor:set-click-through
advisor:start-mock-match
advisor:stop-mock-match
```

Validate all incoming and outgoing IPC payloads with Zod. Do not use dynamic channel names.

## 15. Polling and update behavior

- Poll every two seconds while waiting for a match.
- Poll every one second during an active match.
- Fetch narrow Live Client endpoints in parallel.
- Treat connection refusal as `no active match`, not a fatal error.
- Require two successful snapshots before entering the active-match state.
- Require three consecutive failures before treating the match as ended.
- Hash only recommendation-relevant fields.
- Recompute recommendations only when the hash changes.
- Keep the last valid recommendation during one or two temporary poll failures.
- Target less than 200 milliseconds for scoring after a validated snapshot is available.

Do not log raw API responses in production.

## 16. Security requirements

Configure Electron with:

```ts
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  preload: PRELOAD_PATH,
}
```

Also enforce:

- A restrictive Content Security Policy.
- No `eval`, remote scripts, or remotely hosted renderer code.
- URL allowlists for approved external links.
- Zod validation for Live Client, Data Dragon, settings, and IPC data.
- TLS exceptions scoped only to `https://127.0.0.1:2999`.
- No API keys in source code or distributed binaries.
- No persistence of player identity or raw match snapshots.
- No automatic analytics or crash reporting in the MVP.
- No use of Electron's `remote` module.

## 17. Mock mode

Claude may not have access to an active League match while building. Mock mode is a first-class requirement, not an afterthought.

Create deterministic fixtures for at least these scenarios:

1. Garen versus a mostly physical-damage enemy team.
2. Garen versus a mostly magic-damage enemy team.
3. Jinx facing multiple tanks.
4. Ahri needing an earlier affordable power spike.
5. Leona facing heavy crowd control and magic damage.
6. A player who cannot afford any complete recommended item.
7. An unsupported champion.
8. A malformed Live Client response.
9. A temporary local-API disconnect.
10. A simulated match ending.

The entire UI and scoring loop must be usable in mock mode.

## 18. Testing requirements

### Unit tests

Test the pure recommendation engine with Vitest:

- Same input always produces the same output.
- Invalid and unavailable items are excluded.
- Recommendations contain three unique items when three valid candidates exist.
- Physical-heavy enemy composition increases armor-item scores.
- Magic-heavy enemy composition increases magic-resistance-item scores.
- Healing threats increase anti-heal value only when appropriate.
- Current inventory prevents redundant unique effects.
- Affordable components improve build-path score.
- Every recommendation contains at least one reason and one tradeoff.
- Unsupported champions return an explicit unsupported result.
- Input objects are not mutated.

### Integration tests

- Validate fixture responses with the same Zod schemas used in production.
- Test raw-response normalization.
- Test main-to-renderer IPC subscriptions and unsubscriptions.
- Test Data Dragon cache fallback.
- Test repeated API failure and recovery behavior.

### UI tests

- Waiting state renders correctly.
- Active recommendation renders all three choices.
- Expanded factor breakdown is accessible by keyboard.
- Click-through status is visible before interaction is disabled.
- Error states explain the next user action.

### End-to-end tests

Use Playwright against the packaged Electron application in mock mode:

- Launch the application.
- Start a mock match.
- Verify the primary and alternative cards.
- Change the fixture snapshot.
- Verify the recommendation updates.
- Restart the app and verify position/settings persistence.

## 19. Accessibility

- All interactive controls must be keyboard accessible.
- Provide visible focus styles.
- Do not communicate recommendation categories by color alone.
- Maintain readable contrast against both bright and dark game scenes.
- Support UI scaling.
- Provide text labels and tooltips for icons.
- Respect reduced-motion preferences.

## 20. Logging and diagnostics

Use structured local logs during development, but sanitize them.

Allowed:

- Connection state.
- Endpoint name.
- Response-validation success or failure.
- Snapshot hash.
- Recommendation item IDs and factor totals.
- Performance timings.

Prohibited:

- Raw API payloads in production.
- Riot IDs or summoner names.
- Chat content.
- Full opponent identity data.
- Authentication tokens or API keys.

Add an **Export diagnostics** action later only if it redacts all prohibited fields.

## 21. Git and code-quality rules

- Enable TypeScript strict mode.
- Use ESLint and Prettier.
- Prefer small pure functions over large conditional blocks.
- Do not use `any` unless a boundary is immediately validated and narrowed.
- Keep engine configuration separate from engine logic.
- Add tests with every scoring rule.
- Use conventional commit messages.
- Keep generated assets and build output out of Git.
- Include a clear README with setup, mock-mode, test, build, and policy instructions.

## 22. Implementation phases

### Phase 1: Application shell

1. Scaffold Electron, React, TypeScript, and `electron-vite`.
2. Configure strict TypeScript, ESLint, Prettier, and Vitest.
3. Build the transparent always-on-top window.
4. Add dragging, resizing, position persistence, and global shortcuts.
5. Add waiting and mock-mode screens.

### Phase 2: Static game data

1. Implement the Data Dragon version resolver.
2. Download and validate item/champion data.
3. Add local caching and bundled fallback data.
4. Render real item icons and data-version information.

### Phase 3: Domain and scoring engine

1. Implement shared domain models.
2. Create the first ten champion profiles.
3. Normalize item data into a scoring-friendly catalog.
4. Implement candidate filtering.
5. Implement factor scoring, penalties, alternative diversity, and explanations.
6. Complete unit tests using fixtures.

### Phase 4: Live match adapter

1. Implement the scoped loopback HTTPS client.
2. Add Zod schemas for the three required endpoints.
3. Normalize responses into `GameSnapshot`.
4. Add polling, recovery, and match lifecycle handling.
5. Connect snapshots to the recommendation engine.

### Phase 5: Product polish

1. Complete compact and expanded recommendation views.
2. Add settings, onboarding, disclaimer, and data-source explanations.
3. Complete keyboard accessibility and click-through behavior.
4. Run integration and end-to-end tests.
5. Package an unsigned Windows development installer.

### Phase 6: External release preparation

1. Record a complete product walkthrough.
2. Document every endpoint and data field used.
3. Register the product through the Riot Developer Portal.
4. Request Riot review of the in-game recommendation flow.
5. Address feedback before public distribution.
6. Add code signing and an update mechanism only after approval and MVP validation.

## 23. MVP acceptance criteria

The MVP is complete when all of the following are true:

- The application installs and launches on Windows 10/11.
- The overlay can be moved, resized, hidden, restored, and made click-through.
- Mock mode demonstrates the entire recommendation loop without League running.
- A supported live match is detected through the local Live Client Data API.
- Data Dragon item data loads from the network or cache.
- The engine returns one primary recommendation and two distinct alternatives.
- Every option contains reasons and a tradeoff.
- Recommendations update after meaningful inventory, gold, time, or visible-composition changes.
- The same snapshot always returns the same recommendations.
- Unsupported champions and malformed data produce safe, understandable states.
- No game process injection, memory reading, input automation, or hidden-information analysis occurs.
- No Riot ID, summoner name, chat, or raw match response is persisted.
- Unit, integration, and mock-mode end-to-end tests pass.
- The Riot disclaimer is visible.
- Public release remains blocked until Riot registration and review are addressed.

## 24. Instructions to the implementing agent

1. Read this document before editing or generating files.
2. Do not expand the MVP scope without a demonstrated blocker.
3. Build in the listed phase order.
4. Use mock mode to complete and verify the application before relying on a live game.
5. Keep all Riot-specific input logic behind adapters.
6. Keep recommendation logic deterministic, pure, configurable, and thoroughly tested.
7. Never weaken Electron security settings for convenience.
8. Never use undocumented game access, hidden data, or automation.
9. When a Riot data field is ambiguous, omit it from scoring until its meaning and policy status are verified.
10. Finish each phase with passing tests and a short implementation note before continuing.

## 25. Guiding principle

**Help players understand their options; never make the decision for them.**
