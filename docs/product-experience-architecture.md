# BaziGB Product Experience Architecture

**Status:** Alpha implementation contract  
**Decision owner:** Human Direction  
**Last reviewed:** 2026-09-01

This document is the canonical information architecture, journey and interaction contract for BaziGB. Visual tokens and component anatomy remain in `DESIGN_SYSTEM.md`; active work state remains in `ai/work-registry-v1.json`.

## 1. Product promise

BaziGB sells the experience of playing together. The experience must feel alive, legible and continuous: people know who is present, whose turn it is, why play is paused, what an action changed and what useful action comes next.

Alpha optimizes for the shortest trustworthy path from discovery to a completed game. A separate acquisition landing page remains a measured post-Alpha experiment; Lobby is the current public entry.

## 2. Information architecture

```text
Public discovery
├── Lobby / Home
│   ├── Game Hub: Tic-tac-toe
│   ├── Game Hub: Backgammon
│   ├── Game Hub: Chess
│   ├── Game Hub: Vegas
│   ├── Per-game Leaderboards
│   └── Trust links (responsive footer)
│       ├── Rules
│       ├── Privacy
│       └── Contact
├── Login (OTP)
└── Profile (authenticated)

Task state (not indexed)
├── Local/bot game
├── Invite room / online game
│   ├── Waiting
│   ├── Playing
│   ├── Reconnecting
│   ├── Spectating
│   └── Finished
└── Recovery states
    ├── Invalid or expired invite
    ├── Offline / reconnecting
    ├── Session expired
    ├── Not found
    └── Unexpected error
```

Tournament and Admin are outside the public Alpha navigation boundary.

## 3. Sitemap and indexability

| Surface | Canonical locale routes | Index | Shell |
|---|---|---:|---|
| Lobby | `/fa/lobby`, `/en/lobby` | Yes | public header + responsive footer |
| Game Hub | `/fa/games/{game}`, `/en/games/{game}` | Yes | public header |
| Leaderboard | `/fa/leaderboard`, `/en/leaderboard` | Yes | public header |
| Rules / Privacy / Contact | localized routes | After approved content exists | public header + responsive footer |
| Login / Profile | localized routes | No | internal header |
| Local game | `/[locale]/game/{game}` | No | focused game header |
| Online room | `/[locale]/play/{room}` | No | focused game header + safe exit |
| Admin / Tournament Alpha surfaces | internal or hidden | No | private/disabled |

Ephemeral room codes, account pages and game sessions never enter the sitemap.

## 4. Primary user journeys

### A. Invite a friend

`Search/direct → Lobby → Game Hub → sound choice → create room → identify creator → share code → friend joins → start → play → result → rematch / same game / Lobby`

Success means both people understand who created the room, who joined, whose turn it is and what happens if either connection fails.

### B. Join with a code

`Invite link/code → Game Hub or room → sound choice → join as player or spectator → presence visible → play/watch → result → useful continuation`

Invalid, expired or closed codes explain the cause and return to the matching Game Hub.

### C. Recover from connection trouble

`Connected → transient disconnect → self sees reconnecting → others see affected player reconnecting → seat held for grace period → reconnect and continue OR timeout and explicit result → continuation CTA`

The board must never appear silently frozen. Text and icon are authoritative; sound is supplementary.

### D. Leave an active shared game

`Back / centered brand / route request → consequence dialog → stay OR confirm exit → server closes or resolves session → remaining people receive reason → result / Lobby / same-game CTA`

Spectators and already-finished sessions may leave without the consequential confirmation.

### E. Review competition

`Lobby or Header → Leaderboard → choose game → see top players and own row → return to Game Hub → play`

There is no cross-game “overall” rank in Alpha.

### F. Manage account

`OTP login → Profile → masked phone and username → edit username / review mobile history / delete account → confirmation → identifiers removed and logout`

Password and avatar upload are not Alpha concepts.

## 5. Multiplayer state and continuation contract

