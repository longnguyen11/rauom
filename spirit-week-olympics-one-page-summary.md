# Operation: Golden Acorn - One-Page Summary

Updated: March 12, 2026 (America/New_York)

## Overview

Build a central website/app for `Operation: Golden Acorn`, a 3-5 day company Spirit Week retreat that drives team rivalry through challenges, secret trading, and a private star economy.

- Teams: use existing company teams first; unassigned users join the smallest eligible team.
- Event style: honor-code based, light organizer moderation.
- Kickoff narrative tone: teams are framed as spy `agents` (`Operation: Golden Acorn`), with alliances and betrayal treated as expected gameplay.
- Opening line option for kickoff briefing: `Look at the teams around you. At least one will stab you in the back.`
- Core currencies:
  - `Stars`: determine winner; highest total stars at closing wins (kept private by team/admin visibility rules).
  - `Bitacorn`: strategy currency (each team starts with `200`) used for secret trades and final-auction bidding to gain more stars.

## Daily Flow (Chronological)

1. Morning kickoff competition (team-building + competitive, often ranked across all teams).
   - Day 1 requirement: each team picks one Team Captain.
2. All-day planned team-specific activities (pre-assigned, can differ by team, due end-of-day), including exactly 2 assigned secret-investigation tasks per team.
3. Popup impromptu challenges (organizer-triggered anytime via push/Slack).
4. End-of-day live recap show after Day 1 (5 minutes, narrative only, no star/`Bitacorn` totals), including `Secret Activity Today` counts, one `Close Call` moment, and one optional alliance/leak rumor teaser.

Daily time estimate:
- Player active time: `~45-60 minutes/day` plus passive/background coordination
- Recommended design target: cap active event time around `60 minutes/day`
- Default day (`45-60 min`): morning `15-20`, two secret tasks `15-25`, one impromptu `5-10`, recap `5`
- Pacing note: distribute activity in short bursts through the day and keep impromptu volume light
- Organizer effort: `3-5 hours/day` (can drop to `2-4` with automation)

## Core Game Mechanics

- Versus default star scoring: winner `+2`, loser `+1`.
- Correct assigned secret claim scoring: verified correct claim awards `+2 stars` (not `+3`).
- First verified claim of a specific opponent secret gives claimer team `+20 Bitacorn` (one-time per secret).
- Every verified secret claim also triggers a public `Rumor Drop` announcement with no hint, no secret type, and no secret value.
- Impromptu default `Bitacorn` payout:
  - challenger `+20`
  - accepter `+20`
  - winner bonus `+40`

## Secrets + Trading Rules

- Each team submits exactly `4` core secrets before challenges.
- Secret type/category is public; actual value is private.
- For each core secret, owner team pre-submits a small decoy/diversion bank at kickoff to enable fast fallback prompts.
- Teams may also have optional member-level secrets for random prompts.
- Allowed ways to obtain secrets:
  - ask directly
  - trade with the owner team
  - deduce socially
- Submission scope is strict: teams may only submit secret claims for their 2 assigned secret targets that day.
- Assignment generator can intentionally target the same secret for multiple teams to create race pressure and alliance/betrayal decisions.
- Trade is optional strategy, not mandatory friction.
- Only the requesting team's captain can trigger fallback; once triggered, owner cannot refuse.
- Owner must issue fallback options within the same 10-minute window from initial ask.
- Fallback uses exactly 3 options with exactly 1 true value.
- Requester gets 1 guess only, and that guess is the final secret answer for that challenge.
- Owner may not reuse the exact same 3-option set for different teams when it is the same secret.
- Every 3-option set must include the true value.
- Teams are expected to compare fallback option sets across teams as a deduction signal.
- Decoy quality is owner-team responsibility under honor code; weak decoys simply make guessing easier.
- Secret sales must be truthful (honor code).
- Only the original owner team can sell its own secrets.
- Purchased secrets can be used, but cannot be sold again.
- Guessed/inferred secrets are not valid for paid sale.
- Dynamic/time-variant secret categories are not allowed.
- Core secret values are locked once submitted at kickoff.
- Physical sticky-intel layer (optional but recommended):
  - for each core secret, generate exactly 3 physical fallback sticky sets
  - team hides 1 set and destroys 2 sets
  - team captures a photo of all generated sets before any hide/destroy action
  - found sticky intel is tradable/bargainable information
  - this physical layer never replaces the digital captain-triggered fallback flow
