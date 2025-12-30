export type CareerLevelId = 'TRAINING' | 'EVALUATION_PRATA' | 'REAL_BRONZE' | 'REAL_PRATA' | 'REAL_RUBI';

export interface CareerLevel {
    id: CareerLevelId;
    name: string;
    type: 'SIMULATION' | 'EVALUATION' | 'REAL';
    minDays: number;
    target: number | null; // Null if no target (e.g. Training, or top level if infinite)
    maxDailyLoss: number;
    maxDrawdown: number;
    maxContracts: number;
    platformCost: number; // Monthly cost
    nextLevelId: CareerLevelId | null;
}

export const CAREER_LEVELS: Record<CareerLevelId, CareerLevel> = {
    TRAINING: {
        id: 'TRAINING',
        name: 'Treinamento',
        type: 'SIMULATION',
        minDays: 10,
        target: null,
        maxDailyLoss: Infinity,
        maxDrawdown: Infinity,
        maxContracts: 100,
        platformCost: 0,
        nextLevelId: 'EVALUATION_PRATA'
    },
    EVALUATION_PRATA: {
        id: 'EVALUATION_PRATA',
        name: 'Avaliação Prata',
        type: 'EVALUATION',
        minDays: 10,
        target: 3000,
        maxDailyLoss: 750,
        maxDrawdown: 1500,
        maxContracts: 10, // Recommended 3, but rule says 10
        platformCost: 0,
        nextLevelId: 'REAL_BRONZE' // Assuming Bronze is next after passing Prata Eval
    },
    REAL_BRONZE: {
        id: 'REAL_BRONZE',
        name: 'Mesa Real Bronze',
        type: 'REAL',
        minDays: 5,
        target: 2000,
        maxDailyLoss: 1000,
        maxContracts: 5,
        maxDrawdown: 1500, // Inherited or defined? Assuming same base risk or scaled. Let's keep 1500 strict.
        platformCost: 179,
        nextLevelId: 'REAL_PRATA'
    },
    REAL_PRATA: {
        id: 'REAL_PRATA',
        name: 'Mesa Real Prata',
        type: 'REAL',
        minDays: 10,
        target: 3000,
        maxDailyLoss: 1500,
        maxContracts: 10,
        maxDrawdown: 3000, // Usually scales roughly with daily loss x 2 or similar. Assuming 3000.
        platformCost: 179,
        nextLevelId: 'REAL_RUBI'
    },
    REAL_RUBI: {
        id: 'REAL_RUBI',
        name: 'Mesa Real Rubi',
        type: 'REAL',
        minDays: 10,
        target: 3500,
        maxDailyLoss: 1750,
        maxContracts: 13,
        maxDrawdown: 3500, // Assumption
        platformCost: 179,
        nextLevelId: null // Top level for now
    }
};

export const OPERATIONAL_COSTS = {
    WIN: 1.00, // Per contract per side -> R$ 2.00 round trip
    WDO: 1.50, // Per contract per side -> R$ 3.00 round trip
    PLATFORM_MONTHLY: 179.00
};
