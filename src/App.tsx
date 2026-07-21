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
  ChevronDown, 
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
  Smartphone, 
  Maximize2, 
  RotateCcw,
  Calendar,
  Sparkles,
  ArrowLeft,
  Clock,
  History,
  Check,
  TrendingUp,
  AlertCircle,
  Award,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  Lock,
  Mail,
  Settings
} from 'lucide-react';

// Transaction data structure
interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: 'comida' | 'transporte' | 'compras' | 'servicios' | 'entretenimiento' | 'otros';
  day: number;
}

// Category Configuration with Premium Color Palettes matching the visual reference
const CATEGORIES = {
  comida: {
    label: 'Comida',
    icon: Utensils,
    bgColor: 'bg-[#EAF2EF]',
    textColor: 'text-[#1A7E5C]',
    badgeBg: 'bg-[#EAF2EF]',
    badgeText: 'text-[#1A7E5C]',
    hoverBg: 'hover:bg-[#1A7E5C]',
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
    hoverBg: 'hover:bg-[#426EE4]',
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
    hoverBg: 'hover:bg-[#EC6833]',
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
    hoverBg: 'hover:bg-[#8B5CF6]',
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
    hoverBg: 'hover:bg-[#EC4899]',
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
    hoverBg: 'hover:bg-[#4B5563]',
    colorHex: '#4B5563',
    quickTags: ['Regalo especial', 'Libros / Cursos', 'Ropa / Zapatos', 'Imprevisto médico', 'Gasto hormiga']
  }
};

// Initial Seed Data matching the user mockup perfectly
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Almuerzo ejecutivo', amount: 28000, category: 'comida', day: 20 },
  { id: '2', description: 'Uber al centro', amount: 14500, category: 'transporte', day: 20 },
  { id: '3', description: 'Supermercado', amount: 125000, category: 'compras', day: 19 },
  { id: '4', description: 'Suscripciones', amount: 50000, category: 'servicios', day: 18 },
  { id: '5', description: 'Cine & Palomitas', amount: 12900, category: 'entretenimiento', day: 16 },
  { id: '6', description: 'Mantenimiento Auto', amount: 70000, category: 'transporte', day: 15 },
  { id: '7', description: 'Compra de Libros', amount: 120000, category: 'otros', day: 13 },
  { id: '8', description: 'Consulta Médica', amount: 75000, category: 'otros', day: 12 },
  { id: '9', description: 'Regalo de Cumpleaños', amount: 95000, category: 'otros', day: 10 },
  { id: '10', description: 'Café con amigos', amount: 45000, category: 'comida', day: 8 },
  { id: '11', description: 'Cena familiar', amount: 150000, category: 'comida', day: 5 },
  { id: '12', description: 'Gasolina', amount: 22000, category: 'transporte', day: 4 },
  { id: '13', description: 'Peaje', amount: 15000, category: 'transporte', day: 3 },
  { id: '14', description: 'Desayuno rápido', amount: 35000, category: 'comida', day: 1 }
];