- Intel verification + buyback flow:
  - holder can pay `20 Bitacorn` to request authenticity check
  - owner answers only `AUTHENTIC` or `NOT AUTHENTIC`
  - owner may instead negotiate buyback, reclaim, and destroy the clue without confirming authenticity
  - buyback price is fully negotiated (no fixed cap)
- Courier/dead-drop rule: each team publicly designates 1-3 couriers who must complete clue hiding by end of day.
- Every `Bitacorn` transfer requires buyer and seller reason labels.

## Visibility + Leaderboard Philosophy

- Public leaderboard is intentionally "useless/fun" (for hype, not strategy), e.g.:
  - Loudest
  - Early Bird
  - Best Trash Talker
- Public view never reveals star totals or `Bitacorn` balances.
- Each team sees only its own totals; admin sees all.

## Morning Challenge Examples (Current)

- Day 1: Team Chant + Flag Presentation (ranked by votes; tie-breaker: alphabetical chant).
- Day 2: Marker Tower + Vibration Knockdown (ranked; tie-breaker: rock-paper-scissors).
- Day 3: Silent Birthday Line-Up (no speaking; scored by final correctness).

## Impromptu Challenge Examples

- Relay: Giant Connect 4 Spoon Race
- Human Knot Speed Round
- Strategy Stack Duel
- Mobile Tug of War (honor-code tap rotation, first to `50` valid taps)
- Secret Decode Sprint
- 3-Minute Trivia Blitz
- Freeze Frame

## Closing Ceremony Mechanics

- Start with a short narrative recap of the week.
- Random bonus star categories are prewritten before event, then randomly drawn at closing.
- Final Star Auction:
  - unknown number of rounds (hidden from teams)
  - each round awards `1` or `2` stars (preset, hidden by admin)
  - teams bid with remaining `Bitacorn`
- Winner is decided by final total stars after regular challenges, bonus stars, and auction stars.
- Trade-economy awards:
  - Greatest Negotiator
  - Nosey
  - Open Book
  - Nicest

## Product/Platform Requirements (MVP)

- Team management, challenge scheduling, submission flow, and admin verification.
- Real-time notifications: push + Slack posts for live/impromptu tasks (recap show is delivered live, not as a Slack recap post).
- Private team economy panel (stars/`Bitacorn`/secrets) with strict visibility controls.
- Ledgered `Bitacorn` transactions with required reason labels.
- Organizer kickoff reminder: explain `Bitacorn` usage clearly (trades + final-auction star bidding).
- Secret-access flow supports direct ask/trade/social deduction plus mandatory 3-option fallback after failed trade.
- 3-option fallback enforces captain-only trigger control, 10-minute SLA, truth-in-set, no duplicate triplets, and one final guess.
- Fallback prompts are generated quickly from pre-submitted decoy banks.
- Sticky intel tooling supports generation/photo capture, courier assignment, hide/destroy tracking, found-clue exchange, verification (`20 Bitacorn`), and negotiated buyback.
- First verified opponent-secret claim bonus (`+20 Bitacorn`, one-time per secret) is tracked in the reward flow.
- Daily assignment gate enforces exactly 2 secret targets per team/day and blocks unassigned secret submissions.
- Rumor Drop feed is tracked with strict no-hint/no-secret-details publishing.
- Rules engine for versus, ranked, impromptu payouts, and final auction.




