import { useState, useEffect } from "react";
import { format } from "date-fns";
import { UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { DatePicker } from "./ui/date-picker";
import { TradeInput, Trade, TradePeriod } from "../types";
import { calculateEstimatedCost } from "../utils/calculations";
import { useCareer } from "../context/CareerContext";
import { formatCurrency } from "../lib/utils";

interface TradeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (trade: TradeInput) => Promise<any>;
    initialData?: Trade | null;
    defaultDate?: string;
    activePeriod: TradePeriod | null;
}

export function TradeDialog({ isOpen, onClose, onSubmit, initialData, defaultDate }: TradeDialogProps) {
    // Context
    const { currentLevel } = useCareer();

    // State
    const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
    const [symbol, setSymbol] = useState("WIN");
    const [qty, setQty] = useState("1");
    const [resultPoints, setResultPoints] = useState("");
    const [side, setSide] = useState<"BUY" | "SELL">("BUY");
    const [emotionalStatus, setEmotionalStatus] = useState("");
    const [riskChecked, setRiskChecked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Derived
    const estimatedCost = calculateEstimatedCost(symbol, parseInt(qty) || 0);
    const maxContracts = currentLevel.maxContracts;
    const isQtyInvalid = (parseInt(qty) || 0) > maxContracts;

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setSymbol(initialData.symbol);
                setQty(initialData.quantity.toString());
                setResultPoints(initialData.result_points.toString());
                setSide(initialData.side);
                setEmotionalStatus(initialData.emotional_status || "");
                if ((initialData as any).date) setDate((initialData as any).date);
                setRiskChecked(true); // Assume editing means it was checked before
                setSelectedFile(null); // Reset file
            } else {
                setSymbol("WIN");
                setQty("1"); // Default
                setResultPoints("");
                setSide("BUY");
                setEmotionalStatus("");
                setRiskChecked(false);
                setSelectedFile(null);
            }
            if (defaultDate && !initialData) setDate(defaultDate);
        }
    }, [isOpen, initialData, defaultDate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!riskChecked) {
            alert("Você deve confirmar que respeitou o gerenciamento de risco.");
            return;
        }

        if (isQtyInvalid) {
            alert(`Quantidade excede o limite do nível ${currentLevel.name} (${maxContracts} contratos).`);
            return;
        }

        setIsSubmitting(true);

        try {
            const points = parseFloat(resultPoints);
            const quantity = parseInt(qty);

            if (isNaN(points) || isNaN(quantity)) throw new Error("Dados inválidos");

            const newTrade = await onSubmit({
                date,
                symbol,
                quantity,
                side,
                result_points: points,
                emotional_status: emotionalStatus
            });

            // Upload Screenshot if exists and we have an ID
            if (selectedFile && newTrade?.id) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFile);

                // Assuming API is at localhost:8000 based on standard setup
                await fetch(`http://127.0.0.1:8000/api/trades/${newTrade.id}/upload`, {
                    method: 'POST',
                    body: uploadData,
                });
            }

            onClose();
        } catch (err: any) {
            console.error(err);
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Trade" : "Novo Trade"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Ajuste os detalhes do trade." : "Preencha os dados do trade realizado."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Data</Label>
                        <DatePicker
                            date={date ? new Date(date + 'T12:00:00') : undefined}
                            setDate={(d) => setDate(d ? format(d, 'yyyy-MM-dd') : "")}
                        />
                    </div>
                    {/* Ativo */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="symbol" className="text-right">Ativo</Label>
                        <select id="symbol" className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={symbol} onChange={e => setSymbol(e.target.value)}>
                            <option value="WIN">WIN (Índice)</option>
                            <option value="WDO">WDO (Dólar)</option>
                        </select>
                    </div>

                    {/* Quantidade & Custo */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="qty" className="text-right">Qtd</Label>
                        <div className="col-span-3 space-y-1">
                            <Input
                                id="qty"
                                type="number"
                                min="1"
                                max={maxContracts}
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                className={isQtyInvalid ? "border-red-500 focus-visible:ring-red-500" : ""}
                                required
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Max: {maxContracts}</span>
                                <span>Custo Est.: {formatCurrency(estimatedCost)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Lado */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Lado</Label>
                        <div className="col-span-3 flex gap-2">
                            <Button type="button" variant={side === "BUY" ? "default" : "outline"} className={`flex-1 ${side === "BUY" ? "bg-green-600 hover:bg-green-700" : ""} `} onClick={() => setSide("BUY")}>Compra</Button>
                            <Button type="button" variant={side === "SELL" ? "default" : "outline"} className={`flex-1 ${side === "SELL" ? "bg-red-600 hover:bg-red-700" : ""} `} onClick={() => setSide("SELL")}>Venda</Button>
                        </div>
                    </div>

                    {/* Pontos */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="points" className="text-right">Pontos</Label>
                        <Input id="points" type="number" step="0.5" placeholder="Ex: 150" value={resultPoints} onChange={(e) => setResultPoints(e.target.value)} className="col-span-3" required />
                    </div>

                    {/* Emocional */}
                    {/* Emocional & Upload - Grid de 2 colunas para melhor layout */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Sentimento</Label>
                            <select
                                id="emotional"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={emotionalStatus}
                                onChange={e => setEmotionalStatus(e.target.value)}
                            >
                                <option value="">Selecione...</option>
                                <option value="CONFIDENT">🎯 Confiante</option>
                                <option value="NEUTRAL">😐 Neutro</option>
                                <option value="ANXIOUS">😰 Ansioso</option>
                                <option value="FOMO">🏃 FOMO</option>
                                <option value="REVENGE">😡 Vingança</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Print do Gráfico</Label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex items-center justify-center w-full px-3 py-2 h-10 text-sm text-slate-400 bg-slate-900 border border-slate-700 rounded-md cursor-pointer hover:bg-slate-800 transition-colors truncate"
                                >
                                    <UploadCloud className="w-4 h-4 mr-2" />
                                    {selectedFile ? "Arquivo selecionado" : "Anexar"}
                                </label>
                            </div>
                            {selectedFile && <div className="text-[10px] text-emerald-500 truncate">{selectedFile.name}</div>}
                        </div>
                    </div>

                    {/* Compliance Checkbox */}
                    <div className="flex items-center space-x-2 pt-2 justify-end">
                        <Checkbox id="risk" checked={riskChecked} onCheckedChange={(c) => setRiskChecked(c as boolean)} />
                        <label htmlFor="risk" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-red-600">
                            Declaro que respeitei o Gerenciamento de Risco
                        </label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting || isQtyInvalid || !riskChecked}>
                            {isSubmitting ? "Salvando..." : "Salvar Trade"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
