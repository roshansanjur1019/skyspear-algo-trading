# Supabase Migration Guide - Auto-Execute Trading System

This guide will walk you through running the database migrations for the auto-execute trading system.

## 📋 Prerequisites

1. **Supabase Account**: You need access to your Supabase project
2. **Migration File**: The file `supabase/migrations/20251120000000_auto_execute_enhancements.sql` should be ready
3. **Database Access**: You need either:
   - Supabase Dashboard access (easiest)
   - Supabase CLI installed locally
   - Direct PostgreSQL access

## 🚀 Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Access SQL Editor
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy Migration SQL
1. Open the migration file: `supabase/migrations/20251120000000_auto_execute_enhancements.sql`
2. Copy **ALL** the contents of the file
3. Paste it into the SQL Editor in Supabase

### Step 3: Review the Migration
The migration will:
- ✅ Add new columns to `strategy_configs` table
- ✅ Create `execution_runs` table
- ✅ Extend `trades` and `trade_legs` tables
- ✅ Add indexes for performance
- ✅ Set up Row Level Security (RLS) policies

### Step 4: Run the Migration
1. Click **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for the execution to complete
3. Check for any errors in the output

### Step 5: Verify Migration Success
Run this query to verify:

```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'strategy_configs' 
AND column_name IN ('auto_execute_enabled', 'trail_sl_enabled', 'strategy_type');

-- Check if execution_runs table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'execution_runs';

-- Check if new columns exist in trades table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trades' 
AND column_name IN ('execution_run_id', 'allocated_capital', 'trailing_sl_price');
```

## 🔧 Method 2: Using Supabase CLI

### Step 1: Install Supabase CLI (if not installed)
```bash
# macOS
brew install supabase/tap/supabase

# Windows (using Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
npm install -g supabase
```

### Step 2: Link Your Project
```bash
# Login to Supabase
supabase login

# Link to your project (you'll need your project ref)
supabase link --project-ref your-project-ref
```

### Step 3: Run Migration
```bash
# Apply the migration
supabase db push

# Or apply specific migration
supabase migration up
```

### Step 4: Verify
```bash
# Check migration status
supabase migration list
```

## 🗄️ Method 3: Direct PostgreSQL Access

### Step 1: Get Connection Details
1. Go to Supabase Dashboard → **Settings** → **Database**
2. Find **Connection string** → **URI**
3. Copy the connection string (it includes password)

### Step 2: Connect to Database
```bash
# Using psql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Or using any PostgreSQL client (pgAdmin, DBeaver, etc.)
```

### Step 3: Run Migration
```sql
-- Read and execute the migration file
\i supabase/migrations/20251120000000_auto_execute_enhancements.sql
```

## 📊 What the Migration Does

### 1. Extends `strategy_configs` Table
Adds columns for:
- `auto_execute_enabled` - Toggle for auto-execution
- `strategy_type` - Classification (buying/selling/fixed_timing)
- `per_trade_capital_pct` - Capital allocation percentage
- `daily_loss_cap_absolute` - Daily loss limit
- `trail_sl_enabled` - Enable trailing stop-loss
- `trail_sl_steps` - JSON configuration for trailing SL
- `averaging_enabled` - Enable averaging for buying strategies
- `averaging_threshold_pct` - When to trigger averaging (default 10%)
- `max_averaging_additions` - Maximum averaging entries
- `allocated_capital` - Capital allocated to this strategy
- `lot_size` - Number of lots to trade

### 2. Creates `execution_runs` Table
Tracks daily execution runs with:
- `user_id` - User who owns the run
- `strategy_config_id` - Which strategy was executed
- `date` - Execution date
- `status` - planned/running/completed/stopped
- `allocated_capital` - Capital allocated
- `used_capital` - Capital actually used
- `vix_at_entry` - VIX level at entry
- `nifty_spot_at_entry` - NIFTY spot at entry
- `strike_gap_used` - Strike gap applied
- `entry_time` / `exit_time` - Timestamps
- `reason` - Exit reason

