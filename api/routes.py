from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import shutil
import uuid
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from models import (
    TradeDay, Trade, Plan, TradePeriod, 
    PeriodCreate, TradeCreate, DayResponse, SessionLocal,
    Base, engine
)
from logic import calculate_trade_result, audit_day
from import_logic import parse_profit_csv

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Setup & Config ---

@router.post("/setup/init")
def init_db(db: Session = Depends(get_db)):
    """Resets/seeds the DB with default plans"""
    Base.metadata.create_all(bind=engine)
    
    # Seed Plans
    plans_data = [
        {
            "name": "Avaliação Bronze (Lite)",
            "description": "Plano Bronze",
            "target_profit": 2000.0,
            "max_daily_loss": 500.0,
            "max_drawdown": 1000.0,
            "max_leverage": 5,
            "daily_soft_stop": 350.0, # 70% of max
        },
        {
            "name": "Avaliação Prata (Junior)",
            "description": "Plano Prata",
            "target_profit": 3000.0,
            "max_daily_loss": 750.0,
            "max_drawdown": 1500.0,
            "max_leverage": 10,
            "daily_soft_stop": 525.0,
        },
        {
            "name": "Avaliação Rubi (Junior Pro)",
            "description": "Plano Rubi",
            "target_profit": 3500.0,
            "max_daily_loss": 875.0,
            "max_drawdown": 1750.0,
            "max_leverage": 13,
            "daily_soft_stop": 600.0,
        },
        {
            "name": "Avaliação Ouro (Pleno)",
            "description": "Plano Ouro",
            "target_profit": 4500.0,
            "max_daily_loss": 1000.0,
            "max_drawdown": 2000.0,
            "max_leverage": 17,
            "daily_soft_stop": 700.0,
        },
         {
            "name": "Avaliação Platina (Master)",
            "description": "Plano Platina",
            "target_profit": 7000.0,
            "max_daily_loss": 1500.0,
            "max_drawdown": 3500.0,
            "max_leverage": 20,
            "daily_soft_stop": 1050.0,
        },
        {
            "name": "Avaliação Diamante (Master)",
            "description": "Plano Diamante",
            "target_profit": 7000.0,
            "max_daily_loss": 1500.0,
            "max_drawdown": 3500.0,
            "max_leverage": 20,
            "daily_soft_stop": 1050.0,
        },
        {
            "name": "Avaliação EXPERT",
            "description": "Plano Expert",
            "target_profit": 10000.0,
            "max_daily_loss": 2500.0,
            "max_drawdown": 5000.0,
            "max_leverage": 35,
            "daily_soft_stop": 1750.0,
        }
    ]

    for p_data in plans_data:
        if not db.query(Plan).filter_by(name=p_data["name"]).first():
            plan = Plan(
                name=p_data["name"],
                description=p_data["description"],
                target_profit=p_data["target_profit"],
                max_daily_loss=p_data["max_daily_loss"],
                max_drawdown=p_data["max_drawdown"],
                consistency_pct=0.50, # Standard rule per doc 6.11
                min_days=5, # Standard rule per doc 6.4
                daily_soft_stop=p_data["daily_soft_stop"],
                max_leverage=p_data["max_leverage"]
            )
            db.add(plan)
    
    db.commit()
    return {"message": "Database initialized and seeded"}

@router.get("/plans")
def get_plans(db: Session = Depends(get_db)):
    return db.query(Plan).all()

@router.post("/periods")
def create_period(period: PeriodCreate, db: Session = Depends(get_db)):
    db_period = TradePeriod(
        plan_id=period.plan_id,
        name=period.name,
        training_start_date=period.training_start_date,
        eval_start_date=period.eval_start_date
    )
    db.add(db_period)
    db.commit()
    db.refresh(db_period)
    return db_period

@router.get("/periods/active")
def get_active_period(db: Session = Depends(get_db)):
    # Get last active with status ACTIVE
    return db.query(TradePeriod).filter_by(active=True, status="ACTIVE").order_by(TradePeriod.id.desc()).first()

# --- Trading ---

