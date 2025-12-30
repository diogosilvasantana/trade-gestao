# Atom Trade Manager 🚀

Um sistema completo de gestão de risco e performance focado em traders de mesa proprietária (especificamente desenhado para as regras da **Atom Educacional**). O sistema gerencia todo o ciclo de vida do trader, desde o treinamento, passando pela avaliação, até a gestão de conta real.

## 🌟 Funcionalidades Principais

### 1. Gestão de Ciclo de Vida (Lifecycle)
O sistema entende e acompanha as fases da sua carreira:
*   **Modo Treinamento**: Um ambiente seguro para praticar. Os trades importados antes da "Data de Início da Avaliação" são classificados como treinamento e não impactam suas metas oficiais. O Dashboard exibe "Fase de Preparação".
*   **Modo Avaliação**: Ativado automaticamente na data configurada. Monitora metas de aprovação (Financeiro Líquido) e limites de perda (Drawdown Global e Stop Diário).
*   **Aprovação & Mesa Real**: Ao atingir a meta, um botão de "Aprovação" habilita a transição para a Mesa Real.
*   **Ciclos Mensais**: Na Mesa Real, o sistema gerencia ciclos mensais (Ciclo 1, Ciclo 2, etc.), permitindo o acompanhamento de performance recorrente.

### 2. Simulação de Custos Reais (Atom/B3)
Para garantir que seu resultado no simulador reflita a realidade da mesa, o sistema aplica automaticamente os custos operacionais conforme tabela da Atom:
*   **WIN (Mini Índice)**: R$ 1,00 por contrato/ponta (Total R$ 2,00 por trade completo).
*   **WDO (Mini Dólar)**: R$ 1,50 por contrato/ponta (Total R$ 3,00 por trade completo).
*   *O Dashboard exibe claramente o Resultado Bruto, Custos Totais e Resultado Líquido.*

### 3. Dashboard Profissional
*   **Termômetro de Aprovação**: Acompanhe visualmente o quão perto você está da meta (ex: R$ 3.000,00 no Plano Prata).
*   **Gestão de Risco**: Alertas visuais se você estiver próximo do Limite de Perda Diária ou Max Drawdown.
*   **Estatísticas Detalhadas**: Curva de capital, taxa de acerto (Win Rate), Payoff, maior ganho, maior perda e dias consecutivos de gain/loss.

### 4. Importação de Dados
*   **ProfitChart Desktop**: Suporte nativo para importação de relatórios de performance via CSV (detalhado ou resumido). O sistema detecta automaticamente ativos, lados (compra/venda) e resultados.

---

## 🛠️ Stack Tecnológico

O projeto é construído com uma arquitetura moderna e separada (Frontend/Backend):

### Backend (API)
*   **Linguagem**: Python 3.9+
*   **Framework**: FastAPI (Alta performance e validação automática).
*   **Banco de Dados**: SQLite (Leve e portátil, arquivo `atom_manager.db`).
*   **ORM**: SQLAlchemy (Mapeamento objeto-relacional).

### Frontend (Interface)
*   **Framework**: React (com Vite para build rápido).
*   **Estilização**: Tailwind CSS (Design moderno e responsivo).
*   **Componentes**: Radix UI / Shadcn UI (Acessibilidade e beleza).
*   **Gráficos**: Recharts.

---

## 🚀 Como Rodar o Projeto

Pré-requisitos: Python 3+ e Node.js instalados.

### 1. Instalação do Backend
No terminal, navegue até a pasta `api`:
```bash
cd api
python -m venv ../.venv        # Criar ambiente virtual (apenas na 1ª vez)
source ../.venv/bin/activate   # Ativar ambiente (Mac/Linux)
# ..\.venv\Scripts\activate    # Ativar ambiente (Windows)
pip install -r requirements.txt
```

### 2. Instalação do Frontend
No terminal, navegue até a pasta `web`:
```bash
cd web
npm install
```

### 3. Executando a Aplicação
Você precisará de dois terminais abertos:

**Terminal 1 (Backend):**
```bash
cd api
source ../.venv/bin/activate
uvicorn main:app --reload
```
*A API rodará em: http://127.0.0.1:8000*

**Terminal 2 (Frontend):**
```bash
cd web
npm run dev
```
*O site abrirá em: http://localhost:5173 (ou similar)*

---

## 📚 Guia de Uso Rápido

1.  **Criar Plano**: Ao abrir pela primeira vez, selecione o plano desejado (ex: Atom Prata - Meta 3k, Max Loss 1.5k).
2.  **Definir Período**: Dê um nome ao seu período (ex: "Avaliação Janeiro") e defina a **Data de Início da Avaliação** (ex: 05/01/2026).
3.  **Operar/Importar**:
    *   Exporte seu relatório de performance do Profit (ferramenta: "Relatório de Performance" -> Botão direito na tabela -> "Exportar para CSV").
    *   No sistema, clique em "Importar Trades" e envie o arquivo.
4.  **Acompanhar**: O Dashboard atualizará automaticamente com seus resultados líquidos e progresso.

---

## ⚠️ Notas Importantes
*   **Custos**: O sistema assume que os valores importados do Profit são BRUTOS (ou configurados como tal) e aplica a taxa de custo da Atom "por cima" para calcular o Líquido Real.
*   **Fuso Horário**: O sistema opera localmente, respeitando o horário da sua máquina.

---

Desenvolvido para traders que levam a gestão a sério. 🦅
