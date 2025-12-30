import { useState } from "react";
import { format } from "date-fns";
import { Plan, PeriodCreate } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { formatCurrency } from "../lib/utils";
import { Badge } from "./ui/badge";
import { DatePicker } from "./ui/date-picker";

interface SetupWizardProps {
    plans: Plan[];
    onSelectPlan: (data: PeriodCreate) => Promise<void>;
}

export function SetupWizard({ plans, onSelectPlan }: SetupWizardProps) {
    const [step, setStep] = useState(1);
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [periodName, setPeriodName] = useState("");
    const [trainingStartDate, setTrainingStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [evalStartDate, setEvalStartDate] = useState("");
    const [loading, setLoading] = useState(false);

    const activePlan = plans.find(p => p.id === selectedPlanId);

    const handleSubmit = async () => {
        if (!selectedPlanId || !periodName || !evalStartDate) return;
        setLoading(true);
        await onSelectPlan({
            plan_id: selectedPlanId,
            name: periodName,
            training_start_date: trainingStartDate,
            eval_start_date: evalStartDate
        });
        setLoading(false);
    };

    return (
        <Card className="max-w-4xl mx-auto mt-10 shadow-lg animate-in fade-in slide-in-from-bottom-4">
            <CardHeader className="text-center border-b bg-muted/20 pb-8">
                <CardTitle className="text-3xl font-bold tracking-tight">Comece sua Jornada</CardTitle>
                <CardDescription className="text-lg">Configuração da Avaliação Atom</CardDescription>

                {/* Stepper */}
                <div className="flex justify-center gap-4 mt-6">
                    <div className={`h-2 w-20 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                    <div className={`h-2 w-20 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                    <div className={`h-2 w-20 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                </div>
            </CardHeader>
            <CardContent className="p-8">
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-semibold">1. Escolha seu Plano</h3>
                            <p className="text-muted-foreground">Selecione o plano adquirido para iniciar a avaliação.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {plans.map(plan => (
                                <div
                                    key={plan.id}
                                    className={`relative p-6 border rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 ${selectedPlanId === plan.id
                                        ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary ring-offset-2'
                                        : 'hover:border-primary/50 hover:bg-muted/50'
                                        }`}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                >
                                    {plan.name.includes("Expert") && (
                                        <Badge className="absolute -top-3 -right-3 bg-purple-600">Best Seller</Badge>
                                    )}
                                    <h4 className="font-bold text-lg mb-2">{plan.name}</h4>

                                    <div className="space-y-2 text-sm text-muted-foreground mt-4">
                                        <div className="flex justify-between border-b pb-1">
                                            <span>Meta</span>
                                            <span className="font-mono font-medium text-green-600">{formatCurrency(plan.target_profit)}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span>Loss Dia</span>
                                            <span className="font-mono font-medium text-red-500">{formatCurrency(plan.max_daily_loss)}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span>Max Loss</span>
                                            <span className="font-mono font-medium text-red-700">{formatCurrency(plan.max_drawdown)}</span>
                                        </div>
                                        <div className="flex justify-between pt-1">
                                            <span>Contratos</span>
                                            <span className="font-mono font-bold">{plan.max_leverage}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end mt-8">
                            <Button size="lg" disabled={!selectedPlanId} onClick={() => setStep(2)}>
                                Próximo: Configurar Período
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="max-w-md mx-auto space-y-6">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-semibold">2. Datas e Treinamento</h3>
                            <p className="text-muted-foreground">Defina quando começa seu treinamento e quando inicia a avaliação valendo.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label>Nome da Avaliação</Label>
                                <Input
                                    placeholder="Ex: Avaliação Janeiro 2024"
                                    value={periodName}
                                    onChange={e => setPeriodName(e.target.value)}
                                    className="h-12 text-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Início Treinamento</Label>
                                    <div className="mt-1">
                                        <DatePicker
                                            date={trainingStartDate ? new Date(trainingStartDate + 'T12:00:00') : undefined}
                                            setDate={(d) => setTrainingStartDate(d ? format(d, 'yyyy-MM-dd') : "")}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Trades aqui não contam para aprovação.</p>
                                </div>
                                <div>
                                    <Label className="text-primary font-bold">Início Avaliação Valendo</Label>
                                    <div className="mt-1">
                                        <DatePicker
                                            date={evalStartDate ? new Date(evalStartDate + 'T12:00:00') : undefined}
                                            setDate={(d) => setEvalStartDate(d ? format(d, 'yyyy-MM-dd') : "")}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">A partir daqui, regras valendo!</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between mt-8">
                            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                            <Button size="lg" disabled={!periodName || !evalStartDate} onClick={() => setStep(3)}>
                                Próximo: Confirmar
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && activePlan && (
                    <div className="max-w-md mx-auto space-y-6 text-center">
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold">3. Confirmar Detalhes</h3>
                            <p className="text-muted-foreground">Revise antes de iniciar.</p>
                        </div>

                        <div className="bg-muted/30 p-6 rounded-xl space-y-4 text-left border">
                            <div>
                                <h4 className="font-bold text-lg text-primary">{activePlan.name}</h4>
                                <div className="text-sm text-muted-foreground">{periodName}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-muted-foreground">Meta</span>
                                    <span className="font-bold text-green-600">{formatCurrency(activePlan.target_profit)}</span>
                                </div>
                                <div>
                                    <span className="block text-muted-foreground">Perda Diária</span>
                                    <span className="font-bold text-red-500">{formatCurrency(activePlan.max_daily_loss)}</span>
                                </div>
                                <div className="col-span-2 border-t pt-2 mt-2">
                                    <span className="block text-muted-foreground">Cronograma</span>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Treino: {new Date(trainingStartDate).toLocaleDateString()}</span>
                                        <span>➡️</span>
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Valendo: {new Date(evalStartDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between mt-8">
                            <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
                            <Button size="lg" onClick={handleSubmit} disabled={loading} className="w-full ml-4">
                                {loading ? "Criando..." : "🚀 Iniciar Jornada"}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
