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
                                <div key={loan.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 text-xl">{getLoanTypeIcon(loan.type)}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{loan.name}</h4>
                                                <p className="text-sm text-slate-500">{getLoanTypeName(loan.type)} - {loan.lender}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
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
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <p className="text-blue-700 font-semibold text-sm mb-1">المبلغ الإجمالي</p>
                                            <p className="text-xl font-bold text-blue-900">{formatCurrency(loan.totalAmount)}</p>
                                        </div>

                                        {/* خط الإنجاز */}
                                        {(loan.prepaidAmount || 0) > 0 && (
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="font-medium text-slate-700">التقدم</span>
                                                    <span className="font-medium text-slate-700">
                                                        {Math.round(((loan.prepaidAmount || 0) / loan.totalAmount) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                                                    <div 
                                                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500" 
                                                        style={{width: `${((loan.prepaidAmount || 0) / loan.totalAmount) * 100}%`}}
                                                    ></div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-center">
                                                    <div className="bg-green-50 p-2 rounded">
                                                        <p className="text-green-700 font-bold text-sm">{Math.floor((loan.prepaidAmount || 0) / loan.monthlyPayment)}</p>
                                                        <p className="text-green-600 text-xs">مدفوع</p>
                                                    </div>
                                                    <div className="bg-blue-50 p-2 rounded">
                                                        <p className="text-blue-700 font-bold text-sm">{loan.totalMonths - Math.floor((loan.prepaidAmount || 0) / loan.monthlyPayment)}</p>
                                                        <p className="text-blue-600 text-xs">متبقي</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <p className="text-slate-600 text-xs mb-1">القسط الشهري</p>
                                                <p className="font-semibold text-slate-800">{formatCurrency(loan.monthlyPayment)}</p>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <p className="text-slate-600 text-xs mb-1">المدة المتبقية</p>
                                                <p className="font-semibold text-slate-800">{loan.remainingMonths || 0} شهر</p>
                                            </div>
                                        </div>

                                        {(loan.prepaidAmount || 0) > 0 && (
                                            <div className="bg-orange-50 p-3 rounded-lg">
                                                <p className="text-orange-700 font-semibold text-sm mb-1">مدفوع مسبقاً</p>
                                                <p className="text-orange-900 font-bold text-lg">{formatCurrency(loan.prepaidAmount || 0)}</p>
                                            </div>
                                        )}

                                        {/* موعد القسط التالي */}
                                        <div className="bg-yellow-50 p-3 rounded-lg">
                                            <p className="text-yellow-700 font-semibold text-sm mb-1">القسط التالي</p>
                                            <p className="text-yellow-900 font-bold text-lg">
                                                {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                                                {getStatusName(loan.status)}
                                            </span>
                                            <span className="text-xs text-slate-500">
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
        </div>
    );
};

export default DebtsLoansTab;
