# Bongo Old Skool — Project Rules

## Architecture
- Social listening sync (useListenSession): the host writes playback state (current song, queue, is_playing, position_seconds, state_updated_at) to `listen_sessions`; guests extrapolate position from `state_updated_at` and self-correct drift (>2s) every 2.5s. Guests never write playback state; reactions travel over a Supabase Realtime broadcast channel, presence over presence, chat over Postgres changes. Why: DB-row sync keeps all clients aligned without WebRTC and works across devices/browsers.
- AudioContext exposes explicit `pausePlayback`/`resumePlayback` (not just a toggle) so guest sync can force exact play/pause states. Why: toggle semantics race with synced state.
- Listen-session chat voice notes upload to the existing `community-uploads` bucket (no dedicated bucket).
- Ludo rules, local AI, and pass-and-play state stay in a standalone client-side game module; a separate game-sound context keeps effects independent of the persistent music player and leaves online multiplayer for a future update.

## General
- Admin UI must not use framer-motion (crash prevention).
