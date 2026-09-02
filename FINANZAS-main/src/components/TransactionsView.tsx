import React, { useState } from 'react';
import {
  ReceiptText,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  User
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionModal } from './modals/TransactionModal';

export const TransactionsView: React.FC = () => {
  const { filteredTransactions, deleteTransaction, activeScope } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter list
  const txList = filteredTransactions.filter(tx => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || tx.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Extract unique categories for filter
  const categories = Array.from(new Set(filteredTransactions.map(t => t.category)));

  // Export to CSV
  const handleExportCSV = () => {
    if (txList.length === 0) return;

    const headers = ['ID', 'Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Pagado Por', 'Alcance'];
    const rows = txList.map(t => [
      t.transactionId,
      t.date,
      t.type,
      `"${t.category}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.userName || t.paidBy,
      t.scope,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transacciones_${activeScope}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-emerald-400" />
            <span>Registro de Transacciones</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Historial detallado de movimientos ({activeScope === 'individual' ? 'Mis Finanzas' : 'Finanzas Pareja'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Movimiento</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descripción o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e: any) => setSelectedType(e.target.value)}
          className="bg-slate-950 text-slate-200 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
        >
          <option value="all">Todos los Tipos (Ingresos y Gastos)</option>
          <option value="expense">Solo Gastos</option>
          <option value="income">Solo Ingresos</option>
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-950 text-slate-200 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
        >
          <option value="all">Todas las Categorías</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Transactions Table / Cards */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
        <div className="divide-y divide-slate-800">
          {txList.map(tx => {
            const payerName = (tx.paidBy && partner && (tx.paidBy === partner.uid || tx.paidBy === 'partner_1' || tx.paidBy === partner.inviteCode))
              ? (partner.displayName || 'Pareja')
              : (tx.paidBy && user && (tx.paidBy === user.uid || tx.paidBy === 'user_1' || tx.paidBy === user.inviteCode))
              ? (user.displayName || 'Tú')
              : (tx.userName || 'Pareja');

            return (
              <div key={tx.transactionId} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition">
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === 'income'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white">{tx.description}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                        {tx.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {tx.date}
                      </span>
                      {tx.scope === 'shared' && (
                        <span className="px-1.5 py-0.5 bg-pink-500/10 text-pink-400 rounded text-[10px] font-semibold border border-pink-500/20">
                          Pagado por {payerName} ({tx.splitMethod === '50_50' ? 'División 50/50' : 'Especial'})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className={`font-extrabold text-sm sm:text-base ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">{tx.scope}</div>
                </div>

                <button
                  onClick={() => {
                    if (confirm('¿Deseas eliminar este movimiento?')) {
                      deleteTransaction(tx.transactionId);
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="Eliminar movimiento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

          {txList.length === 0 && (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <ReceiptText className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm">No se encontraron movimientos con los filtros seleccionados.</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && <TransactionModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};
