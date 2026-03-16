# Operation: Golden Acorn - Event Plan

Updated: March 12, 2026 (America/New_York)

## 1) Goal

Create a central website/app for `Operation: Golden Acorn` that:
- Divides participants into teams and encourages healthy rivalry.
- Publishes and tracks activities across the daily rhythm:
  - Morning team-building competition
  - All-day planned team-specific activities
  - Popup impromptu challenges
- Sends real-time notifications through push and/or Slack.
- Shows a public fun leaderboard with non-strategic categories while keeping stars and `Bitacorn` private.
- Makes the win condition explicit: final winner is based on total stars, while `Bitacorn` is tactical currency used for trading and final-auction star bidding.

## 2) Event Concept

- Event type: `Operation: Golden Acorn` (company Spirit Week + Olympics-style team competition).
- Narrative framing: all teams are `agents`; alliances and betrayal are expected parts of gameplay.
- Kickoff opening hook option: `Look at the teams around you. At least one will stab you in the back.`
- Duration: 3-5 business days (Day 1 can be a half-day kickoff).
- Daily rhythm (chronological):
  - Morning: one team-building competition block (usually ranked across teams).
  - During the day: each team works on its own pre-planned activity/missions (can differ by team), due by end of day.
  - Each team also gets exactly `2` assigned secret-investigation tasks per day.
  - Popup windows: organizer can launch impromptu challenges anytime.
- Daily time estimate (burst-interaction model):
  - Player active time per day: about `45-60 minutes` total, plus passive/background coordination.
  - Recommended design target: cap active event time around `60 minutes` per day.
  - Default daily budget (`45-60 min`):
    - Morning competition: `15-20 min`
    - Two assigned secret investigations: `15-25 min` total active effort
    - One impromptu challenge: `5-10 min`
    - Recap show: `5 min`
  - Practical pacing note:
    - active time should be distributed in short bursts across the day instead of one continuous block
    - keep impromptu volume light by default to stay within the fairness budget
  - Organizer effort:
    - Typical: `3-5 hours/day`
    - With automation and stable operations: `2-4 hours/day`
- Participation model:
  - Use existing company teams as the official event teams to preserve team identity.
  - Every participant belongs to exactly one team.
  - On Day 1 kickoff, each team must designate one Team Captain for the event day flow.
  - If a participant has no existing company team, assign them to an eligible team with fewer members (smallest roster first).
  - Each team starts with `200 Bitacorn`.
  - Each team submits exactly `4` core secrets at the start of the week (public secret types, private values).
  - Some challenges require secrets owned by other teams, so teams can bargain and trade secrets for `Bitacorn`.
  - Secret submissions are assignment-gated: teams may only submit claims for their `2` assigned secret targets for that day.
  - Assignment planning may intentionally point multiple teams at the same target secret to create race pressure.
  - A verified correct assigned secret claim awards `+2 stars` (and can also qualify for first-claim `+20 Bitacorn` bonus).
  - Stars are awarded from challenge outcomes, with default versus scoring of `winner +2` and `loser +1`.
  - Each challenge defines its own winner/loser rule logic (no global speed/quality/participation modifiers).
  - The event is honor-code based with light-touch enforcement.

### Chronological Morning Plan (Current)

- Day 1 kickoff exercise: Team Chant + Flag Presentation (`RankedMultiTeam`)
  - each team designs a chant + flag and presents both
  - other teams vote on which presentation they like most
  - teams are ranked by votes
  - tie-breaker: alphabetical order of the chant
- Day 2 morning exercise: Marker Tower + Vibration Knockdown (`RankedMultiTeam`)
  - run build-and-knockdown flow (defined in challenge catalog)
  - tie-breaker: rock-paper-scissors
- Day 3 morning exercise: Silent Birthday Line-Up (`RankedMultiTeam`)
  - no speaking
  - each participant gets a number from `1-10` based on current standing position
  - participants keep their number card while reordering into correct birthday sequence
  - judging is based on final correctness

## 3) Users and Roles

- Participant:
  - View assigned team and roster.
  - See current tasks grouped by morning kickoff, all-day planned activities, and impromptu challenges.
  - Submit proof of completion (photo/video/check-in/button input).
  - Receive push notifications and Slack alerts.
- Team Captain (required; selected on Day 1 kickoff):
  - Confirms team participation.
  - Coordinates submissions.
  - Negotiates secret-sharing/trades with other teams.
  - Is the only team member allowed to trigger `3-option fallback` for secret requests.
  - Can request result review.
- Organizer/Admin:
  - Manage team mappings and assign users.
  - Create/schedule/publish challenges.
  - Trigger impromptu tasks instantly.
  - Manage `Bitacorn`, secrets, and end-ceremony auction settings.
  - Approve/verify submissions.
  - Manage stars, visibility/privacy settings, and tie-breakers.

