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
import { useAuth } from '../context/AuthContext';
import { TransactionModal } from './modals/TransactionModal';
import { TransactionDetailsModal } from './modals/TransactionDetailsModal';
import { Transaction } from '../types';

import { getSplitBadgeText } from '../utils/splitUtils';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const TransactionsView: React.FC = () => {
  const { filteredTransactions, deleteTransaction, activeScope, members } = useFinance();
  const { user, partner } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDetailsTx, setSelectedDetailsTx] = useState<Transaction | null>(null);

  // Years present in the data, most recent first
  const years = Array.from(new Set<string>(filteredTransactions.map(t => (t.date || '').substring(0, 4)).filter(Boolean)))
    .sort((a, b) => b.localeCompare(a));

  const hasDateFilter = selectedYear !== 'all' || selectedMonth !== 'all' || dateFrom !== '' || dateTo !== '';
  const clearDateFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
    setDateFrom('');
    setDateTo('');
  };

  // Filter list
  const txList = filteredTransactions.filter(tx => {
    const date = tx.date || '';
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || tx.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;
    const matchesYear = selectedYear === 'all' || date.startsWith(selectedYear);
    const matchesMonth = selectedMonth === 'all' || date.substring(5, 7) === selectedMonth;
    const matchesFrom = !dateFrom || date >= dateFrom;
    const matchesTo = !dateTo || date <= dateTo;

    return matchesSearch && matchesType && matchesCategory && matchesYear && matchesMonth && matchesFrom && matchesTo;
  });

  const listIncome = txList.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const listExpense = txList.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

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

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-emerald-950/40"
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

        {/* Date filters: year, month and a custom range */}
        <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-800">
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-400">
            Año
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
            >
              <option value="all">Todos los años</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-400">
            Mes
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
            >
              <option value="all">Todos los meses</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-400">
            Desde
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none [color-scheme:dark]"
            />
          </label>

          <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-400">
            Hasta
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none [color-scheme:dark]"
            />
          </label>

          <div className="col-span-2 sm:col-span-1 flex items-end">
            <button
              type="button"
              onClick={clearDateFilters}
              disabled={!hasDateFilter}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Limpiar fechas
            </button>
          </div>
        </div>

        {/* Totals of the filtered list */}
        <div className="sm:col-span-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span>{txList.length} movimiento{txList.length === 1 ? '' : 's'}</span>
          <span>Ingresos: <strong className="text-emerald-400">+${listIncome.toFixed(2)}</strong></span>
          <span>Gastos: <strong className="text-rose-400">-${listExpense.toFixed(2)}</strong></span>
        </div>
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
              <div
                key={tx.transactionId}
                onClick={() => setSelectedDetailsTx(tx)}
                className="p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 hover:bg-slate-800/60 active:bg-slate-800/60 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${
                    tx.type === 'income'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-105'
                  }`}>
                    {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-sm sm:text-base text-white group-hover:text-pink-300 transition flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{tx.description}</span>
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                        {tx.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {tx.date}
                      </span>
                      {tx.scope === 'shared' && (
                        <span className="px-1.5 py-0.5 bg-pink-500/10 text-pink-400 rounded text-[10px] font-semibold border border-pink-500/20">
                          Pagado por {payerName} ({getSplitBadgeText(tx, members)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                  <div className="text-right whitespace-nowrap">
                    <div className={`font-extrabold text-sm sm:text-base ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-pink-400 font-bold capitalize">Ver Desglose 👁️</div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
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

      {selectedDetailsTx && (
        <TransactionDetailsModal
          tx={selectedDetailsTx}
          onClose={() => setSelectedDetailsTx(null)}
          onDelete={(id) => deleteTransaction(id)}
        />
      )}
    </div>
  );
};