| State | Required message | Optional sound | Primary CTA | Participant effect |
|---|---|---|---|---|
| Waiting | creator, players, room code, who starts | join/start | share / start | roster updates |
| Own turn | self + turn emphasis | own-turn cue | legal board action | everyone sees turn owner |
| Other turn | opponent + subtle timer | none | wait/chat/reaction | no false disabled error |
| Reconnecting | affected name + grace status | reconnect on success | wait / safe exit | everyone sees same status |
| Explicit exit | consequence before action | none | stay / exit | remaining users get reason |
| Timeout | who failed to return + outcome | result | Lobby / same game | terminal state broadcast |
| Natural finish | result and score | win/loss | request/accept rematch / Lobby | same result for all roles |
| Spectating | spectator role and live state | optional result | Lobby / invite | no state mutation rights |

## 6. Presence and community model

Alpha exposes minimum room identity only:

- creator;
- seated players;
- spectators;
- self;
- current turn;
- chat author;
- reaction author when reactions are introduced;
- connected or reconnecting status.

Presence is live and ephemeral. It is not stored as history. Uploaded images and a designed avatar library are post-Alpha because storage, moderation, deletion and reporting must be decided together.

## 7. Sound model

Current shipped assets cover move, capture and dice. Alpha adds synthesized pilot cues for start, own turn, warning, reconnect, win and loss so the interaction vocabulary can be tested before purchasing or producing final assets.

Sound rules:

1. Ask once before game entry; allow sound or silent play.
2. Persist the choice locally.
3. Keep mute in the focused game header only.
4. Never make sound the sole carrier of state.
5. Human listening acceptance covers loudness, fatigue, cultural fit and two-device overlap.

### Shared-session authority

- Chat, reactions and continuation actions are accepted only from sockets that currently belong to the room.
- Only seated players may start a next round or request a rematch; spectators are read-only.
- A finished shared game never restarts from one player's click. One player requests the rematch, the other accepts it, and the server starts the new game only after both active seats consent.
- The waiting player sees an explicit pending state and can still return to the Game Hub or Lobby.

## 8. Leaderboard and future recap data

Alpha displays one selected game at a time. Ordering is deterministic: wins, win rate, games played, account age, username. Rankings are derived from authoritative completed-match history and exclude deactivated or anonymous identities.

Completed-match data uses a versioned envelope containing final state and a minimal authoritative summary. The `metrics` extension point may later receive game-reviewed facts such as legal-move accuracy, comeback, risk, dice distribution or speed. It must not become an unbounded clickstream.

Future outputs may include yearly recaps, player archetypes and skill/luck highlights only when:

- the metric has a game-specific definition;
- it can be derived server-side from authoritative facts;
- privacy copy discloses its retention and purpose;
- users are not assigned sensitive or manipulative labels;
- Alpha display remains unchanged until separately approved.

## 9. Responsive shell decisions

- Mobile is the primary product context.
- A restrained footer appears below primary content on Lobby/trust pages at every viewport so legal and support destinations remain reachable.
- Bottom mobile space remains available for game actions; exploration stays in the upper navigation.
- Profile stays on one physical side across mobile and desktop.
- Focused game pages remove Leaderboard/Profile discovery controls.
- The centered brand is the only Home/Lobby affordance.

## 10. Search discovery contract

- Public pages have unique Persian-first title and description, canonical URL and reciprocal `fa`/`en`/`x-default` alternates.
- Sitemap contains only Lobby, available Game Hubs, Leaderboard and later approved trust pages.
- Robots and route metadata exclude rooms, profiles, login, local sessions, Admin and hidden Tournament surfaces.
- Useful short game summaries and semantic headings are preferred to blogs or keyword-heavy long text.
- Organization/WebSite identity, share previews, internal links and mobile performance support search appearance.
- Google Search Console, Bing Webmaster Tools and any verified Iranian submission/contact path require a separate external-account action. No Iranian webmaster console is assumed without evidence.

## 11. Alpha pilot and human acceptance

Tic-tac-toe is the reference pilot. Before cross-game rollout, test in Persian and English on mobile and desktop with two player sessions plus one spectator:

1. sound and silent entry choices;
2. creator/player/spectator identity;
3. turn and chat attribution;
4. temporary disconnect and reconnect within the grace period;
5. disconnect timeout;
6. Back and centered-brand exit confirmation;
7. creator and non-creator explicit exit messages;
8. natural win, draw, mutual rematch request/accept, same-game and Lobby actions;
9. invalid room recovery;
10. keyboard/focus and 360px overflow.

One meaningful approval boundary remains: accept or reject this full Tic-tac-toe experience pilot before applying the shared pattern to the other games and before any commit, push or deployment.