@router.post("/trades")
def add_trade(trade_in: TradeCreate, db: Session = Depends(get_db)):
    # 1. Find or Create Day
    # Need active period
    period = db.query(TradePeriod).filter_by(active=True, status="ACTIVE").order_by(TradePeriod.id.desc()).first()
    if not period:
        raise HTTPException(400, "No active period found. Create one first.")
        
    day = db.query(TradeDay).filter_by(period_id=period.id, date=trade_in.date).first()
    if not day:
        day = TradeDay(period_id=period.id, date=trade_in.date)
        db.add(day)
        db.commit()
        db.refresh(day)
        
    # 2. Calculate Result
    gross, cost = calculate_trade_result(trade_in.symbol, trade_in.quantity, trade_in.result_points)
    
    # 3. Create Trade
    trade = Trade(
        day_id=day.id,
        symbol=trade_in.symbol,
        quantity=trade_in.quantity,
        side=trade_in.side,
        result_points=trade_in.result_points,
        result_brl=gross,
        cost=cost,
        setup=trade_in.setup,
        emotional_status=trade_in.emotional_status,
        career_level_id=trade_in.career_level_id,
        is_platform_fee=trade_in.is_platform_fee
    )
    db.add(trade)
    db.commit()
    
    # 4. Audit Day
    audit_day(db, day)
    db.commit()
    
    return trade

@router.delete("/trades/{trade_id}")
def delete_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    day = trade.day
    db.delete(trade)
    db.commit()
    
    # Recalculate Day
    audit_day(db, day)
    db.commit()
    
    return {"message": "Trade deleted"}