### 3. Extends `trades` Table
Adds columns for:
- `execution_run_id` - Links to execution run
- `allocated_capital` - Capital for this trade
- `used_capital` - Capital used
- `current_pnl_pct` - Current P/L percentage
- `max_profit_pct` - Maximum profit reached
- `max_loss_pct` - Maximum loss reached
- `exit_reason` - Why the trade was exited
- `average_entry_price` - For averaged positions
- `trailing_sl_price` - Current trailing SL price

### 4. Extends `trade_legs` Table
Adds columns for:
- `leg_status` - active/closed/cancelled
- `order_id` - Angel One order ID
- `order_type` - LIMIT/MARKET
- `trigger_price` - Stop-loss trigger
- `stop_loss_price` - Stop-loss level
- `target_price` - Target price
- `trailing_sl_active` - Is trailing SL active
- `trailing_sl_steps_json` - Trailing SL configuration
- `symboltoken` - Angel One symbol token
- `tradingsymbol` - Trading symbol
- `averaging_entry_number` - Which averaging entry this is

### 5. Adds Indexes
For performance optimization:
- Index on `execution_runs(user_id, date)`
- Index on `execution_runs(status)`
- Index on `trades(execution_run_id)`
- Index on `trade_legs(trade_id)`

### 6. Sets Up RLS Policies
Row Level Security policies to ensure:
- Users can only see their own execution runs
- Users can only see their own trades
- Users can only modify their own strategy configs

## ⚠️ Important Notes

1. **Backup First**: Always backup your database before running migrations
   ```sql
   -- In Supabase Dashboard → Database → Backups
   -- Or manually:
   pg_dump "postgresql://..." > backup.sql
   ```

2. **Test Environment**: Run migrations in a test/staging environment first if possible

3. **Downtime**: This migration should have minimal downtime, but avoid running during active trading hours

4. **Rollback**: If something goes wrong, you can rollback:
   ```sql
   -- Manual rollback (adjust as needed)
   ALTER TABLE strategy_configs DROP COLUMN IF EXISTS auto_execute_enabled;
   DROP TABLE IF EXISTS execution_runs;
   ```

5. **Data Migration**: Existing data will remain intact. New columns will have default values (NULL, false, etc.)

## ✅ Post-Migration Checklist

After running the migration:

1. **Verify Tables**:
   ```sql
   SELECT COUNT(*) FROM execution_runs; -- Should be 0 initially
   ```

2. **Check RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'execution_runs';
   ```

3. **Test Insert** (optional):
   ```sql
   -- Test insert into execution_runs (replace with real user_id)
   INSERT INTO execution_runs (user_id, strategy_config_id, date, status)
   VALUES ('test-user-id', 1, CURRENT_DATE, 'planned');
   DELETE FROM execution_runs WHERE user_id = 'test-user-id';
   ```

4. **Update Environment Variables**:
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in your backend
   - Verify `SUPABASE_URL` is correct

5. **Test Backend Connection**:
   - Verify the trading worker can connect to Supabase
   - Test the `/precheck` endpoint

## 🐛 Troubleshooting

### Error: "column already exists"
- The migration has already been run
- Check if columns exist before running

### Error: "permission denied"
- You need to use the service role key for backend operations
- Check your RLS policies

### Error: "relation does not exist"
- Ensure you're connected to the correct database
- Check table names match exactly

### Migration Partially Applied
- Check which parts succeeded
- Manually apply remaining parts
- Or rollback and re-run

## 📞 Support

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Review migration file for syntax errors
3. Verify database connection
4. Check Supabase status page

## 🎯 Next Steps

After successful migration:
1. ✅ Update backend environment variables
2. ✅ Test pre-check endpoint
3. ✅ Enable auto-execute on a test strategy
4. ✅ Monitor execution runs
5. ✅ Test scheduler (during market hours)

---

**Migration File**: `supabase/migrations/20251120000000_auto_execute_enhancements.sql`  
**Created**: 2025-01-XX  
**Version**: 1.0