## 4) Core Product Requirements

### Team Management

- Use existing company teams as the default event teams.
- Allow fallback placement for users without a team:
  - assign to any eligible team with fewer members
  - prioritize the team with the smallest roster
- Allow manual overrides by organizer if balancing rules need adjustments.
- Team economy defaults:
  - each team wallet starts at `200 Bitacorn`
  - wallet changes only through approved transfers and auction bids
  - every `Bitacorn` transaction requires a reason label
- Team secret rules:
  - each team must submit exactly `4` core secrets before challenges begin
  - organizer assigns the 4 core secret types per team at kickoff from the shared pool below (different combinations per team where possible)
  - the type/category of each core secret is public to everyone (example: team color, favorite number)
  - the actual secret value stays private unless shared or sold
  - for each core secret, owner team pre-submits a decoy/diversion bank at kickoff (recommended `4-6` plausible decoy options)
  - each team can also submit additional member-level secrets for random daily/impromptu prompts
  - secrets can be marked as required inputs for selected challenges
  - each team receives exactly `2` assigned secret-investigation tasks per day (target team + secret type)
  - assignment engine may intentionally assign the same target secret to multiple teams on the same day
  - teams may investigate/socially discuss any secret, but submission eligibility is limited to those assigned targets
  - unassigned secret submissions are blocked and do not award stars, `Bitacorn`, or `Rumor Drop`
  - allowed ways to obtain a secret:
    - ask the person/team directly
    - trade with the owner team using `Bitacorn`
    - deduce it socially (conversation/context clues)
  - first verified non-owner claim of a specific team secret earns claimer team `+20 Bitacorn` (one-time bonus per secret)
  - verified correct assigned secret claims award `+2 stars`
  - every verified secret claim also triggers a public `Rumor Drop` announcement
  - `Rumor Drop` announcements must not include hint text, secret type/category, or secret value
  - trade is optional strategy, not mandatory
  - requesting team's captain controls fallback trigger: once captain asks to activate 3-option fallback, owner team cannot refuse
  - if no agreement is reached within `10 minutes` of initial ask, fallback is automatically required
  - owner team must provide fallback options within `10 minutes` of initial ask
  - fallback options should be built from the pre-submitted decoy bank whenever possible
  - fallback must contain exactly `3` options with exactly `1` true value
  - requester gets exactly `1` guess; that guess is submitted as the final secret answer for that challenge
  - for the same secret, owner team may not reuse the exact same 3-option set with different requester teams
  - every 3-option set must include the true value
  - teams may compare fallback option sets they received to improve deduction quality
  - decoy quality is owner-team responsibility under honor code; absurd decoys may simply make guessing easier for requester
  - bad-option disputes (missing truth, duplicate reuse, low-quality decoys) are handled by honor code and organizer judgment
  - when a secret is sold, the selling team must provide a truthful value under honor code
  - only the original owner team can sell/share that team's secrets for `Bitacorn`
  - purchased secrets can be used to complete challenges but cannot be sold again
  - guessed/inferred/just-known secrets are not valid for paid sale
  - dynamic/time-variant secret categories (example: current stars or current `Bitacorn`) are not allowed
  - core secret values are locked once submitted at kickoff
  - physical sticky intel layer (optional but recommended):
    - for each core secret, owner creates exactly `3` fallback sticky sets
    - owner team must capture a photo of all generated sets before hide/destroy actions
    - owner hides `1` sticky set and destroys the other `2`
    - each team designates `1-3` couriers publicly; couriers must complete dead-drop hiding by end-of-day
    - found sticky intel can be traded/bartered as clue information (this does not override owner-only official secret sale rules)
    - physical sticky clues are additive and never replace the captain-triggered digital fallback flow
  - intel verification + buyback mechanics:
    - clue holder may pay `20 Bitacorn` to request owner verification
    - owner must respond `AUTHENTIC` or `NOT AUTHENTIC`, unless buyback path is chosen
    - owner may negotiate buyback, reclaim the clue, and destroy it without authenticity confirmation
    - buyback price is fully negotiated (no fixed cap)
- Core secret type pool (slip-prone + positive):
  - use this pool to assign 4 core secret types per team at kickoff
  - most slip-prone options (recommended first):
    - go-to coffee order
    - go-to boba order
    - favorite lunch spot/order
    - favorite late-night snack
    - most-used emoji
    - most-used Slack reaction
    - most overused work phrase
    - preferred pizza topping combo
    - favorite fast-food order
    - team member's lucky number
    - typical wake-up time range
    - typical bedtime range
    - favorite music while working
    - usual weekend activity
    - favorite weather
    - favorite ice cream flavor
    - go-to karaoke song
    - favorite sports team
    - favorite movie genre
    - first app opened in the morning
    - app most used after work
  - additional easy options:
    - favorite holiday
    - preferred travel type (beach/city/mountains)
    - favorite comfort food
    - favorite board/card game
    - signature trash-talk style/phrase
    - team's most common lunch pick
    - go-to order at a popular local chain
    - most likely teammate to send memes
    - most likely teammate to hype the team
    - most likely teammate to start a challenge
    - most likely teammate to bring snacks
    - most likely teammate to make everyone laugh
    - most likely teammate to keep team morale high
    - most likely teammate to close out a win
    - preferred workout/activity type
    - favorite dessert type
    - typical caffeine level (none/low/high)
    - favorite breakfast type
    - favorite podcast type
    - favorite phone game
    - favorite guilty-pleasure show
