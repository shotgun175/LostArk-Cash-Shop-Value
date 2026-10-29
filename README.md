# Lost Ark Cash Shop Value

A "what is this pack actually worth?" tool for Lost Ark (NA/EU). It shows live auction-house
prices for the materials sold in cash-shop packs and computes each pack's gold value, gold per
Royal Crystal, and how that compares to the in-game F4 currency exchange and to buying gold for
real money.

Beyond the Packs tab it values Mari's Shop, the Ark Pass and Jump-Up Boost tracks, and hell and
netherworld keys (Hell Key math), and lists the tracked prices. A Bonus Room tab appears only
while an in-game Bonus Room is running: it values each product and each group's full purchase
(the products plus the group's free bonus pack) against the F4 exchange and against G2G real
money, and hides itself again when the room ends. The untradable Life Energy Potion gets a
default value from logging at live timber prices (Lv. 70 Logging, Relic charm, no tool bonuses),
shown next to what a best-in-slot logging tool would earn, and you can override it per region.

**Your values.** Every tab shows a slim "Your values" bar with the numbers you
set yourself that the tab actually uses: your F4 exchange rate (gold for 238 Royal Crystals),
the real-money price of gold (G2G, shown as its icon), your Lv. 8 gem price (every other gem
level follows it, 3 gems per level), the Life Energy Potion value, and whether pheons are
included in key values. A tab that uses none of them (Prices) shows no bar. On a computer the bar
sits under the header and stays pinned to the top of the window as you scroll, so you can change
a value right beside the pack it moves; on a phone it is a strip along the bottom of the screen
with one tile per value. Click a value to change just that one (on a phone it opens from the
bottom of the screen); Done, Escape or a click elsewhere closes it. Each value is saved in your browser per region (the pheons setting for both
regions) and applies on every tab at once; "reset all" for your own market prices on Packs leaves
them alone. Clear a box to go back to its default: 35,000 for the
exchange, the live G2G rate, a typical Lv. 8 gem price for your region, or the logging estimate
for the potion.

**Your own prices.** On Packs, a pack's page, the Bonus Room and Jump-Up, click an item's price
to enter your own; empty the box to go back to the market or default price (Escape cancels). Each
price is saved in your browser per region and used on every tab that values that item. "reset
all" on Packs clears every one of them, and Jump-Up's own reset clears just its rewards. Prices the
app works out itself (hell keys, ebony cubes, Blue Crystal, gold) can't be edited.

Live site: https://shotgun175.github.io/LostArk-Cash-Shop-Value/

## How it works

The project is two loosely-coupled halves that deploy separately:

- **Backend, the data API** (`src/`): a Cloudflare Worker. A 60-second cron pulls tracked item
  prices from a community market feed, sanitizes them (the feed is treated as untrusted), and
  stores a small JSON payload in Workers KV. `GET /v1/prices` serves that payload from the edge
  cache; `GET /healthz` reports data freshness per region and returns HTTP 503 (`ok: false`) once
  the oldest region's prices are more than 90 minutes old. Nothing unauthenticated can trigger an
  upstream fetch.
- **Frontend, the UI** (`web/`): a SvelteKit static SPA (Svelte 5). It fetches the price payload
  and does all pack-value math client-side, so the UI never needs to redeploy when prices move.

## The two deploy targets

| Target | What it is | How it ships |
|---|---|---|
| GitHub Pages | The public production UI | Automatically on push to `main` (`.github/workflows/pages.yml`); both test suites gate the deploy, and also run as checks on pull requests to `main` |
| Cloudflare Worker | The data API, plus a live dev copy of the UI at the Worker root | Manually, `npm run deploy` from the repo root, and only when the Worker code (`src/`, `wrangler.jsonc`, root dependencies) changes; the dev copy of the UI can lag behind Pages in between |

The Pages build is served under the repo subpath and fetches prices cross-origin from the Worker
(`VITE_API_BASE`); the Worker-hosted copy serves the same UI same-origin. When a change alters the
wire format, deploy the Worker first, then let Pages ship.

## Working on it

Two separate npm projects with two separate Vitest suites. A fresh clone needs an install in both.

Backend (repo root):

```sh
npm install        # also generates worker-configuration.d.ts (wrangler types)
npm test           # worker suite (Vitest + @cloudflare/vitest-plugin)
npm run typecheck  # tsc over src/ + test/
npm run build:web  # build the UI once; wrangler dev serves it from web/build
npm run dev        # wrangler dev: local worker + the built UI at the root
npm run deploy     # build web/, run the worker suite and type-check, then deploy the worker
```

`npm run deploy` targets the maintainer's Cloudflare account (the bound KV namespace and cron),
so it needs Cloudflare credentials (`wrangler login`); tests and local dev do not.

Frontend (`web/`):

```sh
cd web
npm install
npm test           # UI suite, incl. golden-parity tests for the pack-value engine
npm run check      # svelte-check
npm run dev        # vite dev server
npm run build      # static build into web/build
```

Run both suites when a change touches the wire format (`src/normalize.ts` types, which
`web/src/lib/api.ts` imports directly).

## Conventions worth knowing

- `docs/` is deliberately gitignored: it holds local planning and maintenance notes. Code comments
  that cite `docs/*.md` refer to those local files, so they will not resolve in a fresh clone.
- `worker-configuration.d.ts` is generated by `wrangler types` on install; don't edit or track it.
- Dependency updates come from Dependabot (`.github/dependabot.yml`): each month, one grouped
  minor+patch PR for the root and one for `web/`, with majors as separate PRs and security fixes
  grouped per directory. Each PR runs the CI test job and is merged by hand. The coupled
  Svelte/Vite/SvelteKit majors, TypeScript majors and `web/` `@types/node` majors are ignored there
  and moved by hand. A Vitest major lands in the root and `web/` together (both suites stay on
  one major), so take the two Dependabot PRs as one change or neither. A merged root dependency
  update is a Worker deploy trigger: run `npm ci` in the root first (it regenerates the Worker
  types), then `npm run deploy`.
- The pack dataset (`web/src/lib/packs/data/`) is hand-transcribed and locked by golden tests
  (originally anchored to TheJungleWalrus's compiled cash-shop app, the reference this tool set
  out to match; hell-key values are now this project's own baseline). Key values count every
  chest a floor can offer in the best-of-3 pick, even one worth no gold, and untradable ability
  stones count as 0 unless the opt-in Pheons setting in "Your values" (off by default) values
  them at 9 pheons each. The hell-key reward tables
  are the one generated part: `scripts/gen-hell-rewards.mjs` regenerates them from a community
  datamine whose source file lives in the gitignored `docs/`, so regeneration is a
  maintainer-machine operation and the generated tables are committed.

## Licensing and attribution

- **Code**: MIT, see [LICENSE](LICENSE).
- **Game assets**: item icons are Lost Ark game assets (Smilegate / Amazon Games) covered by
  [ATTRIBUTION.txt](ATTRIBUTION.txt), not by the MIT license. The pack screenshots in
  `web/static/packs/` are in-game purchase-window captures, used under the same community
  fan-tool convention.
- **Fonts**: Cinzel, Sora and JetBrains Mono are self-hosted under the SIL Open Font License,
  see `web/static/fonts/`.
- Pack contents and valuation rules were transcribed from TheJungleWalrus's cash-shop-value app;
  the hell-key reward tables come from sekwahar's Lost Ark datamining project; the special-honing
  cost model is ported from Maxroll's Special Hones calculator (by way of TheJungleWalrus's
  hell-rewards-picker); market prices come from a community market-data feed; the real-money
  reference rate is read from a public marketplace listing.
