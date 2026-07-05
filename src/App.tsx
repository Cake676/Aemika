import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { Transaction } from './types';
import Icon from './components/Icon';
import MonthlySummary from './components/MonthlySummary';
import TransactionList from './components/TransactionList';
import AnalyticsView from './components/AnalyticsView';
import TransactionForm from './components/TransactionForm';

interface CustomUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isDemo: boolean;
}

// Sample Seed Data for Demo Mode
const SEED_TRANSACTIONS = (monthStr: string): Transaction[] => [
  {
    id: 'demo-1',
    type: 'income',
    amount: 35000,
    category: 'เงินเดือน',
    note: 'เงินเดือนประจำเดือน',
    date: `${monthStr}-01`,
    createdAt: new Date(new Date().setDate(1)).toISOString()
  },
  {
    id: 'demo-2',
    type: 'expense',
    amount: 850,
    category: 'อาหาร',
    note: 'บุฟเฟต์ปิ้งย่างมื้อเย็น',
    date: `${monthStr}-03`,
    createdAt: new Date(new Date().setDate(3)).toISOString()
  },
  {
    id: 'demo-3',
    type: 'expense',
    amount: 65,
    category: 'เดินทาง',
    note: 'ค่าบีทีเอสไปทำงาน',
    date: `${monthStr}-04`,
    createdAt: new Date(new Date().setDate(4)).toISOString()
  },
  {
    id: 'demo-4',
    type: 'expense',
    amount: 390,
    category: 'ช้อปปิ้ง',
    note: 'เสื้อยืดแขนสั้นสีขาว',
    date: `${monthStr}-05`,
    createdAt: new Date(new Date().setDate(5)).toISOString()
  },
  {
    id: 'demo-5',
    type: 'expense',
    amount: 8500,
    category: 'บิล & ค่าบ้าน',
    note: 'ค่าผ่อนคอนโด',
    date: `${monthStr}-02`,
    createdAt: new Date(new Date().setDate(2)).toISOString()
  },
  {
    id: 'demo-6',
    type: 'income',
    amount: 1200,
    category: 'ขายของ/ธุรกิจ',
    note: 'ขายของเล่นเก่ามือสอง',
    date: `${monthStr}-06`,
    createdAt: new Date(new Date().setDate(6)).toISOString()
  }
];

const SEED_BUDGETS = {
  'อาหาร': 6000,
  'เดินทาง': 1500,
  'ช้อปปิ้ง': 3000,
  'บิล & ค่าบ้าน': 10000,
};

