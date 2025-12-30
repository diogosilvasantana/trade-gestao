from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey, ForeignKeyConstraint, DateTime, Boolean
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

# Database Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./atom_manager.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- SQLAlchemy Models (DB) ---

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(String)
    
    # Rules
    target_profit = Column(Float)       # e.g., 3000.0
    max_daily_loss = Column(Float)      # e.g., 750.0
    max_drawdown = Column(Float)        # e.g., 1500.0 (Global limit)
    consistency_pct = Column(Float)     # e.g., 0.50 (50%)
    min_days = Column(Integer)          # e.g., 5
    daily_soft_stop = Column(Float)     # e.g., 450.0
    max_leverage = Column(Integer)      # e.g., 3 contracts

    periods = relationship("TradePeriod", back_populates="plan")

class TradePeriod(Base):
    __tablename__ = "trade_periods"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"))
    name = Column(String) # e.g. "Janeiro 2024"
    start_date = Column(DateTime, default=datetime.utcnow) # Create date
    
    # Timeline
    training_start_date = Column(String, nullable=True) # YYYY-MM-DD
    eval_start_date = Column(String, nullable=True)  # YYYY-MM-DD
    
    # Lifecycle V2
    type = Column(String, default="ASSESSMENT") # ASSESSMENT, REAL
    status = Column(String, default="ACTIVE") # ACTIVE, FINISHED, ARCHIVED
    cycle_number = Column(Integer, default=1)
    
    # Hierarchy (for Real Cycles)
    parent_period_id = Column(Integer, ForeignKey("trade_periods.id"), nullable=True)
    
    active = Column(Boolean, default=True)
    
    plan = relationship("Plan", back_populates="periods")
    days = relationship("TradeDay", back_populates="period")
    children = relationship("TradePeriod", back_populates="parent", remote_side=[id])
    parent = relationship("TradePeriod", back_populates="children", remote_side=[parent_period_id])

class TradeDay(Base):
    __tablename__ = "trade_days"

    id = Column(Integer, primary_key=True, index=True)
    period_id = Column(Integer, ForeignKey("trade_periods.id"))
    date = Column(String, index=True) # YYYY-MM-DD
    
    # Aggregated Stats (Updated via logic)
    gross_result = Column(Float, default=0.0)
    total_costs = Column(Float, default=0.0)
    net_result = Column(Float, default=0.0)
    trade_count = Column(Integer, default=0)
    status = Column(String, default="OPEN") # OPEN, WIN, LOSS, BE, VIOLATION
    notes = Column(Text, nullable=True)
    
    period = relationship("TradePeriod", back_populates="days")
    trades = relationship("Trade", back_populates="day")

class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("trade_days.id"))
    
    symbol = Column(String) # WIN, WDO
    quantity = Column(Integer)
    side = Column(String) # BUY, SELL
    result_points = Column(Float) # Points won/lost
    result_brl = Column(Float) # Gross result in BRL
    cost = Column(Float) # Calculated cost
    
    # Trader Psychology / Context
    setup = Column(String, nullable=True) # e.g. Pullback, Breakout
    emotional_status = Column(String, nullable=True) # e.g. Confident, Anxious
    
    # Career V2
    career_level_id = Column(String, default="EVALUATION_PRATA") 
    is_platform_fee = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    
    day = relationship("TradeDay", back_populates="trades")

    @property
    def net_result(self):
        return self.result_brl - self.cost

# --- Pydantic Models (API) ---

class PlanBase(BaseModel):
    name: str
    target_profit: float
    max_daily_loss: float
    max_drawdown: float
    max_leverage: int

class PeriodCreate(BaseModel):
    plan_id: int
    name: str
    training_start_date: Optional[str] = None
    eval_start_date: Optional[str] = None

class TradeCreate(BaseModel):
    day_id: Optional[int] = None # If null, uses today/creates today
    date: str # YYYY-MM-DD
    symbol: str
    quantity: int
    side: str
    result_points: float
    setup: Optional[str] = None
    emotional_status: Optional[str] = None
    career_level_id: Optional[str] = "EVALUATION_PRATA"
    is_platform_fee: Optional[bool] = False

class TradeResponse(BaseModel):
    id: int
    symbol: str
    quantity: int
    side: str
    result_points: float
    result_brl: float
    cost: float
    net_result: float # After cost
    setup: Optional[str] = None
    emotional_status: Optional[str] = None
    career_level_id: Optional[str] = None
    is_platform_fee: bool = False
    
class DayResponse(BaseModel):
    id: int
    date: str
    gross_result: float
    total_costs: float
    net_result: float
    trade_count: int
    status: str
    notes: Optional[str] = None
    trades: List[TradeResponse] = []
    
    class Config:
        from_attributes = True
