import React, { createContext, useContext, useState, useEffect } from 'react';
import { CAREER_LEVELS, CareerLevel, CareerLevelId } from '../config/career-rules';

// Types
interface CareerContextType {
    currentLevel: CareerLevel;
    accumulatedBalance: number; // In the current level
    careerHistory: any[]; // Placeholder for now
    promote: () => void;
    canPromote: boolean;
    setLevel: (levelId: CareerLevelId) => void;
}

const CareerContext = createContext<CareerContextType | undefined>(undefined);

export function CareerProvider({ children }: { children: React.ReactNode }) {
    // Persistent state could be loaded from backend, defaulting to Eval Prata as requested
    const [currentLevelId, setCurrentLevelId] = useState<CareerLevelId>('EVALUATION_PRATA');
    const [accumulatedBalance, setAccumulatedBalance] = useState(0);

    // Derived
    const currentLevel = CAREER_LEVELS[currentLevelId];
    const canPromote = currentLevel.target !== null && accumulatedBalance >= currentLevel.target;

    // Load initial balance/level from API would go here
    // useEffect(() => { ... fetch from /api/career ... }, [])

    const promote = () => {
        if (canPromote && currentLevel.nextLevelId) {
            // Logic to archive current period and start new one
            console.log("Promoting to:", currentLevel.nextLevelId);
            setCurrentLevelId(currentLevel.nextLevelId);
            setAccumulatedBalance(0); // Reset balance for new level? Usually yes.
            // TODO: Call API to persist promotion
        }
    };

    const setLevel = (id: CareerLevelId) => {
        if (CAREER_LEVELS[id]) {
            setCurrentLevelId(id);
        }
    };

    // Helper to update balance from outside (e.g. valid days)
    // For now we might just fetch it.

    return (
        <CareerContext.Provider value={{
            currentLevel,
            accumulatedBalance,
            careerHistory: [],
            promote,
            canPromote,
            setLevel
        }}>
            {children}
        </CareerContext.Provider>
    );
}

export function useCareer() {
    const context = useContext(CareerContext);
    if (context === undefined) {
        throw new Error('useCareer must be used within a CareerProvider');
    }
    return context;
}
