## Scope

* Implement ONLY Skyspear Short Strangle with:

  * Entry at 3:10 PM daily

  * Exit at 3:00 PM next day (profit or loss)

  * If profit between 1–5% carries into next day, trail stop‑loss

* Add Auto‑Execute toggle with pre‑checks: funds, VIX, capital per lot; show consent/warning dialog. If insufficient funds, show error and do not enable.

## Backend Service (Node.js/Express)

* Trading Worker (Dockerized) with:

  * Scheduler: entry 15:10 IST; exit 15:00 IST next day

  * Pre‑check API: compute required capital for 1 lot, read broker available funds, read VIX, validate config

  * Execution API: place orders for CE+PE legs, record trades; close at exit

  * Trailing SL module: if unrealized profit 1–5%, apply trailing SL thresholds on legs

  * Order status WebSocket: monitor fills/cancels

## Data Model

* Extend `strategy_configs` (Short Strangle only):

  * `auto_execute_enabled` (boolean)

  * `per_trade_capital_pct` (number)

  * `daily_loss_cap_absolute` (number)

  * `trail_sl_enabled` (boolean), `trail_sl_steps` (json)

* New `execution_runs` per day:

  * `user_id`, `date`, `status` (planned/running/stopped), `reason`, `allocated_capital`, `used_capital`

* Use existing `trades`, `trade_legs` to store entry/exit legs and P\&L

## Pre‑Checks When Toggle Enabled

* Funds check: fetch broker available funds; estimate margin for 1 lot Short Strangle based on instrument lot size and broker margin rules (conservative estimate if API not available)

* VIX check: read VIX; if VIX > threshold, increase strike gap (configurable)

* Capital per lot: compute from policy (e.g., 40–50% allocation for selling) and ensure `available_funds ≥ required_margin`

* Consent dialog: present daily loss cap and per‑trade capital usage; require explicit consent to enable

## Execution Algorithm (Entry 3:10 PM)

1. Authenticate to Angel One and verify funds
2. Read active Short Strangle config
3. Get NIFTY spot & VIX; compute strikes: `± strike_gap_points` (adjust for high VIX); ensure both premiums ≥ threshold (₹80)
4. Place sell orders for CE+PE legs (1 lot)
5. Record trade and legs; start monitoring via WebSocket

## Trailing SL (Profit 1–5%)

* If unrealized combined profit within 1–5% range and carrying to next day:

  * Apply trailing SL levels (e.g., trail by 25–50% of collected premium decrement)

* If trailing SL hit, close legs and record exit; stop further entries that day

## Exit (3:00 PM Next Day)

* Close both legs at market; record trade exit and final P\&L

* Reset daily loss cap for next day

## Frontend Changes

* Auto‑Execute toggle on Short Strangle card:

  * On enable: run pre‑checks and show consent dialog with:

    * Available funds

    * Required capital for 1 lot

    * VIX and applied strike gap

    * Daily loss cap (reset next day)

  * If insufficient, show error dialog; keep toggle off

* Dashboard banner:

  * Show current eligible status, planned entry time, required capital and estimated margin

## Risk Controls

* Daily loss cap: circuit breaker; halt auto‑execute when cap reached

* Max one run per day; avoid duplicate entries

* Idempotent order placement (keys per user/date/strategy)

## Integrations

* Angel One Orders API for place/close

* WebSocket Order Status for fills/cancels

* Quote API for pre‑checks (spot, premiums)

## Deployment

* Add `trading-worker` service to Docker Compose (Node.js/TS)

* Env via GitHub Secrets; health checks; logs

## Timeline

* Worker skeleton + pre‑checks + UI dialog: 2–3 days

* Order placement/closing + scheduler + WebSocket monitoring: 3–4 days

* Trailing SL + risk caps + dashboard banner: 2–3 days

## Decision

* Use Node.js/Express for the worker (keep Deno function for quotes). Proceed with this plan if approved.

