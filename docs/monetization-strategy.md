# BaziGB — Monetization Strategy & Principles

> سند استراتژیک (Foundation) — نه برنامهٔ پیاده‌سازی. تبدیل به تسک‌ها بعداً انجام می‌شود.
> منبع: سند کاربر (Desktop/BaziGB — Monetization Strategy & Principles.md) — ثبت‌شده در ریپو در 2026-08-20.

## Purpose

Create and maintain a strategic monetization document for BaziGB, a multi-game online board-game platform inspired by platforms such as Board Game Arena.

This document should define the initial monetization philosophy, revenue streams, product principles, and future monetization roadmap.

Do not turn this into a detailed implementation plan yet. The goal is to preserve the strategic decisions so they can be developed later.

---

## 1. Core Monetization Philosophy

BaziGB should follow a **Free-to-Play / Freemium** model.

The core games and competitive experience should remain accessible to free users.

The platform should **not become Pay-to-Win**.

Users should never need to pay in order to:

- increase their probability of winning
- gain gameplay advantages
- receive better matchmaking
- obtain stronger game mechanics
- gain additional competitive power
- manipulate or improve randomness
- gain advantages over other players

The primary value of monetization should come from:

- customization
- identity
- social features
- convenience
- advanced statistics
- premium experiences
- community features
- removal of advertising

The central principle is:

> Users pay to improve their experience, identity, and access — not to improve their ability to win.

---

## 2. Initial Monetization Model

The initial model should have four main pillars:

1. Free access
2. Cosmetics
3. Premium membership
4. Advertising

A fifth pillar, tournaments, should initially focus on engagement and retention rather than real-money competition.

---

## 3. Free Tier

The free tier should feel like a complete product rather than a restricted demo.

Free users should be able to:

- play the core games
- play against other users
- use matchmaking
- play with friends
- create or join basic rooms
- participate in free tournaments
- have a profile
- access standard rankings
- earn basic rewards

The free experience should be sufficient to create strong organic growth and network effects.

---

## 4. Premium Membership — BaziGB Plus

Consider a single platform-wide subscription rather than separate subscriptions for individual games.

Working name:

**BaziGB Plus**

Potential benefits:

- ad-free experience
- advanced player statistics
- advanced match history
- additional profile customization
- premium avatars
- premium profile frames
- premium themes
- additional room customization
- advanced social features
- access to selected premium tournaments
- additional personalization features
- enhanced player analytics

The exact feature set, pricing, and subscription structure should be decided later based on user behavior and product maturity.

Premium membership must not provide competitive gameplay advantages.

---

## 5. Cosmetics

Cosmetics should be one of the main monetization channels.

The platform should allow players to customize their visual identity and game environment.

Potential cosmetic categories:

### Board / Game Appearance

- board skins
- table themes
- game backgrounds
- card/table designs
- dice skins
- checker/piece skins

### Player Identity

- avatars
- profile frames
- badges
- titles
- player banners

### Social Expression

- emotes
- reactions
- victory animations
- match effects

Potential theme directions:

- Classic
- Luxury
- Persian Heritage
- Royal
- Minimal
- Fantasy
- Cyberpunk
- Seasonal
- Limited Edition

Cosmetics should be purely expressive and should not affect gameplay.

---

## 6. Virtual Currency

A future virtual currency may be introduced, tentatively called:

**GB Coins**

Potential model:

Real money → GB Coins → Cosmetics / Premium experiences

However, this should not be implemented unnecessarily early.

The initial version may use direct purchases for simplicity.

A virtual currency should only be introduced when the platform has enough content and transactions to justify the additional economic complexity.

---

## 7. Advertising

Advertising should primarily monetize free users.

The advertising strategy should prioritize user experience.

Preferred formats:

- limited banner advertising
- rewarded ads
- optional ads that provide small non-competitive rewards

Example:

Watch an advertisement → receive GB Coins or another non-competitive reward.

Avoid intrusive advertising during active competitive gameplay.

Premium users should receive an ad-free experience.

---

## 8. Tournaments

Tournaments should primarily be considered an engagement and retention system.

Two initial categories can be considered:

### Free Tournaments

Entry: Free

Potential rewards:

- XP
- cosmetic items
- GB Coins
- badges
- ranking points
- achievements

### Premium / Coin-Based Tournaments

Potential future model:

Entry using GB Coins.

Potential rewards:

- GB Coins
- cosmetics
- exclusive badges
- limited-edition items
- special rankings

