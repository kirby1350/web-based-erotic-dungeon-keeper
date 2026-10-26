# CLAUDE.md

This repository is **地下城城主**. The player manages the dungeon: random adventurers intrude, and the player builds traps and monsters to toy with and defeat them. The code was copied from the adventurer simulator and still runs that loop. Do not treat a keeper-mode change as a change to the original simulator repository.

Guidance below covers both the copied engine and the keeper layer built on top of it. Open design work and advice live in `TODO.md`. The project is an adult, AI-driven text game: a single-player browser RPG where an LLM streams the story, action options, and scene art prompts.

## Stack & running

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** · **Tailwind v4** · Radix UI · `pnpm`.
- **Requires Node ≥ 20.9** (Next 16). The dev box here has Node 18, so the app is run in Docker:
  ```bash
  docker run --rm --name dungeon-dev --network host -w /app -v "$PWD":/app \
    node:20-bookworm-slim sh -c "corepack enable && corepack prepare pnpm@9 --activate && \
    pnpm install && pnpm exec next dev -H 0.0.0.0 -p 3000"
  ```
  - Use `--network host`: the Docker **bridge network can't reach `fonts.gstatic.com`**, so `next/font/google` 500s the page once the `.next` font cache is cleared. Host network works.
  - `pnpm install` must run **inside** the container — the host install misses the glibc `@tailwindcss/oxide` native binary.
  - `next dev` hot-reloads client, `lib/*`, and route handlers — **most changes need no restart**. Only `.env`, `next.config.mjs`, or new deps require a restart. Don't `rm -rf .next` (loses font cache → font 500s).
