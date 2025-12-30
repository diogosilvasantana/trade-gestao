from models import SessionLocal, TradeDay
session = SessionLocal()
try:
    days = session.query(TradeDay).all()
    print(f"Found {len(days)} days")
    for d in days:
        print(f"ID: {d.id}, Date: {d.date}")
        print(f"  Gross: {d.gross_result} ({type(d.gross_result)})")
        print(f"  Cost: {d.total_costs} ({type(d.total_costs)})")
        print(f"  Net: {d.net_result} ({type(d.net_result)})")
        print(f"  Count: {d.trade_count} ({type(d.trade_count)})")
        print(f"  Notes: {d.notes} ({type(d.notes)})")
except Exception as e:
    print(f"Error: {e}")
finally:
    session.close()
