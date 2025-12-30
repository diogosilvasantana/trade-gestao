import { OPERATIONAL_COSTS } from "../config/career-rules";

/**
 * Calculates the estimated cost for a trade based on asset and quantity.
 * @param symbol WIN or WDO
 * @param quantity Number of contracts
 * @returns Total cost (round trip)
 */
export function calculateEstimatedCost(symbol: string, quantity: number): number {
    const rate = symbol === 'WDO' ? OPERATIONAL_COSTS.WDO : OPERATIONAL_COSTS.WIN;
    // Round trip = Open + Close = 2 sides
    return rate * quantity * 2;
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
