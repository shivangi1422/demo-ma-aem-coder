#!/bin/bash
# Usage: run-import.sh <templateName>   (from the project root)
# Copies saved tooling into tools/importer, adds the shared link step, imports, then removes tools/importer.
set -e
T="$1"; TOOL="migration-work/importer-tooling/$T"; SHARED="migration-work/importer-tooling/shared"
D=/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts
rm -rf tools/importer && mkdir -p tools/importer
cp -r "$TOOL/." tools/importer/
rm -f tools/importer/import-*.js tools/importer/gen-import-*.cjs
# Section parsers come from the site's shared library (lib/<site>/parsers); a template only lists
# which ones it uses. Transformers come from the template if it has its own, else from the library.
SITE=$(jq -r '.templates[0].site // empty' tools/importer/page-templates.json)
LIB="migration-work/importer-tooling/lib/$SITE"
mkdir -p tools/importer/parsers tools/importer/transformers
if [ -n "$SITE" ] && [ -d "$LIB/parsers" ]; then cp "$LIB"/parsers/*.js tools/importer/parsers/; fi
if [ -z "$(ls -A tools/importer/transformers)" ] && [ -d "$LIB/transformers" ]; then cp "$LIB"/transformers/*.js tools/importer/transformers/; fi
cp "$SHARED/beckmancoulter-0-links.js" tools/importer/transformers/
jq -r '.templates[0].urls[]' tools/importer/page-templates.json > "tools/importer/urls-$T.txt"
node "$SHARED/gen-import.cjs" "$T"
node --check "tools/importer/import-$T.js"
"$D/aem-import-bundle.sh" --importjs "tools/importer/import-$T.js" 2>&1 | tail -1
node "$D/run-bulk-import.js" --import-script "tools/importer/import-$T.bundle.js" --urls "tools/importer/urls-$T.txt" --force 2>&1 | grep -a -E '\] (✅|❌|⚠️)|Completed|Failed' || true
rm -rf tools/importer
