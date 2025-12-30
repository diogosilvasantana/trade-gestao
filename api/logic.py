from sqlalchemy.orm import Session
from models import TradeDay, Trade, Plan, TradePeriod
from typing import List

# Cost Constants (Estimated)
# Cost Constants (Atom Regulations - Simulated Table)
COST_WIN_PER_SIDE = 1.00 # R$ 1,00 por contrato por ponta (Entrada + Saída = R$ 2,00)
COST_WDO_PER_SIDE = 1.50 # R$ 1,50 por contrato por ponta (Entrada + Saída = R$ 3,00)

def calculate_trade_result(symbol: str, qty: int, points: float):
    # WIN: 1 pt = R$ 0.20
    # WDO: 1 pt = R$ 10.00
    if symbol.upper().startswith("WIN"):
        gross = points * 0.20 * qty
        cost = qty * COST_WIN_PER_SIDE * 2 # Round trip (Entry + Exit)
    elif symbol.upper().startswith("WDO"):
        gross = points * 10.00 * qty
        cost = qty * COST_WDO_PER_SIDE * 2 # Round trip (Entry + Exit)
    else:
        gross = points # Fallback
        cost = 0.0
        
    return gross, cost

def audit_day(db: Session, day: TradeDay):
    """
    Recalculates Day stats and Status based on its Trades and the Period's Plan.
    """
    trades = day.trades
    
    gross = sum(t.result_brl for t in trades)
    costs = sum(t.cost for t in trades)
    net = gross - costs
    count = len(trades)
    
    day.gross_result = gross
    day.total_costs = costs
    day.net_result = net
    day.trade_count = count
    
    # Get Plan Rules
    period = day.period
    if not period: 
        return # Should not happen
    plan = period.plan
    
    # Defaults
    status = "BE"
    if net > 0: status = "WIN"
    elif net < 0: status = "LOSS"
    
    # Violations
    warnings = []
    
    # 1. Hard Stop
    if net <= -plan.max_daily_loss:
        status = "VIOLATION"
    
    # 2. Leverage Check
    for t in trades:
        if t.quantity > plan.max_leverage:
            # We mark as warning or violation? 
            # Doc: "Se contract_qty > 3: Marcar flag warning"
            warnings.append(f"Leverage exceeded on trade {t.id}")

    day.status = status
    return day
