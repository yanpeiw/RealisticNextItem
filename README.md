# LoL Item Advisor

A Windows desktop overlay for League of Legends that reads your own client's local match data during a game and recommends what to buy next -- one primary pick, two meaningfully different alternatives, and the reasoning (and tradeoff) behind each. It's a decision-support tool, not an autopilot: it never clicks, buys, or plays anything for you.

Full product/engineering spec lives in [`LOL_ITEM_ADVISOR_BRAIN.md`](./LOL_ITEM_ADVISOR_BRAIN.md). This README covers what's actually built and how to run it.

**[Try the engine in your browser →](https://yanpeiw.github.io/RealisticNextItem/)** -- the desktop app is Windows-only and needs a real (or mock) League match, but the recommendation engine itself is plain, portable TypeScript. This page runs that exact engine against adjustable mock scenarios, entirely client-side, so you can try the decision logic without installing anything. See [`web-demo/`](./web-demo) for the source; it redeploys automatically on every push to `main` via [the workflow below](./.github/workflows/deploy-demo.yml).

## What's in this MVP

Implemented and tested:

- **Deterministic scoring engine** (`src/shared/engine`) -- pure TypeScript, no Electron/React/Node/network imports. Scores candidate items on champion fit, enemy counter value, affordability, inventory synergy, game-phase value, build-path quality, and team utility, then picks a diverse primary + two alternatives with structured reason/tradeoff codes.
- **10 supported champions**, two per role (Garen, Darius, Warwick, Amumu, Ahri, Annie, Jinx, Ashe, Leona, Lux) -- see `src/shared/config/champions/`. Unsupported champions get an explicit unsupported result, never a guessed recommendation.
- **Curated item catalog** (`src/shared/config/items.ts`) covering the stat/threat categories the 10 champions above actually care about (armor, magic resist, anti-heal, tank, damage, team utility, etc).
- **Mock mode**: 7 deterministic fixture scenarios (`src/shared/mock/scenarios.ts`) exercise the full loop -- physical vs. magic-heavy enemies, tank-heavy comps, an early-affordability spike, heavy CC, "can't afford anything," and an unsupported champion -- with no League client required.
- **Live Client Data API adapter** (`src/main/adapters/live-client-adapter.ts`): polls `/liveclientdata/{gamestats,activeplayer,playerlist}` over a TLS exception scoped to exactly `127.0.0.1:2999`, validates every response with Zod, and normalizes it into the shared `GameSnapshot` type. Wired into a lifecycle state machine (`live-client-service.ts`) that requires 2 consecutive successful polls before going "active" and 3 consecutive failures before declaring the match over.
- **Data Dragon service**: resolves the latest patch version, fetches item/champion JSON, caches it under Electron's userData directory, and falls back to the last good cache (or a bundled default) when offline.
- **Overlay window**: transparent, frameless, always-on-top, draggable from its header, resizable within bounds, remembers position/size (validated against connected displays), global shortcuts to show/hide (`Ctrl+Shift+Space`) and toggle click-through (`Ctrl+Shift+O`).
- **Electron security posture**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, a restrictive CSP, an allowlisted IPC surface validated end-to-end with Zod, no `remote` module.
- **Unit + integration tests** (Vitest) covering the engine's required behaviors: determinism, no input mutation, exclusion of invalid/owned/unavailable items, three-unique-item guarantee, physical/magic-heavy comps shifting armor/MR scores, anti-heal redundancy penalties, affordability affecting build-path score, every recommendation carrying a reason and a tradeoff, and unsupported-champion handling.

Deliberately out of scope for this pass (see `LOL_ITEM_ADVISOR_BRAIN.md` sections 5 and 22 for the intended follow-on phases):

- Full Data Dragon merge into the scoring catalog (the engine scores from the curated catalog; Data Dragon is fetched/cached for version/name/icon display but isn't yet reconciled field-by-field into scoring).
- Playwright end-to-end tests and a packaged installer build.
- Onboarding shortcut customization UI (defaults are shown and used; changing them currently requires editing Settings after first launch).

Nothing here reads game memory, injects into the League process, automates input, or uses hidden information -- see the Compliance section below.

## Requirements

- Windows 10/11
- Node.js 20+ and npm

## Setup

```bash
npm install
npm run dev
```

`npm run dev` starts `electron-vite`'s dev server and launches the overlay. On first launch you'll see the onboarding screen and disclaimer; after that, the app shows "Waiting for a League match" until either a real match starts or you click **Try demo match**.

## Mock mode

No League client needed. From the waiting screen, pick one of the seven fixture scenarios and click **Start demo** -- the full recommendation loop (primary pick, two alternatives, reasons, tradeoffs, expandable scoring breakdown) runs against that fixture, with its in-game clock advancing each second.

## Tests

```bash
npm test          # run once
npm run test:watch
npm run typecheck
npm run lint
```

## Build

```bash
npm run build        # type-checks + builds main/preload/renderer to out/
npm run package:win  # also produces a Windows NSIS installer via electron-builder (unsigned)
```

## Architecture

```
src/
  main/       Electron main process: window, IPC, live-client + Data Dragon services, adapters
  preload/    contextBridge-exposed API surface (typed, allowlisted)
  renderer/   React UI: overlay header, recommendation cards, settings, onboarding
  shared/     Pure domain models, the scoring engine, config (champions/items/scoring), Zod schemas, mock fixtures
tests/
  unit/         Engine behavior (Vitest)
  integration/  Live Client schema validation + normalization
```

The engine (`src/shared/engine`) is the one piece that matters for correctness: it takes a `GameSnapshot` + item catalog and returns a `RecommendationSet` with zero side effects, zero randomness, and zero knowledge of Electron, React, the filesystem, or the network. Everything else exists to get real (or mock) data into that shape and to render its output.

## Compliance

This project reads only Riot-supported, player-visible data:

- Riot's [Live Client Data API](https://developer.riotgames.com/docs/lol#game-client-api_live-client-data-api) (local, no auth, available only during an active match) for live gold/inventory/composition.
- Riot's [Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon) for static item/champion data.

It never injects into or hooks the League process, reads game memory, automates input, or uses information hidden from the player. Every recommendation ships with its reasoning and at least one tradeoff, and the app always presents a primary option plus two distinct alternatives -- it never tells you there is only one correct answer. Public distribution is intentionally blocked pending Riot Developer Portal registration and review (see brain doc section 6 and 22).

> LoL Item Advisor isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties, are trademarks or registered trademarks of Riot Games, Inc.
