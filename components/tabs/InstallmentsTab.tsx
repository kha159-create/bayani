import React, { useState, useMemo } from 'react';
import { AppState, Transaction, BankAccountConfig, CardConfig, InstallmentPlan } from '../../types';
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
    const [showCompletedModal, setShowCompletedModal] = useState(false);

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
            activeCount: activeInstallments.length,
            completedCount: state.installments.filter(i => i.paid >= i.total).length
        };
    };

    // حساب موعد القسط التالي
    const getNextPaymentDate = () => {
        const activeInstallments = state.installments.filter(i => i.paid < i.total);
        if (activeInstallments.length === 0) return null;

        // البحث عن آخر عملية دفع قسط
        const installmentTransactions = state.transactions.filter(t => t.isInstallmentPayment);
        if (installmentTransactions.length === 0) {
            // إذا لم تكن هناك دفعات سابقة، احسب من تاريخ إنشاء الأقساط
            const earliestInstallment = activeInstallments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
            const startDate = new Date(earliestInstallment.createdAt);
            const nextDate = new Date(startDate);
            nextDate.setDate(nextDate.getDate() + 30);
            return nextDate.toISOString().split('T')[0];
        }

        // البحث عن آخر عملية دفع لكل قسط نشط
        let nextPaymentDate = null;
        
        for (const installment of activeInstallments) {
            const installmentPayments = installmentTransactions
                .filter(t => t.installmentId === installment.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            if (installmentPayments.length > 0) {
                const lastPayment = installmentPayments[0];
                const lastPaymentDate = new Date(lastPayment.date);
                const nextDate = new Date(lastPaymentDate);
                nextDate.setDate(nextDate.getDate() + 30);
                
                if (!nextPaymentDate || nextDate < new Date(nextPaymentDate)) {
                    nextPaymentDate = nextDate.toISOString().split('T')[0];
                }
            } else {
                // إذا لم تكن هناك دفعات لهذا القسط، احسب من تاريخ إنشائه
                const startDate = new Date(installment.createdAt);
                const nextDate = new Date(startDate);
                nextDate.setDate(nextDate.getDate() + 30);
                
                if (!nextPaymentDate || nextDate < new Date(nextPaymentDate)) {
                    nextPaymentDate = nextDate.toISOString().split('T')[0];
                }
            }
        }
        
        return nextPaymentDate;
    };

    // حساب مبلغ القسط التالي
    const getNextPaymentAmount = () => {
        const activeInstallments = state.installments.filter(i => i.paid < i.total);
        return activeInstallments.reduce((sum, i) => sum + i.installmentAmount, 0);
    };

    // حساب جميع مواعيد الأقساط التالية
    const getAllNextPaymentDates = () => {
        const activeInstallments = state.installments.filter(i => i.paid < i.total);
        const installmentTransactions = state.transactions.filter(t => t.isInstallmentPayment);
        
        return activeInstallments.map(installment => {
            const installmentPayments = installmentTransactions
                .filter(t => t.installmentId === installment.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            let nextPaymentDate;
            if (installmentPayments.length > 0) {
                const lastPayment = installmentPayments[0];
                const lastPaymentDate = new Date(lastPayment.date);
                const nextDate = new Date(lastPaymentDate);
                nextDate.setDate(nextDate.getDate() + 30);
                nextPaymentDate = nextDate.toISOString().split('T')[0];
            } else {
                const startDate = new Date(installment.createdAt);
                const nextDate = new Date(startDate);
                nextDate.setDate(nextDate.getDate() + 30);
                nextPaymentDate = nextDate.toISOString().split('T')[0];
            }
            
            return {
                installment,
                nextPaymentDate
            };
        }).sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime());
    };

    const handlePayInstallment = (installmentId: string) => {
        const installment = state.installments.find(i => i.id === installmentId);
        if (!installment || installment.paid >= installment.total) return;

        let paymentOptionsHTML = '';
        Object.values(state.bankAccounts).forEach((acc: BankAccountConfig) => {
            paymentOptionsHTML += `<option value="${acc.id}">🏦 ${acc.name}</option>`;
        });
        paymentOptionsHTML += '<option value="cash">💵 نقدي</option>';
        Object.values(state.cards).forEach((card: CardConfig) => {
            paymentOptionsHTML += `<option value="${card.id}">💳 ${card.name}</option>`;
        });

        const body = `<p class="mb-4">اختر مصدر الدفع لسداد قسط "${installment.description}" بقيمة ${formatCurrency(installment.installmentAmount)} ريال.</p><div><label for="installment-payment-source" class="block text-sm font-medium mb-2">مصدر الدفع</label><select id="installment-payment-source" class="w-full p-3">${paymentOptionsHTML}</select></div>`;

        setModal({
            show: true, title: 'سداد قسط', body, confirmText: 'تأكيد الدفع',
            onConfirm: () => {
                const paymentSource = (document.getElementById('installment-payment-source') as HTMLSelectElement).value;
                const billCategory = state.categories.find(c => c.name === 'سداد فواتير' || c.name === '💳 سداد فواتير');
                const categoryId = billCategory?.id || state.categories.find(c => c.name === 'أخرى')?.id || '';

                const transaction: Transaction = {
                    id: 'trans-' + Date.now(),
                    amount: installment.installmentAmount,
                    date: new Date().toISOString().split('T')[0],
                    description: `سداد القسط ${installment.paid + 1} لـ: ${installment.description}`,
                    paymentMethod: paymentSource,
                    type: 'bnpl-payment',
                    categoryId: categoryId,
                    isInstallmentPayment: true,
                    installmentId: installmentId,
                };

                setState(prev => {
                    const updatedInstallments = prev.installments.map(i => {
                        if (i.id === installmentId) {
                            const updatedInstallment = { ...i, paid: i.paid + 1 };
                            console.log('🔄 تحديث قسط:', { id: i.id, paid: i.paid, newPaid: updatedInstallment.paid, total: i.total });
                            return updatedInstallment;
                        }
                        return i;
                    });
                    return {
                        ...prev,
                        transactions: [...prev.transactions, transaction],
                        installments: updatedInstallments
                    };
                });
                setModal({ show: false });
            }
        });
    };

    const activeInstallments = state.installments.filter(i => i.paid < i.total);
    const installmentTransactions = state.transactions.filter(t => t.isInstallmentPayment);

    const summary = getInstallmentSummary();
    const nextPaymentDate = getNextPaymentDate();
    const nextPaymentAmount = getNextPaymentAmount();

    return (
        <div className="space-y-6">
            {/* عنوان */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">الأقساط</h2>
                <p className="text-blue-200">إدارة أقساط تابي وتمارا</p>
            </div>

            {/* ملخص الأقساط */}
            <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">ملخص الأقساط</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* تابي */}
                    <div className="bg-slate-700/40 backdrop-blur-md rounded-lg p-4 border border-blue-400/20">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">📱</span>
                            <span className="font-semibold text-blue-400">تابي</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatCurrency(summary.tabbyTotal)}</p>
                    </div>

                    {/* تمارا */}
                    <div className="bg-slate-700/40 backdrop-blur-md rounded-lg p-4 border border-blue-400/20">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">📱</span>
                            <span className="font-semibold text-purple-400">تمارا</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatCurrency(summary.tamaraTotal)}</p>
                    </div>

                    {/* المجموع */}
                    <div className="bg-slate-700/40 backdrop-blur-md rounded-lg p-4 border border-blue-400/20">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">💰</span>
                            <span className="font-semibold text-red-400">المجموع</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatCurrency(summary.grandTotal)}</p>
                    </div>
                </div>

                {/* القسط التالي */}
                {nextPaymentDate && (
                    <div className="bg-slate-700/40 backdrop-blur-md rounded-lg p-4 border border-blue-400/20">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">⏰</span>
                            <h4 className="font-semibold text-white">القسط التالي</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-2xl font-bold text-cyan-400">{formatCurrency(nextPaymentAmount)}</p>
                                <p className="text-sm text-blue-200">المبلغ</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-yellow-400">{new Date(nextPaymentDate).toLocaleDateString('en-GB')}</p>
                                <p className="text-sm text-blue-200">التاريخ</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* مواعيد الأقساط التالية */}
            {getAllNextPaymentDates().length > 0 && (
                <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">مواعيد الأقساط التالية</h3>
                    <div className="space-y-2">
                        {getAllNextPaymentDates().slice(0, 3).map((item) => (
                            <div key={item.installment.id} className="bg-slate-700/40 backdrop-blur-md rounded-lg p-3 border border-blue-400/20">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-white">{item.installment.description}</p>
                                        <p className="text-xs text-blue-200">{getPaymentMethodName(item.installment.provider, state)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-cyan-400">{new Date(item.nextPaymentDate).toLocaleDateString('en-GB')}</p>
                                        <p className="text-xs text-blue-200">{formatCurrency(item.installment.installmentAmount)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* الأقساط النشطة */}
            <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">الأقساط النشطة</h3>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{summary.activeCount}</p>
                            <p className="text-xs text-blue-200">نشطة</p>
                        </div>
                        <button 
                            onClick={() => setShowCompletedModal(true)}
                            className="text-center"
                        >
                            <p className="text-2xl font-bold text-green-400">{summary.completedCount}</p>
                            <p className="text-xs text-blue-200">مكتملة</p>
                        </button>
                    </div>
                </div>
                
                <div className="space-y-3">
                    {activeInstallments.length > 0 ? activeInstallments.map(i => {
                        const progress = (i.paid / i.total) * 100;
                        return (
                            <div key={i.id} className="bg-slate-700/40 backdrop-blur-md rounded-lg p-4 border border-blue-400/20">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-white">{i.description}</h4>
                                        <p className="text-sm text-blue-200">{getPaymentMethodName(i.provider, state)}</p>
                                    </div>
                                    <div className="bg-blue-500/20 px-3 py-1 rounded-lg border border-blue-400/30">
                                        <span className="font-bold text-blue-300 text-sm">{formatCurrency(i.installmentAmount)}/شهر</span>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                                        <div 
                                            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-blue-200">
                                        <span>{i.paid} / {i.total} مدفوع</span>
                                        <span>متبقي: {i.total - i.paid}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handlePayInstallment(i.id)} 
                                    className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 text-sm shadow-md font-semibold"
                                >
                                    💳 دفع القسط التالي
                                </button>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">🎉</div>
                            <h3 className="text-xl font-bold text-white mb-2">لا توجد أقساط نشطة</h3>
                            <p className="text-blue-200">جميع أقساطك مكتملة! ممتاز! 🎊</p>
                        </div>
                    )}
                </div>
            </div>

            {/* سجل دفعات الأقساط */}
            {installmentTransactions.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">سجل دفعات الأقساط</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {installmentTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                            <div key={t.id} className="bg-slate-700/40 backdrop-blur-md rounded-lg p-3 border border-blue-400/20">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm text-blue-200">{new Date(t.date).toLocaleDateString('en-GB')}</div>
                                        <div>
                                            <div className="text-white font-semibold text-sm">{t.description}</div>
                                            <div className="text-xs text-blue-300">{getPaymentMethodName(t.paymentMethod, state)}</div>
                                        </div>
                                    </div>
                                    <div className="text-red-400 font-bold">{formatCurrency(t.amount)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* نافذة الأقساط المكتملة */}
            {showCompletedModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={() => setShowCompletedModal(false)}>
                    <div className="bg-gradient-to-br from-slate-800/95 to-blue-900/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">✅ الأقساط المكتملة</h3>
                                <button onClick={() => setShowCompletedModal(false)} className="text-blue-200 hover:text-white">✕</button>
                            </div>

                            <div className="space-y-4">
                                {Object.values(state.installments)
                                    .filter(i => i.paid >= i.total)
                                    .map(installment => (
                                        <div key={installment.id} className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-green-400">{installment.description}</h4>
                                                    <p className="text-sm text-blue-200">{getPaymentMethodName(installment.provider, state)}</p>
                                                </div>
                                                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                                                    مكتمل
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-4 text-center mt-3">
                                                <div className="bg-slate-700/50 p-3 rounded-lg">
                                                    <p className="text-green-400 font-bold text-lg">{installment.total}</p>
                                                    <p className="text-blue-200 text-xs">إجمالي الأقساط</p>
                                                </div>
                                                <div className="bg-slate-700/50 p-3 rounded-lg">
                                                    <p className="text-green-400 font-bold text-lg">{formatCurrency(installment.installmentAmount)}</p>
                                                    <p className="text-blue-200 text-xs">قيمة القسط</p>
                                                </div>
                                                <div className="bg-slate-700/50 p-3 rounded-lg">
                                                    <p className="text-green-400 font-bold text-lg">{formatCurrency(installment.total * installment.installmentAmount)}</p>
                                                    <p className="text-blue-200 text-xs">المجموع الكلي</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                
                                {Object.values(state.installments).filter(i => i.paid >= i.total).length === 0 && (
                                    <div className="text-center py-12 text-blue-200">
                                        <div className="text-6xl mb-4">🎉</div>
                                        <p className="text-lg">لا توجد أقساط مكتملة حالياً</p>
                                        <p className="text-sm">ستظهر الأقساط المكتملة هنا عند إنهائها</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end mt-6">
                                <button 
                                    onClick={() => setShowCompletedModal(false)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstallmentsTab;
