-- Migration: Auto-Execute Trading Enhancements
-- Extends strategy_configs and creates execution_runs table

-- Add new columns to strategy_configs
ALTER TABLE public.strategy_configs
  ADD COLUMN IF NOT EXISTS auto_execute_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS per_trade_capital_pct DECIMAL(5,2) DEFAULT 40.00,
  ADD COLUMN IF NOT EXISTS daily_loss_cap_absolute DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS trail_sl_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS trail_sl_steps JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS strategy_type TEXT CHECK (strategy_type IN ('buying', 'selling')) DEFAULT 'selling',
  ADD COLUMN IF NOT EXISTS allocated_capital DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS lot_size INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS fixed_timing BOOLEAN DEFAULT false;

-- Create execution_runs table to track daily execution attempts
CREATE TABLE IF NOT EXISTS public.execution_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_config_id UUID NOT NULL REFERENCES strategy_configs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'running', 'completed', 'stopped', 'failed')) DEFAULT 'planned',
  reason TEXT,
  allocated_capital DECIMAL(10,2) NOT NULL,
  used_capital DECIMAL(10,2) DEFAULT 0,
  entry_time TIMESTAMP WITH TIME ZONE,
  exit_time TIMESTAMP WITH TIME ZONE,
  vix_at_entry DECIMAL(5,2),
  nifty_spot_at_entry DECIMAL(10,2),
  strike_gap_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, strategy_config_id, date)
);

-- Extend trades table with additional fields for auto-execution
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS execution_run_id UUID REFERENCES execution_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lot_size INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS allocated_capital DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS used_capital DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS current_pnl_pct DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS max_profit_pct DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS max_loss_pct DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS average_entry_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS trailing_sl_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS max_profit_reached DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS exit_reason TEXT;

-- Extend trade_legs to support averaging and order tracking
ALTER TABLE public.trade_legs
  ADD COLUMN IF NOT EXISTS entry_order_id TEXT,
  ADD COLUMN IF NOT EXISTS exit_order_id TEXT,
  ADD COLUMN IF NOT EXISTS averaging_entry_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS order_status TEXT CHECK (order_status IN ('pending', 'placed', 'filled', 'cancelled', 'rejected')) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS symboltoken TEXT,
  ADD COLUMN IF NOT EXISTS tradingsymbol TEXT,
  ADD COLUMN IF NOT EXISTS leg_status TEXT CHECK (leg_status IN ('active', 'closed', 'cancelled')) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS order_type TEXT CHECK (order_type IN ('LIMIT', 'MARKET', 'SL', 'SL-M')) DEFAULT 'LIMIT',
  ADD COLUMN IF NOT EXISTS trigger_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS stop_loss_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS target_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS trailing_sl_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trailing_sl_steps_json JSONB;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_execution_runs_user_date ON public.execution_runs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_execution_runs_status ON public.execution_runs(status);
CREATE INDEX IF NOT EXISTS idx_trades_execution_run ON public.trades(execution_run_id);
CREATE INDEX IF NOT EXISTS idx_strategy_configs_auto_execute ON public.strategy_configs(auto_execute_enabled, is_active);

-- Enable RLS for execution_runs
ALTER TABLE public.execution_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for execution_runs
CREATE POLICY "Users can manage their execution runs"
  ON public.execution_runs
  FOR ALL
  USING (auth.uid() = user_id);

-- Create trigger for execution_runs updated_at
CREATE TRIGGER update_execution_runs_updated_at
  BEFORE UPDATE ON public.execution_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update strategy_configs defaults for Skyspear Short Strangle
UPDATE public.strategy_configs
SET 
  strategy_type = 'selling',
  fixed_timing = true,
  trail_sl_steps = '[
    {"profit_pct": 1.0, "trail_to_pct": 0.0, "description": "Trail to cost at 1% profit"},
    {"profit_pct": 5.0, "trail_to_pct": 3.5, "description": "Trail to 3.5% at 5% profit"}
  ]'::jsonb
WHERE strategy_name = 'Short Strangle' AND fixed_timing IS NULL;

