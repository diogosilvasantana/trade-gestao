import { useState } from "react";
import { Toaster, toaster } from "./components/ui/toaster";
import { SetupWizard } from "./components/SetupWizard";
import { useTradeData } from "./hooks/useTradeData";
import { TradeDialog } from "./components/TradeDialog";
import { Trade, TradeInput } from "./types";
import { DashboardTab } from "./components/tabs/DashboardTab";
import { CareerProvider } from "./context/CareerContext";
import { Sidebar, ViewState } from "./components/Sidebar";
import { DashboardStats } from "./components/DashboardStats";

function App() {
    const { days, loading, plans, activePeriod, addTrade, createPeriod, deleteTrade, editTrade } = useTradeData();
    const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
    const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
    const [editingTradeDate, setEditingTradeDate] = useState<string | undefined>(undefined);
    const [currentView, setCurrentView] = useState<ViewState>('dashboard');

    // Initial check for active period
    if (!activePeriod && !loading) {
        return (
            <div className="min-h-screen bg-background p-8 flex items-center justify-center">
                <SetupWizard plans={plans} onSelectPlan={createPeriod} />
                <Toaster />
            </div>
        );
    }

    // Handlers
    const handleEditTradeClick = async (_: number, data: Trade, date: string) => {
        setEditingTrade(data);
        setEditingTradeDate(date);
        setIsTradeDialogOpen(true);
    };

    const handleNewTradeClick = () => {
        setEditingTrade(null);
        setEditingTradeDate(undefined);
        setIsTradeDialogOpen(true);
    };

    const handleDeleteTrade = async (tradeId: number) => {
        try {
            await deleteTrade(tradeId);
            toaster.toast("Removido", "Trade excluído com sucesso", "default");
        } catch (error) {
            console.error(error);
            toaster.toast("Erro", "Falha ao excluir trade", "destructive");
        }
    };
    const handleTradeSubmit = async (data: TradeInput) => {
        try {
            if (editingTrade) {
                await editTrade(editingTrade.id, data);
                toaster.toast("Sucesso", "Trade atualizado", "success");
            } else {
                await addTrade(data);
                toaster.toast("Sucesso", "Trade criado", "success");
            }
            setIsTradeDialogOpen(false);
            setEditingTrade(null);
        } catch (error) {
            console.error(error);
            toaster.toast("Erro", "Falha ao salvar trade", "destructive");
        }
    };

    return (
        <CareerProvider>
            <div className="min-h-screen bg-[#0B0E14] text-slate-100 font-sans selection:bg-violet-500/30">
                {activePeriod && <Sidebar activeView={currentView} onNavigate={setCurrentView} />}

                <main className={`${activePeriod ? 'lg:ml-64' : ''} min-h-screen transition-all duration-300`}>
                    <div className="container mx-auto p-4 lg:p-8 space-y-8 max-w-7xl">

                        {/* Top Bar (Mobile/Title) */}
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-100">
                                    {currentView === 'dashboard' && 'Dashboard de Performance'}
                                    {currentView === 'history' && 'Histórico de Trades'}
                                    {currentView === 'analysis' && 'Análise de Evolução'}
                                    {currentView === 'settings' && 'Configurações'}
                                </h1>
                                <p className="text-slate-500 text-sm">Gerencie seu risco e evolua seu plano.</p>
                            </div>
                        </div>

                        {!activePeriod ? (
                            <div className="max-w-2xl mx-auto mt-20">
                                <SetupWizard
                                    plans={plans}
                                    onSelectPlan={createPeriod}
                                />
                            </div>
                        ) : (
                            <div className="space-y-8">

                                {currentView === 'dashboard' && (
                                    <>
                                        <DashboardStats />
                                        <DashboardTab
                                            days={days}
                                            onNewTrade={handleNewTradeClick}
                                            onEditTrade={handleEditTradeClick}
                                            onDeleteTrade={handleDeleteTrade}
                                        />
                                    </>
                                )}

                                {currentView === 'history' && (
                                    <DashboardTab
                                        days={days}
                                        onNewTrade={handleNewTradeClick}
                                        onEditTrade={handleEditTradeClick}
                                        onDeleteTrade={handleDeleteTrade}
                                    />
                                )}

                                {currentView === 'analysis' && (
                                    <div className="p-8 text-center text-slate-500 bg-[#151A25] rounded-xl border border-slate-800/50 border-dashed">
                                        <h3 className="text-lg font-medium text-slate-300 mb-2">Análise de Performance</h3>
                                        Em breve: Gráficos e Curva de Equity.
                                    </div>
                                )}

                                {currentView === 'settings' && (
                                    <div className="p-8 text-center text-slate-500 bg-[#151A25] rounded-xl border border-slate-800/50 border-dashed">
                                        <h3 className="text-lg font-medium text-slate-300 mb-2">Configurações</h3>
                                        Em breve: Gerenciamento da conta e plano.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* Global Dialogs */}
                <TradeDialog
                    isOpen={isTradeDialogOpen}
                    onClose={() => {
                        setIsTradeDialogOpen(false);
                        setEditingTrade(null);
                    }}
                    onSubmit={handleTradeSubmit}
                    initialData={editingTrade}
                    defaultDate={editingTradeDate || new Date().toISOString().split('T')[0]}
                    activePeriod={activePeriod}
                />
                <Toaster />
            </div>
        </CareerProvider>
    );
}

export default App;
