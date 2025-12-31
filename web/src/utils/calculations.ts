import { OPERATIONAL_COSTS } from "../config/career-rules";

/**
 * Calculates the estimated cost for a trade based on asset and quantity.
 * @param symbol WIN or WDO
 * @param quantity Number of contracts
 * @returns Total cost (round trip)
 */
export function calculateEstimatedCost(symbol: string, quantity: number): number {
    const rate = symbol === 'WDO' ? OPERATIONAL_COSTS.WDO : OPERATIONAL_COSTS.WIN;
    // Cost is fixed per contract (Atom rule reference: WIN=1.00, WDO=1.50)
    return rate * quantity;
}

/**
 * calculates net result given points and quantity
 */
export function calculateTradeNetResult(symbol: string, quantity: number, points: number): number {
    const cost = calculateEstimatedCost(symbol, quantity);
    let gross = 0;

    if (symbol === 'WIN') {
        gross = points * quantity * 0.20;
    } else if (symbol === 'WDO') {
        gross = points * quantity * 10.0;
    }

    return gross - cost;
}

export function groupTradesByDay(trades: any[]): any[] {
    const daysMap = new Map<string, {
        date: string;
        gross_result: number;
        total_costs: number;
        net_result: number;
        trades_count: number;
    }>();

    trades.forEach(trade => {
        // Normalize date to YYYY-MM-DD
        const dateStr = trade.date.split('T')[0];

        if (!daysMap.has(dateStr)) {
            daysMap.set(dateStr, {
                date: dateStr,
                gross_result: 0,
                total_costs: 0,
                net_result: 0,
                trades_count: 0
            });
        }

        const day = daysMap.get(dateStr)!;

        const qty = Number(trade.quantity);
        const points = Number(trade.result_points);
        const symbol = trade.symbol;

        // Calculate gross
        let tradeGross = 0;
        if (symbol === 'WIN') tradeGross = points * qty * 0.20;
        else if (symbol === 'WDO') tradeGross = points * qty * 10.0;

        // Calculate cost
        const tradeCost = calculateEstimatedCost(symbol, qty);

        day.gross_result += tradeGross;
        day.total_costs += tradeCost;
        day.net_result += (tradeGross - tradeCost);
        day.trades_count += 1;
    });

    return Array.from(daysMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
