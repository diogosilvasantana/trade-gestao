import {
    LayoutDashboard,
    History,
    Settings,
    TrendingUp
} from "lucide-react";

export type ViewState = 'dashboard' | 'history' | 'analysis' | 'settings';

interface SidebarProps {
    activeView: ViewState;
    onNavigate: (view: ViewState) => void;
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
    return (
        <aside className="w-20 lg:w-64 border-r border-slate-800/50 bg-[#0F1219] flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300">
            {/* Logo */}
            <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800/50">
                <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-900/20">
                    AM
                </div>
                <span className="hidden lg:block ml-4 font-bold text-slate-100 tracking-tight text-lg">
                    Atom V2
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-8 flex flex-col gap-2 px-3">
                <NavItem
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                    active={activeView === 'dashboard'}
                    onClick={() => onNavigate('dashboard')}
                />
                <NavItem
                    icon={<History size={20} />}
                    label="Histórico"
                    active={activeView === 'history'}
                    onClick={() => onNavigate('history')}
                />
                <NavItem
                    icon={<TrendingUp size={20} />}
                    label="Análise"
                    active={activeView === 'analysis'}
                    onClick={() => onNavigate('analysis')}
                />
                <div className="flex-1" />
                <NavItem
                    icon={<Settings size={20} />}
                    label="Configurações"
                    active={activeView === 'settings'}
                    onClick={() => onNavigate('settings')}
                />
            </nav>

            {/* User Profile (Mini) */}
            <div className="p-4 border-t border-slate-800/50">
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-medium text-slate-400">
                        US
                    </div>
                    <div className="hidden lg:block">
                        <p className="text-sm font-medium text-slate-200">Trader</p>
                        <p className="text-xs text-slate-500">Pro Plan</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group w-full
                ${active
                    ? 'bg-violet-500/10 text-violet-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }
                justify-center lg:justify-start
            `}
        >
            <span className={`${active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {icon}
            </span>
            <span className="hidden lg:block">{label}</span>
        </button>
    )
}
