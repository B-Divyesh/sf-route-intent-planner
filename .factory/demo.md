# Route Intent Planner demo

- Demo URL: `https://route-intent-planner.sociobot.in/demo/`
- Local URL after `npm run build && npm run preview`: `http://127.0.0.1:4173/demo/`
- Sample: a nine-point London canal loop with eight segments. The canal towpath stays locked. The river-crossing segment is an open gap for review.
- Entry: select **Try it with sample data** on the first screen, or open `/demo/` directly.
- Reset: select **Reset demo** in the persistent demo banner.
- Exit: select **Start for real**. This clears the demo draft, demo license data, and demo archive before opening the real planner.

Demo state uses only `demo:route-intent-planner:current`, `demo:sb_license:route-intent-planner*`, and the separate `demo:route-intent-planner` IndexedDB database. Demo mode never reads or writes the real draft key, real license keys, or the real `route-intent-planner` IndexedDB database.