export default function App() {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // App core state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allBudgets, setAllBudgets] = useState<{ [month: string]: { [category: string]: number } }>({});
  
  // View options
  const [activeMonth, setActiveMonth] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // 1. Listen for Firebase Auth State Change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          isDemo: false
        });
      } else {
        // If not authenticated, check if there was a previously active demo session
        const wasDemo = localStorage.getItem('demo_active') === 'true';
        if (wasDemo) {
          handleEnterDemo();
        } else {
          setUser(null);
          setTransactions([]);
          setAllBudgets({});
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Synchronize Data from Firestore or localStorage depending on user status
  useEffect(() => {
    if (!user) return;

    if (user.isDemo) {
      // DEMO MODE - Load from localStorage
      const localTrans = localStorage.getItem('demo_transactions');
      const localBudgets = localStorage.getItem('demo_budgets');

      if (localTrans) {
        setTransactions(JSON.parse(localTrans));
      } else {
        // Seed initial transactions
        const seed = SEED_TRANSACTIONS(activeMonth);
        setTransactions(seed);
        localStorage.setItem('demo_transactions', JSON.stringify(seed));
      }

      if (localBudgets) {
        setAllBudgets(JSON.parse(localBudgets));
      } else {
        const seedB = { [activeMonth]: SEED_BUDGETS };
        setAllBudgets(seedB);
        localStorage.setItem('demo_budgets', JSON.stringify(seedB));
      }
    } else {
      // REAL FIRESTORE MODE - Sync transactions real-time
      const transactionsCol = collection(db, 'users', user.uid, 'transactions');
      const unsubTransactions = onSnapshot(transactionsCol, (snapshot) => {
        const list: Transaction[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setTransactions(list);
      });

      // Sync budgets real-time
      const budgetsCol = collection(db, 'users', user.uid, 'budgets');
      const unsubBudgets = onSnapshot(budgetsCol, (snapshot) => {
        const map: { [month: string]: { [category: string]: number } } = {};
        snapshot.forEach((doc) => {
          map[doc.id] = doc.data() as { [category: string]: number };
        });
        setAllBudgets(map);
      });

      return () => {
        unsubTransactions();
        unsubBudgets();
      };
    }
  }, [user]);

  // Handle Google Sign-In
  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.removeItem('demo_active'); // Clean demo status
    } catch (err: any) {
      console.error('Google login failed:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        setAuthError('ระบบป๊อปอัพถูกบล็อก หรือมีการยกเลิกกรุณาเปิดหน้าจอใหม่ (Open in new tab) จากนั้นเข้าสู่ระบบอีกครั้ง');
      } else {
        setAuthError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  // Handle Enter Demo Mode
  const handleEnterDemo = () => {
    localStorage.setItem('demo_active', 'true');
    setUser({
      uid: 'demo_user',
      displayName: 'ผู้ใช้งานทั่วไป (บัญชีทดลอง)',
      email: null,
      photoURL: null,
      isDemo: true
    });
    setLoading(false);
  };

  // Handle Logout
  const handleLogout = async () => {
    if (user?.isDemo) {
      localStorage.removeItem('demo_active');
      setUser(null);
      setTransactions([]);
      setAllBudgets({});
    } else {
      await signOut(auth);
    }
    setActiveTab('list');
  };

  // Save Transaction (Create / Update)
  const handleSaveTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => {
    const timestampStr = new Date().toISOString();

    if (user?.isDemo) {
      // Demo Mode Write
      let updated: Transaction[];
      if (data.id) {
        // Edit
        updated = transactions.map(t => 
          t.id === data.id 
            ? { ...t, ...data, date: data.date } as Transaction
            : t
        );
      } else {
        // New
        const newTrans: Transaction = {
          id: `demo-${Date.now()}`,
          ...data,
          createdAt: timestampStr,
        };
        updated = [newTrans, ...transactions];
      }
      setTransactions(updated);
      localStorage.setItem('demo_transactions', JSON.stringify(updated));
    } else if (user) {
      // Firestore Write
      const userRef = doc(db, 'users', user.uid);
      const transCol = collection(userRef, 'transactions');

      if (data.id) {
        // Edit
        const transRef = doc(transCol, data.id);
        await updateDoc(transRef, {
          type: data.type,
          amount: data.amount,
          category: data.category,
          note: data.note,
          date: data.date,
        });
      } else {
        // New
        await addDoc(transCol, {
          ...data,
          createdAt: timestampStr,
        });
      }
    }

    setShowForm(false);
    setEditingTransaction(null);
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (user?.isDemo) {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      localStorage.setItem('demo_transactions', JSON.stringify(updated));
    } else if (user) {
      const transDoc = doc(db, 'users', user.uid, 'transactions', id);
      await deleteDoc(transDoc);
    }
  };

  // Set Budget for Category for the current month
  const handleSetBudget = async (category: string, amount: number) => {
    const currentMonthBudgets = allBudgets[activeMonth] || {};
    const updatedBudgets = {
      ...currentMonthBudgets,
      [category]: amount,
    };

    if (user?.isDemo) {
      const updatedAll = {
        ...allBudgets,
        [activeMonth]: updatedBudgets,
      };
      setAllBudgets(updatedAll);
      localStorage.setItem('demo_budgets', JSON.stringify(updatedAll));
    } else if (user) {
      const budgetDocRef = doc(db, 'users', user.uid, 'budgets', activeMonth);
      await setDoc(budgetDocRef, updatedBudgets, { merge: true });
    }
  };

  // Active budgets map for the selected month
  const activeMonthBudgets = allBudgets[activeMonth] || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" id="loading-screen">
        <div className="animate-pulse space-y-4 text-center">
          <div className="p-4 bg-indigo-500 text-white rounded-3xl inline-block shadow-lg">
            <Icon name="PiggyBank" size={40} className="animate-bounce" />
          </div>
          <h2 className="text-sm font-bold text-gray-700">กำลังโหลดแอปบันทึกรายรับรายจ่าย...</h2>
          <p className="text-xs text-gray-400">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  // Login Splash Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-12" id="login-screen">
        <div className="w-full max-w-sm space-y-8 text-center bg-white border border-gray-100 p-8 rounded-3xl shadow-sm relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -top-12 -left-12 w-28 h-28 bg-indigo-100/50 rounded-full blur-xl"></div>
          <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-rose-100/50 rounded-full blur-xl"></div>

          <div className="space-y-3 relative z-10">
            <div className="p-4 bg-indigo-600 text-white rounded-2xl inline-block shadow-md shadow-indigo-500/10">
              <Icon name="PiggyBank" size={32} />
            </div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight">บันทึกรายรับรายจ่าย</h1>
            <p className="text-xs text-gray-400 font-medium">
              แอปช่วยวางแผนการเงิน บันทึกทุกรายการวิเคราะห์การใช้จ่ายครบ จบในที่เดียว
            </p>
          </div>

          <div className="space-y-3 relative z-10 pt-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/15 active:scale-98 transition-all"
            >
              {/* Simple inline Google G SVG */}
              <svg className="w-4 h-4 mr-1 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>เข้าสู่ระบบด้วย Google</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-3 text-[10px] text-gray-400 font-bold uppercase">หรือ</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <button
              onClick={handleEnterDemo}
              className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-98"
            >
              <Icon name="User" size={14} className="text-gray-500" />
              <span>ใช้งานบัญชีทดลอง (ไม่ต้องล็อกอิน)</span>
            </button>
          </div>

          {authError && (
            <div className="bg-rose-50 border border-rose-100/50 rounded-2xl p-3 text-left">
              <p className="text-[10px] text-rose-600 font-bold leading-relaxed flex items-start space-x-1.5">
                <Icon name="AlertCircle" size={14} className="flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </p>
            </div>
          )}
        </div>

        <p className="text-[10px] text-gray-400 mt-6 font-medium max-w-xs text-center leading-relaxed">
          * ระบบใช้ Firebase Auth ในการล็อกอินอย่างปลอดภัย ข้อมูลของคุณจะถูกปกป้องตามสิทธิ์ของบัญชีของคุณเท่านั้น
        </p>
      </div>
    );
  }

  // Logged In Application Screen
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col items-center pb-24" id="app-viewport">
      {/* 1. Header Navigation Bar */}
      <header className="w-full max-w-md bg-white border-b border-gray-100/80 sticky top-0 z-40 px-5 py-3.5 flex justify-between items-center" id="app-header">
        <div className="flex items-center space-x-2">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'Profile'} 
              className="w-8 h-8 rounded-full border border-gray-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Icon name={user.isDemo ? "User" : "UserCheck"} size={16} />
            </span>
          )}
          <div className="text-left">
            <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none">ยินดีต้อนรับ</span>
            <span className="text-xs font-black text-slate-800 truncate max-w-[120px] block mt-0.5">
              {user.displayName || 'สมาชิกเงินเก็บ'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {user.isDemo && (
            <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50 rounded-lg px-2 py-1 leading-none">
              บัญชีทดลอง
            </span>
          )}
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-all"
            title="ออกจากระบบ"
          >
            <Icon name="LogOut" size={16} />
          </button>
        </div>
      </header>

      {/* 2. Demo Warning Notification */}
      {user.isDemo && (
        <div className="w-full max-w-md bg-amber-500/10 border-b border-amber-500/10 px-5 py-2 flex justify-between items-center" id="demo-banner">
          <p className="text-[9px] text-amber-800 font-bold flex items-center space-x-1">
            <Icon name="AlertCircle" size={12} className="text-amber-600 flex-shrink-0" />
            <span>ข้อมูลบันทึกในเครื่องนี้เท่านั้น เข้าสู่ระบบคลาวด์ได้ทันที!</span>
          </p>
          <button 
            onClick={handleLogout}
            className="text-[9px] bg-amber-600 text-white rounded-md px-2 py-0.5 font-black hover:bg-amber-700 transition-colors"
          >
            ผูกบัญชี Google
          </button>
        </div>
      )}

      {/* 3. Main Body Scroll Area */}
      <main className="w-full max-w-md px-4 pt-4 space-y-5 flex-1" id="main-content">
        {/* Monthly summary widget always on top */}
        <MonthlySummary 
          transactions={transactions}
          activeMonth={activeMonth}
          onMonthChange={setActiveMonth}
        />

        {/* Dynamic View switching */}
        {activeTab === 'list' ? (
          <TransactionList 
            transactions={transactions}
            activeMonth={activeMonth}
            onEdit={(t) => {
              setEditingTransaction(t);
              setShowForm(true);
            }}
            onDelete={handleDeleteTransaction}
          />
        ) : (
          <AnalyticsView 
            transactions={transactions}
            activeMonth={activeMonth}
            budgets={activeMonthBudgets}
            onSetBudget={handleSetBudget}
          />
        )}
      </main>

      {/* 4. Floating Action Button (FAB) for quick add */}
      <button
        onClick={() => {
          setEditingTransaction(null);
          setShowForm(true);
        }}
        className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 active:scale-95 transition-all z-30"
        title="เพิ่มรายการใหม่"
        id="quick-add-fab"
      >
        <Icon name="Plus" size={24} />
      </button>

      {/* 5. Sticky Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-around items-center z-30 max-w-md mx-auto rounded-t-2xl shadow-md" id="bottom-nav">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center space-y-1 py-1.5 px-4 rounded-xl transition-all ${
            activeTab === 'list'
              ? 'text-indigo-600 bg-indigo-50/50'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Icon name="List" size={18} />
          <span className="text-[9px] font-bold">รายการ</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center space-y-1 py-1.5 px-4 rounded-xl transition-all ${
            activeTab === 'analytics'
              ? 'text-indigo-600 bg-indigo-50/50'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Icon name="PieChart" size={18} />
          <span className="text-[9px] font-bold">สรุป & วิเคราะห์</span>
        </button>
      </nav>

      {/* 6. Form Slide-over Sheet Modal */}
      {showForm && (
        <TransactionForm 
          onSave={handleSaveTransaction}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          editingTransaction={editingTransaction}
        />
      )}
    </div>
  );
}
