# Team workflow pilot — mybeckman.in

Goal: prove that a teammate can migrate pages with only `MIGRATION-BRIEF.md` + this branch, that reuse and
batching make pages fast, and that two people's work merges cleanly.

## Branches

| Branch | Tester | Pages | Tests |
|---|---|---|---|
| `mb/plans-flow-liquid-particle` | Tester 1 | flow-cytometry, then liquid-handling + particle-analysis | A then C |
| `mb/service-tech-support` | Tester 2 | tech-support | B |

Both start from `mybeckman-design-match` (the integration branch). `main` only receives PRs from the integration branch.

## Pages

| Test | Live page | Our page | What it proves | Target time |
|---|---|---|---|---|
| A — same template | https://www.mybeckman.in/service/plans/flow-cytometry | `/en-in/service/plans/flow-cytometry` | reuse of the Centrifuge blocks (hero-dim-buttons, table-plan-compare, Columns (cta), Get in Touch) | 20–30 min |
| B — new components | https://www.mybeckman.in/service/tech-support | `/en-in/service/tech-support` | new blocks built with the authoring rules from the start | ~45 min |
| C — batch | https://www.mybeckman.in/service/plans/liquid-handling and https://www.mybeckman.in/service/plans/particle-analysis | `/en-in/service/plans/liquid-handling`, `/en-in/service/plans/particle-analysis` | two pages of one template in one chat | < 15 min per page |

Check each live page in a normal browser first (it exists, roughly what you expect).

## Before you start (each tester)

- [ ] Use a FRESH workspace (not the one that built the first four pages — it has saved notes the brief must replace).
- [ ] Workspace on your branch from the table above.
- [ ] Settings → LLM Permissions: git permission enabled (needed for the PRs at the end).
- [ ] New chat: run the setup commands from section 3 of `MIGRATION-BRIEF.md` (tooling, snapshots, verify scripts).

## Run (each test)

- [ ] Attach `MIGRATION-BRIEF.md` and write: `Migrate <url> following the attached brief.` (Test C: both URLs in one message.)
- [ ] Note the start time.
- [ ] Log every question the agent asks you and every time you had to step in.
- [ ] Note the end time when the summary arrives.
- [ ] Review the page in the preview at desktop and mobile width.
- [ ] Ask: "Share this page's tooling to migration-tooling as a PR and commit the code to my branch."
- [ ] Sync the page content (you own your pages; only one person syncs nav/footer) and check it in the authoring
      environment with `?ref=<your branch>`; log anything that differs from the preview.

## Merge (after both testers finish)

- [ ] PR `mb/plans-flow-liquid-particle` → `mybeckman-design-match`, merge.
- [ ] PR `mb/service-tech-support` → `mybeckman-design-match`; expect conflicts in:
      `scripts/scripts.js` (PATH_THEMES), `models/_section.json` (block list / section styles),
      `component-*.json` (generated), `styles/brand.css`, block CSS of shared blocks.
- [ ] Resolve: merge source files by hand; never hand-merge `component-*.json` — run `npm run build:json`;
      `npm run lint`.
- [ ] Regression: `node migration-work/verify/style-dump.mjs dump/diff` for every migrated page (0 differences
      except the pages just added).
- [ ] Tooling PRs into `migration-tooling`: merge; add the new pages to the `pathMap` of every mybeckman template
      and re-import the pages that link to them (ask before re-importing home).
- [ ] Sync and check the merged result in authoring with `?ref=mybeckman-design-match`.

## Scorecard

| | Test A | Test B | Test C (per page) |
|---|---|---|---|
| Time per page | | | |
| New blocks / variants created | | | |
| Questions asked by the agent | | | |
| Manual interventions | | | |
| Fixes needed after syncing to authoring | | | |
| Pixel match 1440 / 390 | | | |
| Regression diffs on existing pages | | | |
| Merge conflicts + time to resolve | | | |

## What to do with the results

- Questions asked → add the missing decision to `MIGRATION-BRIEF.md`.
- Fixes after syncing to authoring → add the rule to section 6 of the brief.
- Slow merges → give the conflicting shared file an owner or split it.
- Times above target → check whether blocks were rebuilt that could have been reused, and do an up-front
  component inventory of all remaining mybeckman.in pages before the next round.
