import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toaster } from "./ui/toaster";
import { TradeDayInput } from "../types";

interface DayFormProps {
    onAddDay: (day: TradeDayInput) => Promise<any>;
}

const COST_PER_TRADE = 2.0;

export function DayForm({ onAddDay }: DayFormProps) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [grossResult, setGrossResult] = useState("");
    const [tradeCount, setTradeCount] = useState("");
    const [contractQty, setContractQty] = useState("1");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewNet, setPreviewNet] = useState<number | null>(null);

    // Preview logic
    useEffect(() => {
        const gross = parseFloat(grossResult);
        const count = parseInt(tradeCount);

        if (!isNaN(gross) && !isNaN(count)) {
            setPreviewNet(gross - (count * COST_PER_TRADE));
        } else {
            setPreviewNet(null);
        }
    }, [grossResult, tradeCount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const gross = parseFloat(grossResult);
            const trades = parseInt(tradeCount);
            const contracts = parseInt(contractQty);

            if (isNaN(gross) || isNaN(trades) || isNaN(contracts)) {
                toaster.toast("Erro no Formulário", "Preencha os números corretamente.", "destructive");
                return;
            }

            // Local check before sending (Visual immediate feedback requested)
            if (contracts > 3) {
                // Just a warning in the UI, but we still submit as per rules logic (it logs warning)
                // Actually, "Valide se "Contratos" > 3 e mostre um aviso visual imediato."
                // We can show it inline, but let's warn.
            }

            await onAddDay({
                date,
                gross_result: gross,
                trade_count: trades,
                contract_qty: contracts,
                notes
            });

            toaster.toast("Dia Registrado", "Dados salvos com sucesso.", "success");

            // Reset form
            setGrossResult("");
            setTradeCount("");
            setNotes("");
        } catch (err: any) {
            // If it's a violation, the backend returns it in the response usually, 
            // but if it triggered an error status code we catch it here.
            toaster.toast("Erro", err.message, "destructive");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Lançar Pregão</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Data</Label>
                            <Input
                                id="date"
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contracts">Contratos (Max 3)</Label>
                            <Input
                                id="contracts"
                                type="number"
                                required
                                min="1"
                                value={contractQty}
                                onChange={(e) => setContractQty(e.target.value)}
                                className={parseInt(contractQty) > 3 ? "border-yellow-500 ring-yellow-500 bg-yellow-50" : ""}
                            />
                            {parseInt(contractQty) > 3 && (
                                <span className="text-xs text-yellow-600 font-bold">⚠️ Alavancagem Excessiva!</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="gross">Resultado Bruto R$</Label>
                            <Input
                                id="gross"
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                value={grossResult}
                                onChange={(e) => setGrossResult(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="trades">Qtd Trades</Label>
                            <Input
                                id="trades"
                                type="number"
                                min="0"
                                required
                                placeholder="0"
                                value={tradeCount}
                                onChange={(e) => setTradeCount(e.target.value)}
                            />
                        </div>
                    </div>

                    {previewNet !== null && (
                        <div className="p-2 bg-muted rounded text-sm flex justify-between">
                            <span>Estimativa Líquida:</span>
                            <span className={cn("font-bold", previewNet >= 0 ? "text-green-600" : "text-red-600")}>
                                R$ {previewNet.toFixed(2)}
                            </span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Input
                            id="notes"
                            placeholder="Opcional..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Salvando..." : "Registrar Dia"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
