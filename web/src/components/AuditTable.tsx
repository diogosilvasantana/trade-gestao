import { useState } from "react";
import { TradeDay, Trade } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { cn, formatCurrency } from "../lib/utils";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

interface AuditTableProps {
    days: TradeDay[];
    onDelete: (tradeId: number) => Promise<void>;
    onEdit: (tradeId: number, data: Trade, date: string) => Promise<void>;
}

export function AuditTable({ days, onDelete, onEdit }: AuditTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Bruto</TableHead>
                        <TableHead className="text-right">Líquido</TableHead>
                        <TableHead className="text-center">Trades</TableHead>
                        <TableHead className="hidden md:table-cell">Obs</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {days.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                Nenhum registro encontrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        days.map((day) => (
                            <DayRow key={day.id} day={day} onDelete={onDelete} onEdit={onEdit} />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function DayRow({ day, onDelete, onEdit }: { day: TradeDay, onDelete: (id: number) => Promise<void>, onEdit: (id: number, data: Trade, date: string) => Promise<void> }) {
    const [isOpen, setIsOpen] = useState(false);
    const [tradeToDelete, setTradeToDelete] = useState<number | null>(null);

    const handleDeleteClick = (tradeId: number) => {
        setTradeToDelete(tradeId);
    };

    const confirmDelete = async () => {
        if (tradeToDelete) {
            await onDelete(tradeToDelete);
            setTradeToDelete(null);
        }
    };

    return (
        <>
            <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setIsOpen(!isOpen)}>
                <TableCell>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                </TableCell>
                <TableCell className="font-medium">{day.date}</TableCell>
                <TableCell>
                    <StatusBadge status={day.status} />
                </TableCell>
                <TableCell className="text-right">{formatCurrency(day.gross_result)}</TableCell>
                <TableCell className={cn("text-right font-bold", day.net_result >= 0 ? "text-green-600" : "text-red-600")}>
                    {formatCurrency(day.net_result)}
                </TableCell>
                <TableCell className="text-center">{day.trade_count}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[200px]">
                    {day.notes}
                </TableCell>
            </TableRow>
            {isOpen && (
                <TableRow className="bg-muted/30">
                    <TableCell colSpan={7} className="p-0">
                        <div className="p-4 pl-12">
                            <h4 className="text-sm font-semibold mb-2">Trades do Dia</h4>
                            {day.trades.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Nenhum trade registrado.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="h-8 border-none bg-muted/50">
                                            <TableHead className="h-8">Ativo</TableHead>
                                            <TableHead className="h-8">C/V</TableHead>
                                            <TableHead className="h-8 text-right">Qtd</TableHead>
                                            <TableHead className="h-8 text-right">Pts</TableHead>
                                            <TableHead className="h-8 text-right">Bruto</TableHead>
                                            <TableHead className="h-8 text-right">Taxas</TableHead>
                                            <TableHead className="h-8 text-right">Líquido</TableHead>
                                            <TableHead className="h-8 text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {day.trades.map((trade) => (
                                            <TableRow key={trade.id} className="h-8 border-none">
                                                <TableCell className="py-1">{trade.symbol}</TableCell>
                                                <TableCell className="py-1">
                                                    <Badge variant={trade.side === "BUY" ? "outline" : "secondary"} className={trade.side === "BUY" ? "text-green-600 border-green-600" : "text-red-600"}>
                                                        {trade.side === "BUY" ? "C" : "V"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-1 text-right">{trade.quantity || 1}</TableCell>
                                                <TableCell className="py-1 text-right">{trade.result_points || 0}</TableCell>
                                                <TableCell className="py-1 text-right text-muted-foreground">
                                                    {formatCurrency(trade.result_brl || 0)}
                                                </TableCell>
                                                <TableCell className="py-1 text-right text-red-400">
                                                    - {formatCurrency(trade.cost || 0)}
                                                </TableCell>
                                                <TableCell className={cn("py-1 text-right font-medium", (trade.net_result || 0) >= 0 ? "text-green-600" : "text-red-600")}>
                                                    {formatCurrency(trade.net_result || 0)}
                                                </TableCell>
                                                <TableCell className="py-1 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(trade.id, trade, day.date); }}>
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteClick(trade.id); }}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}

            <Dialog open={!!tradeToDelete} onOpenChange={(open: boolean) => !open && setTradeToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Trade?</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir este trade? Essa ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTradeToDelete(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "WIN":
            return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">META BATIDA</Badge>;
        case "LOSS":
            return <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 border-rose-200 hover:bg-rose-500/20 shadow-none border">LOSS DIA</Badge>;
        case "BE":
            return <Badge variant="secondary" className="bg-slate-100 text-slate-600">0x0 (BE)</Badge>;
        case "VIOLATION":
            return <Badge variant="destructive">VIOLAÇÃO</Badge>;
        default:
            return <Badge variant="outline" className="text-muted-foreground">{status}</Badge>;
    }
}
