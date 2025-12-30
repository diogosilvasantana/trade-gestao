
import { useMemo } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TradeDay } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface EquityCurveProps {
    days: TradeDay[];
}

// Helper to format date YYYY-MM-DD to DD/MM
const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return dateStr;
};

export function EquityCurve({ days }: EquityCurveProps) {
    const data = useMemo(() => {
        // Sort days by date just in case
        const sortedDays = [...days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningTotal = 0;
        return sortedDays.map((day) => {
            runningTotal += day.net_result;
            return {
                date: day.date,
                dailyNet: day.net_result,
                accumulated: runningTotal,
            };
        });
    }, [days]);

    if (days.length === 0) {
        return null;
    }

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Curva de Patrimônio</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="gradientAccumulated" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value: string) => formatDate(value)}
                                className="text-xs text-muted-foreground"
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                className="text-xs text-muted-foreground font-mono"
                                tickFormatter={(value: number) => `R$ ${value}`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                content={({ active, payload, label }: any) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            Data
                                                        </span>
                                                        <span className="font-bold text-muted-foreground">
                                                            {formatDate(label)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            Acumulado
                                                        </span>
                                                        <span className="font-bold font-mono">
                                                            {formatCurrency(payload[0].value as number)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            Resultado Dia
                                                        </span>
                                                        <span className={`font-bold font-mono ${(payload[0].payload.dailyNet >= 0) ? 'text-green-600' : 'text-red-600'}`}>
                                                            {formatCurrency(payload[0].payload.dailyNet)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="accumulated"
                                stroke="var(--primary)"
                                fill="url(#gradientAccumulated)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