- Team profile includes:
  - Team name
  - Color/theme
  - Captain
  - Member list
- Support team size rules (min/max) and roster lock date.

### Task System

- Task types:
  - `Morning` (start-of-day kickoff competition block)
  - `PlannedDay` (team-specific planned activities due end-of-day, including exactly `2` assigned secret-investigation tasks)
  - `Impromptu` (short time-window, push-triggered)
  - `Trip` (optional multi-day objective, if used)
- Match format:
  - `Versus` (team vs team)
  - `RankedMultiTeam` (all teams in one ranked challenge)
- Task card includes:
  - Title, description
  - Match format (`Versus` or `RankedMultiTeam`)
  - Winner/loser rule for that specific challenge
  - For ranked challenges: rank rubric + stars/`Bitacorn` payout table by rank
  - Per-game teammate count setting (when applicable), configured before game start
  - Category (physical, creative, strategy, social, trivia, speed)
  - Required participants
  - Secret requirement (if needed): which external secret is required to complete, and allowed acquisition paths (`direct ask`, `trade`, `social deduction`, `3-option fallback`)
  - Assignment gate (for secret-investigation tasks): assigned team, assignment day, assignment slot (`1` or `2`)
  - Random member-secret prompt support (for daily/impromptu challenges)
  - Evidence type required (none/photo/video/live input)
  - Start/end time and countdown
- Task states:
  - `Scheduled` -> `Live` -> `Submitted` -> `Verified` -> `Scored` -> `Closed`

### Notifications

- Push notifications (mobile/web) for:
  - New impromptu challenge
  - Daily challenge opened
  - 30/10 minute deadline reminders
  - Submission approved/rejected
  - `Rumor Drop` published (no hint/details)
- Slack integration for:
  - Team channel post when a challenge goes live
  - @here alert for impromptu challenges
- Notification preferences:
  - Team-only alerts
  - Event-wide alerts
  - Quiet hours

### Daily Narrative Recap Show

- Run a live 5-minute group recap at end-of-day after Day 1 (Day 2 onward).
- Do not post full recap scripts in Slack by default; deliver recap live in person (or in a shared call).
- Keep recaps narrative and hype-focused, not strategy-revealing.
- Recap card template example:
  - `DAY X RECAP`
  - `Marker Tower Champion: <Team>`
  - `Best Trash Talk: <Team>`
  - `Fastest Challenge: <Team>`
  - `Secret Investigations Launched: <N>`
  - `Successful Trades: <N>`
  - `Fallback Guesses: <N>`
  - `Close Calls: <N or short moment text>`
  - `Rumor Drops Today: <N>`
  - `Rumor: <optional alliance/leak teaser>` (no star totals, no `Bitacorn` balances)

### Stars + Rivalry Mechanics

- Event win condition:
  - team with the highest total stars at end of closing ceremony wins
  - final total includes regular challenge stars, bonus-category stars, and auction stars
