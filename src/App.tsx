/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  Wallet,
  Utensils,
  Car,
  ShoppingBag,
  Plus,
  Zap,
  Film,
  HelpCircle,
  Trash2,
  Search,
  Edit3,
  X,
  Calendar,
  Sparkles,
  Check,
  AlertCircle,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  Lock,
  Mail,
  Settings,
  History,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

// Transaction data structure
interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: 'comida' | 'transporte' | 'compras' | 'servicios' | 'entretenimiento' | 'otros';
  day: number;
}

type Tab = 'inicio' | 'movimientos' | 'ajustes';

// Category Configuration with Premium Color Palettes
const CATEGORIES = {
  comida: {
    label: 'Comida',
    icon: Utensils,
    bgColor: 'bg-[#EAF2EF]',
    textColor: 'text-[#1A7E5C]',
    badgeBg: 'bg-[#EAF2EF]',
    badgeText: 'text-[#1A7E5C]',
    colorHex: '#1A7E5C',
    quickTags: ['Almuerzo ejecutivo', 'Café / Snack', 'Cena familiar', 'Desayuno rápido', 'Hamburguesa / Pizza']
  },
  transporte: {
    label: 'Transporte',
    icon: Car,
    bgColor: 'bg-[#EEF2FC]',
    textColor: 'text-[#426EE4]',
    badgeBg: 'bg-[#EEF2FC]',
    badgeText: 'text-[#426EE4]',
    colorHex: '#426EE4',
    quickTags: ['Uber al centro', 'Gasolina', 'Peajes', 'Parqueadero', 'Pasaje Metro / Bus']
  },
  compras: {
    label: 'Despensa',
    icon: ShoppingBag,
    bgColor: 'bg-[#FFF1EB]',
    textColor: 'text-[#EC6833]',
    badgeBg: 'bg-[#FFF1EB]',
    badgeText: 'text-[#EC6833]',
    colorHex: '#EC6833',
    quickTags: ['Supermercado semanal', 'Verdulería / Frutas', 'Panadería / Leche', 'Farmacia / Aseo']
  },
  servicios: {
    label: 'Servicios',
    icon: Zap,
    bgColor: 'bg-[#F2EBF9]',
    textColor: 'text-[#8B5CF6]',
    badgeBg: 'bg-[#F2EBF9]',
    badgeText: 'text-[#8B5CF6]',
    colorHex: '#8B5CF6',
    quickTags: ['Luz & Agua', 'Plan Celular', 'Internet Hogar', 'Suscripción Streaming', 'Arriendo']
  },
  entretenimiento: {
    label: 'Cine/Ocio',
    icon: Film,
    bgColor: 'bg-[#FDF2F8]',
    textColor: 'text-[#EC4899]',
    badgeBg: 'bg-[#FDF2F8]',
    badgeText: 'text-[#EC4899]',
    colorHex: '#EC4899',
    quickTags: ['Cine & Palomitas', 'Salida de noche / Trago', 'Entrada Concierto', 'Helado / Postre']
  },
  otros: {
    label: 'Otros',
    icon: HelpCircle,
    bgColor: 'bg-[#F3F4F6]',
    textColor: 'text-[#4B5563]',
    badgeBg: 'bg-[#F3F4F6]',
    badgeText: 'text-[#4B5563]',
    colorHex: '#4B5563',
    quickTags: ['Regalo especial', 'Libros / Cursos', 'Ropa / Zapatos', 'Imprevisto médico', 'Gasto hormiga']
  }
};

const DEFAULT_BUDGET_PLACEHOLDER = 2000000;

// Derives "today" from the real device clock instead of a hardcoded day
const getCurrentDayOfMonth = () => Math.min(31, Math.max(1, new Date().getDate()));

