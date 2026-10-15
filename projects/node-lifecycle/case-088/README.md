# case-088

Node lifecycle project. Its bounded `postinstall` hook writes only
`.build/postinstall.marker` inside this project. `index.js` evaluates the
JavaScript expression given as its first argument (default `1 + 1`) and
prints the result.

Build/lifecycle validation: `npm ci && npm run build`.