Real-money entry fees and cash prizes should NOT be considered part of the initial MVP monetization strategy.

If this model is ever considered in the future, legal, regulatory, payment, gambling, and country-specific requirements must be evaluated separately before implementation.

---

## 9. Social Premium

BaziGB should potentially monetize its evolution from a simple game platform into a social board-gaming platform.

Potential premium social features:

- private clubs
- club customization
- club tournaments
- club leaderboards
- advanced friend statistics
- spectator mode
- replays
- custom rooms
- custom tables
- advanced player profiles
- social achievements

This creates a monetization model based on **community and identity**, rather than competitive advantage.

---

## 10. Seasons and Battle Pass

Battle Pass / Season systems should NOT necessarily be part of the MVP.

They can be introduced once BaziGB has:

- sufficient active users
- regular engagement
- recurring content
- strong retention
- a meaningful cosmetic economy

Example:

### Season — Royal Games

Free track:

- avatars
- badges
- small rewards
- basic cosmetics

Premium track:

- exclusive board skins
- premium avatars
- profile frames
- special effects
- limited-edition cosmetics

The Battle Pass should primarily reward engagement and customization.

---

## 11. What BaziGB Should Never Monetize

The following should be explicitly avoided:

- gameplay power
- better dice probability
- better cards
- matchmaking advantages
- stronger characters or pieces
- additional competitive time
- hidden gameplay advantages
- paid advantages in rankings
- anything that makes a paying player statistically more likely to win

This principle should become a permanent product constraint.

---

## 12. Suggested Monetization Roadmap

### Phase 1 — MVP

Focus: free games, basic advertising, basic social features.

Goal: Acquire users and validate engagement.

### Phase 2 — Early Growth

Introduce: cosmetics, avatars, board skins, profile customization.

Goal: Validate users' willingness to pay for identity and personalization.

### Phase 3 — Monetization Expansion

Introduce: BaziGB Plus, advanced statistics, ad removal, premium social features.

Goal: Create recurring revenue.

### Phase 4 — Community Economy

Introduce: clubs, club tournaments, seasonal events, premium tournaments, limited cosmetics.

Goal: Increase retention and community-driven engagement.

### Phase 5 — Mature Platform

Potentially introduce: Battle Pass, GB Coins, partnerships, sponsorships, branded events, advanced tournament economy.

These should only be introduced when justified by actual user behavior.

---

## 13. Recommended Revenue Priority

1. Cosmetics
2. Premium membership
3. Advertising
4. Tournaments / events
5. Battle Pass
6. Partnerships / sponsorships

This order may change based on actual product analytics.

---

## 14. Technical Architecture Principle

Monetization should be implemented as an independent domain/module.

Suggested conceptual architecture:

```
server/
- auth/
- games/
- rooms/
- tournaments/
- leaderboard/
- monetization/
  - subscriptions/
  - cosmetics/
  - currency/
  - purchases/
  - entitlements/
- infrastructure/
```

Game modules should not directly depend on payment logic.

For example, a game should know: player, game state, moves, result — but it should not contain logic such as "Does this player have a paid subscription?"

Instead, monetization should expose an entitlement layer that determines which non-gameplay features are available to a user.

This separation should allow the monetization model to evolve without requiring major changes to individual games.

---

## 15. Important Future Questions

Do not answer these questions in this document yet. Preserve them as future product decisions:

- What should BaziGB Plus cost?
- Which features should be free vs premium?
- Which cosmetics should be sold individually?
- Should GB Coins exist from the beginning?
- What percentage of users should be expected to convert?
- Which ad formats should be used?
- Should there be regional pricing?
- Which payment providers should be supported?
- How should international payments work?
- How should refunds work?
- How should subscriptions work?
- How should creators or designers receive revenue from cosmetics?
- Should clubs eventually have their own monetization?
- Should tournament prizes ever have monetary value?
- What legal/regulatory constraints apply to paid tournaments?
- What metrics should determine whether a monetization feature is successful?

---

## Strategic Summary

BaziGB should aim to build a **fair, social, competitive gaming platform** where monetization enhances the player's experience without compromising competitive integrity.

The preferred long-term model is:

**Free gameplay → Social engagement → Cosmetics → Premium membership → Community economy → Seasonal content**

The product should optimize for long-term trust and retention rather than extracting maximum revenue from individual transactions.

This document is a strategic foundation only. Detailed pricing, UX flows, economic balancing, technical implementation, analytics, and launch strategy should be developed in separate documents later.
