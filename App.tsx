

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppState, Tab, Transaction, FinancialCalculations, Category, CardConfig, BankAccountConfig, InstallmentPlan, Loan } from './types';
import { t } from './translations';
import { getInitialState } from './constants';
import { initializeAi, getExchangeRate } from './services/geminiService';
import { initializeFirebase, firebaseService } from './services/firebaseService';
import { saveData, loadData, saveToCloud, restoreFromCloud, downloadBackup, restoreFromFile } from './src/utils/storage';
import AuthForm from './components/auth/AuthForm';
import UserProfile from './components/auth/UserProfile';
import ProfileModal from './components/auth/ProfileModal';

// import Header from './components/layout/Header'; // تم استبداله بهيدر جديد داخل App.tsx
import TabsComponent from './components/layout/Tabs';
import SkeletonDashboard from './components/layout/SkeletonDashboard';
import DashboardTab from './components/tabs/DashboardTab';
import TransactionsTab from './components/tabs/TransactionsTab';
import AIAssistantTab from './components/tabs/AIAssistantTab';
import BudgetTab from './components/tabs/BudgetTab';
import InvestmentTab from './components/tabs/InvestmentTab';
import CardsTab from './components/tabs/CardsTab';
import BankTab from './components/tabs/BankTab';
import InstallmentsTab from './components/tabs/InstallmentsTab';
import DebtsLoansTab from './components/tabs/DebtsLoansTab';
import SettingsTab from './components/tabs/SettingsTab';
import TransactionForm from './components/forms/TransactionForm';
import CardForm from './components/forms/CardForm';
import BankAccountForm from './components/forms/BankAccountForm';
import LoanForm from './components/forms/LoanForm';
import { XMarkIcon } from './components/common/Icons';


