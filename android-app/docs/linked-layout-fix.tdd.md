# Linked layout correction · 28 November 2026

## ECC Planner checkpoint

- Problem: the installed APK showed an invisible Start Here action, plain workshop links, and collapsed bottom tabs. The user asked to correct layouts across all screens before resuming Phase 3.
- Scope: 59 `Link asChild` controls across 16 route files and shared WorkshopNavigation. Preserve their approved styles, routing, state, accessibility and press feedback. Keep the new storage foundation unmounted.
- Cause: Expo Router 58.0.32 uses a Slot shim around the installed Radix Slot. Radix merges `style` with object spread; spreading a Pressable style callback yields `{}`. Thus linked controls lose their backgrounds, padding, row/flex geometry and minimum heights while standalone Views remain styled. Expo's development shim also rejects child style arrays.
- Implementation order: reproduce with the actual installed Radix Slot -> add a React-only style boundary -> delegate routing to the unchanged Expo Link -> route all current callers through the boundary -> regression/typecheck/Android export -> updated preview APK.
- Risk: medium. No library patch or new dependency. The boundary renders the original Pressable without an extra native layout View. Props, refs, child/link event composition and `preventDefault` behavior are preserved.

## Change

`src/navigation/link-style.ts` keeps the original child element/style nested while the Slot composes navigation props, then resolves both slot/child styles inside the original Pressable's style callback. `src/components/Link.tsx` uses that boundary for `asChild`, and delegates ordinary text/source links directly to Expo Router. Every current screen and the shared navigation uses this wrapper. Bottom tab items also have a zero minimum width and bounded wrapping labels.

This restores the already approved button/card/control layout rules. It does not constitute a new design approval or a claim of pixel-identical rendering on every Android device.

## Evidence

- RED `2ba0810`: `node --test tests/link-layout.test.mjs` executed against the installed Slot: 2 passed / 3 failed. The rendered primary button had no background or geometry; the tab had no flex width; the pressed-style callback had become a plain object.
- GREEN `4db1c9c`: the same 5 tests pass with the boundary. They cover primary background/row/padding/minimum height, tab flex/centering, static arrays, pressed opacity, merged navigation/child handlers, disabled state, accessibility and refs.
- `npm test`: all 136 tests passed (including the 10 new Phase 3 storage tests, whose code remains unmounted).
- `npm run typecheck`: passed.
- `npm run check:bundle`: Android export passed (1,265 modules).
- `git diff --check`: passed.
- Node/V8 coverage for `src/navigation/link-style.ts`: 100% lines/functions and 85.71% branches. The React/DOM stand-in tests exercise the real installed Slot but are not native layout/TalkBack tests.

## Native verification still needed

Install the corrected APK over the same-account preview without clearing data. Check Home's Start Here/Continue action, workshop cards and all four tabs; Mission Map cards; Start Here; lesson/practice/quiz/results actions; Review/study; project/editor/plan/build/milestones/readiness; Help and Backup. Check ordinary and large system text, portrait/landscape, long titles and TalkBack. Confirm pressing routes correctly and existing saved progress survives.

Phase 3 remains at its tested storage-core checkpoint. Its provider/screen integration and real-device backup gate are unfinished; this layout correction does not enable a storage migration or Supabase sync.
