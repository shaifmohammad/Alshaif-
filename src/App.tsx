import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useLocation,
  useNavigate
} from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  UserPlus, 
  Users2, 
  Wallet, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  PieChart,
  Filter,
  Download,
  Droplets,
  Printer
} from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { format, isAfter, isBefore, addDays, startOfDay, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

import { auth, db } from './firebase';
import { AuthProvider, useAuth } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { handleFirestoreError, OperationType } from './lib/error-handler';
import { cn } from './lib/utils';

// --- Types ---
interface Customer {
  id: string;
  name: string;
  phone?: string;
  created_at: Timestamp;
  user_id: string;
}

interface Transaction {
  id: string;
  customer_id: string;
  unit_price?: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date?: Timestamp;
  created_at: Timestamp;
  user_id: string;
}

interface Payment {
  id: string;
  transaction_id: string;
  amount: number;
  date: Timestamp;
}

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  permissions?: {
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
}

// --- Components ---

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'لوحة التحكم', path: '/', icon: LayoutDashboard, roles: ['admin', 'user'] },
    { name: 'إدارة المستخدمين', path: '/users', icon: UsersIcon, roles: ['admin'] },
    { name: 'إدارة العملاء', path: '/customers', icon: Users2, roles: ['admin', 'user'] },
    { name: 'إدخال عملية جديدة', path: '/transactions', icon: Wallet, roles: ['admin', 'user'] },
    { name: 'التقارير الشاملة', path: '/reports', icon: FileText, roles: ['admin', 'user'] },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-blue-900/40 z-40 lg:hidden transition-opacity backdrop-blur-sm",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />
      <aside className={cn(
        "fixed top-0 right-0 h-full w-64 bg-white border-l border-blue-100 shadow-2xl z-50 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-900 leading-tight">برهوم</h1>
              <p className="text-[10px] text-blue-500 font-medium tracking-widest uppercase">للمياه النقية</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden mr-auto">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.filter(item => item.roles.includes(profile?.role || 'user')).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  location.pathname === item.path 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-[-4px]" 
                    : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", location.pathname === item.path ? "text-white" : "text-blue-400")} />
                <span className="font-semibold">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold shadow-md">
                {profile?.name?.[0]?.toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{profile?.name}</p>
                <p className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block">{profile?.role === 'admin' ? 'مدير نظام' : 'مستخدم'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-blue-600 font-bold animate-pulse">جاري تحميل البيانات...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-row-reverse" dir="rtl">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-1 lg:mr-64 min-h-screen flex flex-col">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-blue-50 rounded-xl transition-colors">
              <Menu className="w-6 h-6 text-blue-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              {useLocation().pathname === '/' ? 'لوحة التحكم' : 
               useLocation().pathname === '/users' ? 'إدارة المستخدمين' :
               useLocation().pathname === '/customers' ? 'إدارة العملاء' : 
               useLocation().pathname === '/transactions' ? 'إدخال عملية جديدة' : 'التقارير الشاملة'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end ml-4">
              <span className="text-xs text-gray-400 font-medium">{format(new Date(), 'EEEE، d MMMM', { locale: ar })}</span>
            </div>
            <button className="p-2.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>
        <div className="p-6 lg:p-10 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

// --- Pages ---

const LoginPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const isAdmin = result.user.email === "salshaif901@gmail.com";
        await setDoc(userRef, {
          uid: result.user.uid,
          name: result.user.displayName || 'مستخدم جديد',
          email: result.user.email,
          role: isAdmin ? 'admin' : 'user',
          permissions: isAdmin ? { add: true, edit: true, delete: true } : { add: true, edit: true, delete: false },
          createdAt: Timestamp.now()
        });
      }
      navigate('/');
    } catch (err: any) {
      setError('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-4" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center"
      >
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Droplets className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">مرحباً بك</h1>
        <p className="text-gray-500 mb-8">سجل الدخول للوصول إلى نظام الإدارة</p>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        
        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          <span>الدخول بواسطة جوجل</span>
        </button>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const { isAuthReady } = useAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalDebt: 0,
    paidToday: 0,
    pendingDue: 0
  });
  const [upcomingDue, setUpcomingDue] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!isAuthReady) return;

    const unsubscribeC = onSnapshot(collection(db, 'customers'), (snap) => {
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));

    const unsubscribeT = onSnapshot(collection(db, 'transactions'), (snap) => {
      const txs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      
      const totalDebt = txs.reduce((acc, t) => acc + t.remaining_amount, 0);
      const pendingDue = txs.filter(t => t.remaining_amount > 0 && t.due_date && t.due_date.toDate() <= new Date()).length;
      
      setStats(prev => ({
        ...prev,
        totalCustomers: snap.docs.length,
        totalDebt,
        pendingDue
      }));

      setUpcomingDue(txs.filter(t => t.remaining_amount > 0 && t.due_date).sort((a, b) => a.due_date!.toDate().getTime() - b.due_date!.toDate().getTime()).slice(0, 5));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    return () => { unsubscribeC(); unsubscribeT(); };
  }, [isAuthReady]);

  const cards = [
    { title: 'إجمالي العملاء', value: stats.totalCustomers, icon: Users2, color: 'bg-blue-500', shadow: 'shadow-blue-200' },
    { title: 'إجمالي المديونية', value: `${stats.totalDebt.toLocaleString()} ر.س`, icon: Wallet, color: 'bg-cyan-500', shadow: 'shadow-cyan-200' },
    { title: 'عمليات متأخرة', value: stats.pendingDue, icon: AlertCircle, color: 'bg-red-500', shadow: 'shadow-red-200' },
    { title: 'مياه نقية', value: '100%', icon: Droplets, color: 'bg-blue-400', shadow: 'shadow-blue-100' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={card.title} 
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
          >
            <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150", card.color)}></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={cn("p-3 rounded-2xl text-white shadow-lg", card.color, card.shadow)}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-bold text-gray-500 mb-1">{card.title}</p>
            <h4 className="text-2xl font-black text-gray-900">{card.value}</h4>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              مواعيد الاستحقاق القادمة
            </h4>
            <Link to="/reports" className="text-xs text-blue-600 font-bold hover:underline">عرض الكل</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">العميل</th>
                  <th className="px-6 py-4">المبلغ</th>
                  <th className="px-6 py-4">التاريخ</th>
                  <th className="px-6 py-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {upcomingDue.map(t => {
                  const customer = customers.find(c => c.id === t.customer_id);
                  const isOverdue = t.due_date && t.due_date.toDate() < new Date();
                  return (
                    <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{customer?.name || '...'}</td>
                      <td className="px-6 py-4 font-black text-blue-600">{t.remaining_amount.toLocaleString()} ر.س</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{t.due_date ? format(t.due_date.toDate(), 'yyyy-MM-dd') : '-'}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          isOverdue ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {isOverdue ? 'متأخر' : 'قادم'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-2xl shadow-blue-200 flex flex-col justify-between relative overflow-hidden">
          <Droplets className="absolute -bottom-10 -left-10 w-48 h-48 opacity-10 rotate-12" />
          <div>
            <h4 className="text-xl font-bold mb-2">برهوم للمياه النقية</h4>
            <p className="text-blue-100 text-sm leading-relaxed opacity-80">نظام إدارة متكامل يضمن لك دقة الحسابات وسهولة تتبع المديونيات لعملائك الكرام.</p>
          </div>
          <div className="mt-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-blue-200 font-bold">نسبة التحصيل</p>
                <p className="text-xl font-black">84%</p>
              </div>
            </div>
            <Link to="/transactions" className="block w-full py-4 bg-white text-blue-700 rounded-2xl font-black text-center shadow-lg hover:bg-blue-50 transition-colors">
              إضافة عملية جديدة
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersPage = () => {
  const { profile, isAuthReady } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!isAuthReady || profile?.role !== 'admin') return;
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(doc => doc.data() as UserProfile));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
    return () => unsubscribe();
  }, [isAuthReady, profile]);

  const updatePermissions = async (uid: string, key: string, value: boolean) => {
    const user = users.find(u => u.uid === uid);
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        [`permissions.${key}`]: value
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const updateRole = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  if (profile?.role !== 'admin') return <div className="p-8 text-center text-red-600">ليس لديك صلاحية الوصول لهذه الصفحة.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">إدارة المستخدمين والصلاحيات</h3>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">الاسم</th>
              <th className="px-6 py-4 font-semibold text-gray-600">الدور</th>
              <th className="px-6 py-4 font-semibold text-gray-600">إضافة</th>
              <th className="px-6 py-4 font-semibold text-gray-600">تعديل</th>
              <th className="px-6 py-4 font-semibold text-gray-600">حذف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.uid} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {u.name}
                  <p className="text-xs text-gray-500">{u.email}</p>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={u.role}
                    onChange={(e) => updateRole(u.uid, e.target.value)}
                    className="text-sm border border-gray-200 rounded p-1"
                    disabled={u.uid === profile?.uid}
                  >
                    <option value="user">مستخدم</option>
                    <option value="admin">مدير نظام</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={u.permissions?.add || false} 
                    onChange={(e) => updatePermissions(u.uid, 'add', e.target.checked)}
                    disabled={u.role === 'admin'}
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={u.permissions?.edit || false} 
                    onChange={(e) => updatePermissions(u.uid, 'edit', e.target.checked)}
                    disabled={u.role === 'admin'}
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={u.permissions?.delete || false} 
                    onChange={(e) => updatePermissions(u.uid, 'delete', e.target.checked)}
                    disabled={u.role === 'admin'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CustomersPage = () => {
  const { isAuthReady, profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (!isAuthReady) return;
    const q = query(collection(db, 'customers'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));
    return () => unsubscribe();
  }, [isAuthReady]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.permissions?.add && profile?.role !== 'admin') {
      alert("ليس لديك صلاحية الإضافة");
      return;
    }
    try {
      await addDoc(collection(db, 'customers'), {
        ...newCustomer,
        created_at: Timestamp.now(),
        user_id: auth.currentUser?.uid
      });
      setIsModalOpen(false);
      setNewCustomer({ name: '', phone: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'customers');
    }
  };

  const handleDelete = async (id: string) => {
    if (!profile?.permissions?.delete && profile?.role !== 'admin') {
      alert("ليس لديك صلاحية الحذف");
      return;
    }
    if (!confirm("هل أنت متأكد من حذف هذا العميل؟")) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `customers/${id}`);
    }
  };

  const filtered = customers.filter(c => c.name.includes(search) || c.phone?.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold">إدارة العملاء</h3>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="بحث عن عميل..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">إضافة عميل</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <motion.div 
            layout
            key={c.id} 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                {c.name[0]}
              </div>
              <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">{c.name}</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> <span>{c.phone || 'بدون هاتف'}</span></div>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> <span>منذ: {format(c.created_at.toDate(), 'yyyy-MM-dd')}</span></div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end gap-2">
              <Link to={`/transactions?customerId=${c.id}`} className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                العمليات
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md"
            >
              <h3 className="text-xl font-bold mb-6">إضافة عميل جديد</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
                  <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                  <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TransactionsPage = () => {
  const { isAuthReady, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [newTx, setNewTx] = useState({
    unit_price: 0,
    total_amount: 0,
    paid_amount: 0,
    due_date: ''
  });

  const [newPayment, setNewPayment] = useState({ amount: 0 });

  useEffect(() => {
    if (!isAuthReady) return;
    const qT = query(collection(db, 'transactions'), orderBy('created_at', 'desc'));
    const unsubscribeT = onSnapshot(qT, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    const qC = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubscribeC = onSnapshot(qC, (snap) => {
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));

    const qP = query(collection(db, 'payments'), orderBy('date', 'desc'));
    const unsubscribeP = onSnapshot(qP, (snap) => {
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'payments'));

    return () => { unsubscribeT(); unsubscribeC(); unsubscribeP(); };
  }, [isAuthReady]);

  const remainingAmount = useMemo(() => {
    return newTx.total_amount - newTx.paid_amount;
  }, [newTx.total_amount, newTx.paid_amount]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert("يرجى اختيار عميل");
      return;
    }
    if (!profile?.permissions?.add && profile?.role !== 'admin') {
      alert("ليس لديك صلاحية الإضافة");
      return;
    }
    try {
      const txRef = await addDoc(collection(db, 'transactions'), {
        customer_id: selectedCustomer.id,
        unit_price: Number(newTx.unit_price),
        total_amount: Number(newTx.total_amount),
        paid_amount: Number(newTx.paid_amount),
        remaining_amount: remainingAmount,
        due_date: newTx.due_date ? Timestamp.fromDate(new Date(newTx.due_date)) : null,
        created_at: Timestamp.now(),
        user_id: auth.currentUser?.uid
      });

      if (newTx.paid_amount > 0) {
        await addDoc(collection(db, 'payments'), {
          transaction_id: txRef.id,
          amount: Number(newTx.paid_amount),
          date: Timestamp.now()
        });
      }

      setIsModalOpen(false);
      setNewTx({ unit_price: 0, total_amount: 0, paid_amount: 0, due_date: '' });
      setSelectedCustomer(null);
      setSearchCustomer('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'transactions');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    if (!profile?.permissions?.edit && profile?.role !== 'admin') {
      alert("ليس لديك صلاحية التعديل");
      return;
    }
    try {
      const newPaidAmount = selectedTx.paid_amount + Number(newPayment.amount);
      const newRemainingAmount = selectedTx.total_amount - newPaidAmount;

      await updateDoc(doc(db, 'transactions', selectedTx.id), {
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount
      });

      await addDoc(collection(db, 'payments'), {
        transaction_id: selectedTx.id,
        amount: Number(newPayment.amount),
        date: Timestamp.now()
      });

      setIsPaymentModalOpen(false);
      setNewPayment({ amount: 0 });
      setSelectedTx(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `transactions/${selectedTx.id}`);
    }
  };

  const filteredCustomers = customers.filter(c => c.name.includes(searchCustomer));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">العمليات المالية</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>إدخال عملية جديدة</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">التاريخ</th>
              <th className="px-6 py-4 font-semibold text-gray-600">العميل</th>
              <th className="px-6 py-4 font-semibold text-gray-600">الإجمالي</th>
              <th className="px-6 py-4 font-semibold text-gray-600">المدفوع</th>
              <th className="px-6 py-4 font-semibold text-gray-600">المتبقي</th>
              <th className="px-6 py-4 font-semibold text-gray-600">الاستحقاق</th>
              <th className="px-6 py-4 font-semibold text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map(t => {
              const customer = customers.find(c => c.id === t.customer_id);
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{format(t.created_at.toDate(), 'yyyy-MM-dd')}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{customer?.name || '...'}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{t.total_amount} ر.س</td>
                  <td className="px-6 py-4 text-green-600 font-medium">{t.paid_amount} ر.س</td>
                  <td className="px-6 py-4 text-red-600 font-bold">{t.remaining_amount} ر.س</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {t.due_date ? format(t.due_date.toDate(), 'yyyy-MM-dd') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => {
                        setSelectedTx(t);
                        setIsPaymentModalOpen(true);
                      }}
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      disabled={t.remaining_amount <= 0}
                    >
                      <DollarSign className="w-4 h-4" />
                      إضافة دفعة
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md"
            >
              <h3 className="text-xl font-bold mb-6">إدخال عملية جديدة</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">البحث عن عميل *</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      required 
                      type="text" 
                      value={selectedCustomer ? selectedCustomer.name : searchCustomer} 
                      onChange={e => {
                        setSearchCustomer(e.target.value);
                        setSelectedCustomer(null);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                  {showSuggestions && searchCustomer && !selectedCustomer && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm"
                        >
                          {c.name}
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && <p className="p-2 text-xs text-gray-400 text-center">لا يوجد نتائج</p>}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سعر الوحدة</label>
                    <input type="number" value={newTx.unit_price} onChange={e => setNewTx({...newTx, unit_price: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ الإجمالي *</label>
                    <input required type="number" value={newTx.total_amount} onChange={e => setNewTx({...newTx, total_amount: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع *</label>
                    <input required type="number" value={newTx.paid_amount} onChange={e => setNewTx({...newTx, paid_amount: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المتبقي</label>
                    <div className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-red-600 font-bold">
                      {remainingAmount}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق</label>
                  <input type="date" value={newTx.due_date} onChange={e => setNewTx({...newTx, due_date: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ العملية</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isPaymentModalOpen && selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md"
            >
              <h3 className="text-xl font-bold mb-2">إضافة دفعة جديدة</h3>
              <p className="text-sm text-gray-500 mb-6">العميل: {customers.find(c => c.id === selectedTx.customer_id)?.name}</p>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>إجمالي العملية:</span>
                  <span className="font-bold">{selectedTx.total_amount} ر.س</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>المدفوع سابقاً:</span>
                  <span className="text-green-600 font-bold">{selectedTx.paid_amount} ر.س</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span>المتبقي الحالي:</span>
                  <span className="text-red-600 font-bold">{selectedTx.remaining_amount} ر.س</span>
                </div>
              </div>

              <form onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ الدفعة *</label>
                  <input 
                    required 
                    type="number" 
                    max={selectedTx.remaining_amount}
                    value={newPayment.amount} 
                    onChange={e => setNewPayment({ amount: Number(e.target.value) })} 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button type="button" onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedTx(null);
                  }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                  <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">تأكيد الدفع</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReportsPage = () => {
  const { isAuthReady } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!isAuthReady) return;
    const qT = query(collection(db, 'transactions'), orderBy('created_at', 'desc'));
    const unsubscribeT = onSnapshot(qT, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    const qC = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubscribeC = onSnapshot(qC, (snap) => {
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));

    return () => { unsubscribeT(); unsubscribeC(); };
  }, [isAuthReady]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesCustomer = filterCustomer === 'all' || t.customer_id === filterCustomer;
      const date = t.created_at.toDate();
      const matchesStart = !startDate || date >= new Date(startDate);
      const matchesEnd = !endDate || date <= new Date(endDate + 'T23:59:59');
      return matchesCustomer && matchesStart && matchesEnd;
    });
  }, [transactions, filterCustomer, startDate, endDate]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => ({
      total: acc.total + t.total_amount,
      paid: acc.paid + t.paid_amount,
      remaining: acc.remaining + t.remaining_amount
    }), { total: 0, paid: 0, remaining: 0 });
  }, [filteredTransactions]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">التقارير التفصيلية</h3>
          <p className="text-gray-500 text-sm mt-1">عرض وتحليل العمليات المالية لشركة برهوم</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-bold"
        >
          <Printer className="w-5 h-5" />
          <span>تصدير PDF / طباعة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <label className="block text-sm font-bold text-gray-700 mb-2">تصفية حسب العميل</label>
          <select 
            value={filterCustomer} 
            onChange={e => setFilterCustomer(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">جميع العملاء</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <label className="block text-sm font-bold text-gray-700 mb-2">من تاريخ</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
          />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <label className="block text-sm font-bold text-gray-700 mb-2">إلى تاريخ</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl shadow-blue-100">
          <p className="text-blue-100 text-sm font-bold mb-1">إجمالي المبالغ</p>
          <h4 className="text-3xl font-black">{totals.total.toLocaleString()} <span className="text-sm font-normal">ر.س</span></h4>
        </div>
        <div className="bg-green-500 p-6 rounded-2xl text-white shadow-xl shadow-green-100">
          <p className="text-green-100 text-sm font-bold mb-1">إجمالي المدفوع</p>
          <h4 className="text-3xl font-black">{totals.paid.toLocaleString()} <span className="text-sm font-normal">ر.س</span></h4>
        </div>
        <div className="bg-red-500 p-6 rounded-2xl text-white shadow-xl shadow-red-100">
          <p className="text-red-100 text-sm font-bold mb-1">إجمالي المتبقي</p>
          <h4 className="text-3xl font-black">{totals.remaining.toLocaleString()} <span className="text-sm font-normal">ر.س</span></h4>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h4 className="font-bold text-gray-800">تفاصيل العمليات</h4>
          <span className="text-xs text-gray-400 font-medium">عدد العمليات: {filteredTransactions.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[800px]">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-600 text-sm">التاريخ</th>
                <th className="px-6 py-4 font-bold text-gray-600 text-sm">العميل</th>
                <th className="px-6 py-4 font-bold text-gray-600 text-sm">الإجمالي</th>
                <th className="px-6 py-4 font-bold text-gray-600 text-sm">المدفوع</th>
                <th className="px-6 py-4 font-bold text-gray-600 text-sm">المتبقي</th>
                <th className="px-6 py-4 font-bold text-gray-600 text-sm">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map(t => {
                const customer = customers.find(c => c.id === t.customer_id);
                return (
                  <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{format(t.created_at.toDate(), 'yyyy-MM-dd')}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{customer?.name || '...'}</td>
                    <td className="px-6 py-4 font-black text-gray-900">{t.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-green-600 font-bold">{t.paid_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-600 font-black">{t.remaining_amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {t.remaining_amount === 0 ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider">خالص</span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-wider">متبقي</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-area { border: none !important; box-shadow: none !important; }
          main { margin-right: 0 !important; }
          header { display: none !important; }
        }
      `}</style>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/users" element={<Layout><UsersPage /></Layout>} />
            <Route path="/customers" element={<Layout><CustomersPage /></Layout>} />
            <Route path="/transactions" element={<Layout><TransactionsPage /></Layout>} />
            <Route path="/reports" element={<Layout><ReportsPage /></Layout>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