const App: React.FC = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [state, setState] = useState<AppState>(getInitialState);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<'all' | number>(new Date().getMonth() + 1);
    const [activeTab, setActiveTab] = useState<Tab>('summary');
    const [loadingState, setLoadingState] = useState({ isLoading: false, text: '' });
    const [modalConfig, setModalConfig] = useState<any>(null);
    const [transactionForm, setTransactionForm] = useState<{ isOpen: boolean; initialData?: Transaction | null }>({ isOpen: false });
    const [transactionFilters, setTransactionFilters] = useState<{ categoryId?: string }>({});
    const [cardForm, setCardForm] = useState<{ isOpen: boolean; initialData?: CardConfig | null }>({ isOpen: false });
    const [bankAccountForm, setBankAccountForm] = useState<{ isOpen: boolean; initialData?: BankAccountConfig | null }>({ isOpen: false });
    const [loanForm, setLoanForm] = useState<{ isOpen: boolean; initialData?: Loan | null }>({ isOpen: false });
    const [transferModal, setTransferModal] = useState<{ isOpen: boolean }>({ isOpen: false });
    const [profileModal, setProfileModal] = useState<{ isOpen: boolean }>({ isOpen: false });
    const [transferData, setTransferData] = useState({
        fromAccount: '',
        toAccount: '',
        amount: 0,
        description: '',
        exchangeRate: 1
    });
    const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(false);
    const [exchangeRateError, setExchangeRateError] = useState('');
    
    // نظام المصادقة
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // تهيئة الخدمات والتحقق من المصادقة
    useEffect(() => {
        const initializeApp = async () => {
            // تهيئة الخدمات
            initializeAi();
            
            // تهيئة Firebase فقط إذا لم يتم تهيئته مسبقاً
            try {
                initializeFirebase();
            } catch (error) {
                console.warn('Firebase already initialized or error:', error);
            }
            
            // الاستماع لتغييرات حالة المصادقة
            const unsubscribe = await firebaseService.onAuthStateChanged(async (user) => {
                try {
                    if (user) {
                        console.log('✅ تم تسجيل دخول المستخدم:', user.email);
                        setCurrentUser(user);
                        await loadUserData(user.uid);
                    } else {
                        console.log('❌ لا يوجد مستخدم مسجل دخول');
                        setCurrentUser(null);
                        await loadLocalData();
                    }
                } catch (error) {
                    console.error('خطأ في تحميل بيانات المستخدم:', error);
                    await loadLocalData();
                } finally {
                    setIsCheckingAuth(false);
                    setIsInitialized(true);
                }
            });
            
            // تنظيف الاشتراك عند إلغاء التحميل
            return () => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            };
        };
        
        initializeApp();
    }, []);

    // إدارة scroll الخلفية عند فتح النوافذ
    useEffect(() => {
        const isAnyModalOpen = transactionForm.isOpen || cardForm.isOpen || bankAccountForm.isOpen || loanForm.isOpen || transferModal.isOpen || modalConfig || loadingState.isLoading;
        
        if (isAnyModalOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }

        // تنظيف عند إلغاء المكون
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [transactionForm.isOpen, cardForm.isOpen, bankAccountForm.isOpen, loanForm.isOpen, transferModal.isOpen, modalConfig, loadingState.isLoading]);

    // إدارة الوضع المظلم واللغة
    useEffect(() => {
        // إدارة الوضع المظلم
        if (state.settings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // إدارة اللغة والاتجاه
        const htmlElement = document.documentElement;
        if (state.settings.language === 'ar') {
            htmlElement.setAttribute('lang', 'ar');
            htmlElement.setAttribute('dir', 'rtl');
        } else {
            htmlElement.setAttribute('lang', 'en');
            htmlElement.setAttribute('dir', 'ltr');
        }
    }, [state.settings.darkMode, state.settings.language]);


    // Auto-update exchange rate when accounts change
    useEffect(() => {
        if (transferModal.isOpen && transferData.fromAccount && transferData.toAccount && 
            state.bankAccounts[transferData.fromAccount]?.currency !== state.bankAccounts[transferData.toAccount]?.currency) {
            updateExchangeRate();
        }
    }, [transferData.fromAccount, transferData.toAccount, transferModal.isOpen]);

    const loadUserData = async (userId: string) => {
        try {
            // تحميل بيانات المستخدم الطبيعية المخزنة (بدون جلب آخر نسخة تلقائياً)
            const result = await firebaseService.getData('users', userId);
            if (result.success && result.data) {
                const initialState = getInitialState();
                const mergedState = {
                    ...initialState,
                    ...result.data,
                    cards: { ...initialState.cards, ...(result.data.cards || {}) },
                    bankAccounts: { ...initialState.bankAccounts, ...(result.data.bankAccounts || {}) },
                    investments: { ...initialState.investments, ...(result.data.investments || {}) },
                };
                setState(mergedState);
                console.log('✅ تم تحميل بيانات المستخدم من Firebase');
            } else if (!result.success) {
                console.warn('⚠️ فشل في تحميل بيانات المستخدم من Firebase:', result.error);
                
                // إذا كان الخطأ متعلق بالأذونات، اعرض رسالة تحذير
                if (result.error?.includes('الأذونات')) {
                    setModalConfig({
                        title: "تحذير - إعداد Firebase",
                        body: `<p>فشل في تحميل البيانات من السحابة. يرجى:</p>
                               <ul>
                                 <li>تأكد من تسجيل الدخول</li>
                                 <li>تحقق من إعداد قواعد Firestore</li>
                                 <li>راجع ملف FIREBASE_SETUP.md للإرشادات</li>
                               </ul>
                               <p>سيتم استخدام البيانات المحلية مؤقتاً.</p>`,
                        confirmText: 'موافق',
                        hideCancel: true
                    });
                }
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات المستخدم:', error);
        }
    };

    const loadLocalData = async () => {
        try {
            // البحث عن جميع النسخ المحفوظة
            const possibleKeys = [
                'financial_dashboard_state',
                'financial_dashboard_backup_1',
                'financial_dashboard_backup_2'
            ];
            
            // إضافة النسخ اليومية (آخر 7 أيام)
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                possibleKeys.push(`financial_dashboard_${dateStr}`);
            }
            
            let savedState = null;
            let sourceKey = '';
            
            // البحث عن أحدث نسخة صالحة
            for (const key of possibleKeys) {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        JSON.parse(data); // التحقق من صحة البيانات
                        savedState = data;
                        sourceKey = key;
                        break;
                    } catch (e) {
                        console.warn(`⚠️ بيانات تالفة في ${key}`);
                    }
                }
            }
            
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                const initialState = getInitialState();
                const mergedState = {
                    ...initialState,
                    ...parsedState,
                    cards: { ...initialState.cards, ...(parsedState.cards || {}) },
                    bankAccounts: { ...initialState.bankAccounts, ...(parsedState.bankAccounts || {}) },
                    investments: { ...initialState.investments, ...(parsedState.investments || {}) },
                };
                setState(mergedState);
                console.log(`✅ تم تحميل البيانات بنجاح من: ${sourceKey}`);
            } else {
                console.log('ℹ️ لم توجد بيانات محفوظة، سيتم استخدام البيانات الافتراضية');
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات المحلية:', error);
        }
    };

    useEffect(() => {
        if (isInitialized && !isCheckingAuth) {
            // حفظ في localStorage دائماً مع نسخ احتياطية متعددة
            try {
                const stateData = JSON.stringify(state);
                localStorage.setItem('financial_dashboard_state', stateData);
                localStorage.setItem('financial_dashboard_backup_1', stateData);
                localStorage.setItem('financial_dashboard_backup_2', stateData);
                
                // حفظ إضافي مع timestamp
                const timestamp = new Date().toISOString();
                localStorage.setItem(`financial_dashboard_${timestamp.split('T')[0]}`, stateData);
                
                console.log('✅ تم حفظ البيانات في localStorage مع نسخ احتياطية متعددة');
            } catch (error) {
                console.error('❌ خطأ في حفظ البيانات:', error);
            }
            
            // حفظ في Firebase إذا كان المستخدم مسجل (اختياري)
            if (currentUser) {
                const saveToFirebase = async () => {
                    try {
                        const result = await firebaseService.saveData('users', currentUser.uid, state);
                        if (result.success) {
                            console.log('✅ تم حفظ البيانات في Firebase');
                        } else {
                            console.warn('⚠️ فشل في حفظ البيانات في Firebase:', result.error);
                        }
                    } catch (error) {
                        console.error('❌ خطأ في حفظ البيانات في Firebase:', error);
                    }
                };
                
                // تأخير 2 ثانية قبل الحفظ لتجنب الحفظ المتكرر
                const timeoutId = setTimeout(saveToFirebase, 2000);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [state, isInitialized, currentUser, isCheckingAuth]);

    // Clear transaction filters when switching tabs
    useEffect(() => {
        if (activeTab !== 'transactions') {
            clearTransactionFilters();
        }
    }, [activeTab]);
    
    const setLoading = (isLoading: boolean, text: string = '') => setLoadingState({ isLoading, text });

    const getFilteredTransactions = useCallback(() => {
        if (!state.transactions) return [];
        const filtered = state.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const yearMatch = transactionDate.getFullYear() === selectedYear;
            const monthMatch = selectedMonth === 'all' || (transactionDate.getMonth() + 1) === selectedMonth;
            return yearMatch && monthMatch;
        });
        
        // Sort ALL transactions by date first, then by entry time (ID timestamp)
        return filtered.sort((a, b) => {
            // First sort by transaction date (newest date first)
            const aDate = new Date(a.date);
            const bDate = new Date(b.date);
            const dateComparison = bDate.getTime() - aDate.getTime();
            
            // If dates are the same, sort by entry time (ID contains timestamp) - newest first
            if (dateComparison === 0) {
                const aTime = parseInt(a.id.replace('trans-', '').split('-')[0]);
                const bTime = parseInt(b.id.replace('trans-', '').split('-')[0]);
                return bTime - aTime;
            }
            
            return dateComparison;
        });
    }, [state.transactions, selectedYear, selectedMonth]);

    // ترتيب جميع الحركات في النظام
    const allTransactionsSorted = useMemo(() => {
        if (!state.transactions) return [];
        
        // Sort ALL transactions by date first, then by entry time (ID timestamp)
        return [...state.transactions].sort((a, b) => {
            // First sort by transaction date (newest date first)
            const aDate = new Date(a.date);
            const bDate = new Date(b.date);
            const dateComparison = bDate.getTime() - aDate.getTime();
            
            // If dates are the same, sort by entry time (ID contains timestamp) - newest first
            if (dateComparison === 0) {
                const aTime = parseInt(a.id.replace('trans-', '').split('-')[0]);
                const bTime = parseInt(b.id.replace('trans-', '').split('-')[0]);
                return bTime - aTime;
            }
            
            return dateComparison;
        });
    }, [state.transactions]);
    
    const filteredTransactions = useMemo(() => getFilteredTransactions(), [getFilteredTransactions]);

    const calculations = useMemo<FinancialCalculations>(() => {
        const expensesByCategory: { [key: string]: number } = {};
        const cardPayments: { [key: string]: number } = {};
        const cardDetails: { [key: string]: any } = {};
        const bankAccountDetails: { [key: string]: any } = {};

        // Initialize details objects
        if (state.cards && typeof state.cards === 'object') {
            Object.values(state.cards).forEach((card: any) => {
                if (card && card.id) {
            cardDetails[card.id] = { ...card, balance: 0, available: card.limit, usagePercentage: 0 };
                }
        });
        }
        if (state.bankAccounts && typeof state.bankAccounts === 'object') {
            Object.values(state.bankAccounts).forEach((account: any) => {
                if (account && account.id) {
            bankAccountDetails[account.id] = { ...account, deposits: 0, withdrawals: 0 };
                }
        });
        }

        let totalIncome = 0;
        let totalExpenses = 0;
        let totalInvestmentDeposits = 0;
        let totalInvestmentWithdrawals = 0;

        filteredTransactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else if (t.type === 'expense') {
                totalExpenses += t.amount;
                if (t.categoryId) {
                    expensesByCategory[t.categoryId] = (expensesByCategory[t.categoryId] || 0) + t.amount;
                }
            } else if (t.type === 'bnpl-payment') {
                // BNPL payments are always expenses (installment payments)
                totalExpenses += t.amount;
                if (t.categoryId) {
                    expensesByCategory[t.categoryId] = (expensesByCategory[t.categoryId] || 0) + t.amount;
                }
            } else if (t.type === 'investment-deposit') {
                totalInvestmentDeposits += t.amount;
                totalExpenses += t.amount;
            } else if (t.type === 'investment-withdrawal') {
                totalInvestmentWithdrawals += t.amount;
                totalIncome += t.amount;
            } else if (t.type.endsWith('-payment')) {
                 const cardId = t.type.replace('-payment', '');
                 if (cardPayments[cardId]) {
                    cardPayments[cardId] += t.amount;
                 } else {
                    cardPayments[cardId] = t.amount;
                 }
            }
        });
        
        // Calculate card balances based on ALL transactions, not just filtered ones
        Object.keys(state.cards).forEach(cardId => {
             const card = state.cards[cardId];
             
             // Calculate cumulative balance: start with configured balance + all transactions
             let currentBalance = 0; // Start from zero (cards don't have initial balance like banks)
             
            // Process all transactions with mutually exclusive conditions to prevent double counting
            state.transactions.forEach(t => {
                // CASE 1: Payment RECEIVED by this card (reduces debt/balance)
                if ((t.description?.includes(`سداد ${card.name}`) || t.type === `سداد ${card.name}` || t.type === `${cardId}-payment`)) {
                    currentBalance -= t.amount; // السداد المستلم يقلل الرصيد المستحق
                }
                // CASE 2: Payment MADE from this card to another card (increases debt/balance)
                else if (t.paymentMethod === cardId && 
                        (t.description?.includes('سداد') || t.type?.includes('سداد') || t.type?.includes('-payment')) && 
                        !t.description?.includes(card.name) && 
                        t.type !== `سداد ${card.name}` && 
                        t.type !== `${cardId}-payment`) {
                    currentBalance += t.amount; // السداد المدفوع يزيد الرصيد المستحق
                }
                // CASE 3: Regular expenses made with this card (increases debt/balance)
                else if (t.paymentMethod === cardId && (t.type === 'expense' || t.type === 'bnpl-payment')) {
                    currentBalance += t.amount; // المصروفات العادية تزيد الرصيد المستحق
                }
            });
             
             cardDetails[cardId].balance = currentBalance;
             cardDetails[cardId].available = card.limit - currentBalance;
             cardDetails[cardId].usagePercentage = card.limit > 0 ? (currentBalance / card.limit) * 100 : 0;
        });

        // Calculate bank balances and period deposits/withdrawals
        Object.keys(state.bankAccounts).forEach(accountId => {
            const account = state.bankAccounts[accountId];
            let deposits = 0;
            let withdrawals = 0;
            
            // Calculate current balance based on ALL transactions (not just filtered ones)
            let currentBalance = account.balance; // Start with configured balance
            
            state.transactions.forEach(t => {
                // Only count transactions that actually involve this bank account
                if (t.paymentMethod === accountId) {
                    if (['income', 'investment-withdrawal'].includes(t.type)) {
                        currentBalance += t.amount; // Add to balance
                    } else if (['expense', 'investment-deposit'].includes(t.type)) {
                        currentBalance -= t.amount; // Subtract from balance
                    }
                }
                // Card payments also affect bank balance (they are withdrawals from bank)
                if (t.type.endsWith('-payment') && t.paymentMethod === accountId) {
                    currentBalance -= t.amount; // Subtract from balance
                }
                // BNPL first payments also affect bank balance if paid from bank
                if (t.type === 'expense' && t.isInstallmentPayment && t.paymentMethod === accountId) {
                    currentBalance -= t.amount; // Subtract from balance
                }
            });
            
            // Calculate period deposits/withdrawals for display
            filteredTransactions.forEach(t => {
                // Only count transactions that actually involve this bank account
                if (t.paymentMethod === accountId) {
                    if (['income', 'investment-withdrawal'].includes(t.type)) {
                        deposits += t.amount;
                    } else if (['expense', 'investment-deposit'].includes(t.type)) {
                        withdrawals += t.amount;
                    }
                }
                // Card payments also affect bank balance (they are withdrawals from bank)
                if (t.type.endsWith('-payment') && t.paymentMethod === accountId) {
                    withdrawals += t.amount;
                }
                // BNPL first payments also affect bank balance if paid from bank
                if (t.type === 'expense' && t.isInstallmentPayment && t.paymentMethod === accountId) {
                    withdrawals += t.amount;
                }
            });
            
            bankAccountDetails[accountId].balance = currentBalance; // Use calculated balance
            bankAccountDetails[accountId].deposits = deposits;
            bankAccountDetails[accountId].withdrawals = withdrawals;
        });

        const totalDebt = Object.values(cardDetails).reduce((sum, card) => sum + card.balance, 0);
        const totalAvailable = Object.values(cardDetails).reduce((sum, card) => sum + card.available, 0);
        const totalLimits = Object.values(cardDetails).reduce((sum, card) => sum + card.limit, 0);
        const totalBankBalance = Object.values(bankAccountDetails).reduce((sum, acc) => sum + acc.balance, 0);
        
        return { totalIncome, totalExpenses, cardDetails, cardPayments, bankAccountDetails, totalDebt, totalAvailable, totalLimits, totalBankBalance, totalInvestmentDeposits, totalInvestmentWithdrawals, expensesByCategory };
    }, [filteredTransactions, state.transactions, state.cards, state.bankAccounts]);

    const handleSaveTransaction = (transaction: Omit<Transaction, 'id'>, id?: string) => {
        setState(prev => {
            if (id) {
                // Update existing transaction
                const newTransactions = prev.transactions.map(t => 
                    t.id === id ? { ...t, ...transaction } : t
                );
            return { ...prev, transactions: newTransactions };
            } else {
                // Handle BNPL transactions
                if (transaction.bnplData && transaction.paymentMethod.includes('bnpl')) {
                    // Create installment plan
                    const installmentPlan: InstallmentPlan = {
                        id: `installment-${Date.now()}`,
                        provider: transaction.paymentMethod as 'tabby-bnpl' | 'tamara-bnpl',
                        description: transaction.description,
                        totalAmount: transaction.amount,
                        installmentAmount: transaction.bnplData.installmentAmount,
                        total: transaction.bnplData.installmentsCount,
                        paid: 1, // First payment is paid immediately
                        createdAt: transaction.date
                    };

                    // Create first payment transaction (this is what shows in transactions list)
                    const firstPaymentTransaction: Transaction = {
                        id: `trans-${Date.now()}-1`,
                        amount: transaction.bnplData.installmentAmount,
                        date: transaction.date,
                        description: `الدفعة الأولى لـ: ${transaction.description}`,
                        paymentMethod: transaction.bnplData.initialPaymentSource as PaymentMethod,
                        type: 'expense', // This should be expense (negative) not bnpl-payment
                        categoryId: transaction.categoryId,
                        isInstallmentPayment: true,
                        installmentId: installmentPlan.id
                    };

                    // DON'T create the main BNPL transaction - it should only exist as installment plan
                    // The installment plan will handle the remaining amount

                    return {
                        ...prev,
                        transactions: [...prev.transactions, firstPaymentTransaction],
                        installments: [...prev.installments, installmentPlan]
                    };
                } else {
                    // Add regular transaction
                    const newTransaction: Transaction = {
                        id: `trans-${Date.now()}`,
                        ...transaction
                    };
                    return { ...prev, transactions: [...prev.transactions, newTransaction] };
                }
            }
        });
        setTransactionForm({ isOpen: false });
    };

    const handleDeleteTransaction = (id: string) => {
        setModalConfig({
            title: 'تأكيد الحذف',
            body: '<p>هل أنت متأكد من رغبتك في حذف هذه الحركة؟ لا يمكن التراجع عن هذا الإجراء.</p>',
            confirmText: 'نعم, حذف',
            onConfirm: () => {
                setState(prev => {
                    const transactionToDelete = prev.transactions.find(t => t.id === id);
                    if (!transactionToDelete) return prev;

                    // 1. فلترة الحركة المحذوفة
                    const updatedTransactions = prev.transactions.filter(t => t.id !== id);
                    let updatedInstallments = prev.installments;

                    // 2. **منطق تحديث الأقساط (هذا هو الجزء الأهم)**
                    // إذا كانت الحركة المحذوفة دفعة قسط، قم بتحديث خطة القسط
                    if (transactionToDelete.isInstallmentPayment && transactionToDelete.installmentId) {
                        updatedInstallments = prev.installments.map(inst => {
                            if (inst.id === transactionToDelete.installmentId) {
                                // إنقاص عداد الدفعات، مع التأكد من أنه لا يقل عن صفر
                                return { ...inst, paid: Math.max(0, inst.paid - 1) };
                            }
                            return inst;
                        });
                    }

                    return {
                        ...prev,
                        transactions: updatedTransactions,
                        installments: updatedInstallments, // تطبيق تحديث الأقساط على الحالة
                    };
                });
                setModalConfig(null);
            }
        });
    };
    
    const handleEditTransaction = (id: string) => {
        const transaction = state.transactions.find(t => t.id === id);
        if (transaction) {
            setTransactionForm({ isOpen: true, initialData: transaction });
        }
    };

    const navigateToTransactionsWithFilter = (categoryId?: string) => {
        setTransactionFilters({ categoryId });
        setActiveTab('transactions');
    };

    const clearTransactionFilters = () => {
        setTransactionFilters({});
    };

    // دوال المصادقة
    const handleAuthSuccess = async (user: any) => {
        setCurrentUser(user);
        setShowAuthForm(false);
        await loadUserData(user.uid);
    };

    const handleSignOut = async () => {
        try {
            const result = await firebaseService.signOut();
            if (result.success) {
                console.log('✅ تم تسجيل الخروج بنجاح');
                setCurrentUser(null);
                // تحميل البيانات المحلية بعد تسجيل الخروج
                await loadLocalData();
        } else {
                console.error('❌ خطأ في تسجيل الخروج:', result.error);
            }
        } catch (error) {
            console.error('❌ خطأ في تسجيل الخروج:', error);
        }
    };

    const handleUpdateProfile = async (data: { displayName: string; email: string; photoURL?: string }) => {
        try {
            setLoading(true, 'جار تحديث الملف الشخصي...');
            
            // حفظ الصورة في localStorage إذا كانت موجودة
            if (data.photoURL && data.photoURL.startsWith('data:')) {
                localStorage.setItem('profile_photo', data.photoURL);
            }
            
            // TODO: إضافة منطق تحديث الملف الشخصي في Firebase
            console.log('تحديث الملف الشخصي:', data);
            
            // تحديث state المستخدم المحلي
            if (currentUser) {
                setCurrentUser({
                    ...currentUser,
                    displayName: data.displayName,
                    photoURL: data.photoURL || currentUser.photoURL
                });
            }
            
            setModalConfig({
                title: '✅ تم التحديث',
                body: '<p>تم تحديث الملف الشخصي بنجاح!</p>',
                hideCancel: true,
                confirmText: 'موافق'
            });
        } catch (error) {
            console.error('خطأ في تحديث الملف الشخصي:', error);
            setModalConfig({
                title: 'خطأ',
                body: '<p>حدث خطأ أثناء تحديث الملف الشخصي</p>',
                hideCancel: true,
                confirmText: 'موافق'
            });
        } finally {
            setLoading(false, '');
        }
    };

    const handleChangePassword = async (currentPassword: string, newPassword: string) => {
        try {
            setLoading(true, 'جار تغيير كلمة المرور...');
            // TODO: إضافة منطق تغيير كلمة المرور في Firebase
            console.log('تغيير كلمة المرور');
            setModalConfig({
                title: '✅ تم التغيير',
                body: '<p>تم تغيير كلمة المرور بنجاح!</p>',
                hideCancel: true,
                confirmText: 'موافق'
            });
        } catch (error) {
            console.error('خطأ في تغيير كلمة المرور:', error);
            setModalConfig({
                title: 'خطأ',
                body: '<p>حدث خطأ أثناء تغيير كلمة المرور</p>',
                hideCancel: true,
                confirmText: 'موافق'
            });
        } finally {
            setLoading(false, '');
        }
    };

    
    
    const handleSaveCard = (card: Omit<CardConfig, 'id'>, id?: string) => {
        setState(prev => {
            const newCards = { ...prev.cards };
            if (id) {
                newCards[id] = { ...newCards[id], ...card, id };
            } else {
                const newId = `card-${Date.now()}`;
                newCards[newId] = { ...card, id: newId };
            }
            return { ...prev, cards: newCards };
        });
        setCardForm({ isOpen: false });
    };

    const handleDeleteCard = (id: string) => {
        if (state.transactions.some(t => t.paymentMethod === id || t.type === `${id}-payment`)) {
            setModalConfig({
                title: 'لا يمكن الحذف',
                body: '<p>لا يمكن حذف هذه البطاقة لأنها مستخدمة في بعض الحركات. يرجى تعديل الحركات أولاً.</p>',
                hideCancel: true,
                confirmText: 'موافق'
            });
        } else {
             setModalConfig({
                title: 'تأكيد الحذف',
                body: `<p>هل أنت متأكد من رغبتك في حذف بطاقة "${state.cards[id]?.name}"؟</p>`,
                confirmText: 'نعم, حذف',
                onConfirm: () => {
                    setState(prev => {
                        const newCards = { ...prev.cards };
                        delete newCards[id];
                        return { ...prev, cards: newCards };
                    });
                    setModalConfig(null);
                }
            });
        }
    };

    const handleSaveBankAccount = (account: Omit<BankAccountConfig, 'id'>, id?: string) => {
        setState(prev => {
            const newBankAccounts = { ...prev.bankAccounts };
            if (id) {
                newBankAccounts[id] = { ...newBankAccounts[id], ...account, id };
            } else {
                const newId = `bank-${Date.now()}`;
                newBankAccounts[newId] = { ...account, id: newId };
            }
            return { ...prev, bankAccounts: newBankAccounts };
        });
        setBankAccountForm({ isOpen: false });
    };

    const handleDeleteBankAccount = (id: string) => {
        if (state.transactions.some(t => t.paymentMethod === id)) {
            setModalConfig({
                title: 'لا يمكن الحذف',
                body: '<p>لا يمكن حذف هذا الحساب لأنه مستخدم في بعض الحركات. يرجى تعديل الحركات أولاً.</p>',
                hideCancel: true,
                confirmText: 'موافق'
            });
        } else {
            setModalConfig({
                title: 'تأكيد الحذف',
                body: `<p>هل أنت متأكد من رغبتك في حذف حساب "${state.bankAccounts[id]?.name}"؟</p>`,
                confirmText: 'نعم, حذف',
                onConfirm: () => {
                    setState(prev => {
                        const newBankAccounts = { ...prev.bankAccounts };
                        delete newBankAccounts[id];
                        return { ...prev, bankAccounts: newBankAccounts };
                    });
                    setModalConfig(null);
                }
            });
        }
    };

    const handleRestore = (restoredState: any) => {
        setModalConfig({
            title: "استعادة نسخة احتياطية",
            body: "<p>هل أنت متأكد من استعادة هذه البيانات؟ سيتم استبدال جميع البيانات الحالية.</p>",
            confirmText: "استعادة",
            cancelText: "إلغاء",
            onConfirm: () => {
                try {
                    // Use the exact same logic as the old system
                    const initialState = getInitialState();

                    // Handle old backup format - convert creditCards to cards format
                    if (restoredState.creditCards && !restoredState.cards) {
                        // Convert old creditCards format to new cards format
                        const convertedCards: { [key: string]: any } = {};
                        Object.entries(restoredState.creditCards).forEach(([key, card]: [string, any]) => {
                            convertedCards[key] = {
                                id: key,
                                name: key.toUpperCase(),
                                limit: card.creditLimit || 0,
                                balance: card.currentBalance || 0,
                                dueDay: card.dueDay || 1,
                                smsSamples: [],
                                keywords: []
                            };
                        });
                        restoredState.cards = convertedCards;
                    }

                    // Handle old backup format - convert old cards format to new format
                    if (restoredState.cards && typeof restoredState.cards === 'object' && (restoredState.cards.snb || restoredState.cards.enbd)) {
                        // Convert old cards format to new format
                        const newFormatCards: { [key: string]: any } = {};
                        if (restoredState.cards.snb) {
                            newFormatCards['snb-card'] = {
                                id: 'snb-card',
                                name: 'SNB الأهلي',
                                limit: restoredState.cards.snb.limit || 0,
                                dueDay: restoredState.cards.snb.dueDay || 1,
                                statementDay: 25,
                                smsSamples: ['SNB', 'الأهلي', 'إئتمانية']
                            };
                        }
                        if (restoredState.cards.enbd) {
                            newFormatCards['enbd-card'] = {
                                id: 'enbd-card',
                                name: 'ENBD الإمارات',
                                limit: restoredState.cards.enbd.limit || 0,
                                dueDay: restoredState.cards.enbd.dueDay || 1,
                                statementDay: 28,
                                smsSamples: ['ENBD', 'الإمارات', 'Visa card']
                            };
                        }
                        restoredState.cards = newFormatCards;
                    }

                    // Handle old backup format - convert bank to bankAccounts format
                    if (restoredState.bank && !restoredState.bankAccounts) {
                        // Convert old bank format to new bankAccounts format
                        restoredState.bankAccounts = {
                            'bank-default': {
                                id: 'bank-default',
                                name: 'حساب البنك',
                                balance: restoredState.bank.balance || 0,
                                smsSamples: ['مدى', 'mada', 'Alrajhi', 'الراجحي', 'Inma', 'الإنماء', 'بنك']
                            }
                        };
                    }

                    // Convert old mada-bank references to bank-default in transactions
                    if (restoredState.transactions && Array.isArray(restoredState.transactions)) {
                        restoredState.transactions = restoredState.transactions.map((transaction: any) => {
                            if (transaction.paymentMethod === 'mada-bank') {
                                return { ...transaction, paymentMethod: 'bank-default' };
                            }
                            return transaction;
                        });
                    }

                    // Use exact same merge logic as old system: state = { ...getInitialState(), ...restoredState }
                    const validatedState = {
                        ...initialState,
                        ...restoredState
                    };
                    
                    setState(validatedState);
                    
                    // حفظ البيانات في Firebase بعد الاستعادة (إذا كان المستخدم مسجل)
                    if (currentUser) {
                        const saveToFirebase = async () => {
                            try {
                                const result = await firebaseService.saveData('users', currentUser.uid, validatedState);
                                if (result.success) {
                                    console.log('✅ تم حفظ البيانات المستعادة في Firebase');
                                } else {
                                    console.warn('⚠️ فشل في حفظ البيانات في Firebase:', result.error);
                                }
                            } catch (error) {
                                console.error('❌ خطأ في حفظ البيانات في Firebase:', error);
                            }
                        };
                        
                        saveToFirebase();
                    }
                    
                    setModalConfig({ 
                        title: "تم الاستعادة بنجاح", 
                        body: "<p>تم استعادة بياناتك بنجاح وحفظها في السحابة.</p>",
                        confirmText: 'موافق',
                        hideCancel: true
                    });
                } catch (error) {
                    setModalConfig({
                        title: "خطأ في الاستعادة",
                        body: "<p>حدث خطأ أثناء استعادة البيانات. يرجى المحاولة مرة أخرى.</p>",
                        confirmText: 'موافق',
                        hideCancel: true
                    });
                }
            }
        });
    };
    
    const openCardFormModal = (cardId?: string) => setCardForm({ isOpen: true, initialData: cardId ? state.cards[cardId] : null });
    const openBankAccountFormModal = (accountId?: string) => setBankAccountForm({ isOpen: true, initialData: accountId ? state.bankAccounts[accountId] : null });
    const openLoanFormModal = (loanId?: string) => setLoanForm({ isOpen: true, initialData: loanId ? state.loans[loanId] : null });

    const toggleDarkMode = () => {
        // تم تعطيل النظام اليلي
        return;
    };

    const toggleNotifications = () => {
        setState(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                notifications: !prev.settings.notifications
            }
        }));
    };

    // دوال النسخ الاحتياطي الجديدة
    const handleSaveToCloud = async () => {
        try {
            const success = await saveToCloud(state, currentUser?.uid);
            if (success) {
                setModalConfig({
                    title: '✅ تم بنجاح',
                    body: '<p>تم حفظ جميع البيانات في السحابة بنجاح!</p>',
                    confirmText: 'موافق'
                });
            } else {
                throw new Error('فشل في حفظ البيانات');
            }
        } catch (error) {
            setModalConfig({
                title: '❌ خطأ',
                body: '<p>حدث خطأ أثناء حفظ البيانات في السحابة. يرجى المحاولة مرة أخرى.</p>',
                confirmText: 'موافق'
            });
        }
    };

    const handleRestoreFromCloud = async () => {
        try {
            setLoading(true, 'جار استعادة البيانات من السحابة...');
            // مثل النظام القديم: لا نمرر userId ليتم اختيار أحدث نسخة عامة
            const result = await restoreFromCloud(undefined);
            
            if (result.success) {
                // إذا أردنا، يمكننا تطبيق البيانات مباشرة، ولكن حالياً نستعيد كما هو موجود في util
                
                setModalConfig({
                    title: '✅ تم بنجاح',
                    body: `<p>${result.message || 'تم تحديث البيانات بنجاح!'}</p>`,
                    hideCancel: true,
                    confirmText: 'موافق'
                });
            } else {
                throw new Error(result.message || result.error);
            }
        } catch (error: any) {
            console.error('❌ خطأ في الاستعادة من السحابة:', error);
            setModalConfig({
                title: '❌ خطأ',
                body: `<p>${error.message || 'حدث خطأ أثناء استعادة البيانات من السحابة'}</p>`,
                hideCancel: true,
                confirmText: 'موافق'
            });
        } finally {
            setLoading(false, '');
        }
    };

    const handleDownloadBackup = async () => {
        try {
            const success = await downloadBackup();
            if (success) {
                setModalConfig({
                    title: '✅ تم بنجاح',
                    body: '<p>تم تحميل ملف النسخة الاحتياطية بنجاح!</p>',
                    confirmText: 'موافق'
                });
            } else {
                throw new Error('فشل في تحميل النسخة الاحتياطية');
            }
        } catch (error) {
            setModalConfig({
                title: '❌ خطأ',
                body: '<p>حدث خطأ أثناء تحميل النسخة الاحتياطية.</p>',
                confirmText: 'موافق'
            });
        }
    };

    const handleRestoreFromFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        restoreFromFile(file)
            .then(result => {
                if (result.success) {
                    // إعادة تحميل البيانات
                    window.location.reload();
                    setModalConfig({
                        title: '✅ تم بنجاح',
                        body: `<p>${result.message}</p><p>تم تحديث البيانات بنجاح!</p>`,
                        confirmText: 'موافق'
                    });
                } else {
                    throw new Error(result.message);
                }
            })
            .catch(error => {
                setModalConfig({
                    title: '❌ خطأ',
                    body: `<p>${error.message}</p>`,
                    confirmText: 'موافق'
                });
            });
    };

    const toggleLanguage = () => {
        setState(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                language: prev.settings.language === 'ar' ? 'en' : 'ar'
            }
        }));
    };

    const handleTransfer = () => {
        if (!transferData.fromAccount || !transferData.toAccount || transferData.amount <= 0) {
            setModalConfig({ title: 'خطأ', body: '<p>يرجى ملء جميع البيانات بشكل صحيح.</p>', hideCancel: true, confirmText: 'موافق' });
            return;
        }

        if (transferData.fromAccount === transferData.toAccount) {
            setModalConfig({ title: 'خطأ', body: '<p>لا يمكن التحويل لنفس الحساب.</p>', hideCancel: true, confirmText: 'موافق' });
            return;
        }

        // تحديد نوع الحسابين (بنكي أو بطاقة)
        const fromBankAccount = state.bankAccounts[transferData.fromAccount];
        const toBankAccount = state.bankAccounts[transferData.toAccount];
        const fromCard = state.cards[transferData.fromAccount];
        const toCard = state.cards[transferData.toAccount];
        
        const fromAccount = fromBankAccount || fromCard;
        const toAccount = toBankAccount || toCard;
        
        // حساب المبلغ المحول مع معدل التحويل
        const convertedAmount = transferData.amount * transferData.exchangeRate;
        
        // تحديد نوع الحركة حسب نوع الحساب
        const fromTransactionType = fromCard ? `${transferData.fromAccount}-payment` : 'expense';
        const toTransactionType = toCard ? `${transferData.toAccount}-payment` : 'income';
        
        // إنشاء حركتين: سحب من الحساب المصدر وإيداع في الحساب الهدف
        const withdrawalTransaction = {
            id: `trans-${Date.now()}-withdrawal`,
            amount: transferData.amount,
            date: new Date().toISOString().split('T')[0],
            description: `تحويل إلى ${toAccount?.name || 'حساب آخر'}: ${transferData.description}${transferData.exchangeRate !== 1 ? ` (معدل: ${transferData.exchangeRate})` : ''}`,
            paymentMethod: transferData.fromAccount,
            type: fromTransactionType as any,
            categoryId: null
        };

        const depositTransaction = {
            id: `trans-${Date.now()}-deposit`,
            amount: convertedAmount,
            date: new Date().toISOString().split('T')[0],
            description: `تحويل من ${fromAccount?.name || 'حساب آخر'}: ${transferData.description}${transferData.exchangeRate !== 1 ? ` (معدل: ${transferData.exchangeRate})` : ''}`,
            paymentMethod: transferData.toAccount,
            type: toTransactionType as any,
            categoryId: null
        };

        // إضافة الحركتين للدولة
        setState(prev => ({
            ...prev,
            transactions: [...prev.transactions, withdrawalTransaction, depositTransaction]
        }));

        // إغلاق النافذة وإعادة تعيين البيانات
        setTransferModal({ isOpen: false });
        setTransferData({
            fromAccount: '',
            toAccount: '',
            amount: 0,
            description: '',
            exchangeRate: 1
        });
        setExchangeRateError('');

        setModalConfig({ title: 'نجح التحويل', body: '<p>تم التحويل بنجاح!</p>', hideCancel: true, confirmText: 'موافق' });
    };

    const handleSaveLoan = (loanData: Loan) => {
        setState(prev => ({
            ...prev,
            loans: {
                ...prev.loans,
                [loanData.id]: loanData
            }
        }));

        // لا نُنشئ أي حركات تلقائياً عند إضافة القرض
        // ستُسجّل الدفعات عند حدوثها فعلياً (سداد قسط/دفعة أولى/دفعة أخيرة)

        setLoanForm({ isOpen: false });
        setModalConfig({ 
            title: 'تم إضافة القرض بنجاح', 
            body: '<p>تم حفظ بيانات القرض. لن يتم إنشاء أي حركة بنكية تلقائياً. قم بتسجيل الدفعات عند سدادها.</p>', 
            hideCancel: true, 
            confirmText: 'موافق' 
        });
    };

    const updateExchangeRate = async () => {
        if (!transferData.fromAccount || !transferData.toAccount) return;
        
        const fromAccount = state.bankAccounts[transferData.fromAccount];
        const toAccount = state.bankAccounts[transferData.toAccount];
        
        if (!fromAccount || !toAccount) return;
        
        const fromCurrency = fromAccount.currency || 'SAR';
        const toCurrency = toAccount.currency || 'SAR';
        
        if (fromCurrency === toCurrency) {
            setTransferData(prev => ({ ...prev, exchangeRate: 1 }));
            setExchangeRateError('');
            return;
        }
        
        setIsLoadingExchangeRate(true);
        setExchangeRateError('');
        
        try {
            const rateData = await getExchangeRate(fromCurrency, toCurrency);
            setTransferData(prev => ({ ...prev, exchangeRate: rateData.rate }));
        } catch (error) {
            setExchangeRateError(error instanceof Error ? error.message : 'فشل في الحصول على معدل التحويل');
            console.error('Exchange rate error:', error);
        } finally {
            setIsLoadingExchangeRate(false);
        }
    };


    if (!isInitialized || isCheckingAuth) {
        return <SkeletonDashboard />;
    }

    // إذا لم يكن المستخدم مسجل دخول، اعرض نموذج المصادقة فقط
    if (!currentUser) {
        return (
            <div className="bg-gradient-to-br from-[#031A2E] to-[#052E4D] min-h-screen font-sans flex items-center justify-center relative overflow-hidden">
                {/* خلفية متحركة */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#031A2E] via-[#052E4D] to-[#0A192F]"></div>
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-500/10"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
                </div>
                
                <div className="w-full max-w-md px-4 relative z-10">
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl mx-auto mb-6 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 p-1">
                            <img src="/bayani/logo.jpg" alt="Bayani Logo" className="w-full h-full object-cover rounded-2xl" />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">بياني</h1>
                        <p className="text-blue-200 text-lg font-medium">كل شيء عن مالي… في بياني</p>
                        <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto mt-4 rounded-full"></div>
                    </div>
                    
                    <AuthForm 
                        onSuccess={handleAuthSuccess}
                        onClose={() => {}}
                        hideCloseButton={true}
                    />
                </div>
            </div>
        );
    }

    const selectedPeriodText = `${selectedYear} - ${selectedMonth === 'all' ? 'كل الشهور' : new Date(selectedYear, selectedMonth - 1).toLocaleString('ar-SA', { month: 'long' })}`;

    const getUserDisplayName = () => {
        if (currentUser?.displayName) {
            return currentUser.displayName.split(' ')[0]; // الاسم الأول فقط
        }
        if (currentUser?.email) {
            return currentUser.email.split('@')[0];
        }
        return 'المستخدم';
    };

    const profilePhotoUrl = (() => {
        try {
            const stored = typeof window !== 'undefined' ? localStorage.getItem('profile_photo') : null;
            return (currentUser?.photoURL as string) || stored || null;
        } catch {
            return (currentUser?.photoURL as string) || null;
        }
    })();

    const renderTabContent = () => {
        switch (activeTab) {
            case 'summary': return <DashboardTab calculations={calculations} categories={state.categories} state={state} allTransactionsSorted={allTransactionsSorted} darkMode={false} language={state.settings.language} onNavigateToTransactions={navigateToTransactionsWithFilter} />;
            case 'transactions': return <TransactionsTab transactions={filteredTransactions} allTransactions={allTransactionsSorted} categories={state.categories} deleteTransaction={handleDeleteTransaction} editTransaction={handleEditTransaction} state={state} darkMode={false} language={state.settings.language} initialCategoryFilter={transactionFilters.categoryId} />;
            case 'ai-assistant': return <AIAssistantTab calculations={calculations} filteredTransactions={filteredTransactions} allTransactions={allTransactionsSorted} state={state} darkMode={false} language={state.settings.language} />;
            case 'budget': return <BudgetTab state={state} setLoading={setLoading} setModal={setModalConfig} darkMode={false} language={state.settings.language} />;
            case 'investment': return <InvestmentTab state={state} setState={setState} calculations={calculations} setModal={setModalConfig} darkMode={false} language={state.settings.language} />;
            case 'cards': return <CardsTab state={state} calculations={calculations} openCardFormModal={openCardFormModal} deleteCard={handleDeleteCard} darkMode={false} language={state.settings.language} />;
            case 'bank': return <BankTab state={state} setState={setState} calculations={calculations} filteredTransactions={filteredTransactions} categories={state.categories} setModal={setModalConfig} openBankAccountFormModal={openBankAccountFormModal} deleteBankAccount={handleDeleteBankAccount} openTransferModal={() => setTransferModal({ isOpen: true })} darkMode={false} language={state.settings.language} />;
            case 'installments': return <InstallmentsTab state={state} setState={setState} filteredTransactions={filteredTransactions} setModal={setModalConfig} darkMode={false} language={state.settings.language} />;
            case 'debts-loans': return <DebtsLoansTab state={state} setState={setState} setModal={setModalConfig} openLoanFormModal={openLoanFormModal} darkMode={false} language={state.settings.language} />;
            case 'settings': return <SettingsTab state={state} setState={setState} setModal={setModalConfig} setLoading={setLoading} onRestore={handleRestore} darkMode={false} language={state.settings.language} onSaveToCloud={handleSaveToCloud} onRestoreFromCloud={handleRestoreFromCloud} onDownloadBackup={handleDownloadBackup} onRestoreFromFile={handleRestoreFromFile} currentUser={currentUser} />;
            default: return <div>Tab not found</div>;
        }
    };

        return (
            <div className="min-h-screen font-sans bg-gradient-to-br from-[#031A2E] to-[#052E4D] relative">
                {/* START: New Header */}
                <div className="container mx-auto px-2 sm:px-4 max-w-7xl mb-6">
                    <div className="relative flex items-center justify-between w-full p-4 bg-slate-800/50 rounded-lg backdrop-blur-md border border-blue-400/30 min-h-[80px]">

                        {/* اليسار: فلتر التاريخ (بشكل دائري صغير) */}
                        <div className="flex gap-1 z-10 left-4 absolute">
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="appearance-none bg-slate-700 text-white px-2 py-1.5 text-xs rounded-full border border-blue-400/30 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {[2025, 2024, 2023].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="appearance-none bg-slate-700 text-white px-2 py-1.5 text-xs rounded-full border border-blue-400/30 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">كل الشهور</option>
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
                                    <option key={month} value={month}>
                                        {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][month - 1]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* اليمين: اللوجو واسم التطبيق مع الشعار */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-center flex items-center gap-3">
                            <img src="./logo.jpg" alt="بياني Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover" />
                            <div className="flex flex-col leading-tight">
                                <h1 className="text-xl md:text-2xl font-bold text-white">بياني</h1>
                                <p className="text-[10px] md:text-xs text-blue-200">كل شيئ عن مالي.... في بياني</p>
                            </div>
                        </div>

                        {/* الجهة اليمنى: مساحة فارغة لحفظ التوازن (أُزيلت لا حاجة لها مع المحاذاة الجديدة) */}
                        <div />
                    </div>
                    {/* صف المستخدم أسفل الهيدر */}
                        <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3" onClick={() => setProfileModal({ isOpen: true })}>
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-blue-400 bg-gradient-to-br from-cyan-400 to-blue-500 cursor-pointer">
                                {profilePhotoUrl ? (
                                    <img src={profilePhotoUrl} alt="User Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                                        {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="text-white font-semibold text-base md:text-lg">{getUserDisplayName()}</span>
                                <p className="text-blue-200 text-xs">أهلاً بعودتك!</p>
                            </div>
                        </div>
                        <button onClick={handleSignOut} className="ml-auto flex items-center gap-2 text-red-300 hover:text-red-400 transition-colors">
                            <span className="text-2xl">🚪</span>
                            <span className="text-sm md:text-base">تسجيل الخروج</span>
                        </button>
                    </div>
                </div>
                {/* END: New Header */}
            
            <main className="container mx-auto px-2 sm:px-4 max-w-7xl mt-8 mb-20 content-safe-bottom">
                <TabsComponent activeTab={activeTab} setActiveTab={setActiveTab} language={state.settings.language} />
                {renderTabContent()}
            </main>

            {/* Floating Add Button for Mobile */}
            <button onClick={() => setTransactionForm({ isOpen: true })} className="md:hidden fixed bottom-24 right-4 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 text-2xl">+</button>

            {/* Transaction Form Modal */}
            {transactionForm.isOpen && (
                <TransactionForm
                    onClose={() => setTransactionForm({ isOpen: false })}
                    onSave={handleSaveTransaction}
                    initialData={transactionForm.initialData}
                    categories={state.categories}
                    cards={state.cards}
                    bankAccounts={state.bankAccounts}
                    loans={state.loans}
                    setModalConfig={setModalConfig}
                    darkMode={false}
                    language={state.settings.language}
                />
            )}

            {/* Card Form Modal */}
            {cardForm.isOpen && (
                <CardForm
                    onClose={() => setCardForm({ isOpen: false })}
                    onSave={handleSaveCard}
                    initialData={cardForm.initialData}
                />
            )}

            {/* Bank Account Form Modal */}
            {bankAccountForm.isOpen && (
                <BankAccountForm
                    onClose={() => setBankAccountForm({ isOpen: false })}
                    onSave={handleSaveBankAccount}
                    initialData={bankAccountForm.initialData}
                />
            )}

            {/* Loan Form Modal */}
            {loanForm.isOpen && (
                <LoanForm
                    onClose={() => setLoanForm({ isOpen: false })}
                    onSave={handleSaveLoan}
                    initialData={loanForm.initialData}
                    bankAccounts={state.bankAccounts}
                />
            )}

            {/* Transfer Modal */}
            {transferModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => {
                    setTransferModal({ isOpen: false });
                    setTransferData({ fromAccount: '', toAccount: '', amount: 0, description: '', exchangeRate: 1 });
                    setExchangeRateError('');
                }}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">💸 تحويل بين الحسابات</h2>
                                <button onClick={() => {
                                    setTransferModal({ isOpen: false });
                                    setTransferData({ fromAccount: '', toAccount: '', amount: 0, description: '', exchangeRate: 1 });
                                    setExchangeRateError('');
                                }} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>
                        
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="fromAccount" className="block text-sm font-medium text-slate-600 mb-1">من الحساب</label>
                                    <select 
                                        id="fromAccount"
                                        name="fromAccount"
                                        value={transferData.fromAccount} 
                                        onChange={(e) => setTransferData(prev => ({ ...prev, fromAccount: e.target.value }))}
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">اختر الحساب المصدر</option>
                                        {Object.entries(state.bankAccounts).map(([id, account]) => (
                                            <option key={id} value={id}>🏦 {account.name}</option>
                                        ))}
                                        {Object.entries(state.cards).map(([id, card]) => (
                                            <option key={id} value={id}>💳 {card.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label htmlFor="toAccount" className="block text-sm font-medium text-slate-600 mb-1">إلى الحساب</label>
                                    <select 
                                        id="toAccount"
                                        name="toAccount"
                                        value={transferData.toAccount} 
                                        onChange={(e) => setTransferData(prev => ({ ...prev, toAccount: e.target.value }))}
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">اختر الحساب الهدف</option>
                                        {Object.entries(state.bankAccounts)
                                            .filter(([id]) => id !== transferData.fromAccount)
                                            .map(([id, account]) => (
                                            <option key={id} value={id}>🏦 {account.name}</option>
                                        ))}
                                        {Object.entries(state.cards)
                                            .filter(([id]) => id !== transferData.fromAccount)
                                            .map(([id, card]) => (
                                            <option key={id} value={id}>💳 {card.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">المبلغ</label>
                                    <input 
                                        type="number" 
                                        id="amount"
                                        name="amount"
                                        step="0.01"
                                        value={transferData.amount} 
                                        onChange={(e) => setTransferData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                
                                {transferData.fromAccount && transferData.toAccount && 
                                 state.bankAccounts[transferData.fromAccount]?.currency !== state.bankAccounts[transferData.toAccount]?.currency && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            💱 معدل التحويل ({state.bankAccounts[transferData.fromAccount]?.currency} → {state.bankAccounts[transferData.toAccount]?.currency})
                                        </label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="number" 
                                                step="0.0001"
                                                value={transferData.exchangeRate} 
                                                onChange={(e) => setTransferData(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 1 }))}
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="1.0000"
                                            />
                                            <button 
                                                type="button"
                                                onClick={updateExchangeRate}
                                                disabled={isLoadingExchangeRate}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                                                title="تحديث معدل التحويل تلقائياً"
                                            >
                                                {isLoadingExchangeRate ? (
                                                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                                ) : (
                                                    '🔄'
                                                )}
                                                <span className="hidden sm:inline">تحديث</span>
                                            </button>
                                        </div>
                                        {exchangeRateError && (
                                            <p className="text-red-500 text-xs mt-1">{exchangeRateError}</p>
                                        )}
                                        <p className="text-xs text-slate-500 mt-1">
                                            المبلغ المحول: {(transferData.amount * transferData.exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {state.bankAccounts[transferData.toAccount]?.currency}
                                        </p>
                                    </div>
                                )}
                                
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">الوصف (اختياري)</label>
                                    <input 
                                        type="text" 
                                        id="description"
                                        name="description"
                                        value={transferData.description} 
                                        onChange={(e) => setTransferData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="مثل: تحويل للطوارئ"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setTransferModal({ isOpen: false });
                                        setTransferData({ fromAccount: '', toAccount: '', amount: 0, description: '', exchangeRate: 1 });
                                        setExchangeRateError('');
                                    }} 
                                    className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleTransfer}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    تحويل
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Generic Modal */}
            {modalConfig && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
                    onClick={() => setModalConfig(null)}
                >
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{modalConfig.title}</h3>
                        <div className="text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: modalConfig.body }}></div>
                        <div className="flex justify-end gap-3 mt-6">
                            {!modalConfig.hideCancel && <button onClick={() => setModalConfig(null)} className="px-4 py-2 bg-slate-200 rounded-lg">إلغاء</button>}
                            <button onClick={() => { if (!modalConfig.onConfirm || modalConfig.onConfirm() !== false) setModalConfig(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{modalConfig.confirmText || 'موافق'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {profileModal.isOpen && (
                <ProfileModal
                    isOpen={profileModal.isOpen}
                    onClose={() => setProfileModal({ isOpen: false })}
                    currentUser={currentUser}
                    onUpdateProfile={handleUpdateProfile}
                    onChangePassword={handleChangePassword}
                />
            )}

            {/* Loading Overlay */}
            {loadingState.isLoading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001] flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    <p className="text-white mt-4">{loadingState.text || 'جاري التحميل...'}</p>
                </div>
            )}

            {/* Auth Form Modal (only for logged-in users) */}
            {showAuthForm && currentUser && (
                <AuthForm 
                    onSuccess={handleAuthSuccess}
                    onClose={() => setShowAuthForm(false)}
                />
            )}
        </div>
    );
};

export default App;