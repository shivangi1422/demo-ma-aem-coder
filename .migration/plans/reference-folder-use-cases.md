# Delete `reference/` Before PR — Plan

## Short answer
**Yes — it's safe to delete `reference/` before raising the PR.** It's build-time scaffolding (the Figma-extraction cache: `migration-plan.json`, the 13 `extraction-block-*.json` specs, and the asset manifests). Nothing the site serves depends on it — blocks read from `blocks/`, content from `content/`, styles from `styles/`. No block JS/CSS imports these JSON files, and they aren't referenced by `fstab.yaml`, `head.html`, or any block.

## Considerations
- **It's a design reference.** These files record the original Figma design intent (exact tokens, spacing, content). Handy later if you refine a block to match the design. Deleting loses that convenience — but it can be re-extracted from Figma if ever needed.
- **PR cleanliness.** Removing it keeps the PR focused on shippable code/content, which is the tidier choice.
- **Alternative to deleting:** add `reference/` to `.hlxignore` (and/or `.gitignore`) so it's never served/committed but stays on disk locally.

## Checklist
- [ ] Confirm nothing references the folder — `grep -r "reference/" blocks/ scripts/ styles/ *.html *.json` returns no hits (safe to remove).
- [ ] Verify git status of the folder — is `reference/` currently tracked or already git-ignored? (determines whether deletion is even part of the PR diff).
- [ ] Choose disposition (see question below): delete entirely, or keep-but-ignore via `.hlxignore`/`.gitignore`.
- [ ] If deleting: remove `reference/`, then run `npm run lint` to confirm nothing breaks.
- [ ] Proceed with the normal PR steps (commit, push branch, open PR).

## Decision needed
I'd like your call on how to handle it before I touch anything.

## Execution readiness
Requires **Execute mode** to delete the folder or edit ignore files. Once you confirm the approach below (and switch to Execute mode), I'll carry it out and re-run lint.# Delete `reference/` Before PR — Plan

## Decision
**Delete the `reference/` folder entirely.** Confirmed safe: it's build-time scaffolding (Figma-extraction cache) — no block JS/CSS, `fstab.yaml`, `head.html`, or content file depends on it. The site serves from `blocks/`, `content/`, and `styles/` only.

## Checklist
- [ ] Verify nothing references the folder — `grep -r "reference/" blocks/ scripts/ styles/ *.html *.json` returns no hits.
- [ ] Delete the `reference/` folder.
- [ ] Run `npm run lint` to confirm nothing breaks.
- [ ] Proceed with normal PR steps (commit, push `figma` branch, open PR) when you're ready.

## Execution readiness
Ready to execute. **This requires Execute mode** — my delete/verify commands are currently blocked by plan mode. Switch to Execute mode and I'll run the grep safety-check, delete `reference/`, and re-run lint.