const INITIAL_BUDGET = 2000000;

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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<number>(INITIAL_BUDGET);
  const [dbLoading, setDbLoading] = useState(true);

  // Modal displays (instead of rigid full screen switching)
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showDeleteConfirmScreen, setShowDeleteConfirmScreen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [viewMode, setViewMode] = useState<'mobile' | 'full'>('mobile');
  
  // Filtering & search controls for history
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  // Input states for Nuevo Gasto modal
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState<keyof typeof CATEGORIES>('comida');
  const [txDesc, setTxDesc] = useState('');
  const [txDay, setTxDay] = useState(20);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Budget editor input
  const [budgetInput, setBudgetInput] = useState('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState('');

  // Month selector simulation
  const [selectedMonth, setSelectedMonth] = useState('Julio 2026');
  const [showMonthSelect, setShowMonthSelect] = useState(false);

  // Quick 30-Second Challenge Timer states
  const [challengeState, setChallengeState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [challengeSuccess, setChallengeSuccess] = useState<boolean | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const unsubWalletRef = useRef<(() => void) | null>(null);
  const unsubTxRef = useRef<(() => void) | null>(null);
  const isDeletingAccountRef = useRef(false);

  // Feedback Notification trigger
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'delete' } | null>(null);

  // Hover states for daily activity chart tooltips
  const [hoveredMobileDay, setHoveredMobileDay] = useState<{ day: number; amount: number } | null>(null);
  const [hoveredDesktopDay, setHoveredDesktopDay] = useState<{ day: number; amount: number } | null>(null);

  // Dark mode state (persistent)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('tb_theme');
    return saved ? saved === 'dark' : false;
  });

  // Apply dark mode theme class to html/body elements
  useEffect(() => {
    localStorage.setItem('tb_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
        // Document does not exist yet (Day Zero / first load)
        // Set state to prompt user for budget setup
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
          day: Number(data.day) || 20
        });
      });
      
      // Sort transactions descending by day
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

  // Handle Challenge Timer ticks
  useEffect(() => {
    if (challengeState === 'running') {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const nextVal = Math.round((prev + 0.1) * 10) / 10;
          if (nextVal >= 30) {
            // Failed the 30 seconds challenge!
            clearInterval(timerRef.current!);
            setChallengeState('completed');
            setChallengeSuccess(false);
            triggerNotification('¡Se acabó el tiempo! Superaste los 30 segundos.', 'delete');
            return 30;
          }
          return nextVal;
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [challengeState]);

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

  // Search filter for history
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
        // Update existing transaction in Firestore
        const txRef = doc(db, 'transactions', editingTxId);
        await updateDoc(txRef, {
          description: finalDescription,
          amount: cleanAmount,
          category: txCategory,
          day: Math.min(31, Math.max(1, txDay))
        });
        triggerNotification('Gasto actualizado con éxito 💸', 'success');
      } else {
        // Create new transaction in Firestore
        await addDoc(collection(db, 'transactions'), {
          walletId,
          description: finalDescription,
          amount: cleanAmount,
          category: txCategory,
          day: Math.min(31, Math.max(1, txDay)),
          createdAt: new Date().toISOString()
        });

        // If a timer was running, calculate the finish time!
        if (challengeState === 'running') {
          setChallengeState('completed');
          setChallengeSuccess(elapsedTime <= 30);
          triggerNotification(`¡Éxito! Gasto registrado en ${elapsedTime}s ⚡`, 'success');
        } else {
          triggerNotification('Gasto registrado con éxito 💸', 'success');
        }
      }
    } catch (err) {
      console.error("Error saving expense:", err);
      alert("Error al guardar en la base de datos de la nube.");
    }

    // Reset Form fields
    setTxAmount('');
    setTxDesc('');
    setTxCategory('comida');
    setTxDay(20);
    setEditingTxId(null);

    // Close Modal
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

      // Check if the login session is recent (Firebase deleteUser requires a recent login, typically < 5 mins)
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

      // Reset modal displays and confirm fields
      setShowBudgetModal(false);
      setShowDeleteConfirmScreen(false);
      setDeleteConfirmInput('');

      // 4. Reset state & local Storage completely to force LOGIN view rendering
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
        setShowBudgetModal(false);
        triggerNotification('Presupuesto mensual actualizado', 'info');
      } catch (err) {
        console.error("Error updating budget:", err);
      }
    }
  };

  const updateBudgetInline = async (newBudget: number) => {
    try {
      await setDoc(doc(db, 'wallets', walletId), { budget: newBudget }, { merge: true });
    } catch (err) {
      console.error("Error updating budget inline:", err);
    }
  };

  const resetAllToMockup = async () => {
    if (confirm('¿Restablecer datos predeterminados de Tu Billetera en la nube?')) {
      try {
        setDbLoading(true);
        // Reset budget in Firestore
        await setDoc(doc(db, 'wallets', walletId), { budget: INITIAL_BUDGET }, { merge: true });
        
        // Delete all current transactions for this wallet
        const txQuery = query(collection(db, 'transactions'), where('walletId', '==', walletId));
        const querySnapshot = await getDocs(txQuery);
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Add initial mock transactions to Firestore
        const addPromises = INITIAL_TRANSACTIONS.map(tx => {
          return addDoc(collection(db, 'transactions'), {
            walletId,
            description: tx.description,
            amount: tx.amount,
            category: tx.category,
            day: tx.day,
            createdAt: new Date().toISOString()
          });
        });
        await Promise.all(addPromises);

        setSearchQuery('');
        setCategoryFilter('todos');
        setChallengeState('idle');
        setElapsedTime(0);
        setChallengeSuccess(null);
        setShowNewExpenseModal(false);
        setShowHistoryModal(false);
        setSelectedTransactionId(null);
        triggerNotification('Datos restaurados al original en Firestore Cloud', 'info');
      } catch (err) {
        console.error("Error resetting data:", err);
      } finally {
        setDbLoading(false);
      }
    }
  };

  // Clear everything to Day Zero
  const clearAllToDayZero = async () => {
    if (confirm('¿Quieres limpiar todos los movimientos para iniciar en Día Cero? Esta acción se guardará en la nube.')) {
      try {
        setDbLoading(true);
        // Reset budget in Firestore to standard INITIAL_BUDGET
        await setDoc(doc(db, 'wallets', walletId), { budget: INITIAL_BUDGET }, { merge: true });

        // Delete all current transactions for this wallet
        const txQuery = query(collection(db, 'transactions'), where('walletId', '==', walletId));
        const querySnapshot = await getDocs(txQuery);
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        setSearchQuery('');
        setCategoryFilter('todos');
        setChallengeState('idle');
        setElapsedTime(0);
        setChallengeSuccess(null);
        setShowNewExpenseModal(false);
        setShowHistoryModal(false);
        setSelectedTransactionId(null);
        triggerNotification('¡Cuenta limpia en Firestore! Modo Día Cero activado ✨', 'info');
      } catch (err) {
        console.error("Error clearing transactions:", err);
      } finally {
        setDbLoading(false);
      }
    }
  };

  // Launch speedrun challenge
  const startSpeedrun = async () => {
    if (confirm('El reto de velocidad restablecerá los movimientos en la base de datos en la nube. ¿Deseas iniciar?')) {
      try {
        setDbLoading(true);
        // Reset budget in Firestore
        await setDoc(doc(db, 'wallets', walletId), { budget: INITIAL_BUDGET }, { merge: true });
        
        // Delete all current transactions
        const txQuery = query(collection(db, 'transactions'), where('walletId', '==', walletId));
        const querySnapshot = await getDocs(txQuery);
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Add initial mock transactions
        const addPromises = INITIAL_TRANSACTIONS.map(tx => {
          return addDoc(collection(db, 'transactions'), {
            walletId,
            description: tx.description,
            amount: tx.amount,
            category: tx.category,
            day: tx.day,
            createdAt: new Date().toISOString()
          });
        });
        await Promise.all(addPromises);

        setElapsedTime(0);
        setChallengeSuccess(null);
        setChallengeState('running');
        // Pre-populate today's date
        setTxDay(20);
        setTxCategory('comida');
        setTxDesc('');
        setTxAmount('');
        
        // Switch directly to Nuevo Gasto modal to begin recording immediately
        setShowNewExpenseModal(true);
        triggerNotification('⏱️ ¡Tiempo corriendo! Registra un gasto rápido.', 'info');
      } catch (err) {
        console.error("Error launching speedrun:", err);
      } finally {
        setDbLoading(false);
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
            {/* Google Logo vector */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
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

  return (
    <div className="min-h-screen bg-[#EFEFF3] dark:bg-[#090D16] text-gray-800 dark:text-gray-100 font-sans flex flex-col antialiased transition-colors duration-200">
      
      {/* GLOBAL TOP HEADER */}
      <header className="w-full bg-white dark:bg-[#111827] border-b border-gray-200/80 dark:border-slate-800 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-40 shadow-sm shrink-0 transition-colors">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="bg-[#156045] dark:bg-[#1b7a58] p-2.5 rounded-2xl text-white shadow-md shadow-[#156045]/20">
              <Wallet className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Tu billetera</h1>
                <span className="bg-[#EAF2EF] dark:bg-[#156045]/20 text-[#156045] dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">MVP</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                Optimizado para registrar gastos rápidos en menos de 30 segundos.
              </p>
            </div>
          </div>

          {/* USER PROFILE INFO & SIGN OUT & DELETE ACCOUNT */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/40 border border-gray-200/50 dark:border-slate-700/50 px-3.5 py-1.5 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none mb-0.5">Cuenta Activa</span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 max-w-[120px] truncate leading-none" title={user?.email || ''}>
                {user?.email || 'Usuario Google'}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-gray-200 dark:bg-slate-700 mx-1"></div>
            
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="p-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => {
                setBudgetInput(budget.toString());
                setShowBudgetModal(true);
              }}
              className="p-1.5 text-gray-400 hover:text-[#156045] dark:text-gray-500 dark:hover:text-emerald-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Configuración"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
 
        {/* CONTROLS & CHALLENGE WIDGET */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* CHALLENGE CONTROLLER */}
          <div className="bg-[#F8FAFC] dark:bg-slate-800/60 border border-gray-200/70 dark:border-slate-700/60 p-1.5 rounded-xl flex items-center gap-2">
            <div className="px-2.5">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest block">Reto 30 Segundos</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className={`w-3.5 h-3.5 ${challengeState === 'running' ? 'text-orange-500 animate-spin' : 'text-gray-400 dark:text-gray-500'}`} />
                <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-200">{elapsedTime.toFixed(1)}s</span>
              </div>
            </div>
            {challengeState === 'running' ? (
              <button 
                onClick={() => { setChallengeState('idle'); setElapsedTime(0); }}
                className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
            ) : (
              <button 
                onClick={startSpeedrun}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Probar 30s
              </button>
            )}
          </div>
 
          {/* RESET BUTTON */}
          <button
            onClick={resetAllToMockup}
            className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 shadow-sm px-3 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
            title="Resetear al estado del mockup"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>

          {/* DAY ZERO BUTTON */}
          <button
            onClick={clearAllToDayZero}
            className="flex items-center gap-1 bg-[#F1F6F4] dark:bg-emerald-950/20 hover:bg-[#E2EFE9] dark:hover:bg-emerald-900/20 border border-[#E2EFE9] dark:border-emerald-900/30 shadow-sm px-3 py-2.5 rounded-xl text-xs font-bold text-[#156045] dark:text-emerald-400 hover:text-[#114b36] transition-all cursor-pointer"
            title="Limpiar cuenta para modo Día Cero"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Día Cero
          </button>
 
          {/* VIEWPORT SELECTOR */}
          <div className="bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl flex items-center border border-gray-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'mobile' ? 'bg-white dark:bg-slate-700 text-[#156045] dark:text-emerald-400 shadow-sm font-extrabold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Vista Celular
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'full' ? 'bg-white dark:bg-slate-700 text-[#156045] dark:text-emerald-400 shadow-sm font-extrabold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Completa
            </button>
          </div>

          {/* THEME TOGGLE */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 shadow-sm p-2.5 rounded-xl text-gray-600 dark:text-gray-300 transition-all cursor-pointer"
            title={darkMode ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500 animate-pulse" /> : <Moon className="w-4 h-4 text-[#156045]" />}
          </button>
        </div>
      </header>

      {/* CHALLENGE RESULT BANNER */}
      {challengeState === 'completed' && challengeSuccess !== null && (
        <div className={`w-full py-3 px-4 flex justify-between items-center transition-all shrink-0 ${
          challengeSuccess ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="mx-auto flex items-center gap-3">
            {challengeSuccess ? (
              <>
                <Award className="w-5 h-5 animate-bounce text-amber-300" />
                <span className="text-sm font-bold">
                  <strong>¡RETO SUPERADO!</strong> Registraste el gasto exitosamente en <strong>{elapsedTime} segundos</strong>. ¡Cumpliste el reto de velocidad! 🚀
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-bold">
                  <strong>TIEMPO AGOTADO:</strong> Tomó más de 30 segundos registrar el gasto. ¡Sigue practicando con las sugerencias rápidas! ⏱️
                </span>
              </>
            )}
            <button 
              onClick={() => { setChallengeState('idle'); setElapsedTime(0); setChallengeSuccess(null); }}
              className="bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs px-2.5 py-1 rounded-md ml-4 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER WORKSPACE */}
      <main className="flex-1 flex items-center justify-center p-3 md:p-6 overflow-hidden relative">
        
        {viewMode === 'mobile' ? (
          
          /* VIEW MODE: SMARTPHONE BODY SIMULATOR WITH INTERNAL ABSOLUTE MODALS */
          <div className="relative animate-in zoom-in-95 duration-200 shrink-0">
            {/* Phone physical container */}
            <div className="w-[395px] h-[815px] bg-[#FAFAFA] dark:bg-[#111C24] rounded-[52px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] overflow-hidden border-[11px] border-[#18181B] relative flex flex-col transition-colors duration-200">
              
              {/* Camera Notch Dynamic Island */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6.5 bg-[#18181B] rounded-b-[20px] z-50 flex items-center justify-center">
                <span className="w-10 h-1 bg-gray-800 rounded-full"></span>
              </div>

              {/* Inside Layout Area */}
              <div className="flex-1 h-full overflow-hidden flex flex-col relative pt-5">
                
                {/* TOAST NOTIFICATION HUD */}
                {notification && (
                  <div className={`absolute top-18 left-4 right-4 py-3 px-4 rounded-2xl text-xs font-bold text-white shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-top-4 duration-300 ${
                    notification.type === 'success' ? 'bg-[#156045] shadow-[#156045]/20' : 
                    notification.type === 'delete' ? 'bg-[#EF6950] shadow-[#EF6950]/20' : 'bg-gray-800'
                  }`}>
                    {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{notification.message}</span>
                  </div>
                )}

                {/* DASHBOARD CONTAINER - ALWAYS THE MAIN VIEWPORT */}
                <div className="flex-1 overflow-hidden flex flex-col relative">
                  
                  {/* Dashboard Header Bar */}
                  <div className="px-6 pt-5 pb-3 flex justify-between items-center bg-[#FAFAFA] dark:bg-[#111C24] shrink-0 transition-colors duration-200">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-[#156045] dark:bg-[#1b7a58] p-2 rounded-xl text-white">
                        <Wallet className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-400 font-extrabold uppercase tracking-widest block leading-none">Mi Cuenta</span>
                        <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-tight mt-0.5">Tu billetera</h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Internal Phone Theme Toggle */}
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/60 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
                        title={darkMode ? 'Tema Claro' : 'Tema Oscuro'}
                      >
                        {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[#156045]" />}
                      </button>

                      {/* Internal Phone Settings Button */}
                      <button
                        onClick={() => {
                          setBudgetInput(budget.toString());
                          setShowBudgetModal(true);
                        }}
                        className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/60 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
                        title="Configuración"
                      >
                        <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>

                      {/* Month selector dropdown */}
                      <div className="relative">
                        <button 
                          onClick={() => setShowMonthSelect(!showMonthSelect)}
                          className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 shadow-sm px-3 py-1.5 rounded-full text-[11px] font-bold text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
                        >
                          {selectedMonth}
                          <ChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        </button>
                        {showMonthSelect && (
                          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            {['Julio 2026', 'Agosto 2026'].map((m) => (
                              <button
                                key={m}
                                onClick={() => { setSelectedMonth(m); setShowMonthSelect(false); }}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 block transition-colors"
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Main Scrollable Content */}
                  <div className="flex-1 overflow-y-auto px-6 pb-20 hide-scrollbar space-y-4">
                    
                    {/* 1. Remaining Available Card */}
                    <div className="bg-[#F1F6F4] dark:bg-[#062419]/50 rounded-[24px] p-5 shadow-sm border border-[#E2EFE9] dark:border-[#104e37]/40 relative overflow-hidden group transition-colors">
                      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[#156045]/[0.02] pointer-events-none"></div>
                      
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-extrabold text-[#527769] dark:text-[#8CB4A5] uppercase tracking-wider">Te queda disponible</span>
                        <button 
                          onClick={() => { 
                            setBudgetInput(budget.toString());
                            setShowBudgetModal(true);
                          }}
                          className="p-1 transition-colors rounded-md text-gray-400 dark:text-gray-500 hover:text-[#156045] dark:hover:text-emerald-400 cursor-pointer"
                          title="Ajustar Presupuesto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-extrabold text-[#156045] dark:text-[#25b37e]">$</span>
                        <span className="text-3xl font-black text-[#156045] dark:text-[#25b37e] tracking-tight">
                          {formatCurrency(availableAmount)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#557667] dark:text-[#8CB4A5]/90 mt-1 flex flex-wrap items-center gap-1">
                        de{' '}
                        <span 
                          onClick={() => {
                            setBudgetInput(budget.toString());
                            setShowBudgetModal(true);
                          }}
                          className="font-bold text-gray-900 dark:text-white hover:underline cursor-pointer"
                          title="Haz clic para editar"
                        >
                          $ {formatCurrency(budget)}
                        </span>{' '}
                        presupuestado este mes
                      </p>

                      <div className="relative h-2 bg-[#DCE8E3] dark:bg-[#153a2b] rounded-full overflow-hidden mt-4 mb-2">
                        <div 
                          className="absolute top-0 left-0 h-full bg-[#EF6950] rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, spentPercentage)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-extrabold mb-3">
                        <span className="text-[#EF6950] flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#EF6950]"></span>
                          {spentPercentage}% gastado
                        </span>
                        <span className="text-[#557667] dark:text-[#8CB4A5]/90">
                          {availablePercentage}% disponible
                        </span>
                      </div>

                      {/* Estado de Cuenta */}
                      <div className="flex justify-between items-center pt-2.5 border-t border-gray-200/50 dark:border-slate-800/50">
                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estado de Cuenta</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black transition-all ${
                          availableAmount >= 0 
                            ? 'bg-[#EAF2EF] dark:bg-emerald-950/40 text-[#1A7E5C] dark:text-emerald-400 border border-[#1A7E5C]/10 dark:border-emerald-500/10' 
                            : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 animate-pulse'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${availableAmount >= 0 ? 'bg-[#1A7E5C] dark:bg-emerald-400' : 'bg-red-500'}`}></span>
                          {availableAmount >= 0 ? 'Balance positivo' : 'Balance negativo'}
                        </span>
                      </div>
                    </div>

                    {/* Dual Cards: Budget and Spent */}
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => {
                          setBudgetInput(budget.toString());
                          setShowBudgetModal(true);
                        }}
                        className="bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-700/80 border border-gray-100 dark:border-slate-700 rounded-2xl p-3.5 shadow-sm cursor-pointer transition-colors"
                      >
                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider block flex justify-between items-center">
                          Presupuesto
                          <Edit3 className="w-2.5 h-2.5 text-gray-400 dark:text-gray-500" />
                        </span>
                        <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">$ {formatCurrency(budget)}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 rounded-2xl p-3.5 shadow-sm transition-colors">
                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider block">Gastado</span>
                        <p className="text-sm font-black text-[#EF6950] dark:text-[#f87f6a] mt-0.5">$ {formatCurrency(totalSpent)}</p>
                      </div>
                    </div>

                    {/* 2. Daily Activity Chart Card */}
                    <div className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 rounded-[22px] p-4 shadow-sm relative transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">Gastos diarios</h3>
                          <span className="text-[9px] text-gray-400 dark:text-gray-400">Rítmo de este mes (1 - 31)</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-900 dark:text-white">
                          <span className="text-gray-400 dark:text-gray-400 font-medium">Gastado:</span> ${formatCurrency(totalSpent)}
                        </span>
                      </div>

                      {/* Bar Chart */}
                      <div className="relative pt-1 mt-6">
                        {/* Interactive Float-over Tooltip */}
                        {hoveredMobileDay && (
                          <div 
                            className="absolute z-30 bg-gray-900/95 dark:bg-slate-900/95 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-xl text-[9px] font-bold shadow-lg border border-white/10 flex flex-col gap-0.5 pointer-events-none transition-all duration-100"
                            style={{
                              bottom: 'calc(100% - 10px)',
                              left: `${((hoveredMobileDay.day - 1) / 30) * 100}%`,
                              transform: `translateX(-${((hoveredMobileDay.day - 1) / 30) * 100}%) translateY(-12px)`
                            }}
                          >
                            <span className="text-gray-300 dark:text-gray-300 font-bold whitespace-nowrap">
                              Día {hoveredMobileDay.day} de {selectedMonth}
                            </span>
                            <span className="text-emerald-400 dark:text-emerald-400 font-extrabold whitespace-nowrap text-xs">
                              $ {formatCurrency(hoveredMobileDay.amount)}
                            </span>
                            {/* Small Arrow pointing down */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-gray-900/95"></div>
                          </div>
                        )}

                        <div className="h-16 flex items-end gap-[2px] w-full px-1">
                          {Array.from({ length: 31 }, (_, i) => {
                            const day = i + 1;
                            const amount = dailySpentMap[day];
                            const isToday = day === 20; // Simulated Current Day
                            const heightPercent = amount > 0 ? (amount / maxDailySpend) * 100 : 0;
                            return (
                              <div 
                                key={day} 
                                className="flex-1 flex flex-col justify-end h-full cursor-pointer group"
                                onMouseEnter={() => setHoveredMobileDay({ day, amount })}
                                onMouseLeave={() => setHoveredMobileDay(null)}
                              >
                                <div 
                                  className={`w-full rounded-[1px] transition-all duration-150 ${
                                    isToday ? 'bg-[#EF6950] ring-1 ring-[#EF6950]/30' :
                                    amount > 0 ? 'bg-[#29956F] hover:bg-[#156045] dark:bg-[#208260] dark:hover:bg-[#156045] group-hover:scale-y-105' : 'bg-gray-100 dark:bg-slate-700'
                                  }`}
                                  style={{ height: amount > 0 ? `${Math.max(heightPercent, 12)}%` : '3px' }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>

                        {/* X-Axis Line */}
                        <div className="h-[1.5px] bg-gray-200 dark:bg-slate-700 w-full mt-2 rounded-full"></div>

                        {/* X-Axis Markings */}
                        <div className="flex justify-between mt-1.5 text-[8px] font-extrabold text-gray-400 dark:text-gray-400">
                          <span>Día 1</span>
                          <span>Día 10</span>
                          <span className="text-[#EF6950]">Día 20 (Hoy)</span>
                          <span>Día 31</span>
                        </div>

                        {/* Visible X-Axis Label */}
                        <div className="text-center text-[9px] font-extrabold text-gray-400 dark:text-gray-400 mt-2 flex items-center justify-center gap-1.5 bg-gray-50/50 dark:bg-slate-800/40 py-1 rounded-md border border-gray-100 dark:border-slate-700/40">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                          <span>Eje X: Días del Mes ({selectedMonth})</span>
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Last Movements Preview */}
                    <div className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 rounded-[22px] p-4 shadow-sm transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">Últimos movimientos</h3>
                        <button 
                          onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('todos');
                            setShowHistoryModal(true);
                          }}
                          className="text-[10px] font-black text-[#156045] dark:text-emerald-400 hover:underline cursor-pointer bg-transparent border-none"
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
                            <p className="text-xs font-black text-gray-800 dark:text-gray-200">Día Cero: Billetera vacía</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-400 max-w-[200px] leading-relaxed mx-auto">
                              Presiona el botón verde <strong>"+"</strong> abajo a la derecha para agregar tu primer gasto.
                            </p>
                          </div>
                        ) : (
                          transactions.slice(0, 3).map((tx) => {
                            const config = CATEGORIES[tx.category];
                            const Icon = config.icon;
                            return (
                              <div 
                                key={tx.id}
                                onClick={() => setSelectedTransactionId(tx.id)}
                                className="flex items-center justify-between p-1.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8.5 h-8.5 rounded-xl ${config.bgColor} ${config.textColor} flex items-center justify-center shrink-0`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="text-left">
                                    <p className="text-xs font-extrabold text-gray-900 dark:text-white group-hover:text-[#156045] dark:group-hover:text-emerald-400 transition-colors line-clamp-1">{tx.description}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-400 font-semibold">{config.label} • {tx.day} jul</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-xs font-black text-gray-900 dark:text-gray-100 mr-1">
                                    -${formatCurrency(tx.amount)}
                                  </span>
                                  <button 
                                    onClick={() => handleEditExpense(tx)}
                                    className="p-1 text-gray-400 dark:text-gray-400 hover:text-[#156045] dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                    title="Editar"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteExpense(tx.id)}
                                    className="p-1 text-gray-400 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>

                  {/* FLOATING ACTION BUTTON (FAB) FOR REGISTER EXPENSE */}
                  <button
                    onClick={() => setShowNewExpenseModal(true)}
                    className="absolute bottom-5 right-5 bg-[#156045] hover:bg-[#114b36] text-white w-14 h-14 rounded-full shadow-[0_8px_20px_rgba(21,96,69,0.3)] flex items-center justify-center transition-all active:scale-95 z-30 cursor-pointer"
                    title="Registrar Gasto"
                  >
                    <Plus className="w-7 h-7 text-white" strokeWidth={3} />
                  </button>

                </div>

                {/* Absolute iOS-Style Bottom Home Bar decoration */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-300 dark:bg-slate-700 rounded-full z-40 pointer-events-none"></div>

                {/* RENDER THE INTERNAL ABSOLUTE OVERLAYS (MODALS) WITHIN PHONE CONTEXT */}
                {MobileSimulatorModals()}

              </div>
            </div>
          </div>
        ) : (
          
          /* VIEW MODE: FULL EXPANDED CONTAINER FLUID GRID */
          <div className="w-full max-w-4xl bg-[#FAFAFA] dark:bg-[#111C24] border border-gray-200/80 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden h-[790px] flex flex-col animate-in fade-in duration-300 relative transition-colors">
            
            {/* TOAST NOTIFICATION HUD */}
            {notification && (
              <div className={`absolute top-4 left-6 right-6 py-3 px-4 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-top-4 duration-300 ${
                notification.type === 'success' ? 'bg-[#156045]' : 
                notification.type === 'delete' ? 'bg-[#EF6950]' : 'bg-gray-800'
              }`}>
                {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{notification.message}</span>
              </div>
            )}

            {/* HEADER IN FULL VIEW */}
            <div className="px-8 py-5 bg-white dark:bg-[#111C24] border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#156045] p-2 rounded-xl text-white">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-widest block leading-none">Vista Ampliada</span>
                  <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight mt-0.5">Dashboard General</h2>
                </div>
              </div>
              
              {/* Month selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowMonthSelect(!showMonthSelect)}
                  className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 shadow-sm px-4 py-2 rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 transition-all active:scale-95 cursor-pointer"
                >
                  {selectedMonth}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                </button>
                {showMonthSelect && (
                  <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 transition-colors">
                    {['Julio 2026', 'Agosto 2026'].map((m) => (
                      <button
                        key={m}
                        onClick={() => { setSelectedMonth(m); setShowMonthSelect(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 block transition-colors cursor-pointer"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* BENTO-GRID LAYOUT FOR DESKTOP VIEW */}
            <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* Left side: Financial Balance & Charts (3 columns) */}
                <div className="md:col-span-3 space-y-6">
                  
                  {/* Te queda disponible */}
                  <div className="bg-[#F1F6F4] dark:bg-[#062419]/50 rounded-[24px] p-6 border border-[#E2EFE9] dark:border-[#104e37]/40 relative overflow-hidden group transition-colors">
                    <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[#156045]/[0.02] pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-extrabold text-[#527769] dark:text-[#8CB4A5] uppercase tracking-wider">Te queda disponible</span>
                      <button 
                        onClick={() => { 
                          setBudgetInput(budget.toString());
                          setShowBudgetModal(true);
                        }}
                        className="p-1.5 transition-colors rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#156045] dark:hover:text-emerald-400 cursor-pointer"
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

                    <p className="text-xs text-[#557667] dark:text-[#8CB4A5]/90 mt-1.5 flex flex-wrap items-center gap-1">
                      de{' '}
                      <span 
                        onClick={() => {
                          setBudgetInput(budget.toString());
                          setShowBudgetModal(true);
                        }}
                        className="font-bold text-gray-900 dark:text-white hover:underline cursor-pointer"
                        title="Haz clic para editar"
                      >
                        $ {formatCurrency(budget)}
                      </span>{' '}
                      presupuestado este mes
                    </p>

                    <div className="relative h-2 bg-[#DCE8E3] dark:bg-[#153a2b] rounded-full overflow-hidden mt-5 mb-3">
                      <div className="absolute top-0 left-0 h-full bg-[#EF6950] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, spentPercentage)}%` }}></div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-extrabold mt-2 mb-4">
                      <span className="text-[#EF6950] flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#EF6950]"></span>
                        {spentPercentage}% gastado
                      </span>
                      <span className="text-[#557667] dark:text-[#8CB4A5]/90">
                        {availablePercentage}% disponible
                      </span>
                    </div>

                    {/* Estado de Cuenta */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200/50 dark:border-slate-800/50">
                      <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estado de Cuenta</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all ${
                        availableAmount >= 0 
                          ? 'bg-[#EAF2EF] dark:bg-emerald-950/40 text-[#1A7E5C] dark:text-emerald-400 border border-[#1A7E5C]/10 dark:border-emerald-500/10' 
                          : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 animate-pulse'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${availableAmount >= 0 ? 'bg-[#1A7E5C] dark:bg-emerald-400' : 'bg-red-500'}`}></span>
                        {availableAmount >= 0 ? 'Balance positivo' : 'Balance negativo'}
                      </span>
                    </div>
                  </div>

                  {/* Dual Budget Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => {
                        setBudgetInput(budget.toString());
                        setShowBudgetModal(true);
                      }}
                      className="bg-white dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-700/80 border border-gray-100 dark:border-slate-700 rounded-2xl p-4.5 shadow-sm cursor-pointer transition-colors"
                    >
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider block flex justify-between items-center">
                        Presupuesto mensual
                        <Edit3 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      </span>
                      <p className="text-lg font-black text-gray-900 dark:text-white mt-1">$ {formatCurrency(budget)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 rounded-2xl p-4.5 shadow-sm transition-colors">
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider block">Total gastado</span>
                      <p className="text-lg font-black text-[#EF6950] dark:text-[#f87f6a] mt-1">$ {formatCurrency(totalSpent)}</p>
                    </div>
                  </div>

                  {/* Daily activity chart card */}
                  <div className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 rounded-[22px] p-5 shadow-sm relative transition-colors">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">Gastos acumulados por día</h3>
                        <p className="text-[10px] text-gray-400 dark:text-gray-400">Distribución de gastos del mes (1 - 31)</p>
                      </div>
                      <span className="text-xs font-extrabold text-[#156045] dark:text-emerald-400 bg-[#EAF2EF] dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
                        ${formatCurrency(totalSpent)} gastado
                      </span>
                    </div>

                    <div className="relative pt-1 mt-6">
                      {/* Interactive Float-over Tooltip */}
                      {hoveredDesktopDay && (
                        <div 
                          className="absolute z-30 bg-gray-900/95 dark:bg-slate-900/95 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl border border-white/10 flex flex-col gap-0.5 pointer-events-none transition-all duration-100"
                          style={{
                            bottom: 'calc(100% - 10px)',
                            left: `${((hoveredDesktopDay.day - 1) / 30) * 100}%`,
                            transform: `translateX(-${((hoveredDesktopDay.day - 1) / 30) * 100}%) translateY(-14px)`
                          }}
                        >
                          <span className="text-gray-300 dark:text-gray-300 font-bold whitespace-nowrap">
                            Día {hoveredDesktopDay.day} de {selectedMonth}
                          </span>
                          <span className="text-emerald-400 dark:text-emerald-400 font-black whitespace-nowrap text-sm mt-0.5">
                            $ {formatCurrency(hoveredDesktopDay.amount)}
                          </span>
                          {/* Small Arrow pointing down */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-gray-900/95"></div>
                        </div>
                      )}

                      <div className="h-24 flex items-end gap-[3px] w-full px-1">
                        {Array.from({ length: 31 }, (_, i) => {
                          const day = i + 1;
                          const amount = dailySpentMap[day];
                          const isToday = day === 20;
                          const heightPercent = amount > 0 ? (amount / maxDailySpend) * 100 : 0;
                          return (
                            <div 
                              key={day} 
                              className="flex-1 flex flex-col justify-end h-full cursor-pointer group"
                              onMouseEnter={() => setHoveredDesktopDay({ day, amount })}
                              onMouseLeave={() => setHoveredDesktopDay(null)}
                            >
                              <div 
                                className={`w-full rounded-[2px] transition-all duration-150 ${
                                  isToday ? 'bg-[#EF6950]' :
                                  amount > 0 ? 'bg-[#29956F] hover:bg-[#156045] dark:bg-[#208260] dark:hover:bg-[#156045] group-hover:scale-y-105' : 'bg-gray-100 dark:bg-slate-700'
                                }`}
                                style={{ height: amount > 0 ? `${Math.max(heightPercent, 12)}%` : '4px' }}
                              ></div>
                            </div>
                          );
                        })}
                      </div>

                      {/* X-Axis Line */}
                      <div className="h-[2px] bg-gray-200 dark:bg-slate-700 w-full mt-2.5 rounded-full"></div>

                      {/* X-Axis Markings */}
                      <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-400 dark:text-gray-400">
                        <span>Día 1</span>
                        <span>Día 10</span>
                        <span className="text-[#EF6950] font-black">Día 20 (Hoy)</span>
                        <span>Día 31</span>
                      </div>

                      {/* Visible X-Axis Label */}
                      <div className="text-center text-[10px] font-extrabold text-gray-400 dark:text-gray-400 mt-2.5 flex items-center justify-center gap-2 bg-gray-50/70 dark:bg-slate-800/40 py-1.5 rounded-lg border border-gray-150 dark:border-slate-700/40">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#156045]/20 dark:bg-emerald-500/20 animate-pulse"></span>
                        <span>Eje X: Días del Mes ({selectedMonth})</span>
                        <span className="inline-block w-2 h-2 rounded-full bg-[#156045]/20 dark:bg-emerald-500/20 animate-pulse"></span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right side: Quick Shortcuts & Last Movements (2 columns) */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* Interactive Quick Shortcuts Panel */}
                  <div className="bg-white dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700/60 p-5 rounded-[22px] shadow-sm space-y-3.5 transition-colors">
                    <div>
                      <span className="text-[9px] font-black text-[#156045] dark:text-emerald-400 uppercase tracking-widest block">Atajo rápido</span>
                      <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">Registrar Nuevo Gasto</h3>
                      <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-0.5 leading-relaxed">
                        Abre el formulario rápido para guardar un gasto en menos de 30 segundos.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowNewExpenseModal(true)}
                      className="w-full bg-[#156045] hover:bg-[#114b36] text-white py-3.5 rounded-xl font-extrabold text-xs shadow-lg shadow-[#156045]/15 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                      Registrar un Gasto
                    </button>

                    <button
                      onClick={startSpeedrun}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Probar Reto de Velocidad
                    </button>
                  </div>

                  {/* Last Movements Box */}
                  <div className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 rounded-[22px] p-5 shadow-sm flex flex-col justify-between h-[280px] transition-colors">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">Últimos movimientos</h3>
                        <button 
                          onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('todos');
                            setShowHistoryModal(true);
                          }} 
                          className="text-xs font-black text-[#156045] dark:text-emerald-400 hover:underline cursor-pointer bg-transparent border-none"
                        >
                          Ver todos
                        </button>
                      </div>

                      <div className="space-y-3.5">
                        {transactions.length === 0 ? (
                          <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-[#EAF2EF] dark:bg-emerald-950/40 text-[#156045] dark:text-emerald-400 flex items-center justify-center mb-0.5">
                              <Wallet className="w-5.5 h-5.5" />
                            </div>
                            <p className="text-xs font-black text-gray-800 dark:text-gray-200">Día Cero: Tu Billetera está vacía</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-400 max-w-[240px] leading-relaxed mx-auto">
                              Haz clic en el botón verde <strong>"Registrar un Gasto"</strong> de arriba para agregar tu primer movimiento a la nube.
                            </p>
                          </div>
                        ) : (
                          transactions.slice(0, 3).map((tx) => {
                            const config = CATEGORIES[tx.category];
                            return (
                              <div 
                                key={tx.id} 
                                onClick={() => setSelectedTransactionId(tx.id)}
                                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl ${config.bgColor} ${config.textColor} flex items-center justify-center shrink-0`}>
                                    {React.createElement(config.icon, { className: 'w-4.5 h-4.5' })}
                                  </div>
                                  <div className="text-left">
                                    <p className="font-extrabold text-xs text-gray-900 dark:text-white group-hover:text-[#156045] dark:group-hover:text-emerald-400 transition-colors line-clamp-1">{tx.description}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-400 font-bold uppercase">{config.label} • {tx.day} jul</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-xs font-black text-gray-900 dark:text-gray-100 mr-1">
                                    -${formatCurrency(tx.amount)}
                                  </span>
                                  <button 
                                    onClick={() => handleEditExpense(tx)}
                                    className="p-1 text-gray-400 dark:text-gray-400 hover:text-[#156045] dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                    title="Editar"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteExpense(tx.id)}
                                    className="p-1 text-gray-400 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="text-center text-[11px] text-gray-400 dark:text-gray-500 font-medium pt-3 border-t border-gray-50 dark:border-slate-700/60">
                      Mostrando {Math.min(3, transactions.length)} de {transactions.length} registros totales
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* FLOATING ACTION BUTTON (FAB) ALSO IN FULL VIEW FOR ULTIMATE COMFORT */}
            <button
              onClick={() => setShowNewExpenseModal(true)}
              className="absolute bottom-6 right-6 bg-[#156045] hover:bg-[#114b36] text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 z-30 cursor-pointer"
              title="Registrar Gasto"
            >
              <Plus className="w-7 h-7 text-white" strokeWidth={3} />
            </button>

          </div>
        )}

      </main>

      {/* DIALOG MODAL: CONFIGURATION (ADJUST MONTHLY BUDGET & DELETE ACCOUNT) */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2.5px] z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#111C24] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                {showDeleteConfirmScreen ? 'Eliminar mi Cuenta' : 'Configuración'}
              </h3>
              <button 
                onClick={() => {
                  setShowBudgetModal(false);
                  setShowDeleteConfirmScreen(false);
                  setDeleteConfirmInput('');
                }}
                className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {!showDeleteConfirmScreen ? (
              <div className="space-y-6">
                {/* BUDGET SETUP */}
                <form onSubmit={handleUpdateBudget} className="space-y-4">
                  <h4 className="text-xs font-extrabold text-[#557667] dark:text-[#8CB4A5]/90 uppercase tracking-wider text-left">Ajustar Presupuesto</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold leading-relaxed text-left">
                    Ajusta el dinero disponible total para este mes. Los porcentajes de ahorro se adaptarán en tiempo real.
                  </p>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 text-left">
                      Monto Máximo Presupuestado ($)
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Ej. 2000000"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#156045]/25 focus:border-[#156045] transition-all text-left"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowBudgetModal(false)}
                      className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#156045] dark:bg-emerald-600 hover:bg-[#114b36] dark:hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-[#156045]/15 transition-all cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                </form>

                {/* DANGER ZONE: DELETE ACCOUNT */}
                <div className="pt-5 border-t border-red-100 dark:border-red-950/30 space-y-3">
                  <h4 className="text-xs font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider text-left">Zona de Peligro</h4>
                  <div className="p-3.5 bg-red-50/50 dark:bg-red-950/10 rounded-2xl border border-red-100/50 dark:border-red-950/20 text-left">
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 font-semibold leading-normal">
                      ¿Quieres eliminar tu cuenta? Esta acción borrará de manera definitiva tu perfil de usuario y todo tu historial de gastos de la nube.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirmScreen(true);
                        setDeleteConfirmInput('');
                      }}
                      className="mt-3 w-full bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer border border-red-200/50 dark:border-red-900/30 text-center"
                    >
                      Eliminar mi cuenta
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* DELETE ACCOUNT CONFIRMATION SCREEN */
              <div className="space-y-4 text-left animate-in fade-in duration-200">
                <div className="p-3.5 bg-red-100/30 dark:bg-red-950/25 border border-red-200 dark:border-red-900/30 rounded-2xl text-red-700 dark:text-red-400">
                  <p className="text-xs font-bold leading-relaxed">
                    ⚠️ <strong>ATENCIÓN:</strong> Esta acción es irreversible. Se eliminará tu cuenta de usuario y todos tus datos (presupuesto, gastos e historial) se borrarán permanentemente del sistema.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10.5px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-normal">
                    Para confirmar la eliminación, escribe la palabra <strong className="text-red-600 dark:text-red-400 font-black font-mono">ELIMINAR</strong> a continuación:
                  </label>
                  <input 
                    type="text"
                    placeholder="Escribe ELIMINAR"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    className="w-full px-4 py-3 bg-red-50/20 dark:bg-red-950/10 border border-red-200 dark:border-red-900 text-gray-900 dark:text-white rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-red-500/20 text-center uppercase tracking-widest font-mono"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirmScreen(false);
                      setDeleteConfirmInput('');
                    }}
                    className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs transition-all cursor-pointer text-center"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    disabled={deleteConfirmInput !== 'ELIMINAR'}
                    onClick={handleDeleteAccount}
                    className={`flex-1 py-3 text-white rounded-xl font-bold text-xs transition-all cursor-pointer text-center ${
                      deleteConfirmInput === 'ELIMINAR'
                        ? 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/15'
                        : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    Confirmar Eliminación
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER DYNAMIC FIXED/PORTAL OVERLAYS FOR THE FULL SIZE VIEWPORT AS WELL */}
      {viewMode === 'full' && (
        <div className="fixed-overlays-container">
          {RenderExpenseFormModal()}
          {RenderHistoryModal()}
          {RenderDetailModal()}
        </div>
      )}

    </div>
  );

  /**
   * MOBILE SIMULATOR MODALS HELPER
   * Renders the modal trees positioned absolute directly inside the mobile container.
   */
  function MobileSimulatorModals() {
    if (viewMode !== 'mobile') return null;
    return (
      <>
        {RenderExpenseFormModal()}
        {RenderHistoryModal()}
        {RenderDetailModal()}
      </>
    );
  }

  /**
   * 1. REGISTRAR GASTO MODAL RENDERER
   */
  function RenderExpenseFormModal() {
    if (!showNewExpenseModal) return null;
    const isMobile = viewMode === 'mobile';
    return (
      <div className={isMobile 
        ? "absolute inset-0 bg-black/60 z-50 flex items-end justify-center pt-10" 
        : "fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      }>
        <div className={isMobile
          ? "bg-white dark:bg-[#111C24] w-full rounded-t-[32px] max-h-[92%] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 relative transition-colors"
          : "bg-white dark:bg-[#111C24] w-full max-w-md rounded-3xl max-h-[90%] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative border border-gray-100 dark:border-slate-800 transition-colors"
        }>
          {/* Drag bar indicator inside phone */}
          {isMobile && (
            <div className="w-full flex justify-center py-2 shrink-0 bg-gray-50/50 dark:bg-slate-800/40">
              <div className="w-12 h-1 bg-gray-300 dark:bg-slate-700 rounded-full"></div>
            </div>
          )}

          {/* Modal Header */}
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

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar space-y-4">
            
            {/* Amount input field */}
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

              {/* Multipliers */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none hide-scrollbar shrink-0">
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

            {/* Category Select Grid */}
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

            {/* Description / Concept input field */}
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

              {/* Quick Suggestion Tags */}
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

            {/* Date selection range slider */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 text-left">
                Día del Gasto (Julio 2026)
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

            {/* Form Save Button actions */}
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
   * 2. MOVIMIENTOS / HISTORIAL MODAL RENDERER
   */
  function RenderHistoryModal() {
    if (!showHistoryModal) return null;
    const isMobile = viewMode === 'mobile';
    return (
      <div className={isMobile 
        ? "absolute inset-0 bg-black/60 z-50 flex items-end justify-center pt-10" 
        : "fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      }>
        <div className={isMobile
          ? "bg-[#FAFAFA] dark:bg-[#111C24] w-full rounded-t-[32px] h-[92%] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 relative transition-colors"
          : "bg-[#FAFAFA] dark:bg-[#111C24] w-full max-w-lg rounded-3xl h-[80%] max-h-[660px] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative border border-gray-100 dark:border-slate-800 transition-colors"
        }>
          {/* Drag handle */}
          {isMobile && (
            <div className="w-full flex justify-center py-2 shrink-0 bg-white dark:bg-[#111C24] border-b border-gray-100 dark:border-slate-800 transition-colors">
              <div className="w-12 h-1 bg-gray-300 dark:bg-slate-700 rounded-full"></div>
            </div>
          )}

          {/* Header area */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-[#111C24] shrink-0 flex items-center justify-between transition-colors">
            <div>
              <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Historial Completo</span>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">Mis Movimientos</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#156045] dark:text-emerald-400 bg-[#EAF2EF] dark:bg-emerald-950/40 px-2.5 py-1 rounded-md shrink-0">
                Total: {filteredTransactions.length}
              </span>
              <button 
                onClick={() => setShowHistoryModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search filters & Category sliders */}
          <div className="px-6 py-3 bg-white dark:bg-[#111C24] border-b border-gray-100 dark:border-slate-800 space-y-3 shrink-0 transition-colors">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input 
                type="text"
                placeholder="Buscar por descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-750 text-gray-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none text-left"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Horizontal Filter Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar scrollbar-none shrink-0">
              <button
                onClick={() => setCategoryFilter('todos')}
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap cursor-pointer transition-all ${
                  categoryFilter === 'todos' ? 'bg-[#156045] text-white' : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-100/70 dark:border-slate-750 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                Todos
              </button>
              {Object.entries(CATEGORIES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key)}
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap flex items-center gap-1 cursor-pointer transition-all ${
                    categoryFilter === key ? `${value.badgeBg} ${value.badgeText}` : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-100/70 dark:border-slate-750 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <value.icon className="w-2.5 h-2.5" />
                  {value.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Transaction List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-100 dark:border-slate-700">
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
                    className="bg-white dark:bg-slate-800 border border-gray-100/80 dark:border-slate-700 p-3.5 rounded-2xl shadow-sm hover:shadow-md hover:border-[#156045]/25 dark:hover:border-emerald-500/25 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${config.bgColor} ${config.textColor} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-extrabold text-gray-900 dark:text-white text-xs tracking-tight group-hover:text-[#156045] dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {tx.description}
                        </h4>
                        <p className="text-[10px] text-gray-400 dark:text-gray-400 font-bold mt-0.5">
                          {config.label} • Día {tx.day} de Julio
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs font-black text-gray-900 dark:text-gray-100 mr-1">
                        -${formatCurrency(tx.amount)}
                      </span>
                      <button 
                        onClick={() => handleEditExpense(tx)}
                        className="p-1 text-gray-400 dark:text-gray-400 hover:text-[#156045] dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteExpense(tx.id)}
                        className="p-1 text-gray-400 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/45 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-300 dark:text-gray-500 -rotate-90 ml-1 cursor-pointer" onClick={() => setSelectedTransactionId(tx.id)} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  /**
   * 3. DETALLE DEL GASTO MODAL RENDERER (LIVES ON TOP - z-55)
   */
  function RenderDetailModal() {
    if (!selectedTransactionId || !selectedTransaction) return null;
    const isMobile = viewMode === 'mobile';
    return (
      <div className={isMobile 
        ? "absolute inset-0 bg-black/70 z-55 flex items-center justify-center p-4 animate-in fade-in duration-200" 
        : "fixed inset-0 bg-black/70 backdrop-blur-[2.5px] z-55 flex items-center justify-center p-4 animate-in fade-in duration-200"
      }>
        <div className="bg-white dark:bg-[#111C24] w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-gray-100/50 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative flex flex-col transition-colors">
          
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#111C24] shrink-0 transition-colors">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Detalle del Registro</h3>
            <button 
              onClick={() => setSelectedTransactionId(null)} 
              className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto hide-scrollbar space-y-5">
            
            {/* Visual Header Banner */}
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

            {/* Info Metrics Table */}
            <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-750 rounded-2xl p-4 space-y-2.5 text-[11px] transition-colors">
              <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-slate-750">
                <span className="text-gray-400 dark:text-gray-500 font-bold">Fecha de Registro</span>
                <span className="font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  Día {selectedTransaction.day} de Julio, 2026
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-slate-750">
                <span className="text-gray-400 dark:text-gray-500 font-bold">Porcentaje Presupuestal</span>
                <span className="font-extrabold text-gray-800 dark:text-gray-200">
                  {budget > 0 ? ((selectedTransaction.amount / budget) * 100).toFixed(1) : 0}% del total
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 dark:text-gray-500 font-bold">Identificador</span>
                <span className="font-mono text-[9px] text-gray-400 dark:text-gray-500">
                  ID_{selectedTransaction.id}
                </span>
              </div>
            </div>

            {/* Action buttons */}
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
}
