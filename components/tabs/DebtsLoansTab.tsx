import React, { useState } from 'react';
import { AppState, Loan, DebtToMe, DebtFromMe, BankAccountConfig } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { TrashIcon } from '../common/Icons';
import { t } from '../../translations';
import DebtForm from '../forms/DebtForm';

interface DebtsLoansTabProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    setModal: (config: any) => void;
    openLoanFormModal: (loanId?: string) => void;
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

type TabType = 'loans' | 'debts-to-me' | 'debts-from-me';

const DebtsLoansTab: React.FC<DebtsLoansTabProps> = ({ state, setState, setModal, openLoanFormModal, darkMode = false, language = 'ar' }) => {
    const [activeTab, setActiveTab] = useState<TabType>('loans');
    const [showLoanForm, setShowLoanForm] = useState(false);
    const [showDebtToMeForm, setShowDebtToMeForm] = useState(false);
    const [showDebtFromMeForm, setShowDebtFromMeForm] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState<{loan?: Loan} | null>(null);
    const [showPayInstallmentModal, setShowPayInstallmentModal] = useState<{ loan: Loan } | null>(null);
    const [selectedPayAccountId, setSelectedPayAccountId] = useState<string>('');
    const [payAmount, setPayAmount] = useState<string>('');

    const getLoanTypeIcon = (type: string) => {
        switch (type) {
            case 'car': return '🚗';
            case 'house': return '🏠';
            case 'personal': return '👤';
            case 'business': return '💼';
            case 'education': return '🎓';
            default: return '💰';
        }
    };

    const openPayInstallment = (loan: Loan) => {
        const defaultAccount = loan.linkedAccount || Object.values(state.bankAccounts)[0]?.id || '';
        setSelectedPayAccountId(defaultAccount);
        setPayAmount(String(loan.monthlyPayment || 0));
        setShowPayInstallmentModal({ loan });
    };

    const confirmPayInstallment = () => {
        const loan = showPayInstallmentModal?.loan;
        if (!loan) return;
        const amountNum = Math.max(0, parseFloat(payAmount || '0'));
        const accountId = selectedPayAccountId;
        if (!accountId || amountNum <= 0) {
            setModal({ title: 'خطأ', body: '<p>يرجى اختيار الحساب وإدخال مبلغ صحيح.</p>', confirmText: 'موافق', hideCancel: true });
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        // تحديد المبلغ الفعلي بحيث لا يتجاوز المتبقي
        const prepaidSoFar = loan.prepaidAmount || 0;
        const remainingAmountAbs = Math.max((loan.totalAmount || 0) - prepaidSoFar, 0);
        const effectiveAmount = Math.min(amountNum, remainingAmountAbs);

        // عدد الأقساط التي يغطيها هذا السداد (يدعم دفع أكثر من قسط)
        const oneInstallment = Math.max(loan.monthlyPayment || 0, 1);
        const installmentsCovered = Math.max(1, Math.floor(effectiveAmount / oneInstallment)) || 1;

        setState(prev => {
            // إنشاء حركة في سجل الحركات (expense) تؤثر على رصيد الحساب البنكي
            const paymentTransaction = {
                id: `trans-${Date.now()}-loan-${loan.id}`,
                amount: effectiveAmount,
                date: today,
                description: `قسط شهري - ${loan.name}`,
                paymentMethod: accountId,
                type: 'expense' as const,
                categoryId: null
            };

            // تحديث بيانات القرض
            const currentLoan = prev.loans[loan.id];
            const currentRemainingMonths = Math.max(currentLoan.remainingMonths || 0, 0);
            const newPrepaidAmount = (currentLoan.prepaidAmount || 0) + effectiveAmount;
            const decMonths = Math.min(installmentsCovered, currentRemainingMonths || installmentsCovered);
            const newRemainingMonths = Math.max((currentLoan.remainingMonths || 0) - decMonths, 0);
            const newPrepaidInstallments = (currentLoan.prepaidInstallments || 0) + decMonths;
            const newStatus = (newRemainingMonths === 0 || newPrepaidAmount >= (currentLoan.totalAmount || 0)) ? 'completed' : currentLoan.status;

            return {
                ...prev,
                transactions: [...prev.transactions, paymentTransaction],
                loans: {
                    ...prev.loans,
                    [loan.id]: {
                        ...currentLoan,
                        prepaidAmount: newPrepaidAmount,
                        prepaidInstallments: newPrepaidInstallments,
                        remainingMonths: newRemainingMonths,
                        status: newStatus
                    }
                }
            };
        });

        setShowPayInstallmentModal(null);
        setModal({
            title: 'تم سداد القسط',
            body: `<p>تم تسجيل سداد بقيمة ${formatCurrency(effectiveAmount)} من الحساب المحدد، وتحديث بيانات القرض.</p>`,
            confirmText: 'موافق',
            hideCancel: true
        });
    };

    const getLoanTypeName = (type: string) => {
        switch (type) {
            case 'car': return 'سيارة';
            case 'house': return 'بيت';
            case 'personal': return 'شخصي';
            case 'business': return 'تجاري';
            case 'education': return 'تعليمي';
            default: return 'أخرى';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'defaulted': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'partial': return 'bg-orange-100 text-orange-800';
            case 'paid': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusName = (status: string) => {
        switch (status) {
            case 'active': return 'نشط';
            case 'completed': return 'مكتمل';
            case 'defaulted': return 'متأخر';
            case 'pending': return 'معلق';
            case 'partial': return 'جزئي';
            case 'paid': return 'مدفوع';
            default: return 'غير محدد';
        }
    };

    // حساب تاريخ القسط التالي (يرحله للشهر القادم إذا مر يوم السداد)
    const getNextDueDate = (loan: Loan) => {
        const today = new Date();
        const dueDay = loan.dueDay || 27;
        const thisMonthDue = new Date(today.getFullYear(), today.getMonth(), dueDay);
        return (today > thisMonthDue) ? new Date(today.getFullYear(), today.getMonth() + 1, dueDay) : thisMonthDue;
    };

    const hasPaymentForCurrentPeriod = (loan: Loan) => {
        const today = new Date();
        const dueDay = loan.dueDay || 27;
        const periodStart = (today.getDate() >= dueDay)
            ? new Date(today.getFullYear(), today.getMonth(), dueDay)
            : new Date(today.getFullYear(), today.getMonth() - 1, dueDay);
        const periodEnd = getNextDueDate(loan);
        const keywords = ['سداد', 'قسط', 'تأجير', 'تموي', loan.name].filter(Boolean);
        return state.transactions.some(t => {
            const d = new Date(t.date);
            const desc = (t.description || '').toString();
            return d >= periodStart && d < periodEnd && t.type === 'expense' && keywords.some(k => desc.includes(k));
        });
    };

    const handleDeleteLoan = (loanId: string) => {
        setState(prev => ({
            ...prev,
            loans: Object.fromEntries(
                Object.entries(prev.loans).filter(([id]) => id !== loanId)
            )
        }));
    };

    const handleSaveDebtToMe = (debtData: Omit<DebtToMe, 'id' | 'createdAt'>) => {
        const debt: DebtToMe = {
            ...debtData,
            id: `debt-to-me-${Date.now()}`,
            createdAt: new Date().toISOString()
        };

        setState(prev => ({
            ...prev,
            debtsToMe: {
                ...prev.debtsToMe,
                [debt.id]: debt
            }
        }));

        setShowDebtToMeForm(false);
        setModal({
            show: true,
            title: 'تم إضافة الدين بنجاح',
            body: `<p>تم إضافة الدين من "${debt.debtor}" بقيمة ${formatCurrency(debt.amount)} ريال.</p>`,
            hideCancel: true,
            confirmText: 'موافق'
        });
    };

    const handleSaveDebtFromMe = (debtData: Omit<DebtFromMe, 'id' | 'createdAt'>) => {
        const debt: DebtFromMe = {
            ...debtData,
            id: `debt-from-me-${Date.now()}`,
            createdAt: new Date().toISOString()
        };

        setState(prev => ({
            ...prev,
            debtsFromMe: {
                ...prev.debtsFromMe,
                [debt.id]: debt
            }
        }));

        setShowDebtFromMeForm(false);
        setModal({
            show: true,
            title: 'تم إضافة الدين بنجاح',
            body: `<p>تم إضافة الدين لـ "${debt.creditor}" بقيمة ${formatCurrency(debt.amount)} ريال.</p>`,
            hideCancel: true,
            confirmText: 'موافق'
        });
    };

    const handleDeleteDebtToMe = (debtId: string) => {
        setState(prev => ({
            ...prev,
            debtsToMe: Object.fromEntries(
                Object.entries(prev.debtsToMe).filter(([id]) => id !== debtId)
            )
        }));
    };

    const handleDeleteDebtFromMe = (debtId: string) => {
        setState(prev => ({
            ...prev,
            debtsFromMe: Object.fromEntries(
                Object.entries(prev.debtsFromMe).filter(([id]) => id !== debtId)
            )
        }));
    };

    const totalActiveLoans = Object.values(state.loans).filter(loan => loan.status === 'active').length;
    const totalDebtsToMe = Object.values(state.debtsToMe).filter(debt => debt.status !== 'paid').length;
    const totalDebtsFromMe = Object.values(state.debtsFromMe).filter(debt => debt.status !== 'paid').length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">📊 الديون والقروض</h2>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('loans')}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                        activeTab === 'loans'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                    🏦 القروض ({totalActiveLoans})
                </button>
                <button
                    onClick={() => setActiveTab('debts-to-me')}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                        activeTab === 'debts-to-me'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                    💰 الديون لي ({totalDebtsToMe})
                </button>
                <button
                    onClick={() => setActiveTab('debts-from-me')}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                        activeTab === 'debts-from-me'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                    💸 الديون علي ({totalDebtsFromMe})
                </button>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'loans' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-slate-800">القروض الكبيرة</h3>
                        <button
                            onClick={() => openLoanFormModal()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                            + إضافة قرض
                        </button>
                    </div>

                    {Object.keys(state.loans).length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <div className="text-6xl mb-4">🏦</div>
                            <p className="text-lg">لا توجد قروض مسجلة</p>
                            <p className="text-sm">اضغط على "إضافة قرض" لبدء إدارة قروضك</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.values(state.loans).map((loan) => (
                                <div key={loan.id} className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 p-6 rounded-2xl shadow-xl text-white">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xl">{getLoanTypeIcon(loan.type)}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold">{loan.name}</h4>
                                                <p className="text-sm text-blue-200">{getLoanTypeName(loan.type)} - {loan.lender}</p>
                                            </div>
                                        </div>
                                        <div className="hidden md:flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => openLoanFormModal(loan.id)}
                                                className="text-sm bg-blue-100 hover:bg-blue-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                                aria-label={`تعديل قرض ${loan.name}`}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLoan(loan.id)}
                                                className="text-sm bg-red-100 hover:bg-red-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                                aria-label={`حذف قرض ${loan.name}`}
                                            >
                                                <TrashIcon />
                                            </button>
                                            <button
                                                onClick={() => openPayInstallment(loan)}
                                                className="text-sm bg-cyan-100 hover:bg-cyan-200 px-3 h-8 rounded-full flex items-center justify-center transition-colors"
                                                aria-label={`سداد قسط ${loan.name}`}
                                            >
                                                سداد قسط
                                            </button>
                                            <button
                                                onClick={() => setShowScheduleModal({ loan })}
                                                className="text-sm bg-emerald-100 hover:bg-emerald-200 px-3 h-8 rounded-full flex items-center justify-center transition-colors"
                                                aria-label={`جدولة الدفعة الأخيرة ${loan.name}`}
                                            >
                                                جدولة الدفعة الأخيرة
                                            </button>
                                        </div>
                                    </div>

                                    {/* أزرار الجوال: تحت العنوان وبشكل مرتب وواضح */}
                                    <div className="md:hidden grid grid-cols-1 gap-2 mb-4">
                                        <button
                                            onClick={() => openPayInstallment(loan)}
                                            className="w-full px-4 py-2.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-white font-semibold text-sm text-center"
                                            aria-label={`سداد قسط ${loan.name}`}
                                        >
                                            سداد قسط
                                        </button>
                                        <button
                                            onClick={() => setShowScheduleModal({ loan })}
                                            className="w-full px-4 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-white font-semibold text-sm text-center"
                                            aria-label={`جدولة الدفعة الأخيرة ${loan.name}`}
                                        >
                                            جدولة الدفعة الأخيرة
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                                            <p className="text-blue-200 font-semibold text-sm mb-1">المبلغ الإجمالي</p>
                                            <p className="text-xl font-bold">{formatCurrency(loan.totalAmount)}</p>
                                        </div>

                                        {/* خط الإنجاز */}
                                        {(loan.prepaidAmount || 0) > 0 && (
                                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="font-medium text-blue-200">التقدم</span>
                                                    <span className="font-medium text-blue-200">
                                                        {Math.round(((loan.prepaidAmount || 0) / loan.totalAmount) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                                                    <div 
                                                        className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-500" 
                                                        style={{width: `${((loan.prepaidAmount || 0) / loan.totalAmount) * 100}%`}}
                                                    ></div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-center">
                                                    <div className="bg-white/10 p-2 rounded">
                                                        <p className="text-green-300 font-bold text-sm">{Math.floor((loan.prepaidAmount || 0) / loan.monthlyPayment)}</p>
                                                        <p className="text-green-200 text-xs">مدفوع</p>
                                                    </div>
                                                    <div className="bg-white/10 p-2 rounded">
                                                        <p className="text-cyan-300 font-bold text-sm">{loan.remainingMonths || 0}</p>
                                                        <p className="text-blue-200 text-xs">متبقي (شهر)</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                                <p className="text-blue-200 text-xs mb-1">القسط الشهري</p>
                                                <p className="font-semibold">{formatCurrency(loan.monthlyPayment)}</p>
                                            </div>
                                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                                <p className="text-blue-200 text-xs mb-1">المدة المتبقية</p>
                                                <p className="font-semibold">{loan.remainingMonths || 0} شهر</p>
                                            </div>
                                        </div>

                                        {(loan.prepaidAmount || 0) > 0 && (
                                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                                <p className="text-orange-300 font-semibold text-sm mb-1">مدفوع مسبقاً</p>
                                                <p className="text-orange-200 font-bold text-lg">{formatCurrency(loan.prepaidAmount || 0)}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                                <p className="text-blue-200 text-xs mb-1">المبلغ المتبقي</p>
                                                <p className="font-semibold">{formatCurrency(Math.max(loan.totalAmount - (loan.prepaidAmount || 0), 0))}</p>
                                            </div>
                                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                                <p className="text-blue-200 text-xs mb-1">الدفعة الأولى</p>
                                                <p className="font-semibold">{formatCurrency(loan.downPayment || 0)}</p>
                                            </div>
                                            <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                                <p className="text-blue-200 text-xs mb-1">الدفعة الأخيرة</p>
                                                <p className="font-semibold">{formatCurrency(loan.finalPayment || 0)}</p>
                                            </div>
                                        </div>

                                        {/* موعد القسط التالي */}
                                        <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                                            <p className="text-blue-200 font-semibold text-sm mb-1">القسط التالي</p>
                                            <p className="font-bold text-lg">
                                                {getNextDueDate(loan).toLocaleDateString('en-GB')}
                                            </p>
                                            {!hasPaymentForCurrentPeriod(loan) && (
                                                <p className="text-red-300 text-xs mt-1">تنبيه: لم يتم تسجيل سداد لهذا الشهر</p>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                                                {getStatusName(loan.status)}
                                            </span>
                                            <span className="text-xs text-blue-200">
                                                بدأ في: {new Date(loan.startDate).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'debts-to-me' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-slate-800">الديون المستحقة لي</h3>
                        <button
                            onClick={() => setShowDebtToMeForm(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                        >
                            + إضافة دين لي
                        </button>
                    </div>

                    {Object.keys(state.debtsToMe).length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <div className="text-6xl mb-4">💰</div>
                            <p className="text-lg">لا توجد ديون مستحقة لك</p>
                            <p className="text-sm">اضغط على "إضافة دين لي" لتسجيل الأموال المستحقة لك</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.values(state.debtsToMe).map((debt) => (
                                <div key={debt.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{debt.debtor}</h4>
                                            <p className="text-sm text-slate-500">{debt.description}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteDebtToMe(debt.id)}
                                            className="text-sm bg-red-100 hover:bg-red-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                            aria-label={`حذف دين ${debt.debtor}`}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="bg-green-50 p-3 rounded-lg">
                                            <p className="text-green-700 font-semibold text-sm mb-1">المبلغ المستحق</p>
                                            <p className="text-xl font-bold text-green-900">{formatCurrency(debt.amount)}</p>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debt.status)}`}>
                                                {getStatusName(debt.status)}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                تاريخ: {new Date(debt.date).toLocaleDateString('ar-SA')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* نافذة جدولة الدفعة الأخيرة */}
            {showScheduleModal?.loan && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={() => setShowScheduleModal(null)}>
                    <div className="bg-gradient-to-br from-slate-800/95 to-blue-900/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="p-6 space-y-4">
                            <h3 className="text-xl font-bold text-white">جدولة الدفعة الأخيرة</h3>
                            <p className="text-blue-200 text-sm">قسّم الدفعة الأخيرة إلى أقساط تُسجَّل كقرض جديد.</p>
                            <div className="grid grid-cols-1 gap-3">
                                <label className="text-blue-200 text-sm">عدد الأقساط</label>
                                <input id="schedule-count" type="number" min={2} max={60} defaultValue={6} className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white" />
                                <label className="text-blue-200 text-sm">الحساب البنكي للسداد</label>
                                <select id="schedule-account" className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white">
                                    <option value="">اختر حساباً (اختياري)</option>
                                    {Object.values(state.bankAccounts).map((acc: BankAccountConfig) => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg" onClick={() => setShowScheduleModal(null)}>إلغاء</button>
                                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
                                    onClick={() => {
                                        const loan = showScheduleModal.loan!;
                                        const count = Math.max(2, Math.min(60, parseInt((document.getElementById('schedule-count') as HTMLInputElement).value || '6')));
                                        const accountId = (document.getElementById('schedule-account') as HTMLSelectElement).value || '';
                                        const perInstallment = Math.round(((loan.finalPayment || 0) / count) * 100) / 100;
                                        const newLoanId = `loan-${Date.now()}`;
                                        const newLoan: Loan = {
                                            id: newLoanId,
                                            type: loan.type,
                                            name: `جدولة ${loan.name}`,
                                            totalAmount: loan.finalPayment || 0,
                                            downPayment: 0,
                                            finalPayment: 0,
                                            monthlyPayment: perInstallment,
                                            dueDay: loan.dueDay || 27,
                                            startDate: new Date().toISOString().split('T')[0],
                                            lender: loan.lender,
                                            status: 'active',
                                            linkedAccount: accountId,
                                            createdAt: new Date().toISOString()
                                        } as any;
                                        setState(prev => ({ ...prev, loans: { ...prev.loans, [newLoanId]: newLoan } }));
                                        setShowScheduleModal(null);
                                        setModal({ title: 'تمت الجدولة', body: `<p>تم إنشاء قرض جديد بعدد ${count} أقساط بقيمة ${formatCurrency(perInstallment)} لكل قسط.</p>`, confirmText: 'موافق', hideCancel: true });
                                    }}
                                >تأكيد الجدولة</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'debts-from-me' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-slate-800">الديون المستحقة علي</h3>
                        <button
                            onClick={() => setShowDebtFromMeForm(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                        >
                            + إضافة دين علي
                        </button>
                    </div>

                    {Object.keys(state.debtsFromMe).length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <div className="text-6xl mb-4">💸</div>
                            <p className="text-lg">لا توجد ديون مستحقة عليك</p>
                            <p className="text-sm">اضغط على "إضافة دين علي" لتسجيل الأموال المستحقة عليك</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.values(state.debtsFromMe).map((debt) => (
                                <div key={debt.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{debt.creditor}</h4>
                                            <p className="text-sm text-slate-500">{debt.description}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteDebtFromMe(debt.id)}
                                            className="text-sm bg-red-100 hover:bg-red-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                            aria-label={`حذف دين ${debt.creditor}`}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="bg-red-50 p-3 rounded-lg">
                                            <p className="text-red-700 font-semibold text-sm mb-1">المبلغ المستحق</p>
                                            <p className="text-xl font-bold text-red-900">{formatCurrency(debt.amount)}</p>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debt.status)}`}>
                                                {getStatusName(debt.status)}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                تاريخ: {new Date(debt.date).toLocaleDateString('ar-SA')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* نماذج الديون */}
            {showDebtToMeForm && (
                <DebtForm
                    onClose={() => setShowDebtToMeForm(false)}
                    onSave={handleSaveDebtToMe}
                    type="toMe"
                />
            )}

            {showDebtFromMeForm && (
                <DebtForm
                    onClose={() => setShowDebtFromMeForm(false)}
                    onSave={handleSaveDebtFromMe}
                    type="fromMe"
                />
            )}

            {/* نافذة سداد القسط */}
            {showPayInstallmentModal?.loan && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={() => setShowPayInstallmentModal(null)}>
                    <div className="bg-gradient-to-br from-slate-800/95 to-blue-900/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="p-6 space-y-4">
                            <h3 className="text-xl font-bold text-white">سداد قسط - {showPayInstallmentModal.loan.name}</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <label className="text-blue-200 text-sm">الحساب للسداد</label>
                                <select
                                    value={selectedPayAccountId}
                                    onChange={(e) => setSelectedPayAccountId(e.target.value)}
                                    className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white"
                                >
                                    <option value="">اختر حساباً</option>
                                    {Object.values(state.bankAccounts).map((acc: BankAccountConfig) => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                                <label className="text-blue-200 text-sm">مبلغ السداد</label>
                                <input
                                    type="number"
                                    min={1}
                                    step="0.01"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg" onClick={() => setShowPayInstallmentModal(null)}>إلغاء</button>
                                <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg" onClick={confirmPayInstallment}>تأكيد السداد</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtsLoansTab;
