import { TradeDay, Trade } from "../../types";
import { AuditTable } from "../AuditTable";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { PlusCircle, Upload } from "lucide-react";
import { PerformanceCalendar } from "../charts/PerformanceCalendar";
import { RiskMonitor } from "../widgets/RiskMonitor";

interface DashboardTabProps {
    days: TradeDay[];
    onNewTrade: () => void;
    onEditTrade: (tradeId: number, data: Trade, date: string) => Promise<void>;
    onDeleteTrade: (tradeId: number) => Promise<void>;
}

export function DashboardTab({ days, onNewTrade, onEditTrade, onDeleteTrade }: DashboardTabProps) {
    // Calculate Stats for Widgets
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStats = days.find(d => d.date === todayStr);
    const currentDailyNet = todayStats ? todayStats.net_result : 0;

    // Simplified Drawdown Estimate (Sum of all results)
    // Ideally this comes from the backend stats containing Max Drawdown logic
    const totalAccumulated = days.reduce((acc, d) => acc + d.net_result, 0);
    const currentTotalDrawdown = totalAccumulated; // If negative, RiskMonitor handles it

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        if (confirm("Isso apagará todos os trades do período atual e importará do arquivo. Continuar?")) {
            try {
                const res = await fetch("http://127.0.0.1:8000/api/import/profit?clear_existing=true", {
                    method: "POST",
                    body: formData
                });
                if (!res.ok) throw new Error("Falha na importação");
                alert("Importação realizada com sucesso! Recarregando...");
                window.location.reload(); // Simple reload to refresh all stats
            } catch (err) {
                console.error(err);
                alert("Erro ao importar arquivo.");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <PerformanceCalendar days={days} />
                <RiskMonitor
                    currentDailyNet={currentDailyNet}
                    currentTotalDrawdown={currentTotalDrawdown}
                />
            </div>

            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-100">Histórico de Operações</h3>
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImport}
                        />
                        <Button variant="outline" className="gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700">
                            <Upload className="h-4 w-4" />
                            Importar Profit
                        </Button>
                    </div>
                    <Button onClick={onNewTrade} className="bg-violet-600 hover:bg-violet-700">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Registrar Trade
                    </Button>
                </div>
            </div>

            <Card className="bg-[#151A25] border-slate-800/50">
                <CardContent className="p-0">
                    <AuditTable
                        days={days}
                        onEdit={onEditTrade}
                        onDelete={onDeleteTrade}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
