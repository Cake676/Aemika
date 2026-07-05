import { useState } from 'react';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import Icon from './Icon';

interface AnalyticsViewProps {
  transactions: Transaction[];
  activeMonth: string; // YYYY-MM
  budgets: { [category: string]: number };
  onSetBudget: (category: string, amount: number) => void;
}

export default function AnalyticsView({
  transactions,
  activeMonth,
  budgets,
  onSetBudget,
}: AnalyticsViewProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Filter transactions for the active month
  const monthTransactions = transactions.filter(t => t.date.startsWith(activeMonth));

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Group by category for Expenses
  const expenseBreakdown = EXPENSE_CATEGORIES.map(cat => {
    const amount = monthTransactions
      .filter(t => t.type === 'expense' && t.category === cat.name)
      .reduce((sum, t) => sum + t.amount, 0);
    const budget = budgets[cat.name] || 0;
    return {
      ...cat,
      amount,
      budget,
      percent: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    };
  }).sort((a, b) => b.amount - a.amount);

  // Group by category for Income
  const incomeBreakdown = INCOME_CATEGORIES.map(cat => {
    const amount = monthTransactions
      .filter(t => t.type === 'income' && t.category === cat.name)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      ...cat,
      amount,
      percent: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
    };
  }).sort((a, b) => b.amount - a.amount);

  // Calculate overall budget vs overall expense
  const totalBudget = Object.values(budgets).reduce((sum, b) => sum + b, 0);
  const budgetUtilization = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

  const handleSaveBudget = (categoryName: string) => {
    const amt = parseFloat(budgetInput);
    if (!isNaN(amt) && amt >= 0) {
      onSetBudget(categoryName, amt);
    }
    setEditingCategory(null);
    setBudgetInput('');
  };

  const startEditingBudget = (categoryName: string, currentBudget: number) => {
    setEditingCategory(categoryName);
    setBudgetInput(currentBudget > 0 ? currentBudget.toString() : '');
  };

  return (
    <div className="space-y-6" id="analytics-view-container">
      {/* 1. Overall Balance Summary Card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-100/50 rounded-2xl p-4 flex flex-col justify-between" id="summary-card-income">
          <div className="flex items-center space-x-2 text-emerald-800 text-xs font-medium">
            <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
              <Icon name="ArrowUpRight" size={16} />
            </span>
            <span>รายรับรวม</span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-emerald-900">
              ฿{totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-100/50 rounded-2xl p-4 flex flex-col justify-between" id="summary-card-expense">
          <div className="flex items-center space-x-2 text-rose-800 text-xs font-medium">
            <span className="p-1.5 bg-rose-100 rounded-lg text-rose-600">
              <Icon name="ArrowDownRight" size={16} />
            </span>
            <span>รายจ่ายรวม</span>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-rose-900">
              ฿{totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual Chart (SVG Bar Chart comparing Income vs Expense) */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs" id="visual-compare-chart">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center justify-between">
          <span>เปรียบเทียบ รายรับ - รายจ่าย</span>
          <span className="text-xs text-gray-400 font-normal">กราฟแท่งเปรียบเทียบ</span>
        </h3>
        
        <div className="h-44 flex items-end justify-around pb-2 border-b border-gray-100 relative">
          {/* Background grid lines */}
          <div className="absolute left-0 right-0 top-0 border-t border-dashed border-gray-100 w-full h-0"></div>
          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-100 w-full h-0"></div>
          
          {/* Income Bar */}
          <div className="flex flex-col items-center w-20 group relative">
            <div className="text-xs font-bold text-emerald-600 mb-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              ฿{totalIncome.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
            </div>
            <div 
              style={{ 
                height: `${Math.max(5, Math.min(100, (totalIncome / Math.max(totalIncome, totalExpense, 1)) * 120))}px` 
              }}
              className="w-12 bg-emerald-400 rounded-t-xl transition-all duration-500 hover:bg-emerald-500 shadow-xs"
            ></div>
            <span className="text-xs text-gray-500 mt-2 font-medium">รายรับ</span>
          </div>

          {/* Expense Bar */}
          <div className="flex flex-col items-center w-20 group relative">
            <div className="text-xs font-bold text-rose-600 mb-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              ฿{totalExpense.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
            </div>
            <div 
              style={{ 
                height: `${Math.max(5, Math.min(100, (totalExpense / Math.max(totalIncome, totalExpense, 1)) * 120))}px` 
              }}
              className="w-12 bg-rose-400 rounded-t-xl transition-all duration-500 hover:bg-rose-500 shadow-xs"
            ></div>
            <span className="text-xs text-gray-500 mt-2 font-medium">รายจ่าย</span>
          </div>
        </div>
      </div>

      {/* 3. Budget Goal Widget (Overall Progress) */}
      {totalBudget > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs" id="overall-budget-widget">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-800">การควบคุมงบประมาณภาพรวม</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                งบประมาณทั้งหมด: ฿{totalBudget.toLocaleString()}
              </p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              budgetUtilization > 100 
                ? 'bg-rose-100 text-rose-700' 
                : budgetUtilization > 85 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {budgetUtilization.toFixed(1)}%
            </span>
          </div>

          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(100, budgetUtilization)}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUtilization > 100 
                  ? 'bg-rose-500' 
                  : budgetUtilization > 85 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500'
              }`}
            ></div>
          </div>
          
          {budgetUtilization > 100 ? (
            <p className="text-xs text-rose-500 mt-2 flex items-center space-x-1">
              <Icon name="AlertCircle" size={14} />
              <span>คุณใช้จ่ายเกินงบประมาณรวมที่ตั้งไว้แล้ว!</span>
            </p>
          ) : budgetUtilization > 85 ? (
            <p className="text-xs text-amber-500 mt-2 flex items-center space-x-1">
              <Icon name="AlertCircle" size={14} />
              <span>ระวัง! การใช้จ่ายใกล้ถึงขีดจำกัดงบประมาณแล้ว</span>
            </p>
          ) : (
            <p className="text-xs text-emerald-600 mt-2 flex items-center space-x-1">
              <Icon name="Check" size={14} />
              <span>การเงินของคุณอยู่ในระดับที่ควบคุมได้ดีเยี่ยม!</span>
            </p>
          )}
        </div>
      )}

      {/* 4. Category-wise breakdown with navigation tabs */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs" id="category-breakdown-card">
        {/* Tab Controls */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-5">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'expense'
                ? 'bg-white text-gray-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            วิเคราะห์ รายจ่าย
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'income'
                ? 'bg-white text-gray-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            วิเคราะห์ รายรับ
          </button>
        </div>

        {activeTab === 'expense' ? (
          <div className="space-y-4" id="expense-breakdown-list">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-400 px-1">
              <span>หมวดหมู่</span>
              <span>ยอดรวม / งบประมาณ</span>
            </div>

            {expenseBreakdown.filter(cat => cat.amount > 0 || cat.budget > 0).length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                ไม่มีข้อมูลรายจ่ายในเดือนนี้
              </div>
            ) : (
              expenseBreakdown.map(cat => {
                const isOverBudget = cat.budget > 0 && cat.amount > cat.budget;
                const budgetPercent = cat.budget > 0 ? (cat.amount / cat.budget) * 100 : 0;
                
                return (
                  <div key={cat.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0" id={`cat-row-${cat.id}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2.5">
                        <span 
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                          className="p-2 rounded-xl"
                        >
                          <Icon name={cat.icon} size={16} />
                        </span>
                        <div>
                          <span className="text-xs font-bold text-gray-800 block">{cat.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {cat.percent.toFixed(1)}% ของรายจ่ายทั้งหมด
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-800 block">
                          ฿{cat.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        
                        {editingCategory === cat.name ? (
                          <div className="flex items-center space-x-1 mt-1 justify-end">
                            <input
                              type="number"
                              value={budgetInput}
                              onChange={(e) => setBudgetInput(e.target.value)}
                              placeholder="งบ"
                              className="w-16 text-[10px] p-0.5 border border-gray-300 rounded text-right focus:outline-none focus:border-indigo-500"
                              autoFocus
                            />
                            <button 
                              onClick={() => handleSaveBudget(cat.name)}
                              className="p-0.5 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                            >
                              <Icon name="Check" size={10} />
                            </button>
                            <button 
                              onClick={() => setEditingCategory(null)}
                              className="p-0.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                            >
                              <Icon name="X" size={10} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditingBudget(cat.name, cat.budget)}
                            className="text-[10px] text-gray-400 hover:text-indigo-600 transition-colors flex items-center space-x-0.5 ml-auto mt-0.5"
                          >
                            <Icon name="Target" size={10} />
                            <span>
                              {cat.budget > 0 ? `งบ: ฿${cat.budget.toLocaleString()}` : 'ตั้งงบประมาณ'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-1">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, cat.budget > 0 ? budgetPercent : cat.percent)}%`,
                          backgroundColor: cat.color 
                        }}
                      ></div>
                    </div>

                    {/* Budget Warning */}
                    {cat.budget > 0 && (
                      <div className="flex justify-between items-center text-[9px] mt-1 font-medium">
                        <span className={isOverBudget ? "text-rose-500 font-bold" : "text-gray-400"}>
                          {isOverBudget 
                            ? `ใช้เกินงบไปแล้ว ฿${(cat.amount - cat.budget).toLocaleString()}` 
                            : `ใช้ไปแล้ว ${budgetPercent.toFixed(1)}% ของงบรายหมวด`
                          }
                        </span>
                        <span className="text-gray-400">งบ ฿{cat.budget.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Empty Categories Shortcut */}
            {expenseBreakdown.filter(cat => cat.amount === 0 && cat.budget === 0).length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-50">
                <p className="text-[10px] text-gray-400 font-semibold mb-2">หมวดหมู่อื่นๆ (ยังไม่มีข้อมูล)</p>
                <div className="flex flex-wrap gap-2">
                  {expenseBreakdown
                    .filter(cat => cat.amount === 0 && cat.budget === 0)
                    .map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => startEditingBudget(cat.name, 0)}
                        className="inline-flex items-center space-x-1 text-[10px] bg-gray-50 border border-gray-100 text-gray-500 rounded-lg py-1 px-2.5 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                      >
                        <Icon name={cat.icon} size={11} style={{ color: cat.color }} />
                        <span>ตั้งงบ {cat.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4" id="income-breakdown-list">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-400 px-1">
              <span>หมวดหมู่</span>
              <span>ยอดรวม</span>
            </div>

            {incomeBreakdown.filter(cat => cat.amount > 0).length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                ไม่มีข้อมูลรายรับในเดือนนี้
              </div>
            ) : (
              incomeBreakdown
                .filter(cat => cat.amount > 0)
                .map(cat => (
                  <div key={cat.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0" id={`cat-row-inc-${cat.id}`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center space-x-2.5">
                        <span 
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                          className="p-2 rounded-xl"
                        >
                          <Icon name={cat.icon} size={16} />
                        </span>
                        <div>
                          <span className="text-xs font-bold text-gray-800 block">{cat.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {cat.percent.toFixed(1)}% ของรายรับทั้งหมด
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-800 block">
                          ฿{cat.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${cat.percent}%`,
                          backgroundColor: cat.color 
                        }}
                      ></div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
