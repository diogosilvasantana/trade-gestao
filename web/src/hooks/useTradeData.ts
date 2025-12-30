import { useState, useEffect, useCallback } from 'react';
import { TradeDay, StatsSummary, TradeInput, Plan, PeriodCreate, TradePeriod } from '../types';

const API_Base = 'http://127.0.0.1:8000/api';

export function useTradeData() {
    const [days, setDays] = useState<TradeDay[]>([]);
    const [stats, setStats] = useState<StatsSummary | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [activePeriod, setActivePeriod] = useState<TradePeriod | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Check for Active Period
            const periodRes = await fetch(`${API_Base}/periods/active`);
            if (periodRes.ok) {
                const periodData = await periodRes.json();
                setActivePeriod(periodData);

                if (periodData) {
                    // 2. Fetch Stats & Days only if period exists
                    const [daysRes, statsRes] = await Promise.all([
                        fetch(`${API_Base}/days`),
                        fetch(`${API_Base}/stats`)
                    ]);

                    if (daysRes.ok && statsRes.ok) {
                        setDays(await daysRes.json());
                        setStats(await statsRes.json());
                    }
                }
            }

            // Always fetch plans for setup
            const plansRes = await fetch(`${API_Base}/plans`);
            if (plansRes.ok) {
                setPlans(await plansRes.json());
            }

            setError(null);
        } catch (err) {
            console.error(err);
            setError("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const createPeriod = async (data: PeriodCreate) => {
        const res = await fetch(`${API_Base}/periods`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Falha ao criar período");
        await fetchData();
    };

    const addTrade = async (trade: TradeInput) => {
        try {
            const res = await fetch(`${API_Base}/trades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trade),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Falha ao salvar trade");
            }

            await fetchData(); // Refresh data
            return await res.json();
        } catch (err: any) {
            throw err;
        }
    };

    const deleteTrade = async (tradeId: number) => {
        const res = await fetch(`${API_Base}/trades/${tradeId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error("Falha ao deletar trade");
        await fetchData();
    };

    const editTrade = async (tradeId: number, trade: TradeInput) => {
        const res = await fetch(`${API_Base}/trades/${tradeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trade),
        });
        if (!res.ok) throw new Error("Falha ao editar trade");
        await fetchData();
    };

    const approvePeriod = async () => {
        const res = await fetch(`${API_Base}/periods/approve`, {
            method: 'POST',
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Falha ao aprovar período");
        }
        await fetchData();
    };

    return { days, stats, plans, activePeriod, loading, error, refresh: fetchData, addTrade, createPeriod, deleteTrade, editTrade, approvePeriod };
}
