import React, { useState } from 'react';
import { AppState, FinancialCalculations } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';

interface InvestmentTabProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    calculations: FinancialCalculations;
    setModal: (config: any) => void;
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const InvestmentTab: React.FC<InvestmentTabProps> = ({ state, setState, calculations, setModal, darkMode = false, language = 'ar' }) => {
    const [newInvestment, setNewInvestment] = useState({
        amount: '',
        type: '',
        account: ''
    });

    const currentValue = state.investments?.currentValue || 0;
    const profitLoss = currentValue - 1000; // مثال: القيمة الأولية 1000
    const profitPercentage = ((profitLoss / 1000) * 100).toFixed(1);

    const handleAddInvestment = () => {
        if (!newInvestment.amount || !newInvestment.type || !newInvestment.account) {
            setModal({
                title: 'خطأ',
                body: '<p>يرجى ملء جميع الحقول المطلوبة.</p>',
                hideCancel: true,
                confirmText: 'موافق'
            });
            return;
        }

        setModal({
            title: 'تم إضافة الاستثمار',
            body: '<p>تم إضافة الاستثمار بنجاح!</p>',
            hideCancel: true,
            confirmText: 'موافق'
        });

        setNewInvestment({ amount: '', type: '', account: '' });
    };

    return (
        <div className="space-y-6">
            {/* العنوان */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">الاستثمار</h2>
                <p className="text-blue-200">إدارة محفظتك الاستثمارية</p>
            </div>

            {/* القيمة الحالية للمحفظة */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-8 shadow-xl text-center">
                <h3 className="text-2xl font-bold text-white mb-4">القيمة الحالية للمحفظة</h3>
                <div className="text-5xl font-bold text-white mb-2">{formatCurrency(currentValue)}</div>
                <div className={`text-lg font-semibold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profitLoss >= 0 ? '+' : ''}{profitPercentage}% ({profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)})
                </div>
            </div>

            {/* إضافة حركة استثمارية */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">إضافة حركة استثمارية</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">المبلغ</label>
                        <input
                            type="number"
                            value={newInvestment.amount}
                            onChange={(e) => setNewInvestment(prev => ({ ...prev, amount: e.target.value }))}
                            className="w-full p-3 bg-slate-700/50 border border-blue-400/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">نوع الاستثمار</label>
                        <select
                            value={newInvestment.type}
                            onChange={(e) => setNewInvestment(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full p-3 bg-slate-700/50 border border-blue-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">اختر النوع</option>
                            <option value="stocks">أسهم</option>
                            <option value="bonds">سندات</option>
                            <option value="funds">صناديق</option>
                            <option value="crypto">عملات رقمية</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">الحساب البنكي</label>
                        <select
                            value={newInvestment.account}
                            onChange={(e) => setNewInvestment(prev => ({ ...prev, account: e.target.value }))}
                            className="w-full p-3 bg-slate-700/50 border border-blue-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">اختر الحساب</option>
                            {Object.values(state.bankAccounts).map(account => (
                                <option key={account.id} value={account.id}>{account.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={handleAddInvestment}
                    className="mt-4 w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-3 px-6 rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 shadow-lg"
                >
                    إضافة الاستثمار
                </button>
            </div>

            {/* المستشار الاستثماري */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                        🤖
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">المستشار الاستثماري</h3>
                        <div className="space-y-3">
                            <div className="bg-green-500/20 rounded-xl p-4 border border-green-400/30">
                                <p className="text-green-200">
                                    <span className="font-semibold">أسهم STC:</span> تُظهر نمواً إيجابياً بنسبة 8٪ هذا الشهر. فرصة جيدة للشراء.
                                </p>
                            </div>
                            <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-400/30">
                                <p className="text-blue-200">
                                    <span className="font-semibold">السندات:</span> معدلات الفائدة الحالية مناسبة للاستثمار في السندات الحكومية.
                                </p>
                            </div>
                            <div className="bg-yellow-500/20 rounded-xl p-4 border border-yellow-400/30">
                                <p className="text-yellow-200">
                                    <span className="font-semibold">التنويع:</span> ننصح بتوزيع الاستثمار على 60٪ أسهم، 30٪ سندات، 10٪ عملات رقمية.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* الزر العائم للاستشارة السريعة */}
            <div className="fixed bottom-24 right-4 z-50">
                <button 
                    onClick={() => {
                        // الانتقال إلى صفحة المحلل الذكي
                        const event = new CustomEvent('navigateToTab', { detail: 'ai-assistant' });
                        window.dispatchEvent(event);
                    }}
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-4 px-6 rounded-full shadow-2xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 flex items-center gap-2"
                >
                    <span className="text-2xl">💡</span>
                    <span>ابدأ استشارة سريعة</span>
                </button>
            </div>
        </div>
    );
};

export default InvestmentTab;