import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Badge } from './badge';

type ToastType = 'success' | 'destructive' | 'default';

let addToastHandler: ((title: string, desc: string, type: ToastType) => void) | null = null;

export const toaster = {
    toast: (title: string, description: string, type: ToastType = 'default') => {
        if (addToastHandler) addToastHandler(title, description, type);
    }
};

export function Toaster() {
    const [toasts, setToasts] = useState<Array<{ id: number, title: string, desc: string, type: ToastType }>>([]);

    useEffect(() => {
        addToastHandler = (title, desc, type) => {
            const id = Date.now();
            setToasts(prev => [...prev, { id, title, desc, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 5000);
        };
        return () => { addToastHandler = null; };
    }, []);

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
            {toasts.map(t => (
                <div key={t.id} className={cn(
                    "bg-background border rounded-lg shadow-lg p-4 flex flex-col gap-1",
                    t.type === 'destructive' && "border-destructive text-destructive",
                    t.type === 'success' && "border-green-500 text-green-700"
                )}>
                    <div className="font-semibold">{t.title}</div>
                    <div className="text-sm opacity-90">{t.desc}</div>
                </div>
            ))}
        </div>
    );
}
