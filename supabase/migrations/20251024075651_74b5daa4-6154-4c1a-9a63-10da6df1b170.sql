-- Create market conditions history table
CREATE TABLE public.market_conditions_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vix NUMERIC NOT NULL,
  nifty_spot_price NUMERIC NOT NULL,
  nifty_change_percent NUMERIC,
  market_trend TEXT CHECK (market_trend IN ('bullish', 'bearish', 'sideways')),
  volume_profile TEXT CHECK (volume_profile IN ('high', 'normal', 'low')),
  put_call_ratio NUMERIC,
  historical_volatility NUMERIC,
  implied_volatility NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_market_conditions_timestamp ON public.market_conditions_history(timestamp DESC);

-- Enable RLS
ALTER TABLE public.market_conditions_history ENABLE ROW LEVEL SECURITY;

-- Market conditions are viewable by all authenticated users
CREATE POLICY "Market conditions viewable by authenticated users"
  ON public.market_conditions_history
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create monthly performance tracking table
CREATE TABLE public.monthly_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year DATE NOT NULL,
  starting_capital NUMERIC NOT NULL,
  current_capital NUMERIC NOT NULL,
  total_pnl NUMERIC DEFAULT 0,
  monthly_target NUMERIC NOT NULL,
  monthly_target_percentage NUMERIC DEFAULT 10,
  trades_count INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  current_drawdown NUMERIC DEFAULT 0,
  max_drawdown NUMERIC DEFAULT 0,
  risk_used_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.monthly_performance ENABLE ROW LEVEL SECURITY;

-- Users can manage their own monthly performance
CREATE POLICY "Users can view their monthly performance"
  ON public.monthly_performance
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their monthly performance"
  ON public.monthly_performance
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their monthly performance"
  ON public.monthly_performance
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_monthly_performance_updated_at
  BEFORE UPDATE ON public.monthly_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create strategy recommendations table
CREATE TABLE public.strategy_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recommended_strategy TEXT NOT NULL,
  market_condition_id UUID REFERENCES public.market_conditions_history(id),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  reasoning TEXT,
  capital_required NUMERIC,
  expected_return_percentage NUMERIC,
  risk_percentage NUMERIC,
  is_executed BOOLEAN DEFAULT false,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategy_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can view their strategy recommendations
CREATE POLICY "Users can view their strategy recommendations"
  ON public.strategy_recommendations
  FOR ALL
  USING (auth.uid() = user_id);