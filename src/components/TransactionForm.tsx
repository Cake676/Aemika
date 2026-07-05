import React, { useState, useEffect } from 'react';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import Icon from './Icon';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

export default function TransactionForm({
  onSave,
  onClose,
  editingTransaction,
}: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setNote(editingTransaction.note);
      setDate(editingTransaction.date);
    } else {
      // Set first category as default if none selected
      setCategory(categories[0]?.name || '');
    }
  }, [editingTransaction]);

  // Adjust default category when type changes
  useEffect(() => {
    if (!editingTransaction) {
      setCategory(categories[0]?.name || '');
    }
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = 'กรุณากรอกจำนวนเงินที่ถูกต้อง (มากกว่า 0)';
    }

    if (!category) {
      newErrors.category = 'กรุณาเลือกหมวดหมู่';
    }

    if (!date) {
      newErrors.date = 'กรุณาเลือกวันที่';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: editingTransaction?.id,
      type,
      amount: numericAmount,
      category,
      note,
      date,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in" id="transaction-form-overlay">
      <div 
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden animate-slide-up"
        id="transaction-form-card"
      >
        {/* Drag handle for mobile */}
        <div className="w-full flex justify-center py-2.5 sm:hidden">
          <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
        </div>

        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100" id="form-header">
          <h3 className="text-base font-bold text-gray-800">
            {editingTransaction ? 'แก้ไขรายการบันทึก' : 'เพิ่มรายการใหม่'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 1. Transaction Type Tab */}
          <div className="flex bg-gray-100 p-1 rounded-2xl" id="type-selector">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon name="TrendingDown" size={14} />
              <span>รายจ่าย</span>
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon name="TrendingUp" size={14} />
              <span>รายรับ</span>
            </button>
          </div>

          {/* 2. Amount Input (Large Text) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500" htmlFor="amount-input">จำนวนเงิน (บาท)</label>
            <div className="relative flex items-center">
              <span className={`absolute left-4 text-2xl font-black ${type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>฿</span>
              <input
                id="amount-input"
                type="number"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                }}
                placeholder="0.00"
                className={`w-full text-3xl font-black pl-10 pr-4 py-3 bg-gray-50/50 border rounded-2xl focus:outline-none focus:bg-white text-gray-800 ${
                  errors.amount 
                    ? 'border-rose-300 focus:ring-1 focus:ring-rose-500 focus:border-rose-500' 
                    : 'border-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center space-x-1">
                <Icon name="AlertCircle" size={12} />
                <span>{errors.amount}</span>
              </p>
            )}
          </div>

          {/* 3. Category Grid Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">เลือกหมวดหมู่</label>
            <div className="grid grid-cols-4 gap-2.5" id="category-grid">
              {categories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.name);
                      if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                    }}
                    className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all text-center space-y-1.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/30'
                    }`}
                  >
                    <span 
                      style={{ 
                        backgroundColor: isSelected ? cat.color : `${cat.color}15`, 
                        color: isSelected ? '#FFFFFF' : cat.color 
                      }}
                      className="p-2.5 rounded-xl transition-all"
                    >
                      <Icon name={cat.icon} size={18} />
                    </span>
                    <span className={`text-[10px] font-bold truncate w-full ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center space-x-1">
                <Icon name="AlertCircle" size={12} />
                <span>{errors.category}</span>
              </p>
            )}
          </div>

          {/* 4. Date Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500" htmlFor="date-input">วันที่ทำรายการ</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon name="Calendar" size={16} />
              </span>
              <input
                id="date-input"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                }}
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 5. Optional Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500" htmlFor="note-input">บันทึกช่วยจำ (ไม่บังคับ)</label>
            <input
              id="note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ข้าวมันไก่, ค่าแท็กซี่ไปทำงาน, เงินแต๊ะเอีย..."
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
            />
          </div>
        </form>

        {/* Modal Footer (CTAs) */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex space-x-3" id="form-footer">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-center text-xs font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-2xl hover:bg-gray-100 transition-all"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`flex-1 py-3 text-center text-xs font-bold text-white rounded-2xl shadow-lg transition-all ${
              type === 'expense'
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/10'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10'
            }`}
          >
            {editingTransaction ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
          </button>
        </div>
      </div>
    </div>
  );
}
