# Play Ludo

## Goal
Add a polished, fully playable four-player Ludo experience to Bongo Beats Hub, with a strategically challenging AI and local Pass & Play. Keep music playback uninterrupted and accessible throughout the game.

## Build
- Add a Ludo page and an isolated game-rules engine for four colors, four tokens each, dice rolls, legal moves, captures, safe squares, home lanes, exact finishes, extra turns, and win detection.
- Provide Vs AI and Pass & Play setup; the AI scores legal moves for progress, captures, safety, escape from danger, and home positioning, with varied but consistent strategy.
- Create a responsive board with animated dice/tokens, several board themes, winner celebration, and game effects that users can mute independently of music.
- Add “Play Ludo” navigation from the menu and the persistent music player; leave the existing shared audio context untouched.

## Rules defaults
- A six is required to leave the yard and grants another roll.
- Captures send opponents home except on safe squares; landing on a safe square protects tokens.
- Tokens enter the home lane after one circuit and need an exact roll to finish.
- Three consecutive sixes forfeit the turn; finishing a token or capturing grants another roll.

## Technical details
- Keep all game state client-side; online multiplayer is not included.
- Isolate game logic from rendering so rules can be validated directly.
- Use existing React, routing, semantic theme tokens, and Button components; use CSS animations and a dedicated, independently muted Web Audio context for game effects.
- Do not alter audio playback state or the shared audio element.