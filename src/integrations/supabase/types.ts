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
          created_at: string
          entry_time: string | null
          exit_time: string | null
          high_volatility_gap: number | null
          id: string
          is_active: boolean | null
          max_loss_per_trade: number | null
          minimum_premium_threshold: number | null
          profit_booking_percentage: number | null
          strategy_name: string
          strike_gap_points: number | null
          updated_at: string
          user_id: string
          volatility_threshold: number | null
        }
        Insert: {
          created_at?: string
          entry_time?: string | null
          exit_time?: string | null
          high_volatility_gap?: number | null
          id?: string
          is_active?: boolean | null
          max_loss_per_trade?: number | null
          minimum_premium_threshold?: number | null
          profit_booking_percentage?: number | null
          strategy_name?: string
          strike_gap_points?: number | null
          updated_at?: string
          user_id: string
          volatility_threshold?: number | null
        }
        Update: {
          created_at?: string
          entry_time?: string | null
          exit_time?: string | null
          high_volatility_gap?: number | null
          id?: string
          is_active?: boolean | null
          max_loss_per_trade?: number | null
          minimum_premium_threshold?: number | null
          profit_booking_percentage?: number | null
          strategy_name?: string
          strike_gap_points?: number | null
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
          created_at: string
          entry_price: number | null
          exit_price: number | null
          id: string
          option_type: Database["public"]["Enums"]["option_type"]
          pnl: number | null
          premium: number
          quantity: number
          strike_price: number
          trade_id: string
        }
        Insert: {
          created_at?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          option_type: Database["public"]["Enums"]["option_type"]
          pnl?: number | null
          premium: number
          quantity: number
          strike_price: number
          trade_id: string
        }
        Update: {
          created_at?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          option_type?: Database["public"]["Enums"]["option_type"]
          pnl?: number | null
          premium?: number
          quantity?: number
          strike_price?: number
          trade_id?: string
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
          created_at: string
          entry_time: string | null
          exit_time: string | null
          id: string
          nifty_price_at_entry: number | null
          strategy_config_id: string
          total_pnl: number | null
          total_premium_received: number | null
          trade_status: Database["public"]["Enums"]["trade_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_time?: string | null
          exit_time?: string | null
          id?: string
          nifty_price_at_entry?: number | null
          strategy_config_id: string
          total_pnl?: number | null
          total_premium_received?: number | null
          trade_status?: Database["public"]["Enums"]["trade_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_time?: string | null
          exit_time?: string | null
          id?: string
          nifty_price_at_entry?: number | null
          strategy_config_id?: string
          total_pnl?: number | null
          total_premium_received?: number | null
          trade_status?: Database["public"]["Enums"]["trade_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
