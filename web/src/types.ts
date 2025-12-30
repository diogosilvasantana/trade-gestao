export interface Plan {
    id: number;
    name: string;
    description: string;
    target_profit: number;
    max_daily_loss: number;
    max_drawdown: number;
    max_leverage: number;
    daily_soft_stop: number;
}

export interface TradePeriod {
    id: number;
    plan_id: number;
    name: string;
    active: boolean;
    training_start_date?: string;
    eval_start_date?: string;
    type: "ASSESSMENT" | "REAL";
    status: "ACTIVE" | "FINISHED" | "ARCHIVED";
    cycle_number: number;
}

// ... Trade, TradeDay ...

export interface StatsSummary {
    current_balance: number;
    total_gross?: number;
    total_costs?: number;
    remaining_drawdown: number;
    days_operated: number;
    approval_progress: number;
    is_hard_breached: boolean;
    period_name?: string;
    plan_name?: string;
    is_training?: boolean;
    eval_start_date?: string;
    plan_target?: number;
    period_type?: "ASSESSMENT" | "REAL" | "NONE";
    cycle_number?: number;
}

export interface TradeInput {
    date: string;
    symbol: string;
    quantity: number;
    side: "BUY" | "SELL";
    result_points: number;
    setup?: string;
    emotional_status?: string;
}

export interface PeriodCreate {
    plan_id: number;
    name: string;
    training_start_date?: string;
    eval_start_date?: string;
}
