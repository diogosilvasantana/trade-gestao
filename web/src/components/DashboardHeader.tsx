import { StatsSummary, TradeDay } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { cn, formatCurrency } from "../lib/utils";

interface DashboardHeaderProps {
    stats: StatsSummary | null;
    days?: TradeDay[];
    loading: boolean;
}

export function DashboardHeader({ stats, loading, days = [] }: DashboardHeaderProps) {
    if (loading || !stats) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-muted rounded-xl" />
                ))}
            </div>
        );
    }

    // Calc today's result
    // Assuming days is sorted DESC, so index 0 is today or last day
    const todayStr = new Date().toISOString().split('T')[0];
    const today = days.find(d => d.date === todayStr);
    const todayNet = today ? today.net_result : 0;

    // Soft Stop check
    // We need the daily_soft_stop value. It might be in the active period's plan.
    // However, stats from backend does not explicitly return the plan object with limits?
    // Looking at routes.py get_stats, it returns period_name and plan_name but not limits.
    // We can assume hardcoded values for PRATA based on name, OR better:
    // Update api stats to return plan details? 
    // OR we pass activePeriod (which has full plan) to DashboardHeader instead of just stats!
    // But refactoring that is bigger. 
    // Let's use a heuristic or just verify if we have access.
    // Wait, typical clean code: pass limits.
    // For now, let's look at what we have. 
    // Let's assume standard soft stop is 60% of hard stop if not available, OR 
    // hardcode for now as user asked for visual.
    // Ideally we should pass activePeriod to DashboardTab -> DashboardHeader.
    // Let's check App.tsx, we have activePeriod.

    // TEMPORARY: Hardcoding 450.0 for Prata as requested "R$ 450", 
    // but nicer implementation is to upgrade backend response later.
    const SOFT_STOP_LIMIT = -450.0;
    const isSoftBreached = todayNet <= SOFT_STOP_LIMIT;

    const isDrawdownCritical = stats.remaining_drawdown < 500;

    return (
        <div className="space-y-4 w-full">
            <div className="flex justify-end">
                <a
                    href="https://br.investing.com/economic-calendar/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors bg-muted/50 px-3 py-1 rounded-full border hover:border-primary/30"
                >
                    🌍 Calendário Econômico
                </a>
            </div>

            {/* ALERTAS CRITICOS */}
            {isSoftBreached && !stats.is_hard_breached && (
                <div className="p-4 bg-yellow-500/15 border-l-4 border-yellow-500 text-yellow-700 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center">
                        <span className="font-bold flex items-center gap-2">
                            ⚠️ Alerta de Risco (Soft Stop)
                        </span>
                        <span className="text-sm">
                            Perda do dia ({formatCurrency(todayNet)}) atingiu o limite de alerta ({formatCurrency(SOFT_STOP_LIMIT)}). Pare e reflita.
                        </span>
                    </div>
                </div>
            )}

            {stats.is_hard_breached && (
                <div className="p-4 bg-red-900/20 border border-red-600 text-red-600 rounded-lg font-bold text-center animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                    🛑 HARD STOP ATINGIDO - CONTA REPROVADA
                </div>
            )}

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Progresso Aprov.</CardTitle>
                        <span className="text-xs text-muted-foreground">{stats.approval_progress.toFixed(1)}%</span>
                    </CardHeader>
                    <CardContent>
                        <Progress value={stats.approval_progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                            {formatCurrency(stats.current_balance)} / {formatCurrency(3000)}
                        </p>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "transition-all duration-300 border-2",
                    isSoftBreached && !stats.is_hard_breached ? "border-yellow-400 bg-yellow-50/50 shadow-[0_0_10px_rgba(250,204,21,0.2)]" : "",
                    stats.is_hard_breached ? "border-red-600 bg-red-50/50 shadow-[0_0_15px_rgba(220,38,38,0.2)]" : "hover:shadow-md border-transparent"
                )}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            Resultado Hoje
                            {isSoftBreached && <span className="text-lg">⚠️</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold font-mono tracking-tight", todayNet >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {formatCurrency(todayNet)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Drawdown Rest.</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold font-mono tracking-tight", isDrawdownCritical ? "text-rose-500" : "text-slate-700")}>
                            {formatCurrency(stats.remaining_drawdown)}
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Limite Global</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dias Válidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono tracking-tight">{stats.days_operated} <span className="text-base text-muted-foreground">/ 5</span></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
