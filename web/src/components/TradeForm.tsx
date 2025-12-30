import { useState } from "react";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { DatePicker } from "./ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toaster } from "./ui/toaster";
import { TradeInput } from "../types";

interface TradeFormProps {
    onAddTrade: (trade: TradeInput) => Promise<any>;
}

export function TradeForm({ onAddTrade }: TradeFormProps) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [symbol, setSymbol] = useState("WIN");
    const [quantity, setQuantity] = useState("1"); // Changed from qty to quantity
    const [resultPoints, setResultPoints] = useState("");
    const [side, setSide] = useState<"BUY" | "SELL">("BUY");
    const [loading, setLoading] = useState(false); // Changed from isSubmitting to loading

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resultPoints || !quantity) return; // Added check for empty fields

        setLoading(true); // Changed from setIsSubmitting to setLoading

        try {
            const points = parseFloat(resultPoints);
            const qtyParsed = parseInt(quantity); // Changed from quantity to qtyParsed

            if (isNaN(points) || isNaN(qtyParsed)) throw new Error("Dados inválidos");

            await onAddTrade({
                date,
                symbol,
                quantity: qtyParsed, // Used qtyParsed
                side,
                result_points: points
            });

            toaster.toast("Trade Registrado", `${symbol} ${qtyParsed} ctr: ${points} pts`, "success");
            setResultPoints("");
        } catch (err: any) {
            toaster.toast("Erro", err.message, "destructive");
            console.error(err); // Added console.error for debugging
        } finally {
            setLoading(false); // Changed from setIsSubmitting to setLoading
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Registrar Novo Trade</CardTitle> {/* Updated CardTitle */}
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2"> {/* Added space-y-2 for consistency */}
                        <Label>Data do Trade</Label> {/* Updated Label text */}
                        <DatePicker
                            date={date ? new Date(date + 'T12:00:00') : undefined}
                            setDate={(d) => setDate(d ? format(d, 'yyyy-MM-dd') : "")}
                        />
                    </div>

                    <div className="flex gap-4">

                        <div className="w-1/3">
                            <Label>Ativo</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={symbol}
                                onChange={e => setSymbol(e.target.value)}
                            >
                                <option value="WIN">WIN (Índice)</option>
                                <option value="WDO">WDO (Dólar)</option>
                            </select>
                        </div>
                        <div className="w-1/3">
                            <Label>Qtd</Label>
                            <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                        </div>
                        <div className="w-1/3">
                            <Label>Lado</Label>
                            <div className="flex gap-1 h-10">
                                <Button
                                    type="button"
                                    variant={side === "BUY" ? "default" : "secondary"}
                                    className={`w-full ${side === "BUY" ? "bg-green-600 hover:bg-green-700" : ""}`}
                                    onClick={() => setSide("BUY")}
                                >C</Button>
                                <Button
                                    type="button"
                                    variant={side === "SELL" ? "default" : "secondary"}
                                    className={`w-full ${side === "SELL" ? "bg-red-600 hover:bg-red-700" : ""}`}
                                    onClick={() => setSide("SELL")}
                                >V</Button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label>Resultado (Pontos)</Label>
                        <Input
                            type="number"
                            step="0.5"
                            placeholder="Ex: 150 ou -100"
                            value={resultPoints}
                            onChange={e => setResultPoints(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            WIN: 1 pt = R$ 0,20 | WDO: 1 pt = R$ 10,00
                        </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Gravando..." : "Registrar Trade"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
