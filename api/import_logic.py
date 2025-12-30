from datetime import datetime
from sqlalchemy.orm import Session
from models import Trade, TradeDay, TradePeriod
from logic import calculate_trade_result, audit_day
import csv
import io

def parse_profit_csv(content: bytes, db: Session, clear_existing: bool = False):
    """
    Parses a Profit CSV file and imports trades.
    Format expected:
    Abertura;Fechamento;Ativo;Qtd;Resultado_Financeiro;Resultado_Pts;Tempo;Preco_Compra;Preco_Venda
    """
    
    # Decodes content
    text_content = content.decode('utf-8-sig') # Handle BOM if present
    reader = csv.DictReader(io.StringIO(text_content), delimiter=';')
    
    # clean field names (strip whitespace)
    reader.fieldnames = [name.strip() for name in reader.fieldnames]
    
    # 1. Get Active Period
    period = db.query(TradePeriod).filter_by(active=True).order_by(TradePeriod.id.desc()).first()
    if not period:
        raise Exception("Nenhum período ativo encontrado. Crie um período primeiro.")
        
    # 2. Clear Existing Data (Optional)
    if clear_existing:
        # Delete trades and days for this period? Or global?
        # User said "limpe os dados existentes". Let's assume for the current period or all.
        # Safer to clear for the active period to avoid destroying history of other periods if any.
        # But for now, let's clear days and trades of this period.
        existing_days = db.query(TradeDay).filter_by(period_id=period.id).all()
        for d in existing_days:
            db.delete(d) # Cascades to trades usually? We need to accept cascade or delete trades first.
            # If cascade is not set up, delete trades explicitly
            db.query(Trade).filter(Trade.day_id == d.id).delete()
        db.query(TradeDay).filter_by(period_id=period.id).delete()
        db.commit()

    trades_created = 0
    
    for row in reader:
        # Abertura format: 18/12/2025 09:03:48
        abertura_str = row['Abertura']
        dt = datetime.strptime(abertura_str, "%d/%m/%Y %H:%M:%S")
        date_str = dt.strftime("%Y-%m-%d")
        
        # Ativo
        symbol = row['Ativo']
        
        # Qtd & Lado
        # Profit: -3 means Sell, 3 means Buy (usually position change, but let's assume raw trade report implies net direction?)
        # Wait, the log shows: "Qtd: -3" then "Qtd: 3".
        # Negative is usually Sell. Positive Buy.
        qtd_raw = int(row['Qtd'])
        quantity = abs(qtd_raw)
        side = "SELL" if qtd_raw < 0 else "BUY"
        
        # Resultado Pts
        # Format: "120,00" -> 120.00
        pts_str = row['Resultado_Pts'].replace('.', '').replace(',', '.')
        result_points = float(pts_str)
        
        # Resultado Financeiro (Use imported value if available for strict match)
        # Format: "120,00" -> 120.00
        result_brl = None
        if 'Resultado_Financeiro' in row and row['Resultado_Financeiro']:
            fin_str = row['Resultado_Financeiro'].replace('.', '').replace(',', '.')
            try:
                result_brl = float(fin_str)
            except ValueError:
                pass

        # Create/Get Day
        day = db.query(TradeDay).filter_by(period_id=period.id, date=date_str).first()
        if not day:
            day = TradeDay(period_id=period.id, date=date_str)
            db.add(day)
            db.commit()
            db.refresh(day)

        # Calculate Logic (Get cost, and fallback gross if needed)
        calculated_gross, cost = calculate_trade_result(symbol, quantity, result_points)
        
        # Use imported financial result or calculated one
        gross = result_brl if result_brl is not None else calculated_gross
        
        # Create Trade
        trade = Trade(
            day_id=day.id,
            symbol=symbol,
            quantity=quantity,
            side=side,
            result_points=result_points,
            result_brl=gross,
            cost=cost,
            setup="Importado", # Marker
            emotional_status=None,
            career_level_id="EVALUATION_PRATA" # Default or need to infer?
        )
        db.add(trade)
        trades_created += 1
    
    db.commit()
    
    # Re-audit all affected days
    # We can optimize this but for <1000 trades it's fast enough
    days_to_audit = db.query(TradeDay).filter_by(period_id=period.id).all()
    for d in days_to_audit:
        audit_day(db, d)
        
    db.commit()
    
    return trades_created
