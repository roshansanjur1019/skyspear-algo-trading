export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      broker_accounts: {
        Row: {
          access_token_encrypted: string | null
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          broker_type: Database["public"]["Enums"]["broker_type"]
          created_at: string
          id: string
          is_active: boolean | null
          last_connected_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          broker_type: Database["public"]["Enums"]["broker_type"]
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          broker_type?: Database["public"]["Enums"]["broker_type"]
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      execution_runs: {
        Row: {
          allocated_capital: number
          created_at: string
          date: string
          entry_time: string | null
          exit_time: string | null
          id: string
          nifty_spot_at_entry: number | null
          reason: string | null
          status: string
          strategy_config_id: string
          strike_gap_used: number | null
          updated_at: string
          used_capital: number | null
          user_id: string
          vix_at_entry: number | null
        }
        Insert: {
          allocated_capital: number
          created_at?: string
          date: string
          entry_time?: string | null
          exit_time?: string | null
          id?: string
          nifty_spot_at_entry?: number | null
          reason?: string | null
          status?: string
          strategy_config_id: string
          strike_gap_used?: number | null
          updated_at?: string
          used_capital?: number | null
          user_id: string
          vix_at_entry?: number | null
        }
        Update: {
          allocated_capital?: number
          created_at?: string
          date?: string
          entry_time?: string | null
          exit_time?: string | null
          id?: string
          nifty_spot_at_entry?: number | null
          reason?: string | null
          status?: string
          strategy_config_id?: string
          strike_gap_used?: number | null
          updated_at?: string
          used_capital?: number | null
          user_id?: string
          vix_at_entry?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_runs_strategy_config_id_fkey"
            columns: ["strategy_config_id"]
            isOneToOne: false
            referencedRelation: "strategy_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      market_conditions_history: {
        Row: {
          created_at: string
          historical_volatility: number | null
          id: string
          implied_volatility: number | null
          market_trend: string | null
          nifty_change_percent: number | null
          nifty_spot_price: number
          put_call_ratio: number | null
          timestamp: string
          vix: number
          volume_profile: string | null
        }
        Insert: {
          created_at?: string
          historical_volatility?: number | null
          id?: string
          implied_volatility?: number | null
          market_trend?: string | null
          nifty_change_percent?: number | null
          nifty_spot_price: number
          put_call_ratio?: number | null
          timestamp?: string
          vix: number
          volume_profile?: string | null
        }
        Update: {
          created_at?: string
          historical_volatility?: number | null
          id?: string
          implied_volatility?: number | null
          market_trend?: string | null
          nifty_change_percent?: number | null
          nifty_spot_price?: number
          put_call_ratio?: number | null
          timestamp?: string
          vix?: number
          volume_profile?: string | null
        }
        Relationships: []
      }
      market_data: {
        Row: {
          change_percent: number | null
          id: string
          price: number
          symbol: string
          timestamp: string
          vix: number | null
          volume: number | null
        }
        Insert: {
          change_percent?: number | null
          id?: string
          price: number
          symbol: string
          timestamp?: string
          vix?: number | null
          volume?: number | null
        }
        Update: {
          change_percent?: number | null
          id?: string
          price?: number
          symbol?: string
          timestamp?: string
          vix?: number | null
          volume?: number | null
        }
        Relationships: []
      }
      monthly_performance: {
        Row: {
          created_at: string
          current_capital: number
          current_drawdown: number | null
          id: string
          losing_trades: number | null
          max_drawdown: number | null
          month_year: string
          monthly_target: number
          monthly_target_percentage: number | null
          risk_used_percentage: number | null
          starting_capital: number
          total_pnl: number | null
          trades_count: number | null
          updated_at: string
          user_id: string
          winning_trades: number | null
        }
        Insert: {
          created_at?: string
          current_capital: number
          current_drawdown?: number | null
          id?: string
          losing_trades?: number | null
          max_drawdown?: number | null
          month_year: string
          monthly_target: number
          monthly_target_percentage?: number | null
          risk_used_percentage?: number | null
          starting_capital: number
          total_pnl?: number | null
          trades_count?: number | null
          updated_at?: string
          user_id: string
          winning_trades?: number | null
        }
        Update: {
          created_at?: string
          current_capital?: number
          current_drawdown?: number | null
          id?: string
          losing_trades?: number | null
          max_drawdown?: number | null
          month_year?: string
          monthly_target?: number
          monthly_target_percentage?: number | null
          risk_used_percentage?: number | null
          starting_capital?: number
          total_pnl?: number | null
          trades_count?: number | null
          updated_at?: string
          user_id?: string
          winning_trades?: number | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string
          date: string
          id: string
          max_drawdown: number | null
          total_pnl: number | null
          total_trades: number | null
          user_id: string
          win_rate: number | null
          winning_trades: number | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          max_drawdown?: number | null
          total_pnl?: number | null
          total_trades?: number | null
          user_id: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          max_drawdown?: number | null
          total_pnl?: number | null
          total_trades?: number | null
          user_id?: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          subscription_expires_at: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          subscription_expires_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          subscription_expires_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategy_configs: {
        Row: {
          allocated_capital: number | null
          auto_execute_enabled: boolean | null
          created_at: string
          daily_loss_cap_absolute: number | null
          entry_time: string | null
          exit_time: string | null
          fixed_timing: boolean | null
          high_volatility_gap: number | null
          id: string
          is_active: boolean | null
          lot_size: number | null
          max_loss_per_trade: number | null
          minimum_premium_threshold: number | null
          per_trade_capital_pct: number | null
          profit_booking_percentage: number | null
          strategy_name: string
          strategy_type: string | null
          strike_gap_points: number | null
          trail_sl_enabled: boolean | null
          trail_sl_steps: Json | null
          updated_at: string
          user_id: string
          volatility_threshold: number | null
        }
        Insert: {
          allocated_capital?: number | null
          auto_execute_enabled?: boolean | null
          created_at?: string
          daily_loss_cap_absolute?: number | null
          entry_time?: string | null
          exit_time?: string | null
          fixed_timing?: boolean | null
          high_volatility_gap?: number | null
          id?: string
          is_active?: boolean | null
          lot_size?: number | null
          max_loss_per_trade?: number | null
          minimum_premium_threshold?: number | null
          per_trade_capital_pct?: number | null
          profit_booking_percentage?: number | null
          strategy_name?: string
          strategy_type?: string | null
          strike_gap_points?: number | null
          trail_sl_enabled?: boolean | null
          trail_sl_steps?: Json | null
          updated_at?: string
          user_id: string
          volatility_threshold?: number | null
        }
        Update: {
          allocated_capital?: number | null
          auto_execute_enabled?: boolean | null
          created_at?: string
          daily_loss_cap_absolute?: number | null
          entry_time?: string | null
          exit_time?: string | null
          fixed_timing?: boolean | null
          high_volatility_gap?: number | null
          id?: string
          is_active?: boolean | null
          lot_size?: number | null
          max_loss_per_trade?: number | null
          minimum_premium_threshold?: number | null
          per_trade_capital_pct?: number | null
          profit_booking_percentage?: number | null
          strategy_name?: string
          strategy_type?: string | null
          strike_gap_points?: number | null
          trail_sl_enabled?: boolean | null
          trail_sl_steps?: Json | null
          updated_at?: string
          user_id?: string
          volatility_threshold?: number | null
        }
        Relationships: []
      }
      strategy_recommendations: {
        Row: {
          capital_required: number | null
          confidence_level: string | null
          created_at: string
          executed_at: string | null
          expected_return_percentage: number | null
          id: string
          is_executed: boolean | null
          market_condition_id: string | null
          reasoning: string | null
          recommended_strategy: string
          risk_percentage: number | null
          user_id: string
        }
        Insert: {
          capital_required?: number | null
          confidence_level?: string | null
          created_at?: string
          executed_at?: string | null
          expected_return_percentage?: number | null
          id?: string
          is_executed?: boolean | null
          market_condition_id?: string | null
          reasoning?: string | null
          recommended_strategy: string
          risk_percentage?: number | null
          user_id: string
        }
        Update: {
          capital_required?: number | null
          confidence_level?: string | null
          created_at?: string
          executed_at?: string | null
          expected_return_percentage?: number | null
          id?: string
          is_executed?: boolean | null
          market_condition_id?: string | null
          reasoning?: string | null
          recommended_strategy?: string
          risk_percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_recommendations_market_condition_id_fkey"
            columns: ["market_condition_id"]
            isOneToOne: false
            referencedRelation: "market_conditions_history"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_legs: {
        Row: {
          averaging_entry_number: number | null
          created_at: string
          entry_order_id: string | null
          entry_price: number | null
          exit_order_id: string | null
          exit_price: number | null
          id: string
          leg_status: string | null
          option_type: Database["public"]["Enums"]["option_type"]
          order_status: string | null
          order_type: string | null
          pnl: number | null
          premium: number
          quantity: number
          stop_loss_price: number | null
          strike_price: number
          symboltoken: string | null
          target_price: number | null
          trade_id: string
          tradingsymbol: string | null
          trailing_sl_active: boolean | null
          trailing_sl_steps_json: Json | null
          trigger_price: number | null
        }
        Insert: {
          averaging_entry_number?: number | null
          created_at?: string
          entry_order_id?: string | null
          entry_price?: number | null
          exit_order_id?: string | null
          exit_price?: number | null
          id?: string
          leg_status?: string | null
          option_type: Database["public"]["Enums"]["option_type"]
          order_status?: string | null
          order_type?: string | null
          pnl?: number | null
          premium: number
          quantity: number
          stop_loss_price?: number | null
          strike_price: number
          symboltoken?: string | null
          target_price?: number | null
          trade_id: string
          tradingsymbol?: string | null
          trailing_sl_active?: boolean | null
          trailing_sl_steps_json?: Json | null
          trigger_price?: number | null
        }
        Update: {
          averaging_entry_number?: number | null
          created_at?: string
          entry_order_id?: string | null
          entry_price?: number | null
          exit_order_id?: string | null
          exit_price?: number | null
          id?: string
          leg_status?: string | null
          option_type?: Database["public"]["Enums"]["option_type"]
          order_status?: string | null
          order_type?: string | null
          pnl?: number | null
          premium?: number
          quantity?: number
          stop_loss_price?: number | null
          strike_price?: number
          symboltoken?: string | null
          target_price?: number | null
          trade_id?: string
          tradingsymbol?: string | null
          trailing_sl_active?: boolean | null
          trailing_sl_steps_json?: Json | null
          trigger_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_legs_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          allocated_capital: number | null
          average_entry_price: number | null
          created_at: string
          current_pnl_pct: number | null
          entry_time: string | null
          execution_run_id: string | null
          exit_reason: string | null
          exit_time: string | null
          id: string
          lot_size: number | null
          max_loss_pct: number | null
          max_profit_pct: number | null
          max_profit_reached: number | null
          nifty_price_at_entry: number | null
          strategy_config_id: string
          total_pnl: number | null
          total_premium_received: number | null
          trade_status: Database["public"]["Enums"]["trade_status"] | null
          trailing_sl_price: number | null
          updated_at: string
          used_capital: number | null
          user_id: string
        }
        Insert: {
          allocated_capital?: number | null
          average_entry_price?: number | null
          created_at?: string
          current_pnl_pct?: number | null
          entry_time?: string | null
          execution_run_id?: string | null
          exit_reason?: string | null
          exit_time?: string | null
          id?: string
          lot_size?: number | null
          max_loss_pct?: number | null
          max_profit_pct?: number | null
          max_profit_reached?: number | null
          nifty_price_at_entry?: number | null
          strategy_config_id: string
          total_pnl?: number | null
          total_premium_received?: number | null
          trade_status?: Database["public"]["Enums"]["trade_status"] | null
          trailing_sl_price?: number | null
          updated_at?: string
          used_capital?: number | null
          user_id: string
        }
        Update: {
          allocated_capital?: number | null
          average_entry_price?: number | null
          created_at?: string
          current_pnl_pct?: number | null
          entry_time?: string | null
          execution_run_id?: string | null
          exit_reason?: string | null
          exit_time?: string | null
          id?: string
          lot_size?: number | null
          max_loss_pct?: number | null
          max_profit_pct?: number | null
          max_profit_reached?: number | null
          nifty_price_at_entry?: number | null
          strategy_config_id?: string
          total_pnl?: number | null
          total_premium_received?: number | null
          trade_status?: Database["public"]["Enums"]["trade_status"] | null
          trailing_sl_price?: number | null
          updated_at?: string
          used_capital?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_execution_run_id_fkey"
            columns: ["execution_run_id"]
            isOneToOne: false
            referencedRelation: "execution_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_strategy_config_id_fkey"
            columns: ["strategy_config_id"]
            isOneToOne: false
            referencedRelation: "strategy_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      broker_type: "zerodha" | "angel_one"
      option_type: "CE" | "PE"
      subscription_plan: "trial" | "basic" | "premium"
      trade_status: "pending" | "executed" | "cancelled" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      broker_type: ["zerodha", "angel_one"],
      option_type: ["CE", "PE"],
      subscription_plan: ["trial", "basic", "premium"],
      trade_status: ["pending", "executed", "cancelled", "expired"],
    },
  },
} as const
