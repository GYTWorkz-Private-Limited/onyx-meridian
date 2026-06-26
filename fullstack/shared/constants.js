// shared/ — PLANNED shared module (see doc/build.md §3).
//
// In the full design, MODELS / REASONING_LEVELS / ARCHETYPES and enum constants
// live here so the client, the mock, and the future Express server all agree on
// one source of truth.
//
// In this prototype those constants currently live in
// `client/src/data/store.js` (imported by both the UI and the mock backend), so
// this file is a placeholder marking where they move when the real backend lands.
//
// Intentionally not imported anywhere yet.
export {};
