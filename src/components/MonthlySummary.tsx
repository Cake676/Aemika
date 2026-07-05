import { Transaction, MONTHS_THAI } from '../types';
import Icon from './Icon';

interface MonthlySummaryProps {
  transactions: Transaction[];
  activeMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
}

export default function MonthlySummary({
  transactions,
  activeMonth,
  onMonthChange,
}: MonthlySummaryProps) {
  const [yearStr, monthStr] = activeMonth.split('-');
  const currentYear = parseInt(yearStr);
  const currentMonthIdx = parseInt(monthStr) - 1; // 0-11

  // Filter transactions for this month
  const monthTransactions = transactions.filter(t => t.date.startsWith(activeMonth));

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Change month by delta (-1 or +1)
  const handleMonthShift = (delta: number) => {
    let newMonthIdx = currentMonthIdx + delta;
    let newYear = currentYear;

    if (newMonthIdx < 0) {
      newMonthIdx = 11;
      newYear -= 1;
    } else if (newMonthIdx > 11) {
      newMonthIdx = 0;
      newYear += 1;
    }

    const paddedMonth = String(newMonthIdx + 1).padStart(2, '0');
    onMonthChange(`${newYear}-${paddedMonth}`);
  };

  // Convert year to Buddhist Era (B.E.) for Thai users
  const yearBE = currentYear + 543;

  return (
    <div className="space-y-4" id="monthly-summary-container">
      {/* 1. Month Picker Bar */}
      <div className="flex justify-between items-center bg-white border border-gray-100 rounded-2xl p-3 shadow-xs" id="month-picker-bar">
        <button
          onClick={() => handleMonthShift(-1)}
          className="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-700 rounded-xl transition-all"
          aria-label="Previous Month"
        >
          <Icon name="ChevronLeft" size={20} />
        </button>

        <div className="text-center">
          <span className="text-sm font-bold text-gray-800">
            {MONTHS_THAI[currentMonthIdx]} {yearBE}
          </span>
          <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
            {monthTransactions.length} รายการในเดือนนี้
          </span>
        </div>

        <button
          onClick={() => handleMonthShift(1)}
          className="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-700 rounded-xl transition-all"
          aria-label="Next Month"
        >
          <Icon name="ChevronRight" size={20} />
        </button>
      </div>

      {/* 2. Balance Gradient Card */}
      <div 
        className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-slate-900/10"
        id="balance-card"
      >
        {/* Subtle background decoration */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl"></div>
        <div className="absolute left-1/4 top-0 -translate-y-12 w-24 h-24 bg-rose-500/10 rounded-full blur-xl"></div>

        <div className="relative z-10 space-y-5">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">ยอดคงเหลือประจําเดือน</span>
            <span className={`text-3xl font-black mt-1.5 block ${netSavings >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {netSavings < 0 ? '-' : ''}฿{Math.abs(netSavings).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">รายรับรวม</span>
              <span className="text-base font-black text-emerald-400 mt-1 block">
                +฿{totalIncome.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">รายจ่ายรวม</span>
              <span className="text-base font-black text-rose-400 mt-1 block">
                -฿{totalExpense.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Small Insights Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 flex items-center space-x-3" id="savings-rate-card">
          <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
            <Icon name="PiggyBank" size={18} />
          </span>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block">อัตราการออม</span>
            <span className="text-xs font-black text-indigo-700 mt-0.5 block">
              {savingsRate > 0 ? `${savingsRate.toFixed(1)}%` : '0.0%'}
            </span>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4 flex items-center space-x-3" id="average-spend-card">
          <span className="p-2 bg-amber-100 rounded-xl text-amber-600">
            <Icon name="CreditCard" size={18} />
          </span>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block">เฉลี่ยจ่ายรายวัน</span>
            <span className="text-xs font-black text-amber-700 mt-0.5 block">
              ฿{((totalExpense) / 30).toLocaleString('th-TH', { maximumFractionDigits: 0 })}/วัน
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
