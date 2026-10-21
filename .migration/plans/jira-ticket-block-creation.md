# Plan: Connect Jira (Method A, with Method B as Fallback) and Build Blocks from Tickets

## Goal
Connect GSPANN's Jira (`gspann.atlassian.net`) to this workspace. Then, when you paste a ticket link such as https://gspann.atlassian.net/browse/EDSMAA-4, I read the ticket and build the block it describes.

## Decision
- **Try Method A first:** Atlassian's official connector, where you sign in through your browser and no token is stored.
- **Switch to Method B if A doesn't work:** a Jira API token stored as a workspace secret, with a read-only connector.
- **Method C (public project) is dropped.**

## Current State
- **No Jira connection exists yet.** The project settings only turn on the Figma integration, and there's no `.mcp.json` file yet.
- **Never paste a Jira API token or password into chat**, and never commit one to git. If one gets pasted, treat it as compromised and rotate it.

---

## Method A: Atlassian's Official Connector (try first)

**Step A1: Atlassian admin approval** (the GSPANN Atlassian org admin)
1. Sign in to Atlassian Administration (`admin.atlassian.com`) for the GSPANN organisation.
2. Find the settings for the Atlassian remote MCP server / Rovo connector. These are usually under the Apps or AI/Rovo settings.
3. Allow it for the `gspann.atlassian.net` site.
4. Make sure your account can browse the EDSMAA project.

**Step A2: Add the connector** (I do this in Execute mode)
Create `.mcp.json` in the project root:
```json
{
  "mcpServers": {
    "atlassian": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp"
    }
  }
}
```

**Step A3: Sign in** (you)
1. Send any message so the workspace loads the new connector.
2. When the Atlassian sign-in prompt appears, sign in in the browser and approve access to `gspann.atlassian.net`.

**Step A4: Test it.** I read EDSMAA-4 (see "Testing the Connection" below).

**When to switch to Method B:**
- No sign-in prompt appears, or the sign-in fails.
- The admin can't approve the connector.
- I still can't read EDSMAA-4 after signing in.

If any of these happens, I'll remove the Method A entry so the config stays clean, and we move to Method B.

---

## Method B: API Token as a Workspace Secret (fallback)

**Step B1: Create the token** (you, outside the workspace)
1. Go to `id.atlassian.com` → Security → API tokens → Create API token.
2. Give it a clear name and a short expiry date.

**Step B2: Store it as a secret** (you or your workspace admin)
- In the workspace settings, add the environment secrets `JIRA_USERNAME` (your Atlassian email) and `JIRA_API_TOKEN`.
- Don't put them in chat or in any project file.

**Step B3: Check prerequisites** (I do this in Execute mode)
- Check that `uvx` (the Python package runner) is available. If it isn't, I'll pick an equivalent Node-based Jira connector and show you its config before adding it.
- Check that both secrets are visible to the workspace. I'll only check that they're set; I won't print their values.

**Step B4: Add the read-only connector** (I do this in Execute mode)
```json
{
  "mcpServers": {
    "jira": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://gspann.atlassian.net",
        "JIRA_USERNAME": "${JIRA_USERNAME}",
        "JIRA_API_TOKEN": "${JIRA_API_TOKEN}",
        "READ_ONLY_MODE": "true"
      }
    }
  }
}
```

**Step B5: Load and test it**
1. Send any message so the workspace loads the connector.
2. I read EDSMAA-4.

---

## Testing the Connection
1. I read https://gspann.atlassian.net/browse/EDSMAA-4.
2. I confirm what I can see:
   - Summary and description
   - Acceptance criteria
   - Attachments
   - Linked Figma or reference URLs
3. If anything is missing (attachments are the most likely), I'll tell you how to share it another way.

## Build Workflow After Connecting (EDSMAA-4 → Block)
1. **Pull out requirements:** the block's purpose, the fields authors fill in, variants, breakpoints, accessibility and acceptance criteria.
2. **Get the design:** use the Figma link in the ticket (structure, design tokens, screenshot). If there isn't one, use the reference URL or screenshots.
3. **Reuse or create:** compare against the 15 existing blocks and the block library. Then extend an existing block or create a new one.
4. **Content model:** define the Universal Editor model, definition and filter in `_{blockname}.json`, then run `npm run build:json`.
5. **Build the block:** write `blocks/{blockname}/{blockname}.js` and `.css`. The CSS is mobile-first (600/900/1200px) and every selector is scoped to the block.
6. **Check it:** create a draft test page, check the block in the preview against the design, run `npm run lint`, and check accessibility and responsive layouts.
7. **Report back:** check the result against each acceptance criterion and draft a ticket comment. Nothing gets posted to Jira without your approval.

## Optional Add-ons (only if you confirm)
Commerce (product detail and listing page blocks), Forms (Adaptive Forms conversion), Project management (handover documents) and Block development/troubleshooting tools. I won't turn any of them on unless you say so.

## Checklist
- [ ] **A1:** get the GSPANN Atlassian admin to allow the remote MCP / Rovo connector for `gspann.atlassian.net`
- [ ] Switch to Execute mode
- [ ] **A2:** create `.mcp.json` with the Atlassian connector
- [ ] **A3:** send a message to load the connector, then sign in with your Atlassian account in the browser
- [ ] **A4:** test by reading EDSMAA-4. If it works, skip to the build steps
- [ ] **If A fails:** remove the Atlassian entry from `.mcp.json`
- [ ] **B1:** create a Jira API token with a short expiry at id.atlassian.com
- [ ] **B2:** store `JIRA_USERNAME` and `JIRA_API_TOKEN` as workspace secrets (not in chat or git)
- [ ] **B3:** check that `uvx` is available and that the secrets are set, without printing their values
- [ ] **B4:** add the read-only Jira connector to `.mcp.json`
- [ ] **B5:** send a message to load the connector, then test by reading EDSMAA-4
- [ ] Pull out the block requirements and acceptance criteria from EDSMAA-4
- [ ] Get the design details from Figma or the reference
- [ ] Decide whether to reuse an existing block or create a new one
- [ ] Define the content model and run `npm run build:json`
- [ ] Build the block JS and CSS
- [ ] Create draft test content, check it in the preview and run `npm run lint`
- [ ] Check the result against the EDSMAA-4 acceptance criteria and draft a ticket update

## Open Questions
- **Admin:** who is the GSPANN Atlassian org admin for Step A1?
- **Secrets:** who can add workspace secrets for Method B, if we need it?
- **Add-ons:** do you want any of the optional add-ons switched on?

*Creating `.mcp.json` and reading the ticket both need Execute mode. Switch to it when you're ready and I'll start with Step A2.*
