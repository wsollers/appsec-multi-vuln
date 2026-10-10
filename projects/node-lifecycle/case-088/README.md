# case-088

Node lifecycle fixture. Its bounded `postinstall` hook writes only
`.build/postinstall.marker` inside this fixture. `index.js` contains an
intentional dynamic-code-evaluation pattern (CWE-95).

Build/lifecycle validation: `npm ci && npm run build`.