- Verify without a full build (Node 18 can't `next build`): `pnpm typecheck` (`tsc --noEmit`). ESLint isn't installed despite the `lint` script.
- Tests: `pnpm test:adventure` runs the `scripts/check-*.cjs` unit checks (protocol, turns, stream, keeper, terms, portraits, dungeon, body development, prose guard, party). `pnpm test:e2e` runs Playwright specs in `tests/`. `pnpm eval:prompts` scores fixtures in `scripts/fixtures`. Add a check script when you add pure logic to `lib/`.

## Architecture

- `app/page.tsx` — top level keeper loop: `KeepHall` → `IntruderGate` → `GameScreen`, plus workshop / collection / archive / dungeon editor screens. Keep save and live intruder live in localStorage.
- `app/api/chat/route.ts` — edge proxy to the chat LLM. Picks provider from the model id: **Grok** (xAI) if the model is in `CHAT_MODELS` with `provider:'grok'`, else the **DZMM/gpt4novel** `ext/v1` endpoint. Streams SSE straight through. `CHAT_MAX_TOKENS` is 4096. API keys come from the request body (client) or env fallback.
- `app/api/models/route.ts` — proxies DZMM `ext/v2/models` so the settings panel shows the **live** chat-model list.
- `app/api/image/*` — PixAI (`/generate` + `/task/[taskId]`) and TensorArt (`/tensorart` + `/tensorart/[jobId]`) generate-then-poll flows.
- `hooks/use-adventure-session.ts` — the turn runner: builds request messages, streams the reply, runs the prose guard (at most one regenerate), repairs bad STATS, commits via `completeTurn`, and triggers memory summarisation. `hooks/use-aftermath.ts` drives the fate/aftermath popups.
- `components/` — `game-screen` (layout), `chat-panel` (scene UI over the session hook), `explore-controls`, `fate-actions`, `aftermath-popup`, `party-bar`, `status-panel`, `state-portrait`, `image-panel`, `settings-panel`, `keep-hall`, `intruder-gate`, `intruder-dossier`, `keeper-collection`, `keeper-archive`, `dungeon-page` (floor editor), `campaign-card`, `cheat-panel`, `trap-generator` (workshop), `status-picker`, `reply-markdown`.

### `lib/` map

| Area | Files |
|---|---|
| Shared types + data constants (`CHAT_MODELS`, image presets/models, `CHARACTER_PRESETS`, `PRESET_TRAPS`, `PRESET_STATUS_EFFECTS`, `EXPLORE_ENCOUNTER_CHANCE`) | `types.ts`, `canon-intruders.ts` (canon-character intruders) |
| Prompt text | `prompts.ts` (system DM prompt, opening/watch/aftermath/interrogation/workshop/monster prompts, image prompt builder), `adventure-context.ts` (reply protocol, narrative-progress rules, state snapshot, program-result block), `adventure-memory.ts` (memory summary prompt + schema), `terms*.ts` (self-address / address-to-keeper / organ wording by corruption tier), `prose-bank.ts` (dense-style lexicon sampling) |
| Turn pipeline | `turn-engine.ts` (`PendingTurn`, `completeTurn`, `PROMPT_VERSION`), `chat-protocol.ts` (marker parsing, `inspectReply`, STATS salvage/repair, plan-leak stripping), `prose-guard.ts` (code-side length/dialogue/negation/OPTIONS check), `body-development.ts` (program-owned dev exp), `sse.ts` |
| Keeper game | `keeper.ts` (save shape, floors, traps/monsters, essence economy, upgrades, fates, cages, collection returns), `trap-craft.ts` (trap categories, phases, hit preview, levels), `synergy.ts` (same-floor combos), `intruder-roll.ts`, `party.ts` (two-intruder runs), `campaign.ts` (infamy, threat tiers, hero raid, endings), `status-view.ts` (read-only scene sidebar), `portraits.ts`, `cheat.ts` |
| Platform / storage | `storage.ts`, `dzmm.ts` (DZMM platform SDK adapter) |

Prompt text lives in `lib/prompts.ts` and the other prompt modules above — edit it there, never inline in components.

- `lib/storage.ts` — localStorage I/O + export/import. Keys: `dungeon_settings`, `dungeon_game_v2` (character + session written in **one** `setItem`, the commit point), `dungeon_keep` (keeper save), plus legacy `dungeon_character` / `dungeon_session` read for migration. `app/page.tsx` also keeps `dungeon_conversation_id`. Debug flags: `dk_guard_off=1` skips the prose guard, `dk_party_chance` overrides party odds. `getSettings()` sanitizes stale enum values against the current constants.
- `lib/sse.ts` — `streamChatDeltas(response, onDelta)`: the single SSE parser. Buffers across network chunks (a `data:` line can split mid-flight). Use it everywhere; never hand-roll `reader.read()` + `split('\n')`.

## Program vs. model ownership

The program settles mechanics; the model narrates them. Keep it that way.

- Button actions (explore / escape / advance / dispel) are resolved in code (`resolveTurnCharacter`) **before** the prompt is built and sent as a `【程序判定】` block. `enforceTurnResult` overrides any model attempt to change floor, a settled encounter, exploration progress, or a settled status.
- `bodyDevelopment` / `exp` are settled by `body-development.ts` from which parts the prose actually touched; the model is told to copy them. `maxHp` and `explorationProgress` are snapshot-only and must not appear in STATS.
- Essence, infamy, upgrades, fates and endings are pure code (`keeper.ts`, `campaign.ts`). The model must never decide 留下 / 玩坏 / 放走.

## The DM marker protocol (critical, fragile)

Every DM reply ends with structured markers after the prose, parsed in `lib/chat-protocol.ts` (`inspectReply`):

- `[OPTIONS]` … (`[/OPTIONS]`) — exactly 4 action choices → the button grid.
- `[SCENE: danbooru tags]` — image prompt → `onRequestImage`.
- `[STATS:{...}]` — core numeric state (hp/pleasure/desire/floor/encounter/measurements/bodyDevelopment/statusEffects).
- `[DESC:{...}]` — longer per-body-part descriptions (breast/clitoris/urethra/vagina/anus; separate so a truncated DESC can't break STATS).
- `[PARTNER:{...}]` — second intruder's hp/pleasure/desire in party runs (`lib/party.ts`).

**The model violates this format constantly. Parsing must stay defensive — these are real bugs we hit, keep them handled:**

1. **Full-width punctuation.** Models emit JSON with `：，｛｝` instead of `:,{}`, and `[STATS：`/`[SCENE：`. `extractMarkerJson` runs `normalizeJsonPunctuation`, which converts full-width → ASCII **only outside string values** (so commas inside Chinese narrative text are preserved). Marker regexes accept `[:：]`.
2. **Truncation.** A long scene + big STATS/DESC tail overflows `max_tokens` and cuts the JSON mid-object. `extractMarkerJson` accepts **complete JSON only** (it never invents braces or values). When STATS/DESC fail validation, the hook sends a STATS-only repair request (`buildStateRepairPrompt` + snapshot + program result); if that output is still invalid, `salvageStateMetadata` assembles one schema-valid block from the last complete objects. `CHAT_MAX_TOKENS` is 4096.
3. **Missing `[/OPTIONS]` and bullet styles.** `parseOptions` reads up to the close tag **or the next marker or end**, and accepts `1.` / `-` / `•`.
4. **Display hiding.** `cleanContent` shows only the text **before the first marker** — robust to missing close tags and full/half-width colons at once.
5. On unparseable STATS, log with `console.warn` (not `console.error` — that triggers the Next dev error overlay) and show the soft inline `statsError` banner.
6. **Leaked writing plans.** Some models prepend a writing plan. `stripPlanLeak` removes it; the prose guard rejects replies with ≥4 Latin words.

When changing the protocol, update **both** the prompt side (`REPLY_PROTOCOL_PROMPT` in `lib/adventure-context.ts`, `buildSystemPrompt` in `lib/prompts.ts`) and `lib/chat-protocol.ts` (what's tolerated), and test against real model output, including full-width-punctuation samples.

## Prose guard

`lib/prose-guard.ts` checks every reply in code: length tier (dense style, by step), dialogue lines (4–7 on full dense turns), 「不是X是Y」 count ≤ 1, leaked Latin, banned words, `[OPTIONS]` present. Only **clear** misses (well outside tolerance) trigger one automatic regenerate with `retryNote`; `pickBetter` keeps the better of the two. Strict misses are recorded on the message/turn for statistics. Prefer adding a code check here over adding another ban line to the prompt.

## Other conventions

- **Persistence:** a turn is a transaction. `session.pendingTurn` checkpoints the draft (so a reload can resume or discard it); `completeTurn` commits messages + character + a `TurnRecord` (last 20 kept, tagged with `PROMPT_VERSION`) in one write. Bump `PROMPT_VERSION` when prompt behaviour changes meaningfully.
- **Memory:** once there are ≥10 assistant messages, everything except the last 4 is summarised with `MEMORY_SUMMARY_PROMPT` into `summary` + categorized memory entries (`task/relationship/promise/clue/situation`) and dropped. Failure or 60 s timeout keeps the raw messages. `situation` holds the non-explicit current state (place, clothing, restraints, encounter).
- **Image prompts:** built by `buildImagePrompt` in `lib/prompts.ts`: quality prefix (per model family: illustrious / sdxl / flux), appearance anchor from `character.danbooruTags` (+ `adult`, name tag), Illustrious body tags, then scene tags, then extras. Lactation tags are gated by `characterLactates`. The model's `[SCENE]` must not repeat appearance tags.
- Adding an image style / tag preset / model: add to the constant in `lib/types.ts`; `storage.ts` sanitization picks it up via `Object.keys`. Add a default to `getDefaultSettings()` and a sanitization line for any **new `AppSettings` field**.
- **Secrets:** `.env` is gitignored (`.env*`, keep `.env.example`). Never stage `.env`. Keys: `CHAT_API_KEY`, `GROK_API_KEY`, `PIXAI_API_KEY`, `TENSORART_API_KEY`.
- **Security:** the `/api/*` routes have no auth/rate limiting — this is a single-user self-host app. Don't expose it publicly without adding access control.
- Content is adult fiction by design. Match the existing tone/structure when editing presets or prompts.
