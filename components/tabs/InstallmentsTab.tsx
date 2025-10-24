import React from 'react';
import { AppState, Transaction, BankAccountConfig, CardConfig } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';

interface InstallmentsTabProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    filteredTransactions: Transaction[];
    setModal: (config: any) => void;
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const getPaymentMethodName = (key: string, state: AppState): string => {
    const standardMethods: { [key: string]: string } = {
        'cash': '💵 نقدي', 'tabby-bnpl': '📱 تابي', 'tamara-bnpl': '📱 تمارا', 'reconciliation': '🔄 تسوية'
    };
    if (standardMethods[key]) return standardMethods[key];
    if (state.cards[key]) return `💳 ${state.cards[key].name}`;
    if (state.bankAccounts[key]) return `🏦 ${state.bankAccounts[key].name}`;
    return key;
};

const InstallmentsTab: React.FC<InstallmentsTabProps> = ({ state, setState, filteredTransactions, setModal, darkMode = false, language = 'ar' }) => {
    const [showCompletedModal, setShowCompletedModal] = React.useState(false);

    // حساب ملخص الأقساط
    const getInstallmentSummary = () => {
        const activeInstallments = state.installments.filter(i => i.paid < i.total);
        
        const tabbyInstallments = activeInstallments.filter(i => i.provider === 'tabby-bnpl');
        const tamaraInstallments = activeInstallments.filter(i => i.provider === 'tamara-bnpl');
        
        // حساب جميع الدفعات القادمة لكل قسط
        const tabbyTotal = tabbyInstallments.reduce((sum, i) => {
            const remainingPayments = i.total - i.paid;
            return sum + (i.installmentAmount * remainingPayments);
        }, 0);
        
        const tamaraTotal = tamaraInstallments.reduce((sum, i) => {
            const remainingPayments = i.total - i.paid;
            return sum + (i.installmentAmount * remainingPayments);
        }, 0);
        
        const grandTotal = tabbyTotal + tamaraTotal;
        
        return {
            tabbyTotal,
            tamaraTotal,
            grandTotal,
            tabbyCount: tabbyInstallments.length,
            tamaraCount: tamaraInstallments.length,
            totalCount: activeInstallments.length
        };
    };

    const summary = getInstallmentSummary();

    // حساب موعد القسط التالي
    const getNextPaymentDate = () => {
        const activeInstallments = state.installments.filter(i => i.paid < i.total);
        const installmentTransactions = state.transactions.filter(t => t.isInstallmentPayment);
        
        if (activeInstallments.length === 0) return null;
        
        const nextPaymentDate = activeInstallments.map(installment => {
            const installmentPayments = installmentTransactions
                .filter(t => t.installmentId === installment.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            let nextDate;
            if (installmentPayments.length > 0) {
                const lastPayment = installmentPayments[0];
                const lastPaymentDate = new Date(lastPayment.date);
                const nextDateObj = new Date(lastPaymentDate);
                nextDateObj.setDate(nextDateObj.getDate() + 30);
                nextDate = nextDateObj.toISOString().split('T')[0];
            } else {
                const startDate = new Date(installment.createdAt);
                const nextDateObj = new Date(startDate);
                nextDateObj.setDate(nextDateObj.getDate() + 30);
                nextDate = nextDateObj.toISOString().split('T')[0];
            }
            
            return {
                installment,
                nextDate
            };
        }).sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())[0];
        
        return nextPaymentDate;
    };

    // حساب مبلغ القسط التالي
    const getNextPaymentAmount = () => {
        const activeInstallments = state.installments.filter(i => i.paid < i.total);
        return activeInstallments.reduce((sum, i) => sum + i.installmentAmount, 0);
    };

    const nextPayment = getNextPaymentDate();
    const nextPaymentAmount = getNextPaymentAmount();

    return (
        <div className="space-y-6">
            {/* العنوان */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">الأقساط</h2>
                <p className="text-blue-200">إدارة أقساط تابي وتمارا</p>
                        </div>

            {/* ملخص الأقساط */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">📱 تابي</h3>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-blue-400">{formatCurrency(summary.tabbyTotal)}</p>
                        <p className="text-sm text-blue-200">إجمالي الأقساط المتبقية</p>
                        <p className="text-xs text-blue-300 mt-1">{summary.tabbyCount} قسط نشط</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">📱 تمارا</h3>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-purple-400">{formatCurrency(summary.tamaraTotal)}</p>
                        <p className="text-sm text-blue-200">إجمالي الأقساط المتبقية</p>
                        <p className="text-xs text-blue-300 mt-1">{summary.tamaraCount} قسط نشط</p>
                    </div>
                    </div>

                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">💰 المجموع</h3>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-red-400">{formatCurrency(summary.grandTotal)}</p>
                        <p className="text-sm text-blue-200">إجمالي الأقساط المتبقية</p>
                        <p className="text-xs text-blue-300 mt-1">{summary.totalCount} قسط نشط</p>
                    </div>
                        </div>
                    </div>

            {/* القسط التالي */}
            {nextPayment && (
                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">القسط التالي</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-cyan-400">{formatCurrency(nextPaymentAmount)}</p>
                            <p className="text-sm text-blue-200">مبلغ القسط</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-400">
                                {new Date(nextPayment.nextDate).toLocaleDateString('ar-SA')}
                            </p>
                            <p className="text-sm text-blue-200">تاريخ الاستحقاق</p>
                        </div>
                    </div>
                </div>
            )}

            {/* قائمة الأقساط النشطة */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">الأقساط النشطة</h3>
                <div className="space-y-3">
                    {state.installments
                        .filter(i => i.paid < i.total)
                        .map(installment => (
                            <div key={installment.id} className="bg-slate-700/30 rounded-xl p-4 border border-blue-400/20">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-white font-semibold">{installment.description}</h4>
                                        <p className="text-blue-200 text-sm">
                                            {installment.provider === 'tabby-bnpl' ? '📱 تابي' : '📱 تمارا'}
                                        </p>
                                        <p className="text-blue-300 text-xs">
                                            {installment.paid} من {installment.total} أقساط
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">{formatCurrency(installment.installmentAmount)}</p>
                                        <p className="text-blue-200 text-sm">كل شهر</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className="w-full bg-slate-600 rounded-full h-2">
                                        <div 
                                            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(installment.paid / installment.total) * 100}%` }}
                                        ></div>
                                </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* رسالة عدم وجود أقساط */}
            {state.installments.filter(i => i.paid < i.total).length === 0 && (
                <div className="text-center py-8">
                                        <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-bold text-white mb-2">لا توجد أقساط نشطة</h3>
                    <p className="text-blue-200">جميع أقساطك مكتملة! ممتاز! 🎊</p>
                </div>
            )}
        </div>
    );
};

export default InstallmentsTab;