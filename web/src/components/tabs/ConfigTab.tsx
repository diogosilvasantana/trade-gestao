import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TradePeriod } from "../../types";

interface ConfigTabProps {
    activePeriod: TradePeriod | null;
}

export function ConfigTab({ activePeriod }: ConfigTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Configurações da Conta</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Periodo Ativo: {activePeriod?.name || 'Nenhum'}</p>
                {/* Future: Reset Data, Change Plan helpers */}
            </CardContent>
        </Card>
    );
}
