import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../../lib/utils";

interface DayStats {
    date: string; // YYYY-MM-DD
    gross_result: number;
    total_costs: number;
    net_result: number;
    trades_count: number;
}

interface PerformanceCalendarProps {
    days: DayStats[];
}

export function PerformanceCalendar({ days }: PerformanceCalendarProps) {
    // Current date perspective - we'll just use the current real month for now, 
    // or we could infer from data. Let's default to current wall clock month 
    // but maybe the user wants to see the month of the data. 
    // Ideally, we'd pick the month where the latest data is, or just Today.
    // Let's use Today for default view.
    const [currentDate] = React.useState(new Date());

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    const startDayOfWeek = getDay(startOfMonth(currentDate)); // 0 = Sunday

    // Create functionality to map data to dates
    const getDayData = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return days.find(d => d.date === dateStr);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(val);
    };

    // Calculate totals for the month
    const monthStats = days.reduce((acc, day) => {
        const d = new Date(day.date + 'T12:00:00'); // simple parse
        if (isSameMonth(d, currentDate)) {
            acc.gross += day.gross_result;
            acc.costs += day.total_costs;
            acc.net += day.net_result;
        }
        return acc;
    }, { gross: 0, costs: 0, net: 0 });

    return (
        <Card className="bg-[#151A25] border-slate-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-slate-100">
                    Calendário de Performance - {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
                <div className="text-sm space-x-4">
                    <span className="text-emerald-400">Líquido: {formatCurrency(monthStats.net)}</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                        <div key={i} className="text-xs font-bold text-slate-500">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for offset */}
                    {Array.from({ length: startDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-transparent" />
                    ))}

                    {daysInMonth.map((date) => {
                        const data = getDayData(date);
                        const hasTrade = !!data;
                        const isPositive = data && data.net_result >= 0;
                        const isNegative = data && data.net_result < 0;

                        // Background logic
                        let bgClass = "bg-slate-800/50 hover:bg-slate-800"; // default no trade
                        let textClass = "text-slate-400";

                        if (hasTrade) {
                            if (isPositive) {
                                // Intensity based on value? Stick to simple first as requested: "Fundo Verde"
                                bgClass = "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50";
                                textClass = "text-emerald-400 font-bold";
                            } else if (isNegative) {
                                bgClass = "bg-red-500/20 hover:bg-red-500/30 border border-red-500/50";
                                textClass = "text-red-400 font-bold";
                            }
                        }

                        if (isToday(date)) {
                            bgClass = cn(bgClass, "ring-1 ring-white/20");
                        }

                        return (
                            <TooltipProvider key={date.toISOString()}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={cn(
                                                "aspect-square rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors p-1",
                                                bgClass
                                            )}
                                        >
                                            <span className={cn("text-xs mb-1", textClass)}>{format(date, 'd')}</span>
                                            {hasTrade && (
                                                <span className={cn("text-[10px]", textClass)}>
                                                    R$ {Math.round(data.net_result)}
                                                </span>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                                        <div className="text-xs space-y-1">
                                            <div className="font-bold border-b border-slate-700 pb-1 mb-1">
                                                {format(date, "dd 'de' MMMM", { locale: ptBR })}
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span>Bruto:</span>
                                                <span className={data?.gross_result && data.gross_result >= 0 ? "text-emerald-400" : "text-red-400"}>
                                                    {data ? formatCurrency(data.gross_result) : '-'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span>Taxas:</span>
                                                <span className="text-red-400">
                                                    {data ? formatCurrency(data.total_costs) : '-'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between gap-4 font-bold border-t border-slate-700 pt-1 mt-1">
                                                <span>Líquido:</span>
                                                <span className={isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : "text-slate-400"}>
                                                    {data ? formatCurrency(data.net_result) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
