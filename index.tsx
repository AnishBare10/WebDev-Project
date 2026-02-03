import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  PlusCircle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  Download, 
  Trash2, 
  Search,
  ChevronDown,
  PieChart as PieIcon,
  TrendingUp,
  Activity,
  Target,
  Layers,
  Edit3,
  Plus,
  X,
  FileSpreadsheet,
  Filter
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Types
type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

interface SavingGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
}

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Dividends', 'Gift', 'Other'],
  expense: ['Groceries', 'Rent/Bills', 'Transport', 'Dining', 'Shopping', 'Healthcare', 'UPI/Online', 'Education', 'Investment']
};

const GOAL_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#ec4899'];

const RUPEE_FORMAT = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const App = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('rupee-wise-data-v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<SavingGoal[]>(() => {
    const saved = localStorage.getItem('rupee-wise-goals');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Emergency Fund', target: 500000, current: 125000, color: '#8b5cf6' },
      { id: '2', name: 'New Car', target: 1200000, current: 450000, color: '#3b82f6' }
    ];
  });

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Goal Modal State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalColor, setGoalColor] = useState(GOAL_COLORS[0]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('rupee-wise-data-v2', JSON.stringify(transactions));
    localStorage.setItem('rupee-wise-goals', JSON.stringify(goals));
  }, [transactions, goals]);

  // Financial Stats
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const inc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { totalIncome: inc, totalExpense: exp, balance: inc - exp };
  }, [transactions]);

  const filteredTransactions = transactions
    .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Chart Logic
  const lineData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    });

    return {
      labels: last7Days,
      datasets: [
        {
          label: 'Inflow',
          data: last7Days.map(label => transactions
            .filter(t => t.type === 'income' && new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) === label)
            .reduce((s, t) => s + t.amount, 0)),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          fill: true,
          tension: 0.5,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Outflow',
          data: last7Days.map(label => transactions
            .filter(t => t.type === 'expense' && new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) === label)
            .reduce((s, t) => s + t.amount, 0)),
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.05)',
          fill: true,
          tension: 0.5,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    };
  }, [transactions]);

  const doughnutData = useMemo(() => {
    const dataMap = new Map();
    transactions.filter(t => t.type === type).forEach(t => {
      dataMap.set(t.category, (dataMap.get(t.category) || 0) + t.amount);
    });

    return {
      labels: Array.from(dataMap.keys()),
      datasets: [{
        data: Array.from(dataMap.values()),
        backgroundColor: ['#581c87', '#3b82f6', '#f43f5e', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#94a3b8'],
        borderWidth: 0,
        hoverOffset: 15
      }]
    };
  }, [transactions, type]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      description,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date().toISOString()
    };
    setTransactions([newTx, ...transactions]);
    setDescription(''); setAmount(''); setShowForm(false);
  };

  const exportCSV = () => {
    const csv = [['Date', 'Description', 'Category', 'Type', 'Amount'], ...transactions.map(t => [new Date(t.date).toLocaleDateString(), t.description, t.category, t.type, t.amount])].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'RupeeWise_Elite_Report.csv'; a.click();
  };

  const openGoalModal = (goal?: SavingGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalName(goal.name);
      setGoalTarget(goal.target.toString());
      setGoalCurrent(goal.current.toString());
      setGoalColor(goal.color);
    } else {
      setEditingGoal(null);
      setGoalName('');
      setGoalTarget('');
      setGoalCurrent('0');
      setGoalColor(GOAL_COLORS[0]);
    }
    setShowGoalModal(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const goalData: SavingGoal = {
      id: editingGoal ? editingGoal.id : crypto.randomUUID(),
      name: goalName,
      target: parseFloat(goalTarget),
      current: parseFloat(goalCurrent) || 0,
      color: goalColor
    };

    if (editingGoal) {
      setGoals(goals.map(g => g.id === goalData.id ? goalData : g));
    } else {
      setGoals([...goals, goalData]);
    }
    setShowGoalModal(false);
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const addGoalFunds = (id: string) => {
    const val = prompt("Enter amount to contribute to this goal (INR):");
    if (!val || isNaN(parseFloat(val))) return;
    
    setGoals(goals.map(g => {
      if (g.id === id) {
        return { ...g, current: Math.min(g.target, g.current + parseFloat(val)) };
      }
      return g;
    }));
  };

  return (
    <div className="min-h-screen pb-12 bg-[#fafafa]">
      {/* Navigation */}
      <nav className="h-20 flex items-center justify-between px-6 sm:px-12 bg-white/70 backdrop-blur-2xl sticky top-0 z-40 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
            <Layers className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">RUPEEWISE</h1>
            <span className="text-[9px] font-black uppercase text-purple-600 tracking-[0.2em] mt-1 block">ASSET LEDGER</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={exportCSV}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            EXPORT DATA
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-purple-900 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-xl shadow-slate-200"
          >
            <PlusCircle className="w-4 h-4" />
            NEW ENTRY
          </button>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 lg:px-12 py-10 space-y-8">
        
        {/* ROW 1: WALLET, CREDIT, DEBIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Wallet Balance Card */}
          <div className="lg:col-span-6 bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group border border-white/5 card-shadow flex flex-col justify-center min-h-[220px]">
             <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Wallet className="w-64 h-64 text-purple-400" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 mb-2">TOTAL WALLET BALANCE</p>
              <h2 className="text-5xl font-black tracking-tighter tabular-nums">
                {RUPEE_FORMAT.format(balance)}
              </h2>
              <div className="mt-6 flex gap-3">
                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">SYSTEM OPERATIONAL</span>
                </div>
                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">ACTIVE TRACKING</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Credit Card */}
          <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 card-shadow flex flex-col justify-center text-center">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ArrowUpCircle className="w-7 h-7" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">MONTHLY CREDITS</p>
            <h4 className="text-3xl font-black text-slate-900 tabular-nums">{RUPEE_FORMAT.format(totalIncome)}</h4>
          </div>

          {/* Monthly Debit Card */}
          <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 card-shadow flex flex-col justify-center text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ArrowDownCircle className="w-7 h-7" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">MONTHLY DEBITS</p>
            <h4 className="text-3xl font-black text-slate-900 tabular-nums">{RUPEE_FORMAT.format(totalExpense)}</h4>
          </div>
        </div>

        {/* ROW 2: SAVINGS GOALS */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 card-shadow w-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-md font-black text-slate-900 uppercase flex items-center gap-3">
              <Target className="w-5 h-5 text-purple-600" />
              STRATEGIC SAVINGS GOALS
            </h3>
            <button 
              onClick={() => openGoalModal()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-purple-900 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              NEW STRATEGY
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {goals.length > 0 ? goals.map(goal => (
              <div key={goal.id} className="group p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{goal.name}</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{RUPEE_FORMAT.format(goal.current)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => openGoalModal(goal)} className="p-2 text-slate-400 hover:text-purple-600"><Edit3 className="w-3.5 h-3.5" /></button>
                     <button onClick={() => deleteGoal(goal.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%`, backgroundColor: goal.color }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                  <span className="text-slate-500">{Math.round((goal.current / goal.target) * 100)}% PROGRESS</span>
                  <button onClick={() => addGoalFunds(goal.id)} className="text-purple-600 hover:text-purple-800 underline underline-offset-4">CONTRIBUTE</button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-12 text-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[2.5rem] uppercase font-black text-xs tracking-widest">
                NO ACTIVE SAVINGS STRATEGIES FOUND.
              </div>
            )}
          </div>
        </div>

        {/* ROW 3: ASSET PERFORMANCE & CAPITAL BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Asset Performance Card */}
          <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 card-shadow flex flex-col min-h-[450px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-md font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  ASSET PERFORMANCE
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">REAL-TIME FINANCIAL TRAJECTORY</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> CREDITS</div>
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> DEBITS</div>
              </div>
            </div>
            <div className="flex-grow h-full w-full">
              <Line 
                data={lineData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#1e293b',
                      padding: 12,
                      titleFont: { size: 11, weight: 800 },
                      bodyFont: { size: 11, weight: 600 }
                    }
                  },
                  scales: {
                    y: { grid: { color: '#f8fafc' }, border: { display: false }, ticks: { font: { weight: 700, size: 10 }, color: '#94a3b8' } },
                    x: { grid: { display: false }, border: { display: false }, ticks: { font: { weight: 700, size: 10 }, color: '#94a3b8' } }
                  }
                }} 
              />
            </div>
          </div>

          {/* Capital Breakdown Card */}
          <div className="lg:col-span-4 bg-white p-10 rounded-[2.5rem] border border-slate-100 card-shadow flex flex-col">
            <h3 className="text-md font-black text-slate-900 mb-8 uppercase flex items-center gap-3">
              <PieIcon className="w-5 h-5 text-purple-600" />
              CAPITAL BREAKDOWN
            </h3>
            <div className="flex-grow relative min-h-[300px]">
              {transactions.length > 0 ? (
                <Doughnut 
                  data={doughnutData} 
                  options={{ 
                    maintainAspectRatio: false, 
                    cutout: '82%',
                    plugins: { legend: { display: false } }
                  }} 
                />
              ) : (
                 <div className="flex items-center justify-center h-full opacity-10"><PieIcon className="w-24 h-24" /></div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ACTIVE TYPE</span>
                <span className="text-lg font-black text-slate-900 uppercase">{type === 'expense' ? 'DEBIT' : 'CREDIT'}</span>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-50 pt-8">
              {doughnutData.labels.slice(0, 4).map((l, i) => (
                <div key={l} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: doughnutData.datasets[0].backgroundColor[i] as string }}></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase truncate tracking-tighter">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 4: AUDIT HISTORY */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 card-shadow overflow-hidden flex flex-col w-full">
          <div className="p-8 border-b border-slate-50 bg-slate-50/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h3 className="text-md font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                AUDIT HISTORY
              </h3>
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="FILTER ENTRIES..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-purple-500/5 transition-all outline-none shadow-sm"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">DATE</th>
                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">DESCRIPTION</th>
                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">CATEGORY</th>
                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">TYPE</th>
                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">AMOUNT (₹)</th>
                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">DELETE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-10 py-6 text-[11px] font-bold text-slate-500 tabular-nums uppercase">
                      {new Date(t.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'}).toUpperCase()}
                    </td>
                    <td className="px-10 py-6 text-[13px] font-bold text-slate-900 uppercase">{t.description}</td>
                    <td className="px-10 py-6">
                      <span className="px-3.5 py-1.5 bg-slate-100 rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${t.type === 'income' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">{t.type}</span>
                      </div>
                    </td>
                    <td className={`px-10 py-6 text-[13px] font-black tabular-nums text-right ${t.type === 'income' ? 'text-blue-600' : 'text-slate-900'}`}>
                      {t.type === 'income' ? '+' : '-'} {RUPEE_FORMAT.format(t.amount)}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button 
                        onClick={() => setTransactions(transactions.filter(x => x.id !== t.id))}
                        className="text-slate-300 hover:text-rose-600 transition-colors p-2.5 rounded-xl hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-10 py-24 text-center">
                      <div className="opacity-20 flex flex-col items-center">
                        <Filter className="w-14 h-14 mb-5" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">ZERO AUDIT ACTIVITIES DETECTED</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 card-shadow">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative">
              <div className="absolute top-[-50%] left-[-20%] w-96 h-96 bg-purple-600/10 rounded-full blur-[80px]"></div>
              <div>
                <h3 className="text-2xl font-black tracking-tight relative z-10 uppercase">Record Entry</h3>
                <p className="text-[10px] font-black uppercase text-purple-400 tracking-[0.4em] mt-2 relative z-10">SECURED NODE</p>
              </div>
              <button onClick={() => setShowForm(false)} className="hover:bg-white/10 p-3 rounded-2xl transition-colors relative z-10 border border-white/10">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-10 space-y-10">
              <div className="flex bg-slate-100 p-2 rounded-[2rem]">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory(CATEGORIES.expense[0]); }}
                  className={`flex-1 py-4 rounded-[1.75rem] text-[11px] font-black tracking-widest transition-all ${type === 'expense' ? 'bg-white shadow-lg text-rose-600' : 'text-slate-400'}`}
                >DEBIT</button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory(CATEGORIES.income[0]); }}
                  className={`flex-1 py-4 rounded-[1.75rem] text-[11px] font-black tracking-widest transition-all ${type === 'income' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-400'}`}
                >CREDIT</button>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">TRANSACTION MEMO</label>
                  <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.75rem] focus:ring-4 focus:ring-purple-500/10 font-bold text-slate-900 outline-none uppercase placeholder:text-slate-300" placeholder="E.G. ASSET ACQUISITION" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">MAGNITUDE (₹)</label>
                    <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.75rem] font-black text-slate-900 outline-none" placeholder="0" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">CLASS</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-5 py-5 bg-slate-50 border-none rounded-[1.75rem] font-bold text-slate-900 outline-none appearance-none uppercase">
                      {CATEGORIES[type].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-purple-900 text-white font-black py-6 rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-4 hover:-translate-y-1">
                <PlusCircle className="w-6 h-6 text-purple-400" />
                <span>FINALIZE RECORD</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 card-shadow">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight uppercase">{editingGoal ? 'OPTIMIZE GOAL' : 'NEW STRATEGIC GOAL'}</h3>
                <p className="text-[10px] font-black uppercase text-purple-400 tracking-[0.4em] mt-2">PROJECTION BUILDER</p>
              </div>
              <button onClick={() => setShowGoalModal(false)} className="hover:bg-white/10 p-3 rounded-2xl border border-white/10"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveGoal} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">STRATEGY NAME</label>
                  <input type="text" required value={goalName} onChange={(e) => setGoalName(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.75rem] font-bold text-slate-900 outline-none uppercase" placeholder="E.G. DREAM VENTURE" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">TARGET MAGNITUDE (₹)</label>
                    <input type="number" required value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.75rem] font-black text-slate-900 outline-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">INITIAL RESERVES (₹)</label>
                    <input type="number" value={goalCurrent} onChange={(e) => setGoalCurrent(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.75rem] font-black text-slate-900 outline-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">BRAND IDENTITY</label>
                  <div className="flex gap-4">
                    {GOAL_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setGoalColor(c)} className={`w-11 h-11 rounded-2xl border-4 transition-all ${goalColor === c ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent opacity-60'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-purple-900 text-white font-black py-6 rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-4 hover:-translate-y-1 uppercase">
                <Target className="w-6 h-6 text-purple-400" />
                <span>SAVE STRATEGY</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);