import { AuditTable } from "../AuditTable";
import { TradeDay, Trade } from "../../types";

interface ReportsTabProps {
    days: TradeDay[];
    onDelete: (tradeId: number) => Promise<void>;
    onEdit: (tradeId: number, data: Trade, date: string) => Promise<void>;
}

export function ReportsTab({ days, onDelete, onEdit }: ReportsTabProps) {
    return (
        <>
            <div className="flex items-center justify-between mb-4 mt-2">
                <h2 className="text-xl font-semibold">Diário de Trades</h2>
            </div>
            <AuditTable
                days={days}
                onDelete={onDelete}
                onEdit={onEdit}
            />
        </>
    );
}