- Public leaderboard design (intentionally low-strategy / "useless"):
  - `Loudest` (best cheer volume/energy)
  - `Early Bird` (first to challenge someone, or first to complete one of yesterday's tasks)
  - `Best Trash Talker` (friendly banter)
  - `Most Color Coordinated`
  - `Best Team Chant`
- Public leaderboard privacy rules:
  - never reveal any team's total stars
  - never reveal any team's `Bitacorn` balance
  - categories should not expose strategic info used for bargaining
  - display badges/titles instead of economy or star totals
- Private visibility rules:
  - each team can view its own stars and `Bitacorn`
  - admin can view all teams' stars and `Bitacorn`
  - teams cannot view other teams' stars or `Bitacorn`
- Versus star rules (all versus games):
  - winner receives `+2 stars`
  - loser receives `+1 star`
- No global star modifiers. Base versus payout is `winner +2` and `loser +1`; ranked challenges use their configured rank payout tables.
- Ranked multi-team scoring:
  - ranked challenges award stars by rank using a per-challenge payout table
  - ranked challenges may also award `Bitacorn` by rank when configured
  - rank-based payout table overrides versus payout rules for that challenge
- Tie-breakers (in order):
  - Most impromptu wins
  - Fastest average completion time
  - Most unique participants
  - Tie-break metrics are admin-only and not shown on the public leaderboard.
- Ending ceremony bonus stars (Mario Party style):
  - Pre-write bonus categories before the event starts.
  - Randomly draw a subset of those categories during the closing ceremony.
  - Award stars using each category rule.
  - Example categories:
    - Most losses in versus: `+2 stars`
    - Most aggressive (challenged the most opponents): `+1 star`
  - Control settings:
    - `bonus_categories_drawn` (example: 2-4)
    - fixed star value per category
    - tie behavior (`shared_award` or `first_tiebreaker`)
- Ending ceremony trade-economy awards:
  - `Greatest Negotiator`: cheapest average buy price per secret
  - `Nosey`: most secrets learned from other teams
  - `Open Book`: most secrets given away to other teams
  - `Nicest`: cheapest average sell price per secret
  - publish winners without revealing full star/`Bitacorn` totals
  - metric notes:
    - buy/sell averages are computed as `total Bitacorn / total secrets` and require at least one completed trade
    - ties follow admin tie-break policy without publishing underlying totals
- Additional possible end-of-week award categories (not whole-trip challenges):
  - `Rivalry Ladder Champion`: best overall versus record
  - `No Repeat Hunter`: most unique opponents beaten
  - `Category Gauntlet`: wins across the most challenge categories
  - `Comeback Crew`: most comeback wins
  - `Clutch Closer`: most wins in final challenge window
  - `Consistency Machine`: most days with at least one verified win
  - `Deal Maker`: most completed secret trades
  - `Bargain Hunter`: lowest average buy price per secret
  - `Premium Broker`: highest average sell price per secret
  - `Trust Merchant`: most clean trades with no truth disputes
  - `Intel Collector`: most usable secrets acquired
  - `Open Network`: most unique teams traded with
  - `Fast Resolver`: fastest average challenge close time
  - `Underdog Slayer`: most wins against stronger-record teams
  - `Honor Squad`: high activity with zero major disputes
- `Bitacorn` economy:
  - each team starts with `200 Bitacorn`
  - `Bitacorn` does not directly decide the winner; stars do
  - `Bitacorn` matters strategically because it can be spent in the Final Star Auction to gain additional stars
  - teams can transfer `Bitacorn` to other teams to buy required secrets
  - secret trades are optional; teams can use direct ask, social deduction, or fallback guessing instead
  - requesting team's captain may trigger 3-option fallback after asking; owner cannot refuse that trigger
  - if trade has no agreement by `10 minutes` from initial ask, fallback is required automatically
  - fallback prompt must be issued within the same `10-minute` window from initial ask
  - fallback allows one final guess submission for that challenge requirement
  - fallback option sets must be unique per requester team for the same secret
  - teams can compare fallback option sets as part of social deduction
  - physical sticky clues can be traded as intelligence, but they do not replace digital fallback access
  - clue authenticity checks cost `20 Bitacorn` and return `AUTHENTIC`/`NOT AUTHENTIC` unless the owner chooses negotiated buyback
  - buyback values are negotiated; owner may destroy bought-back clues without authenticity confirmation
  - only original owner teams may sell their own secrets
  - purchased secrets cannot be sold again
  - guessed/inferred secrets are not eligible for paid sale
  - every transfer requires a reason label from both teams before settlement
  - secret trade reason examples:
    - buyer label: `Paid 40 Bitacorn for a secret`
    - seller label: `Extorting teams for secrets`
  - seller must truthfully disclose the sold value under honor code
  - `Bitacorn` can come from:
    - first verified claim bonus on opponent secrets (`+20` one-time per secret)
    - impromptu challenge outcomes
    - ranked multi-team challenge rank payouts (when configured)
  - impromptu default payout:
    - challenging team receives `+20 Bitacorn`
    - accepting team receives `+20 Bitacorn`
    - impromptu winner receives additional `+40 Bitacorn`
  - all transfers must be recorded in an auditable ledger
- Honor code policy:
  - this spirit week is intentionally light-regulation and trust-based
  - teams are expected to report truthful submissions and secret values
  - disputes are resolved by organizer judgment instead of heavy automated enforcement
- Final Star Auction (end ceremony):
  - auction happens after regular challenges and bonus-category stars
  - total number of auction rounds is set by admin at week start and hidden from participants
  - each round offers either `1` or `2` stars, determined at week start and kept secret by admin
  - teams bid using current `Bitacorn` balance
  - highest valid bid wins the stars; winning bid amount is deducted from that team wallet
  - participants only see the current round result and do not know whether another round is coming

## 5) Daily Structure + Challenge Catalog

Use this section in chronological order each day.

## A) Morning Kickoff Competition Block (Start of Day)

- Day 1: Team Chant + Flag Presentation (`RankedMultiTeam`)
  - each team presents their chant + flag
  - other teams vote on which one they like most
  - rank teams by vote count
  - tie-breaker: alphabetical order of the chant
  - stars/`Bitacorn` payout follows configured rank table
- Day 2: Marker Tower + Vibration Knockdown (`RankedMultiTeam`)
  - Part 1: Build phase
    - each team gets exactly `6` markers + a stack of Post-it notes
    - goal: build the tallest possible freestanding structure
    - markers cannot be connected end-to-end
    - admin judges height/stability and ranks teams
    - stars and `Bitacorn` are awarded from rank using the configured payout table
    - tie-breaker: rock-paper-scissors
  - Part 2: Knockdown draft + attempt phase
    - teams choose knockdown order in reverse rank order from Part 1 (`last place picks first`)
    - during each attempt:
      - only wrist may rest on the table
      - no pushing/pulling the table with wrist/arm
      - no touching the structure
      - allowed action: use palm/fist up-and-down motion to create vibration
      - blowing on the structure is allowed
      - using a fan is allowed
    - anything that falls off the structure counts as a successful knockdown result
- Day 3: Silent Birthday Line-Up (`RankedMultiTeam`)
  - no speaking
  - each participant is handed a number card `1-10` based on current standing position
  - participants must hold their number card while moving to the correct birthday order
  - score teams by final correctness
  - stars/`Bitacorn` payout follows configured rank table

## B) All-Day Planned Team-Specific Activities (During Day)

- These are pre-assigned by organizer and can be different per team.
- Each planned activity is visible from morning and due by end-of-day.
- Each team has a few PlannedDay tasks; exactly `2` are assigned secret-investigation tasks.
- Only those `2` assigned secret targets are valid for submission that day.
- Use this as a placeholder bucket until exact activity list is finalized (`TBD`).
- Recommended planned activity card fields:
  - objective text
  - required evidence
  - optional secret requirement (with assignment metadata when used)
  - scoring rule for winner/loser or rank
  - deadline and late policy

## C) Popup Impromptu Flash Challenges (Anytime During Day)

- Default impromptu versus reward package:
  - challenger `+20 Bitacorn`
  - accepter `+20 Bitacorn`
  - winner bonus `+40 Bitacorn`
  - stars: winner `+2`, loser `+1`
- Relay: Giant Connect 4 Spoon Race (`Versus`)
  - each player carries giant Connect 4 pieces on a spoon to the board
  - dropped piece = restart for that piece
- Human Knot Speed Round (`Versus`)
  - teams race to untangle without breaking the hand chain
- Strategy Stack Duel (`Versus`)
  - two teams build the tallest stable structure from provided materials
  - tallest valid structure at timeout wins
- Mobile Tug of War (Honor-Code Tap Rotation):
  - No sequence pattern is shown on phone.
  - Race format: first team to `50` valid taps wins.
  - Before game start, organizer configures number of teammates participating for each team.
  - UI uses one unique tap spot (different shape/color) per teammate.
  - Honor code for this game: do not tap another teammate's spot.
  - Each teammate must tap once before any teammate can tap again.
  - Fastest team to `50` taps wins.
- Secret Decode Sprint:
  - Team must obtain a required secret from another team before submission.
  - Fastest correct decode wins.
- 3-Minute Trivia Blitz:
  - Team answers rapid-fire questions in app.
- Freeze Frame:
  - Teams recreate a surprise theme pose and submit photo within 5 minutes.

## 6) Admin Operating Workflow

1. Create event and define schedule (week start/end).
  - Kickoff reminder: explain clearly that stars determine the winner, and `Bitacorn` is used for secret strategy plus final-auction star bidding.
  - Kickoff narrative prompt: frame all teams as spy `agents`, and use betrayal-forward opening speech if desired.
  - Day 1 requirement: each team selects one Team Captain (only captains can trigger secret fallback).
2. Import participants, map to existing company teams, and place unassigned users into the smallest eligible rosters.
3. Initialize each team wallet with `200 Bitacorn`.
4. Assign 4 core secret types per team from the pool, then collect and lock each team's secret values (public types, private values) plus decoy/diversion banks.
  - For each core secret, generate `3` physical sticky fallback sets; take photo evidence for all sets.
  - Collect each team's public courier list (`1-3` members) for dead-drop hiding.
5. Collect optional member-level secrets and preload daily/impromptu random-secret prompts.
6. Preload challenge schedule in daily chronological buckets: morning kickoff competitions, all-day team-specific planned activities, and impromptu flash pool.
  - Day 1 morning: Team Chant + Flag Presentation
  - Day 2 morning: Marker Tower + Vibration Knockdown
  - Day 3 morning: Silent Birthday Line-Up
  - PlannedDay bucket: assign team-specific activities for each day (`TBD` list), including exactly `2` assigned secret-investigation targets per team/day
  - Impromptu pool: Relay Connect 4, Human Knot Speed Round, Strategy Stack Duel, Tug of War, Secret Decode Sprint, Trivia Blitz, Freeze Frame
7. Define scoring logic per challenge:
  - versus rules (`winner +2`, `loser +1`) plus challenge-specific winner logic
  - rank rubric + rank payout table (stars/`Bitacorn`) for ranked challenges
  - per-game teammate count for activities like Mobile Tug before challenge start
8. Configure Final Star Auction settings (hidden from participants):
  - total auction rounds
  - stars per round (`1` or `2`)
9. Connect Slack workspace + channels.
10. Enable push notifications.
11. During event:
  - Publish scheduled tasks.
  - Trigger impromptu tasks.
  - Verify submissions with honor-code-first review.
  - For ranked challenges, judge ranks and apply configured rank payouts.
  - Apply impromptu `Bitacorn` payouts (`+20` challenger, `+20` accepter, `+40` winner bonus).
  - Approve and record secret-sharing `Bitacorn` transfers with required buyer/seller reason labels and seller truth confirmation.
  - Enforce captain-triggered 3-option fallback with 10-minute SLA from initial ask.
  - Generate fallback prompts from pre-submitted decoy banks for quick turnaround.
  - Record one-guess-only fallback submissions as final secret answers for the challenge.
  - Award `+2 stars` for each verified correct assigned secret claim.
  - Verify first-claim events for opponent secrets and apply `+20 Bitacorn` one-time bonus to eligible claimer teams.
  - Track discovered sticky clues, allow clue trades, and enforce owner-only official secret sale boundaries.
  - Process clue verification requests (`20 Bitacorn`) and owner responses (`AUTHENTIC` / `NOT AUTHENTIC`).
  - Process negotiated buyback requests, including clue destruction without authenticity confirmation when chosen.
  - Enforce assignment gate: only accept secret submissions tied to that team's two assigned daily secret targets.
  - Publish a `Rumor Drop` after each verified secret claim with no hint/type/value details.
  - Validate truth-in-set and no duplicate option-triplet reuse; resolve violations via honor-code judgment.
  - Resolve disputes.
12. End-of-day:
  - Run live 5-minute group recap show (Day 2 onward) using the recap template and fun leaderboard highlights.
  - Include secret-activity counts (`investigations`, `successful trades`, `fallback guesses`, `rumor drops`) plus at least one `Close Call` moment and one optional rumor teaser.
  - Keep recap content non-strategic (no star totals, no `Bitacorn` balances).
  - Publish optional recap card in-app after the live show (not Slack by default).
13. Closing ceremony:
  - Open with a short narrative recap of the week.
  - Run bonus-category star awards.
  - Run Final Star Auction round-by-round without revealing remaining round count.
  - Announce trade-economy awards (`Greatest Negotiator`, `Nosey`, `Open Book`, `Nicest`).
  - Announce final winner and ceremony awards without publishing numeric stars/`Bitacorn`.

## 7) User Experience Flow

- User opens app and sees:
  - Team card (name, color, captain, fun badges)
  - ï¿½Live Nowï¿½ challenges
  - Countdown timers
  - Quick submit button
- Team economy panel shows:
  - own team stars and `Bitacorn` (private to that team)
  - public secret types for all teams (values hidden)
  - team-owned secret values (private to team)
  - optional member-level secrets (private to team)
  - secrets needed for active tasks
  - today's `2` assigned secret targets and their progress state
  - pending/approved `Bitacorn` trades
  - required reason labels for outgoing/incoming secret trades
- Challenge detail page shows:
  - Rules and star logic
  - Ranked payout table when challenge format is `RankedMultiTeam`
  - Time remaining
  - Required evidence
  - Team progress status
  - Secret acquisition options for required-secret tasks (`direct ask`, `trade`, `social deduction`, or `3-option fallback`) with `1` final guess and `10-minute` fallback timer
- Submission flow:
  - Upload evidence or complete in-app interaction
  - If secret is required and fallback is used, submit one guess from owner-provided 3-option prompt (final answer for that challenge)
  - If secret target is not assigned to your team/day, submission is blocked
  - Confirmation screen with pending verification status

## 8) Tech Blueprint (MVP)

- Frontend:
  - Responsive web app (mobile-first) + optional PWA install
- Backend:
  - API + real-time events (WebSocket or pub/sub)
- Data:
  - Users, teams, challenges, submissions, stars, `Bitacorn`, secrets, auctions, leaderboard snapshots
- Integrations:
  - Push: Firebase Cloud Messaging or OneSignal
  - Slack: Incoming webhooks + bot for channel posts
- Security:
  - SSO (Google/Microsoft) or magic-link login
  - Admin role-based permissions

## 9) Data Model (Starter)

- `users`: id, name, email, role, team_id
- `teams`: id, name, color, captain_user_id, total_stars, bitacorn_start, bitacorn_balance
- `challenges`: id, type, match_format, title, description, winner_rule_text, rank_rubric_text, players_per_team_config, start_at, end_at, status, requires_external_secret
- `challenge_rank_payouts`: id, challenge_id, rank_position, stars_awarded, bitacorn_awarded
- `ranked_challenge_results`: id, challenge_id, team_id, rank_position, stars_awarded, bitacorn_awarded, judge_notes
- `ranked_knockdown_attempts`: id, challenge_id, team_id, pick_order, attempt_notes, success_flag
- `submissions`: id, challenge_id, team_id, user_id, submitted_at, evidence_url, status
- `scores`: id, challenge_id, team_id, outcome, stars_awarded
- `versus_results`: id, challenge_id, challenger_team_id, accepter_team_id, winner_team_id, loser_team_id, winner_stars, loser_stars
- `impromptu_bitacorn_awards`: id, challenge_id, challenger_team_id, accepter_team_id, winner_team_id, challenger_award, accepter_award, winner_bonus
- `team_secrets`: id, owner_team_id, origin_team_id, owner_user_id_nullable, acquisition_method(`original`,`purchased`), secret_type_public, secret_value_private, is_core_four, is_member_secret, is_locked, created_at
- `team_secret_decoys`: id, team_secret_id, decoy_value, is_preloaded, is_active, created_at
- `challenge_secret_requirements`: id, challenge_id, team_id_needing_secret, owner_team_id, required_secret_type_public, requirement_text
- `team_daily_secret_assignments`: id, event_day, assigned_team_id, target_owner_team_id, target_team_secret_id, required_secret_type_public, assignment_slot(`1`,`2`), challenge_id, status(`assigned`,`submitted`,`verified`,`expired`)
- `secret_trades`: id, seller_team_id, buyer_team_id, team_secret_id, bitacorn_amount, buyer_reason_label, seller_reason_label, seller_truth_confirmed, status, completed_at
- `secret_access_attempts`: id, challenge_id, team_secret_id, requester_team_id, owner_team_id, method(`direct_ask`,`trade`,`social_deduction`,`three_option_guess`), offered_price_bitacorn_nullable, status(`requested`,`accepted`,`refused`,`price_rejected`,`fallback_required`,`fallback_issued`,`resolved`), asked_at, fallback_triggered_at, fallback_due_at, resolved_at
- `secret_three_option_prompts`: id, secret_access_attempt_id, team_secret_id, requester_team_id, option_a, option_b, option_c, correct_option(`A`,`B`,`C`), option_set_signature, guessed_option_nullable, guess_correct_nullable, is_final_answer_submission, created_at
- `team_secret_couriers`: id, event_day, team_id, user_id, announced_at
- `secret_sticky_sets`: id, team_secret_id, owner_team_id, set_label, option_a, option_b, option_c, correct_option(`A`,`B`,`C`), photo_evidence_url, status(`created`,`hidden`,`destroyed`,`found`,`consumed`), hidden_by_courier_user_id_nullable, hidden_at, found_by_team_id_nullable, found_at
- `secret_intel_verifications`: id, sticky_set_id, requester_team_id, owner_team_id, verification_fee_bitacorn, owner_verdict(`authentic`,`not_authentic`,`buyback_instead`), requested_at, resolved_at
- `secret_intel_buybacks`: id, sticky_set_id, owner_team_id, holder_team_id, negotiated_price_bitacorn, accepted_at, clue_destroyed_at, authenticity_disclosed(false)
- `secret_claims`: id, team_secret_id, claimer_team_id, daily_assignment_id, claim_method(`direct_ask`,`trade`,`social_deduction`,`three_option_guess`), claim_submitted_at, verified_at, stars_awarded, is_assignment_eligible, is_first_verified_claim, first_claim_bonus_awarded, bonus_amount
- `rumor_drops`: id, secret_claim_id, owner_team_id, announcement_text, includes_hint(false), includes_secret_type(false), includes_secret_value(false), published_at, channels_json
- `bitacorn_ledger`: id, from_team_id, to_team_id, amount, reason_label, reason_text, reference_type, reference_id, created_at
- `bonus_star_categories`: id, name, rule_text, star_value, created_before_event
- `closing_ceremony_draws`: id, bonus_star_category_id, draw_order, drawn_at
- `bonus_star_awards`: id, bonus_star_category_id, team_id, stars_awarded, reason
- `trade_economy_awards`: id, award_code, team_id, metric_value, computed_at
- `final_auction_config`: id, total_rounds_hidden, stars_plan_json, is_visible_to_participants
- `final_auction_rounds`: id, round_number, stars_awarded_this_round, winner_team_id, winning_bid_bitacorn
- `final_auction_bids`: id, auction_round_id, team_id, bid_bitacorn, submitted_at
- `fun_leaderboard_categories`: id, name, definition, is_active
- `fun_leaderboard_entries`: id, category_id, team_id, snapshot_date, display_text
- `daily_recap_cards`: id, recap_date, day_label, champion_text, trash_talk_text, fastest_text, secret_investigation_count, successful_trade_count, fallback_guess_count, close_call_text, rumor_teaser_text, presented_live, presented_at, published_in_app
- `notifications`: id, audience_type, channel(push/slack), message, sent_at

## 10) MVP Scope (First Build)

- Existing-team mapping + user assignment fallback
- Challenge CRUD + scheduling
- Challenge feed by team
- Submission + honor-code-first admin review
- Public fun leaderboard (non-strategic categories only)
- Private team/admin star and `Bitacorn` views with strict visibility rules
- Team wallet with `200 Bitacorn` start balance
- Secret management (4 core secrets + optional member secrets) with public type/private value design
- Preloaded decoy/diversion banks per core secret to speed 3-option fallback generation
- Physical sticky intel flow: per-secret 3-set generation, photo capture, hide-1/destroy-2 lifecycle, and courier assignment
- Daily assignment engine: exactly `2` secret-investigation targets per team/day with submission gating
- Secret trade logging with required reason labels and seller truth confirmation
- Sticky intel exchange + verification (`20 Bitacorn`) + negotiated buyback workflow
- Rumor Drop feed on verified secret claims (strictly no hint/type/value details)
- Daily recap show support (admin template + live presentation checklist + optional in-app recap card)
- Reward engine for versus + ranked + impromptu rules:
  - all versus games award stars (`winner +2`, `loser +1`)
  - verified correct assigned secret claims award `+2 stars`
  - first verified claim on an opponent secret awards `+20 Bitacorn` (one-time per secret)
  - ranked challenges can award stars and `Bitacorn` by configured rank table
  - impromptu default `Bitacorn` payout is `+20` challenger, `+20` accepter, `+40` winner bonus
- Closing-ceremony trade-economy awards (`Greatest Negotiator`, `Nosey`, `Open Book`, `Nicest`)
- Final Star Auction with hidden round count and hidden per-round star value (`1` or `2`)
- Push notification for impromptu tasks
- Slack posting for challenge announcements

## 11) Phase 2 Enhancements

- In-app mini-games (tap sequence, reaction race, quiz battles)
- Anti-cheat controls (rate limiting, device/session checks)
- Advanced analytics:
  - Engagement by team
  - Completion rates by challenge type
  - Best time-of-day for impromptu tasks
- Awards module:
  - Champion team
  - Most collaborative team
  - Best sportsmanship
  - Greatest negotiator
  - Nosey
  - Open book
  - Nicest

## 12) Open Decisions To Iterate Next

- Team count and target team size.
- Honor-code policy details (default trust-based with light organizer moderation).
- Per-challenge winner rule templates (to keep judging consistent).
- Ranked challenge policy:
  - default rank payout templates for stars and `Bitacorn`
  - tie handling in rank-based judging
  - whether ranked challenges should always include reverse-order drafting for phase 2
- Participation configuration policy:
  - allowed min/max teammate count per game type
  - whether both teams must use identical teammate count in versus games
- Secret rule details:
  - strict format/template for the 4 core secret types that are public
  - template for optional member-level secrets used in random prompts
  - whether secret trades are private DM-style or visible marketplace offers
  - assignment algorithm for selecting each team's 2 daily target secrets (`random`, `weighted`, `no-repeat` policy)
  - approved reason-label taxonomy for buyer/seller transaction labels
  - proof standard that seller is the original owner team of the secret
  - disallowed secret categories (time-variant values, personal-sensitive info, etc.)
- Auction rule details:
  - bid mode (`sealed` or `live ascending`)
  - tie handling for equal bids
  - minimum/maximum bid constraints
- Trade-award details:
  - tie-break order for `Greatest Negotiator`, `Nosey`, `Open Book`, `Nicest`
  - minimum trade count threshold for award eligibility
- Notification policy:
  - Push only
  - Slack only
  - Both
- Evidence requirements per challenge type.
- Whether certain challenge categories should be restricted by department/location.

## 13) Success Metrics

- Participation rate (% users submitting at least one task/day).
- Average tasks completed per team/day.
- Impromptu challenge response time.
- Notification open/click rate.
- Slack engagement per challenge post.
- Secret-trade volume and average `Bitacorn` transferred per team.
- Secret-trade reason-label completion rate.
- First-claim bonus count and distribution (`+20` secret-claim bonuses).
- Assigned secret-task completion rate (`2` targets per team per day).
- 3-option fallback usage rate and guess accuracy.
- Rumor Drop engagement rate (views/reactions) without strategic info leakage.
- Daily recap attendance rate.
- Honor-code dispute rate (reported disputes per day).
- Auction participation rate (% teams bidding per round).
- Post-event satisfaction score.








