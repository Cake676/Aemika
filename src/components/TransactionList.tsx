import { useState } from 'react';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import Icon from './Icon';

interface TransactionListProps {
  transactions: Transaction[];
  activeMonth: string; // YYYY-MM
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionList({
  transactions,
  activeMonth,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Filter for active month
  const monthTransactions = transactions.filter(t => t.date.startsWith(activeMonth));

  // Search filter & Type filter
  const filteredTransactions = monthTransactions.filter(t => {
    const matchesSearch = 
      t.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      filterType === 'all' || 
      t.type === filterType;

    return matchesSearch && matchesType;
  });

  // Sort transactions by date (newest first), then by creation time
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Group transactions by date for aesthetic headings
  const groupedByDate: { [date: string]: Transaction[] } = {};
  sortedTransactions.forEach(t => {
    if (!groupedByDate[t.date]) {
      groupedByDate[t.date] = [];
    }
    groupedByDate[t.date].push(t);
  });

  // Helper to format date header in Thai
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const thDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const thMonthsShort = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    
    const dayName = thDays[date.getDay()];
    const dateNum = date.getDate();
    const monthName = thMonthsShort[date.getMonth()];
    const yearBE = date.getFullYear() + 543;

    return `${dayName} ${dateNum} ${monthName} ${yearBE}`;
  };

  const getCategoryColorAndIcon = (categoryName: string, type: 'income' | 'expense') => {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const cat = categories.find(c => c.name === categoryName);
    return {
      color: cat?.color || '#9CA3AF',
      icon: cat?.icon || 'HelpCircle'
    };
  };

  return (
    <div className="space-y-4" id="transaction-list-container">
      {/* Search and Filters */}
      <div className="space-y-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-xs" id="list-controls">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon name="Search" size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาหมวดหมู่ หรือบันทึกช่วยจำ..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-indigo-500 placeholder-gray-400 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <Icon name="X" size={14} />
            </button>
          )}
        </div>

        {/* Type Filter Buttons */}
        <div className="flex space-x-2" id="type-filters">
          {(['all', 'expense', 'income'] as const).map((type) => {
            const label = type === 'all' ? 'ทั้งหมด' : type === 'expense' ? 'รายจ่าย' : 'รายรับ';
            const activeStyle = 
              type === 'all' 
                ? 'bg-slate-800 text-white' 
                : type === 'expense' 
                ? 'bg-rose-500 text-white shadow-xs' 
                : 'bg-emerald-500 text-white shadow-xs';
            
            const isSelected = filterType === type;

            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 py-1.5 px-3 text-center text-[11px] font-bold rounded-xl border transition-all ${
                  isSelected
                    ? activeStyle
                    : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4" id="grouped-transactions">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-100 rounded-2xl shadow-xs px-6">
            <div className="inline-flex p-3.5 bg-gray-50 rounded-2xl text-gray-400 mb-3">
              <Icon name="Inbox" size={24} />
            </div>
            <p className="text-xs font-bold text-gray-500">ไม่พบรายการที่ต้องการค้นหา</p>
            <p className="text-[10px] text-gray-400 mt-1">
              {searchTerm || filterType !== 'all' 
                ? 'ลองเปลี่ยนเงื่อนไขหรือค้นหาใหม่อีกครั้ง' 
                : 'เริ่มจดบันทึกโดยกดปุ่มเพิ่มรายการด้านล่างได้เลย!'}
            </p>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, items]) => {
            const daySumIncome = items.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const daySumExpense = items.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            
            return (
              <div key={date} className="space-y-2" id={`date-group-${date}`}>
                {/* Date Header */}
                <div className="flex justify-between items-center px-1 text-[10px] font-bold text-gray-400">
                  <span>{formatDateHeader(date)}</span>
                  <div className="flex space-x-2 font-semibold">
                    {daySumIncome > 0 && (
                      <span className="text-emerald-500">+{daySumIncome.toLocaleString()}</span>
                    )}
                    {daySumExpense > 0 && (
                      <span className="text-rose-400">-{daySumExpense.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                {/* Date's Transactions */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs divide-y divide-gray-50">
                  {items.map((item) => {
                    const { color, icon } = getCategoryColorAndIcon(item.category, item.type);
                    
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 transition-all group"
                        id={`transaction-item-${item.id}`}
                      >
                        {/* Info details */}
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span 
                            style={{ backgroundColor: `${color}12`, color: color }}
                            className="p-2.5 rounded-xl flex-shrink-0"
                          >
                            <Icon name={icon} size={18} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-gray-800 block truncate">{item.category}</span>
                            <span className="text-[10px] text-gray-400 font-medium truncate block mt-0.5">
                              {item.note || <span className="italic text-gray-300">ไม่มีคำอธิบาย</span>}
                            </span>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center space-x-3.5 ml-4">
                          <span className={`text-xs font-bold whitespace-nowrap ${
                            item.type === 'income' ? 'text-emerald-600' : 'text-rose-500'
                          }`}>
                            {item.type === 'income' ? '+' : '-'}฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>

                          {/* Quick Edit/Delete Panel */}
                          <div className="flex items-center space-x-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-indigo-600 rounded-lg transition-all"
                              title="แก้ไข"
                            >
                              <Icon name="Edit" size={13} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) {
                                  onDelete(item.id);
                                }
                              }}
                              className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-rose-600 rounded-lg transition-all"
                              title="ลบ"
                            >
                              <Icon name="Trash2" size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