export default function App() {
  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [needBudgetSetup, setNeedBudgetSetup] = useState(false);
  const [initialBudgetInput, setInitialBudgetInput] = useState('');

  // Wallet identifier (derived from authenticated user uid)
  const [walletId, setWalletId] = useState<string>('');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET_PLACEHOLDER);
  const [dbLoading, setDbLoading] = useState(true);

  // Navigation between the app's sections
  const [activeTab, setActiveTab] = useState<Tab>('inicio');

  // Modal displays
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Danger zone (delete account) confirmation flow, lives inside the Ajustes tab
  const [showDeleteConfirmScreen, setShowDeleteConfirmScreen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  // Filtering & search controls for the Movimientos tab
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  // Input states for Nuevo Gasto modal
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState<keyof typeof CATEGORIES>('comida');
  const [txDesc, setTxDesc] = useState('');
  const [txDay, setTxDay] = useState(getCurrentDayOfMonth());
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Budget editor input (lives in the Ajustes tab)
  const [budgetInput, setBudgetInput] = useState('');

  const unsubWalletRef = useRef<(() => void) | null>(null);
  const unsubTxRef = useRef<(() => void) | null>(null);
  const isDeletingAccountRef = useRef(false);

  // Feedback Notification trigger
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'delete' } | null>(null);

  // Hover state for the daily activity chart tooltip
  const [hoveredDay, setHoveredDay] = useState<{ day: number; amount: number } | null>(null);

  // Dark mode state (persistent)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('tb_theme');
    return saved ? saved === 'dark' : false;
  });

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (isDeletingAccountRef.current) {
        setUser(null);
        setWalletId('');
        setAuthLoading(false);
        return;
      }
      setUser(currentUser);
      if (currentUser) {
        setWalletId(currentUser.uid);
      } else {
        setWalletId('');
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Apply dark mode theme class to html element
  useEffect(() => {
    localStorage.setItem('tb_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Keep the budget editor input in sync with the live value from Firestore
  useEffect(() => {
    setBudgetInput(budget.toString());
  }, [budget]);

  // Sync state to Cloud Firestore in real time
  useEffect(() => {
    if (!walletId || isDeletingAccountRef.current) return;

    setDbLoading(true);

    // 1. Subscribe to Wallet Doc
    const walletRef = doc(db, 'wallets', walletId);
    const unsubWallet = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.budget === 'number') {
          setBudget(data.budget);
          setNeedBudgetSetup(false);
        }
      } else {
        // Document does not exist yet (first load) -> prompt user for budget setup
        setNeedBudgetSetup(true);
        setBudget(0);
        setTransactions([]);
        setDbLoading(false);
      }
    });

    // 2. Subscribe to Transactions
    const txQuery = query(
      collection(db, 'transactions'),
      where('walletId', '==', walletId)
    );
    const unsubTx = onSnapshot(txQuery, (querySnapshot) => {
      const txs: Transaction[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        txs.push({
          id: docSnap.id,
          description: data.description || '',
          amount: Number(data.amount) || 0,
          category: data.category || 'comida',
          day: Number(data.day) || getCurrentDayOfMonth()
        });
      });

      txs.sort((a, b) => b.day - a.day);

      setTransactions(txs);
      setDbLoading(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setDbLoading(false);
    });

    unsubWalletRef.current = unsubWallet;
    unsubTxRef.current = unsubTx;

    return () => {
      if (unsubWalletRef.current) {
        unsubWalletRef.current();
        unsubWalletRef.current = null;
      }
      if (unsubTxRef.current) {
        unsubTxRef.current();
        unsubTxRef.current = null;
      }
    };
  }, [walletId]);

  // Helper to flash success alerts
  const triggerNotification = (message: string, type: 'success' | 'info' | 'delete' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Basic stats derived from transaction records
  const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const availableAmount = budget - totalSpent;
  const spentPercentage = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;
  const availablePercentage = Math.max(0, 100 - spentPercentage);
  const currentDay = getCurrentDayOfMonth();

  // Real current month, derived from the device clock (never hardcoded)
  const monthLabel = (() => {
    const raw = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();
  const monthShort = new Date().toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');

  // Interactive daily aggregation
  const dailySpentMap = Array.from({ length: 32 }, () => 0);
  transactions.forEach((tx) => {
    if (tx.day >= 1 && tx.day <= 31) {
      dailySpentMap[tx.day] += tx.amount;
    }
  });
  const maxDailySpend = Math.max(...dailySpentMap, 10000);

  // Colombian peso standard dots-thousands divider
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Transaction selection helper
  const selectedTransaction = transactions.find(t => t.id === selectedTransactionId) || null;

  // Search filter for Movimientos
  const sortedTransactionsChronologically = [...transactions].sort((a, b) => b.day - a.day);
  const filteredTransactions = sortedTransactionsChronologically.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'todos' || tx.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Action: Edit expense handler
  const handleEditExpense = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setTxAmount(tx.amount.toString());
    setTxDesc(tx.description);
    setTxCategory(tx.category);
    setTxDay(tx.day);
    setShowNewExpenseModal(true);
  };

  // Action: Add/Update expense
  const handleSaveExpense = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!txAmount) {
      alert('Por favor digita un monto válido.');
      return;
    }

    const cleanAmount = parseInt(txAmount.replace(/\D/g, ''), 10);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      alert('Monto inválido.');
      return;
    }

    const finalDescription = txDesc.trim() || `Gasto de ${CATEGORIES[txCategory].label}`;

    try {
      if (editingTxId) {
        const txRef = doc(db, 'transactions', editingTxId);
        await updateDoc(txRef, {
          description: finalDescription,
          amount: cleanAmount,
          category: txCategory,
          day: Math.min(31, Math.max(1, txDay))
        });
        triggerNotification('Gasto actualizado con éxito 💸', 'success');
      } else {
        await addDoc(collection(db, 'transactions'), {
          walletId,
          description: finalDescription,
          amount: cleanAmount,
          category: txCategory,
          day: Math.min(31, Math.max(1, txDay)),
          createdAt: new Date().toISOString()
        });
        triggerNotification('Gasto registrado con éxito 💸', 'success');
      }
    } catch (err) {
      console.error("Error saving expense:", err);
      alert("Error al guardar en la base de datos de la nube.");
    }

    setTxAmount('');
    setTxDesc('');
    setTxCategory('comida');
    setTxDay(getCurrentDayOfMonth());
    setEditingTxId(null);
    setShowNewExpenseModal(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este movimiento?')) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
        triggerNotification('Registro eliminado satisfactoriamente', 'delete');
        setSelectedTransactionId(null);
      } catch (err) {
        console.error("Error deleting expense:", err);
      }
    }
  };

  // --- AUTHENTICATION HANDLERS ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword) {
      setAuthError('Por favor, ingresa un correo y una contraseña.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      setAuthLoading(true);
      await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      triggerNotification('¡Cuenta creada exitosamente! 🎉', 'success');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('El correo electrónico ya está registrado.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('El correo electrónico no es válido.');
      } else {
        setAuthError(err.message || 'Error al crear la cuenta.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword) {
      setAuthError('Por favor, ingresa tu correo y contraseña.');
      return;
    }
    try {
      setAuthLoading(true);
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      triggerNotification('Sesión iniciada con éxito 👋', 'success');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setAuthError('Credenciales incorrectas. Inténtalo de nuevo.');
      } else {
        setAuthError(err.message || 'Error al iniciar sesión.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      setAuthLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      triggerNotification('Sesión iniciada con Google 👋', 'success');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Error al iniciar sesión con Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAuthEmail('');
      setAuthPassword('');
      triggerNotification('Sesión cerrada con éxito', 'info');
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDbLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setDbLoading(false);
        return;
      }

      // Firebase deleteUser requires a recent login (typically < 5 mins)
      try {
        const tokenResult = await currentUser.getIdTokenResult();
        const authTime = tokenResult.authTime;
        const authTimeMs = new Date(authTime).getTime();
        const currentTimeMs = Date.now();
        const diffMinutes = (currentTimeMs - authTimeMs) / 1000 / 60;

        if (diffMinutes > 4.5) {
          alert('Por razones de seguridad, la eliminación de cuenta requiere haber iniciado sesión recientemente (dentro de los últimos 5 minutos). Por favor, cierra sesión, inicia sesión de nuevo e inténtalo otra vez.');
          setDbLoading(false);
          return;
        }
      } catch (tokenErr) {
        console.warn("Could not verify token freshness, proceeding anyway:", tokenErr);
      }

      isDeletingAccountRef.current = true;
      const uid = currentUser.uid;

      // 1. Manually unsubscribe from Firestore listeners to avoid trigger-race on deletion
      if (unsubWalletRef.current) {
        unsubWalletRef.current();
        unsubWalletRef.current = null;
      }
      if (unsubTxRef.current) {
        unsubTxRef.current();
        unsubTxRef.current = null;
      }

      // 2. Delete all transactions
      const txQuery = query(collection(db, 'transactions'), where('walletId', '==', uid));
      const querySnapshot = await getDocs(txQuery);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // 3. Delete wallet document
      await deleteDoc(doc(db, 'wallets', uid));

      // Reset local confirmation state
      setShowDeleteConfirmScreen(false);
      setDeleteConfirmInput('');

      // 4. Reset state completely to force LOGIN view rendering
      setNeedBudgetSetup(false);
      setWalletId('');
      setUser(null);
      setBudget(0);
      setTransactions([]);
      localStorage.removeItem('tb_wallet_id');

      // 5. Delete Auth User & Sign Out
      try {
        await deleteUser(currentUser);
        await signOut(auth);
        triggerNotification('Cuenta y datos eliminados permanentemente 🧹', 'delete');
      } catch (authErr: any) {
        console.error("Error deleting Auth user, forcing sign out:", authErr);
        await signOut(auth);
        if (authErr.code === 'auth/requires-recent-login') {
          alert('Tus datos fueron eliminados de la base de datos, pero por seguridad de Firebase, debes iniciar sesión de nuevo para borrar por completo tus credenciales de acceso.');
        } else {
          alert('Tus datos fueron eliminados, pero ocurrió un error al borrar las credenciales de Firebase: ' + (authErr.message || authErr));
        }
      }

    } catch (err: any) {
      console.error("Error during account and data deletion:", err);
      alert('Error al eliminar la cuenta y los datos: ' + (err.message || err));
    } finally {
      isDeletingAccountRef.current = false;
      setDbLoading(false);
    }
  };

  const handleCreateInitialBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(initialBudgetInput.replace(/\D/g, ''), 10);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Por favor, ingresa un presupuesto válido mayor a 0.');
      return;
    }
    if (!walletId) return;

    try {
      setDbLoading(true);
      await setDoc(doc(db, 'wallets', walletId), {
        budget: parsed,
        createdAt: new Date().toISOString()
      });
      setNeedBudgetSetup(false);
      triggerNotification('Presupuesto inicial configurado con éxito 🎉', 'success');
    } catch (err) {
      console.error("Error setting initial budget:", err);
      alert('Error al guardar el presupuesto en la nube.');
    } finally {
      setDbLoading(false);
    }
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(budgetInput.replace(/\D/g, ''), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      try {
        await setDoc(doc(db, 'wallets', walletId), { budget: parsed }, { merge: true });
        triggerNotification('Presupuesto mensual actualizado', 'info');
      } catch (err) {
        console.error("Error updating budget:", err);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#EFEFF3] dark:bg-[#090D16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#156045] border-t-transparent animate-spin"></div>
          <p className="text-sm font-bold text-[#156045] dark:text-emerald-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#EFEFF3] dark:bg-[#090D16] flex items-center justify-center p-4 transition-colors duration-200">
        <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-slate-800 overflow-hidden p-8 transition-colors duration-200">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#156045] dark:bg-[#1b7a58] p-4 rounded-2xl text-white shadow-lg shadow-[#156045]/20 mb-3">
              <Wallet className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Tu Billetera</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium text-center">
              Gestiona tu presupuesto mensual con facilidad y rapidez
            </p>
          </div>

          <form onSubmit={isRegistering ? handleSignUp : handleSignIn} className="space-y-4">
            {authError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-900/30">
                {authError}
              </div>
            )}

            <div>
              <label className="text-xs font-extrabold text-[#557667] dark:text-[#8CB4A5]/90 uppercase tracking-wider block mb-1.5">Correo Electrónico</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/80 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-[#156045] dark:focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#557667] dark:text-[#8CB4A5]/90 uppercase tracking-wider block mb-1.5">Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/80 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-[#156045] dark:focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#156045] hover:bg-[#0f4632] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all active:scale-95 shadow-sm shadow-[#156045]/10 mt-2 cursor-pointer"
            >
              {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-100 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-gray-400 dark:text-gray-500 text-xs font-extrabold uppercase tracking-widest">o bien</span>
            <div className="flex-grow border-t border-gray-100 dark:border-slate-800"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-slate-700/80 text-gray-700 dark:text-gray-200 font-bold py-3.5 px-4 rounded-xl text-sm transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Entrar con Google
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError('');
              }}
              className="text-xs font-bold text-[#156045] dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (needBudgetSetup) {
    return (
      <div className="min-h-screen bg-[#EFEFF3] dark:bg-[#090D16] flex items-center justify-center p-4 transition-colors duration-200">
        <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-slate-800 p-8 text-center transition-colors duration-200">
          <div className="bg-[#156045]/10 p-4 rounded-2xl text-[#156045] dark:text-emerald-400 w-16 h-16 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">¡Bienvenido a Tu Billetera!</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-xs mx-auto">
            Para iniciar tu cuenta desde cero, ingresa tu presupuesto disponible para este mes.
          </p>

          <form onSubmit={handleCreateInitialBudget} className="mt-6 space-y-4 text-left">
            <div>
              <label className="text-xs font-extrabold text-[#557667] dark:text-[#8CB4A5]/90 uppercase tracking-wider block mb-1.5">Presupuesto Mensual</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-black text-gray-400">$</span>
                <input
                  type="text"
                  value={initialBudgetInput}
                  onChange={(e) => setInitialBudgetInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Por ejemplo: 1500000"
                  className="w-full pl-8 pr-4 py-3 bg-[#F8FAFC] dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/80 rounded-xl text-sm font-black text-gray-900 dark:text-white outline-none focus:border-[#156045] dark:focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#156045] hover:bg-[#0f4632] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all active:scale-95 shadow-sm mt-2 cursor-pointer"
            >
              Comenzar a Registrar
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full border border-gray-200 dark:border-slate-700/80 hover:bg-gray-50 dark:hover:bg-slate-800/80 text-gray-600 dark:text-gray-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer mt-2"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  /**
   * INICIO TAB — balance overview, budget vs spent, daily chart, last movements
   */
  function renderInicioTab() {
    return (
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">

          {/* Remaining Available Card */}
          <div className="bg-[#F1F6F4] dark:bg-[#062419]/50 rounded-[24px] p-6 shadow-sm border border-[#E2EFE9] dark:border-[#104e37]/40 relative overflow-hidden transition-colors">
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[#156045]/[0.03] pointer-events-none"></div>

            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-[#527769] dark:text-[#8CB4A5] uppercase tracking-wider">Te queda disponible</span>
              <button
                onClick={() => setActiveTab('ajustes')}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#156045] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                title="Ajustar Presupuesto"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-[#156045] dark:text-[#25b37e]">$</span>
              <span className="text-4xl font-black text-[#156045] dark:text-[#25b37e] tracking-tight">
                {formatCurrency(availableAmount)}
              </span>
            </div>

            <p className="text-xs text-[#557667] dark:text-[#8CB4A5]/90 mt-1.5">
              de{' '}
              <button
                onClick={() => setActiveTab('ajustes')}
                className="font-bold text-gray-900 dark:text-white hover:underline cursor-pointer"
              >
                $ {formatCurrency(budget)}
              </button>{' '}
              presupuestado este mes
            </p>

            <div className="relative h-2 bg-[#DCE8E3] dark:bg-[#153a2b] rounded-full overflow-hidden mt-5 mb-3">
              <div
                className="absolute top-0 left-0 h-full bg-[#EF6950] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, spentPercentage)}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-xs font-extrabold mb-4">
              <span className="text-[#EF6950] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF6950]"></span>
                {spentPercentage}% gastado
              </span>
              <span className="text-[#557667] dark:text-[#8CB4A5]/90">
                {availablePercentage}% disponible
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-200/50 dark:border-slate-800/50">
              <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estado de cuenta</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all ${
                availableAmount >= 0
                  ? 'bg-[#EAF2EF] dark:bg-emerald-950/40 text-[#1A7E5C] dark:text-emerald-400 border border-[#1A7E5C]/10 dark:border-emerald-500/10'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${availableAmount >= 0 ? 'bg-[#1A7E5C] dark:bg-emerald-400' : 'bg-red-500'}`}></span>
                {availableAmount >= 0 ? 'Balance positivo' : 'Balance negativo'}
              </span>
            </div>
          </div>

          {/* Dual Cards: Budget and Spent */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab('ajustes')}
              className="text-left bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-700/80 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm cursor-pointer transition-colors"
            >
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider flex justify-between items-center">
                Presupuesto
                <Edit3 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              </span>
              <p className="text-lg font-black text-gray-900 dark:text-white mt-1">$ {formatCurrency(budget)}</p>
            </button>
            <div className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm transition-colors">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider block">Gastado</span>
              <p className="text-lg font-black text-[#EF6950] dark:text-[#f87f6a] mt-1">$ {formatCurrency(totalSpent)}</p>
            </div>
          </div>

          {/* Daily Activity Chart Card */}
          <div className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 rounded-[22px] p-5 shadow-sm relative transition-colors">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">Gastos diarios</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-400">Ritmo de este mes (1 - 31)</p>
              </div>
              <span className="text-xs font-extrabold text-[#156045] dark:text-emerald-400 bg-[#EAF2EF] dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
                ${formatCurrency(totalSpent)}
              </span>
            </div>

            <div className="relative pt-1 mt-6">
              {hoveredDay && (
                <div
                  className="absolute z-30 bg-gray-900/95 dark:bg-slate-900/95 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl border border-white/10 flex flex-col gap-0.5 pointer-events-none transition-all duration-100"
                  style={{
                    bottom: 'calc(100% - 10px)',
                    left: `${((hoveredDay.day - 1) / 30) * 100}%`,
                    transform: `translateX(-${((hoveredDay.day - 1) / 30) * 100}%) translateY(-14px)`
                  }}
                >
                  <span className="text-gray-300 dark:text-gray-300 font-bold whitespace-nowrap">
                    Día {hoveredDay.day} de {monthLabel}
                  </span>
                  <span className="text-emerald-400 dark:text-emerald-400 font-black whitespace-nowrap text-sm mt-0.5">
                    $ {formatCurrency(hoveredDay.amount)}
                  </span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-gray-900/95"></div>
                </div>
              )}

              <div className="h-20 flex items-end gap-[2px] w-full px-1">
                {Array.from({ length: 31 }, (_, i) => {
                  const day = i + 1;
                  const amount = dailySpentMap[day];
                  const isToday = day === currentDay;
                  const heightPercent = amount > 0 ? (amount / maxDailySpend) * 100 : 0;
                  return (
                    <div
                      key={day}
                      className="flex-1 flex flex-col justify-end h-full cursor-pointer group"
                      onMouseEnter={() => setHoveredDay({ day, amount })}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <div
                        className={`w-full rounded-[2px] transition-all duration-150 ${
                          isToday ? 'bg-[#EF6950] ring-1 ring-[#EF6950]/30' :
                          amount > 0 ? 'bg-[#29956F] hover:bg-[#156045] dark:bg-[#208260] dark:hover:bg-[#156045] group-hover:scale-y-105' : 'bg-gray-100 dark:bg-slate-700'
                        }`}
                        style={{ height: amount > 0 ? `${Math.max(heightPercent, 12)}%` : '3px' }}
                      ></div>
                    </div>
                  );
                })}
              </div>

              <div className="h-[1.5px] bg-gray-200 dark:bg-slate-700 w-full mt-2 rounded-full"></div>

              <div className="flex justify-between mt-1.5 text-[9px] font-extrabold text-gray-400 dark:text-gray-400">
                <span>Día 1</span>
                <span>Día 10</span>
                <span className="text-[#EF6950]">Día {currentDay} (Hoy)</span>
                <span>Día 31</span>
              </div>
            </div>
          </div>

        </div>

        <div className="lg:col-span-2 space-y-5">
          {/* Last Movements Preview */}
          <div className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 rounded-[22px] p-5 shadow-sm transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">Últimos movimientos</h3>
              <button
                onClick={() => setActiveTab('movimientos')}
                className="text-xs font-black text-[#156045] dark:text-emerald-400 hover:underline cursor-pointer bg-transparent border-none"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-2.5">
              {transactions.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#EAF2EF] dark:bg-emerald-950/40 text-[#156045] dark:text-emerald-400 flex items-center justify-center mb-1">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-black text-gray-800 dark:text-gray-200">Tu billetera está vacía</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 max-w-[220px] leading-relaxed mx-auto">
                    Presiona el botón verde <strong>"+"</strong> para agregar tu primer gasto.
                  </p>
                </div>
              ) : (
                transactions.slice(0, 5).map((tx) => {
                  const config = CATEGORIES[tx.category];
                  const Icon = config.icon;
                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTransactionId(tx.id)}
                      className="flex items-center justify-between p-1.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${config.bgColor} ${config.textColor} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-xs font-extrabold text-gray-900 dark:text-white group-hover:text-[#156045] dark:group-hover:text-emerald-400 transition-colors truncate">{tx.description}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-400 font-semibold">{config.label} • {tx.day} {monthShort}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-gray-900 dark:text-gray-100 shrink-0 ml-2">
                        -${formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * MOVIMIENTOS TAB — searchable, filterable full transaction history
   */
  function renderMovimientosTab() {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Movimientos</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
            {filteredTransactions.length} de {transactions.length} registros de {monthLabel}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-[#156045] dark:focus:border-emerald-500 shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar mb-4">
          <button
            onClick={() => setCategoryFilter('todos')}
            className={`px-3 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap cursor-pointer transition-all shrink-0 ${
              categoryFilter === 'todos' ? 'bg-[#156045] text-white' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            Todos
          </button>
          {Object.entries(CATEGORIES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`px-3 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap flex items-center gap-1 cursor-pointer transition-all shrink-0 ${
                categoryFilter === key ? `${value.badgeBg} ${value.badgeText}` : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <value.icon className="w-2.5 h-2.5" />
              {value.label}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
              <AlertCircle className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500">No hay movimientos registrados</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Intenta cambiar la búsqueda o categoría</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const config = CATEGORIES[tx.category];
              const Icon = config.icon;
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTransactionId(tx.id)}
                  className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3.5 rounded-2xl shadow-sm hover:shadow-md hover:border-[#156045]/25 dark:hover:border-emerald-500/25 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl ${config.bgColor} ${config.textColor} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left min-w-0">
                      <h4 className="font-extrabold text-gray-900 dark:text-white text-xs tracking-tight group-hover:text-[#156045] dark:group-hover:text-emerald-400 transition-colors truncate">
                        {tx.description}
                      </h4>
                      <p className="text-[10px] text-gray-400 dark:text-gray-400 font-bold mt-0.5">
                        {config.label} • Día {tx.day} de {monthLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                      -${formatCurrency(tx.amount)}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-500" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  /**
   * AJUSTES TAB — account info, budget editor, theme, danger zone
   */
  function renderAjustesTab() {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Ajustes</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold mt-0.5">Tu cuenta y presupuesto</p>
        </div>

        {/* Account card */}
        <div className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center gap-3.5 transition-colors">
          <div className="w-11 h-11 rounded-full bg-[#EAF2EF] dark:bg-emerald-950/40 text-[#156045] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Cuenta activa</span>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate" title={user?.email || ''}>
              {user?.email || 'Usuario de Google'}
            </p>
          </div>
        </div>

        {/* Theme toggle */}
        <div className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-700/60 flex items-center justify-center text-gray-500 dark:text-gray-300 shrink-0">
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[#156045]" />}
            </div>
            <div>
              <p className="text-xs font-extrabold text-gray-900 dark:text-white">Tema {darkMode ? 'oscuro' : 'claro'}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Cambia la apariencia de la app</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${darkMode ? 'bg-[#156045]' : 'bg-gray-200'}`}
            title="Cambiar tema"
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-[22px]' : 'translate-x-0.5'}`}></span>
          </button>
        </div>

        {/* Budget editor */}
        <form onSubmit={handleUpdateBudget} className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3.5 transition-colors">
          <div>
            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white">Presupuesto mensual</h4>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed mt-0.5">
              Ajusta el dinero disponible para {monthLabel}. El porcentaje de gasto se recalcula al instante.
            </p>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              Monto máximo presupuestado ($)
            </label>
            <input
              type="text"
              required
              placeholder="Ej. 2000000"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#156045]/25 focus:border-[#156045] transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-[#156045] dark:bg-emerald-600 hover:bg-[#114b36] dark:hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-[#156045]/15 transition-all cursor-pointer"
          >
            Guardar presupuesto
          </button>
        </form>

        {/* Trust / security note */}
        <div className="flex items-start gap-2.5 px-1">
          <ShieldCheck className="w-4 h-4 text-[#156045] dark:text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
            Tus movimientos y presupuesto se guardan de forma privada y se sincronizan en la nube con tu cuenta.
          </p>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>

        {/* Danger zone */}
        <div className="pt-4 border-t border-red-100 dark:border-red-950/30">
          {!showDeleteConfirmScreen ? (
            <div className="p-4 bg-red-50/50 dark:bg-red-950/10 rounded-2xl border border-red-100/60 dark:border-red-950/20">
              <h4 className="text-xs font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1.5">Zona de peligro</h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 font-semibold leading-normal">
                Eliminar tu cuenta borra de forma definitiva tu perfil y todo tu historial de gastos de la nube.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmScreen(true);
                  setDeleteConfirmInput('');
                }}
                className="mt-3 w-full bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer border border-red-200/50 dark:border-red-900/30"
              >
                Eliminar mi cuenta
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 bg-red-100/30 dark:bg-red-950/25 border border-red-200 dark:border-red-900/30 rounded-2xl text-red-700 dark:text-red-400">
                <p className="text-xs font-bold leading-relaxed">
                  ⚠️ <strong>Atención:</strong> esta acción es irreversible. Se eliminará tu cuenta y todos tus datos (presupuesto, gastos e historial) de forma permanente.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10.5px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-normal">
                  Para confirmar, escribe la palabra <strong className="text-red-600 dark:text-red-400 font-black font-mono">ELIMINAR</strong>:
                </label>
                <input
                  type="text"
                  placeholder="Escribe ELIMINAR"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  className="w-full px-4 py-3 bg-red-50/20 dark:bg-red-950/10 border border-red-200 dark:border-red-900 text-gray-900 dark:text-white rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-red-500/20 text-center uppercase tracking-widest font-mono"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirmScreen(false);
                    setDeleteConfirmInput('');
                  }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmInput !== 'ELIMINAR'}
                  onClick={handleDeleteAccount}
                  className={`flex-1 py-3 text-white rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    deleteConfirmInput === 'ELIMINAR'
                      ? 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/15'
                      : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Confirmar eliminación
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /**
   * MODAL: REGISTRAR / EDITAR GASTO — bottom sheet on mobile, centered dialog on larger screens
   */
  function RenderExpenseFormModal() {
    if (!showNewExpenseModal) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#111C24] w-full sm:max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[92%] sm:max-h-[90%] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative border border-gray-100 dark:border-slate-800 transition-colors">
          <div className="w-full flex justify-center py-2 shrink-0 bg-gray-50/50 dark:bg-slate-800/40 sm:hidden">
            <div className="w-12 h-1 bg-gray-300 dark:bg-slate-700 rounded-full"></div>
          </div>

          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#111C24] shrink-0 transition-colors">
            <div className="flex items-center gap-2">
              {editingTxId ? (
                <Edit3 className="w-5 h-5 text-[#156045] dark:text-emerald-400" />
              ) : (
                <Plus className="w-5 h-5 text-[#156045] dark:text-emerald-400" strokeWidth={3} />
              )}
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                {editingTxId ? 'Editar Gasto' : 'Registrar Gasto'}
              </h3>
            </div>
            <button
              onClick={() => {
                setTxAmount('');
                setTxDesc('');
                setEditingTxId(null);
                setShowNewExpenseModal(false);
              }}
              className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar space-y-4">

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 text-left">
                Monto del Gasto ($)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#156045] dark:text-emerald-400">$</span>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="0"
                  value={txAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setTxAmount(val);
                  }}
                  className="w-full pl-9 pr-4 py-3 bg-[#F1F6F4] dark:bg-slate-800/80 border-2 border-transparent focus:border-[#156045] dark:focus:border-emerald-500 rounded-2xl text-xl font-black text-[#156045] dark:text-emerald-400 placeholder:text-[#156045]/30 dark:placeholder:text-emerald-400/20 focus:outline-none transition-all text-left"
                />
              </div>

              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 hide-scrollbar shrink-0">
                {[5000, 10000, 20000, 50000].map((increment) => (
                  <button
                    key={increment}
                    type="button"
                    onClick={() => {
                      const currentVal = parseInt(txAmount, 10) || 0;
                      setTxAmount((currentVal + increment).toString());
                    }}
                    className="bg-[#EAF2EF] dark:bg-emerald-950/40 hover:bg-[#d5e7e1] dark:hover:bg-emerald-900/40 text-[#1A7E5C] dark:text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer"
                  >
                    +${formatCurrency(increment)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTxAmount('')}
                  className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 text-left">
                Seleccionar Categoría
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CATEGORIES).map(([key, value]) => {
                  const Icon = value.icon;
                  const isSelected = txCategory === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setTxCategory(key as keyof typeof CATEGORIES);
                        setTxDesc('');
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                        isSelected
                          ? `${value.badgeBg} ${value.textColor} border-transparent ring-2 ring-[#156045]/20 scale-[1.03] font-black`
                          : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] leading-tight font-extrabold">{value.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 text-left">
                Descripción / Concepto
              </label>
              <input
                type="text"
                placeholder={`Ej. ${CATEGORIES[txCategory].quickTags[0]}`}
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:border-[#156045] dark:focus:border-emerald-500 rounded-xl text-xs font-semibold focus:outline-none text-gray-900 dark:text-white text-left"
              />

              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold mt-2 uppercase tracking-wide text-left">Sugerencias rápidas:</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {CATEGORIES[txCategory].quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTxDesc(tag)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                      txDesc === tag
                        ? 'bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 text-left">
                Día del Gasto ({monthLabel})
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="31"
                  value={txDay}
                  onChange={(e) => setTxDay(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#156045] dark:accent-emerald-500 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="bg-gray-100 dark:bg-slate-800 text-[#156045] dark:text-emerald-400 text-xs font-black px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shrink-0 w-16 text-center">
                  Día {txDay}
                </span>
              </div>
            </div>

            <div className="pt-3 space-y-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSaveExpense()}
                className="w-full py-3.5 bg-[#156045] hover:bg-[#104a35] text-white rounded-xl font-extrabold text-xs shadow-lg shadow-[#156045]/15 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {editingTxId ? 'Guardar Cambios' : 'Guardar Gasto'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTxAmount('');
                  setTxDesc('');
                  setEditingTxId(null);
                  setShowNewExpenseModal(false);
                }}
                className="w-full py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold transition-all text-center cursor-pointer"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  /**
   * MODAL: DETALLE DEL GASTO
   */
  function RenderDetailModal() {
    if (!selectedTransactionId || !selectedTransaction) return null;
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[2.5px] z-[55] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#111C24] w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-gray-100/50 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative flex flex-col transition-colors">

          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#111C24] shrink-0 transition-colors">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Detalle del Registro</h3>
            <button
              onClick={() => setSelectedTransactionId(null)}
              className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto hide-scrollbar space-y-5">

            <div className="bg-white dark:bg-slate-800/60 border border-gray-100 dark:border-slate-750 p-5 rounded-[24px] shadow-sm text-center relative overflow-hidden transition-colors">
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: CATEGORIES[selectedTransaction.category].colorHex }}></div>

              <div className={`w-12 h-12 rounded-2xl mx-auto ${CATEGORIES[selectedTransaction.category].bgColor} ${CATEGORIES[selectedTransaction.category].textColor} flex items-center justify-center mb-2 shrink-0`}>
                {React.createElement(CATEGORIES[selectedTransaction.category].icon, { className: 'w-6 h-6' })}
              </div>

              <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${CATEGORIES[selectedTransaction.category].badgeBg} ${CATEGORIES[selectedTransaction.category].badgeText} mb-2`}>
                {CATEGORIES[selectedTransaction.category].label}
              </span>

              <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight leading-snug">
                {selectedTransaction.description}
              </h3>

              <div className="text-2xl font-black text-gray-900 dark:text-white mt-3 tracking-tight">
                <span className="text-[#EF6950] font-extrabold">-$</span> {formatCurrency(selectedTransaction.amount)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-750 rounded-2xl p-4 space-y-2.5 text-[11px] transition-colors">
              <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-slate-750">
                <span className="text-gray-400 dark:text-gray-500 font-bold">Fecha de Registro</span>
                <span className="font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  Día {selectedTransaction.day} de {monthLabel}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 dark:text-gray-500 font-bold">Porcentaje Presupuestal</span>
                <span className="font-extrabold text-gray-800 dark:text-gray-200">
                  {budget > 0 ? ((selectedTransaction.amount / budget) * 100).toFixed(1) : 0}% del total
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedTransactionId(null);
                  handleEditExpense(selectedTransaction);
                }}
                className="w-full py-3 bg-[#156045] dark:bg-emerald-600 hover:bg-[#114b36] dark:hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-[#156045]/15"
              >
                <Edit3 className="w-4 h-4" />
                Editar Gasto
              </button>

              <button
                type="button"
                onClick={() => handleDeleteExpense(selectedTransaction.id)}
                className="w-full py-3 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/30 text-[#EF6950] dark:text-red-400 border border-red-100/50 dark:border-red-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Registro
              </button>

              <button
                type="button"
                onClick={() => setSelectedTransactionId(null)}
                className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs transition-all text-center cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: typeof Wallet }[] = [
    { id: 'inicio', label: 'Inicio', icon: Wallet },
    { id: 'movimientos', label: 'Movimientos', icon: History },
    { id: 'ajustes', label: 'Ajustes', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#EFEFF3] dark:bg-[#090D16] text-gray-800 dark:text-gray-100 font-sans flex flex-col antialiased transition-colors duration-200">

      {/* TOP HEADER */}
      <header className="w-full bg-white dark:bg-[#111C24] border-b border-gray-100 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#156045] dark:bg-[#1b7a58] p-2 rounded-xl text-white shadow-sm shadow-[#156045]/20">
            <Wallet className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-900 dark:text-white tracking-tight leading-none">Tu billetera</h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-0.5">{monthLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={darkMode ? 'Tema claro' : 'Tema oscuro'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[#156045]" />}
          </button>
          <button
            onClick={handleSignOut}
            className="w-9 h-9 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm py-3 px-4 rounded-2xl text-xs font-bold text-white shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' ? 'bg-[#156045]' :
          notification.type === 'delete' ? 'bg-[#EF6950]' : 'bg-gray-800'
        }`}>
          {notification.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full px-4 sm:px-6 py-5 pb-28">
        {dbLoading ? (
          <div className="max-w-5xl mx-auto flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-4 border-[#156045] border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <>
            {activeTab === 'inicio' && renderInicioTab()}
            {activeTab === 'movimientos' && renderMovimientosTab()}
            {activeTab === 'ajustes' && renderAjustesTab()}
          </>
        )}
      </main>

      {/* BOTTOM TAB BAR — the "+" action lives inside this fixed strip (raised, centered)
          so it can never drift over scrolled page content, unlike a viewport-pinned FAB. */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111C24] border-t border-gray-100 dark:border-slate-800 px-2 grid grid-cols-4 items-center z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] h-[68px]">
        {TABS.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors cursor-pointer justify-self-center ${
                isActive ? 'text-[#156045] dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? 'font-black' : 'font-bold'}`}>{tab.label}</span>
            </button>
          );
        })}

        {/* spacer column reserved for the raised action button below */}
        <div />

        {TABS.slice(2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors cursor-pointer justify-self-center ${
                isActive ? 'text-[#156045] dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? 'font-black' : 'font-bold'}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => setShowNewExpenseModal(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#156045] hover:bg-[#114b36] text-white w-14 h-14 rounded-full shadow-[0_8px_20px_rgba(21,96,69,0.35)] flex items-center justify-center transition-all active:scale-95 z-40 cursor-pointer border-4 border-[#EFEFF3] dark:border-[#090D16]"
        title="Registrar Gasto"
      >
        <Plus className="w-6 h-6" strokeWidth={3} />
      </button>

      {RenderExpenseFormModal()}
      {RenderDetailModal()}
    </div>
  );
}
