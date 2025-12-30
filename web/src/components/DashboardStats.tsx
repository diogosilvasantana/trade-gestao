import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { useTradeData } from "../hooks/useTradeData";
import { useCareer } from "../context/CareerContext";
import { formatCurrency } from "../lib/utils";
import { TrendingUp, TrendingDown, Target, ShieldAlert, Award } from "lucide-react";

export function DashboardStats() {
    const { stats, loading, approvePeriod } = useTradeData();
    const { currentLevel, nextLevel } = useCareer();

    if (loading || !stats) {
        return <div className="animate-pulse h-64 bg-slate-800/50 rounded-xl w-full" />;
    }

    const netResult = stats.current_balance;
    const isPositive = netResult >= 0;
    const progress = Math.min(stats.approval_progress, 100);
    const isReal = stats.period_type === "REAL";
    const canApprove = !isReal && stats.approval_progress >= 100;

    const handleApprove = async () => {
        if (confirm("Confirmar aprovação e iniciar Ciclo na Mesa Real?")) {
            try {
                await approvePeriod();
            } catch (e) {
                alert(e instanceof Error ? e.message : "Erro ao aprovar");
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* HERO CARD: Career Progress */}
            <Card className="border-none bg-gradient-to-br from-[#151A25] to-[#0F1219] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-600/10 transition-all duration-1000" />

                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                        <div className="space-y-4 flex-1 w-full">
                            <div className="flex items-center gap-3">
                                <Badge className={`px-3 py-1 text-xs uppercase tracking-wider ${isReal
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                    }`}>
                                    {isReal
                                        ? `Mesa Real - Ciclo ${stats.cycle_number || 1}`
                                        : (stats.is_training ? "Modo Treinamento" : "Avaliação Oficial")}
                                </Badge>
                                <span className="text-slate-400 text-sm flex items-center gap-1">
                                    <Award size={14} />
                                    {currentLevel.name}
                                </span>
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold text-slate-100 tracking-tight mb-2">
                                    {isReal
                                        ? "Performance do Ciclo"
                                        : (canApprove
                                            ? "Aprovação Conquistada! 🏆"
                                            : (stats.is_training ? "Fase de Preparação" : "Rumo à Aprovação"))}
                                </h2>

                                {!isReal && !stats.is_training && (
                                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                                        <span>Meta: {formatCurrency(stats.plan_target)}</span>
                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                        <span>Restante: {formatCurrency((stats.plan_target || 0) - netResult)}</span>
                                    </div>
                                )}

                                {stats.is_training && stats.eval_start_date && (
                                    <div className="flex items-center gap-2 text-sm text-amber-400/80 bg-amber-400/10 px-3 py-2 rounded-lg mb-4 border border-amber-400/10">
                                        <ShieldAlert size={14} />
                                        <span>Avaliação Oficial inicia em: <span className="font-semibold text-amber-400">{new Date(stats.eval_start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span></span>
                                    </div>
                                )}
                            </div>

                            <div className="w-full max-w-xl space-y-4">
                                {canApprove ? (
                                    <button
                                        onClick={handleApprove}
                                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        CONFIRMAR APROVAÇÃO E INICIAR MESA REAL
                                    </button>
                                ) : (
                                    !isReal && !stats.is_training && (
                                        <>
                                            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                <span>Progresso</span>
                                                <span>{stats.approval_progress.toFixed(1)}%</span>
                                            </div>
                                            <Progress value={progress} className="h-3 bg-slate-800" indicatorClassName="bg-gradient-to-r from-violet-600 to-indigo-500" />
                                        </>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Saldo Líquido</p>
                            <div className={`text-5xl font-bold tabular-nums tracking-tighter ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCurrency(netResult)}
                            </div>

                            {/* Detailed Financials */}
                            <div className="flex justify-end gap-3 mt-2 text-xs font-mono text-slate-500">
                                <span>Bruto: <span className="text-slate-400">{formatCurrency(stats.total_gross || 0)}</span></span>
                                <span className="text-slate-700">|</span>
                                <span>Custos: <span className="text-rose-400/70">-{formatCurrency(Math.abs(stats.total_costs || 0))}</span></span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Daily Result */}
                <MetricCard
                    label="Resultado Hoje"
                    value={formatCurrency(0)} // TODO: Fetch daily result specifically
                    icon={<TrendingUp size={20} />}
                    trend="+0.0%" // Placeholder
                    color="text-emerald-400"
                />

                {/* Drawdown Shield */}
                <MetricCard
                    label="Drawdown Restante"
                    value={formatCurrency(stats.remaining_drawdown)}
                    icon={<ShieldAlert size={20} />}
                    subtext={`Limite Global: ${formatCurrency(stats.max_drawdown || 0)}`} // Show strict max drawdown limit
                    color="text-rose-400"
                />

                {/* Consistency / Days */}
                <MetricCard
                    label={isReal ? "Ciclo Atual" : "Dias Operados"}
                    value={isReal ? `Mês ${stats.cycle_number || 1}` : `${stats.days_operated} / ${currentLevel.minDays}`}
                    icon={<Target size={20} />}
                    subtext={isReal ? "Mesa Proprietária" : "Mínimo exigido"}
                    color="text-blue-400"
                />
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon, subtext, trend, color }: any) {
    return (
        <Card className="bg-[#151A25] border border-slate-800/50 shadow-lg hover:border-slate-700/50 transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-800/50 rounded-lg text-slate-400">
                        {icon}
                    </div>
                    {trend && (
                        <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                            {trend}
                        </span>
                    )}
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
                    <h3 className={`text-2xl font-bold tabular-nums tracking-tight text-slate-100`}>
                        {value}
                    </h3>
                    {subtext && <p className="text-xs text-slate-500 mt-2">{subtext}</p>}
                </div>
            </CardContent>
        </Card>
    )
}
