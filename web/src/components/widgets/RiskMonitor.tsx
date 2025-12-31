import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "../../lib/utils";

// Definição das Regras (Pode vir do Contexto ou Banco no futuro)
const RISK_RULES = {
    dailyLossLimit: 1000, // Ex: R$ 1.000,00 de limite de perda diária
    maxDrawdown: 2500,    // Ex: R$ 2.500,00 de perda global acumulada
    softStop: 800         // Aviso de "Pare de Operar" antes do limite real
};

interface RiskMonitorProps {
    currentDailyNet: number;  // Resultado Líquido do Dia (ex: -300.00)
    currentTotalDrawdown: number; // Drawdown acumulado da conta (ex: -1200.00)
}

export function RiskMonitor({ currentDailyNet, currentTotalDrawdown }: RiskMonitorProps) {
    // Cálculos Diários (Perda é negativa, então invertemos se for < 0)
    // Se resultado positivo, perda é 0.
    const dailyLoss = currentDailyNet < 0 ? Math.abs(currentDailyNet) : 0;
    const dailyUsagePct = Math.min((dailyLoss / RISK_RULES.dailyLossLimit) * 100, 100);

    // Cálculos Globais (Total Drawdown já vem como quanto perdeu do topo ou acumulado? 
    // O backend retorna 'remaining_drawdown'.
    // Se remaining = 2000 e max = 2500, então perdeu 500.
    // Vamos assumir que 'currentTotalDrawdown' passado aqui SEJA O VALOR PERDIDO (Drawdown atual).
    // Se o backend manda 'remaining', a gente calcula o consumed antes de passar ou aqui.
    // O user pediu: "currentTotalDrawdown: number; // Drawdown acumulado da conta (ex: -1200.00)"
    // Se for negativo, é perda.
    const totalLoss = currentTotalDrawdown < 0 ? Math.abs(currentTotalDrawdown) : 0;
    const globalUsagePct = Math.min((totalLoss / RISK_RULES.maxDrawdown) * 100, 100);

    // Estados de Alerta
    const isDailyDanger = dailyUsagePct >= 80;
    const isDailyBreached = dailyUsagePct >= 100;

    return (
        <Card className="bg-[#151A25] border-slate-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Gestor de Risco (Mesa Proprietária)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Limite Diário */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-200">Limite Diário</span>
                        <span className={cn("font-bold", isDailyDanger ? "text-red-400" : "text-slate-400")}>
                            R$ {dailyLoss.toFixed(2)} / R$ {RISK_RULES.dailyLossLimit.toFixed(2)}
                        </span>
                    </div>
                    <Progress
                        value={dailyUsagePct}
                        className={cn("h-2 bg-slate-800")}
                        indicatorClassName={cn(
                            isDailyBreached ? "bg-red-600" : isDailyDanger ? "bg-orange-500" : "bg-emerald-500"
                        )}
                    />
                    <p className="text-xs text-slate-500 text-right">
                        {isDailyBreached
                            ? "STOP LOSS DIÁRIO ATINGIDO! PARE DE OPERAR."
                            : `${(100 - dailyUsagePct).toFixed(1)}% restante`}
                    </p>
                </div>

                {/* Drawdown Global */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-200">Drawdown Global</span>
                        <span className="text-slate-400">
                            R$ {totalLoss.toFixed(2)} / R$ {RISK_RULES.maxDrawdown.toFixed(2)}
                        </span>
                    </div>
                    <Progress
                        value={globalUsagePct}
                        className="h-2 bg-slate-800"
                        indicatorClassName="bg-blue-600"
                    />
                </div>

                {/* Alertas */}
                {isDailyDanger && !isDailyBreached && (
                    <div className="rounded border border-orange-500/50 bg-orange-500/10 p-3 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                        <div className="text-xs text-orange-200">
                            <strong>Atenção:</strong> Você atingiu 80% do seu limite diário. Considere reduzir a mão ou encerrar o dia.
                        </div>
                    </div>
                )}

                {isDailyBreached && (
                    <div className="rounded border border-red-500/50 bg-red-500/10 p-3 flex items-start gap-3 animate-pulse">
                        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                        <div className="text-xs text-red-200">
                            <strong>VIOLAÇÃO DE REGRA:</strong> O limite de perda foi atingido. Qualquer operação adicional pode eliminar sua conta.
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