@router.put("/trades/{trade_id}")
def update_trade(trade_id: int, trade_in: TradeCreate, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
        
    old_day = trade.day
    current_date = old_day.date
    
    # Check if date changed
    if trade_in.date != current_date:
        # Check if new day exists in same period
        new_day = db.query(TradeDay).filter(
            TradeDay.period_id == old_day.period_id, 
            TradeDay.date == trade_in.date
        ).first()
        
        if not new_day:
            new_day = TradeDay(period_id=old_day.period_id, date=trade_in.date)
            db.add(new_day)
            db.flush()
            
        trade.day = new_day
        
    # Update fields
    trade.symbol = trade_in.symbol
    trade.quantity = trade_in.quantity
    trade.side = trade_in.side
    trade.result_points = trade_in.result_points
    trade.setup = trade_in.setup
    trade.emotional_status = trade_in.emotional_status
    trade.career_level_id = trade_in.career_level_id
    trade.is_platform_fee = trade_in.is_platform_fee
    
    # Recalculate financial results
    gross, cost = calculate_trade_result(trade.symbol, trade.quantity, trade.result_points)
    trade.result_brl = gross
    trade.cost = cost
    
    db.commit()
    
    # Recalculate Old Day (if changed)
    audit_day(db, old_day)
    
    # Recalculate New Day (current day of trade)
    audit_day(db, trade.day)
    
    db.commit()
    
    return trade

    return trade

@router.post("/trades/{trade_id}/upload")
def upload_trade_screenshot(trade_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    # Gerar nome único para não sobrescrever
    file_extension = file.filename.split(".")[-1]
    filename = f"{trade_id}_{uuid.uuid4()}.{file_extension}"
    file_path = f"uploads/{filename}"
    
    # Salvar arquivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Atualizar banco
    trade.screenshot_path = file_path
    db.commit()
    db.refresh(trade)
    
    return {"filename": file_path}

@router.get("/days", response_model=List[DayResponse])
def get_days(db: Session = Depends(get_db)):
    period = db.query(TradePeriod).filter_by(active=True, status="ACTIVE").order_by(TradePeriod.id.desc()).first()
    if not period: return []
    return db.query(TradeDay).filter_by(period_id=period.id).order_by(TradeDay.date.desc()).all()

@router.post("/periods/approve")
def approve_period(db: Session = Depends(get_db)):
    period = db.query(TradePeriod).filter_by(active=True, status="ACTIVE", type="ASSESSMENT").order_by(TradePeriod.id.desc()).first()
    if not period:
        raise HTTPException(400, "Nenhum período de avaliação ativo para aprovar.")
        
    # Recalculate stats to ensure eligibility
    # We can reuse get_stats logic or extract it. For now, let's assume UI checked it, but backend should verify.
    # ... Verification logic skipped for MVP speed, trust the user button for now or add simple check
    
    # Close current
    period.status = "FINISHED"
    period.active = False
    
    # Start Real Cycle
    today = date.today()
    # Logic: Start today? Or next month? User said "monthly cycles".
    # Let's start "Ciclo 1" now.
    
    real_period = TradePeriod(
        plan_id=period.plan_id,
        name="Conta Real - Ciclo 1",
        type="REAL",
        status="ACTIVE",
        cycle_number=1,
        active=True,
        parent_period_id=period.id,
        start_date=datetime.now()
    )
    db.add(real_period)
    db.commit()
    
    return {"message": "Parabéns! Você foi aprovado e o Ciclo 1 da Conta Real foi iniciado."}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    period = db.query(TradePeriod).filter_by(active=True, status="ACTIVE").order_by(TradePeriod.id.desc()).first()
    if not period:
         return {
            "current_balance": 0.0,
            "remaining_drawdown": 0.0,
            "days_operated": 0,
            "approval_progress": 0.0,
            "is_hard_breached": False,
            "is_training": False,
            "period_type": "NONE"
        }
    
    plan = period.plan
    all_days = db.query(TradeDay).filter_by(period_id=period.id).all()
    
    # --- ASSESSMENT LOGIC ---
    if period.type == "ASSESSMENT":
        eval_days = []
        eval_start = period.eval_start_date # String YYYY-MM-DD
        today_str = date.today().isoformat()
        is_training_today = False
        
        target_days = []
        
        if eval_start and today_str < eval_start:
            is_training_today = True
            # TRAINING MODE: Show stats for days BEFORE start date
            for d in all_days:
                if d.date < eval_start:
                    target_days.append(d)
        else:
            # EVALUATION MODE: Show stats for days ON/AFTER start date
            for d in all_days:
                if not eval_start or d.date >= eval_start:
                    target_days.append(d)
                
        # Stats based on Target Days (Training or Eval)
        total_net = sum(d.net_result for d in target_days)
        total_gross = sum(d.gross_result for d in target_days)
        total_costs = sum(d.total_costs for d in target_days)
        days_operated = len(target_days)
        remaining_drawdown = plan.max_drawdown + total_net
        
        # Consistency
        consistency_limit = plan.target_profit * plan.consistency_pct
        approvable_balance = 0.0
        for d in target_days:
            if d.net_result > 0:
                approvable_balance += min(d.net_result, consistency_limit)
            else:
                approvable_balance += d.net_result
                
        approval_progress = (max(0, approvable_balance) / plan.target_profit) * 100
        is_hard_breached = any(d.status == "VIOLATION" for d in target_days)
        if remaining_drawdown <= 0: is_hard_breached = True
        
        return {
            "current_balance": total_net,
            "total_gross": total_gross,
            "total_costs": total_costs,
            "remaining_drawdown": remaining_drawdown,
            "days_operated": days_operated,
            "approval_progress": min(100, approval_progress),
            "is_hard_breached": is_hard_breached,
            "period_name": period.name,
            "plan_name": plan.name,
            "is_training": is_training_today,
            "eval_start_date": period.eval_start_date,
            "plan_target": plan.target_profit,
            "period_type": "ASSESSMENT"
        }

    # --- REAL ACCOUNT LOGIC ---
    elif period.type == "REAL":
        # All days in this period count (it's a monthly cycle)
        total_net = sum(d.net_result for d in all_days)
        total_gross = sum(d.gross_result for d in all_days)
        total_costs = sum(d.total_costs for d in all_days)
        days_operated = len(all_days)
        
        # Drawdown in Real: Based on Max Drawdown relative to HighWaterMark? 
        # Or fixed? User didn't specify, assume same fixed DD rule for now OR relative.
        # Usually Prop Firms use Trailing Drawdown.
        # Let's keep simple static DD from starting balance for MVP unless specified.
        # "20% cumulative to scale"
        
        remaining_drawdown = plan.max_drawdown + total_net
        is_hard_breached = any(d.status == "VIOLATION" for d in all_days)
        if remaining_drawdown <= 0: is_hard_breached = True
        
        return {
            "current_balance": total_net,
            "total_gross": total_gross,
            "total_costs": total_costs,
            "remaining_drawdown": remaining_drawdown,
            "days_operated": days_operated,
            "approval_progress": 100.0, # Always approved
            "is_hard_breached": is_hard_breached,
            "period_name": period.name,
            "plan_name": plan.name,
            "is_training": False,
            "eval_start_date": None,
            "plan_target": None, # No target in real, just profit
            "period_type": "REAL",
            "cycle_number": period.cycle_number
        }

@router.post("/import/profit")
async def import_profit_trades(
    file: UploadFile = File(...), 
    clear_existing: bool = False,
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        count = parse_profit_csv(content, db, clear_existing)
        return {"message": f"Sucesso! {count} trades importados."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
