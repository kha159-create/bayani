import React, { useMemo } from 'react';
import { FinancialCalculations, Category, CardDetails, BankAccountDetails, AppState, CardConfig, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';
import AzkarCard from '../common/AzkarCard';

interface DashboardTabProps {
    calculations: FinancialCalculations;
    categories: Category[];
    state: AppState;
    allTransactionsSorted: Transaction[];
    darkMode?: boolean;
    language?: 'ar' | 'en';
    onNavigateToTransactions?: (categoryId?: string) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ calculations, categories, state, allTransactionsSorted, darkMode = false, language = 'ar', onNavigateToTransactions }) => {
    const totalBankBalance = calculations.totalBankBalance;
    const totalExpenses = calculations.totalExpenses;
    const totalIncome = calculations.totalIncome;
    const netResult = totalIncome - totalExpenses;

    // تحديد نوع البطاقة وشعارها
    const getCardTypeAndLogo = (card: any) => {
        // استخدام cardType المباشر إذا كان موجوداً
        if (card.cardType) {
            switch (card.cardType) {
                case 'visa':
                    return { type: 'Visa', logo: 'VISA', color: 'from-blue-600 to-blue-800' };
                case 'mastercard':
                    return { type: 'Mastercard', logo: '●●', color: 'from-red-500 to-orange-500' };
                case 'amex':
                    return { type: 'American Express', logo: '●●', color: 'from-green-600 to-blue-600' };
                default:
                    return { type: 'Credit Card', logo: '●●', color: 'from-gray-600 to-gray-800' };
            }
        }
        
        // Fallback للبطاقات القديمة بدون cardType
        const cardName = (typeof card === 'string' ? card : card.name || card.id || '').toLowerCase();
        if (cardName.includes('visa') || cardName.includes('فيزا')) {
            return { type: 'Visa', logo: 'VISA', color: 'from-blue-600 to-blue-800' };
        }
        if (cardName.includes('mastercard') || cardName.includes('ماستر')) {
            return { type: 'Mastercard', logo: '●●', color: 'from-red-500 to-orange-500' };
        }
        if (cardName.includes('amex') || cardName.includes('أمريكان')) {
            return { type: 'American Express', logo: '●●', color: 'from-green-600 to-blue-600' };
        }
        return { type: 'Credit Card', logo: '●●', color: 'from-gray-600 to-gray-800' };
    };

    // حساب ملخص البطاقات الائتمانية - باستخدام calculations.cardDetails مباشرة
    const creditCardsSummary = useMemo(() => {
        return Object.values(calculations.cardDetails || {}).map(card => {
            const cardInfo = getCardTypeAndLogo(card); // تمرير كائن البطاقة الكامل بدلاً من card.name فقط
            const usagePercentage = (card.balance / card.limit) * 100;
            const available = card.limit - card.balance;
            
            return {
                id: card.id,
                name: card.name,
                type: cardInfo.type,
                logo: cardInfo.logo,
                color: cardInfo.color,
                currentBalance: card.balance,
                usedAmount: card.balance,
                availableAmount: available,
                limit: card.limit,
                usagePercentage: usagePercentage
            };
        });
    }, [calculations.cardDetails]);

    // بيانات الرسم البياني الدائري
    const pieChartData = useMemo(() => {
        const colors = [
            '#00B2FF', // Quantum Blue
            '#A0D2EB', // Robo Blue
            '#3B82F6', // Blue
            '#06B6D4', // Cyan
            '#8B5CF6', // Purple
            '#10B981', // Green
            '#F59E0B', // Orange
            '#EF4444'  // Red
        ];

        const total = calculations.totalExpenses || Object.values(calculations.expensesByCategory || {}).reduce((s: number, v: any) => s + (v as number), 0);

        return Object.entries(calculations.expensesByCategory)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 8) // أخذ أعلى 8 فئات
            .map(([categoryId, amount], index) => {
                const category = categories.find(c => c.id === categoryId);
                return {
                    id: categoryId,
                    name: category?.name || t('other', language),
                    value: amount as number,
                    percentage: total > 0 ? ((amount as number) / total) * 100 : 0,
                    color: colors[index % colors.length],
                    icon: category?.icon || '📊'
                };
            });
    }, [calculations.expensesByCategory, calculations.totalExpenses, categories, language]);

    // ملخص الحسابات البنكية
    const bankAccountDetails = calculations.bankAccountDetails;
    const bankAccountsCount = Object.keys(bankAccountDetails).length;
    const totalBankAccountsBalance = Object.values(bankAccountDetails).reduce((sum, account) => sum + account.balance, 0);
    
    // آخر 5 حركات
    const lastFiveTransactions = useMemo(() => {
        return allTransactionsSorted.slice(0, 5);
    }, [allTransactionsSorted]);

    // تنبيهات الميزانية (تستخدم ميزانيات محلية محفوظة)
    const budgetAlerts = useMemo(() => {
        try {
            const saved = localStorage.getItem('bayani_category_budgets');
            if (!saved) return [] as Array<{ id: string; name: string; icon: string; budget: number; spent: number; pct: number }>;
            const budgets = JSON.parse(saved) as { [id: string]: number };
            // مصروفات الشهر الحالي فقط للتنبيه الشهري
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const spentMap: { [id: string]: number } = {};
            state.transactions.forEach(t => {
                const d = new Date(t.date);
                if (d.getFullYear() === year && d.getMonth() === month && (t.type === 'expense' || t.type === 'bnpl-payment' || t.type === 'investment-deposit') && t.categoryId) {
                    spentMap[t.categoryId] = (spentMap[t.categoryId] || 0) + t.amount;
                }
            });
            const items: Array<{ id: string; name: string; icon: string; budget: number; spent: number; pct: number }> = [];
            Object.entries(budgets).forEach(([id, budget]) => {
                if (!budget || budget <= 0) return;
                const spent = spentMap[id] || 0;
                const pct = Math.min(100, (spent / budget) * 100);
                if (pct >= 80) {
                    const cat = categories.find(c => c.id === id);
                    items.push({ id, name: cat?.name || 'فئة', icon: cat?.icon || '📊', budget, spent, pct });
                }
            });
            return items.sort((a, b) => b.pct - a.pct).slice(0, 3);
        } catch {
            return [] as Array<{ id: string; name: string; icon: string; budget: number; spent: number; pct: number }>;
        }
    }, [state.transactions, categories]);

    return (
        <div className="space-y-6">
            {/* 1. بطاقة الأذكار */}
            <AzkarCard darkMode={darkMode} />

            {/* 2. آخر خمس حركات */}
            {lastFiveTransactions.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">آخر 5 حركات</h3>
                    <div className="space-y-2">
                        {lastFiveTransactions.map((transaction) => {
                            const category = categories.find(c => c.id === transaction.categoryId);
                            const transactionDate = new Date(transaction.date);
                            const formattedDate = transactionDate.toLocaleDateString('en-GB', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit' 
                            });
                return (
                                <div key={transaction.id} className="bg-slate-700/40 backdrop-blur-md rounded-lg p-3 flex items-center justify-between border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{category?.icon || '📊'}</span>
                                        <div>
                                            <div className="text-white font-semibold">{transaction.description}</div>
                                            <div className="text-blue-200 text-sm">{formattedDate}</div>
                                        </div>
                                    </div>
                                    <div className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                                </div>
            )}

            {/* 3. ملخص الحسابات والبطاقات */}
            {(bankAccountsCount > 0 || creditCardsSummary.length > 0) && (
                <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6 shadow-xl">
                    {/* ملخص الحسابات البنكية */}
                {bankAccountsCount > 0 && (
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-white mb-3 text-center">ملخص الحسابات البنكية</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/20 backdrop-blur-md rounded-lg p-2 text-center border border-white/30">
                                <div className="text-lg font-bold text-white">{bankAccountsCount}</div>
                                <div className="text-white/80 text-xs">حسابات</div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-lg p-2 text-center border border-white/30">
                                <div className="text-lg font-bold text-white">{formatCurrency(totalBankAccountsBalance)}</div>
                                <div className="text-white/80 text-xs">إجمالي</div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-lg p-2 text-center border border-white/30">
                                <div className="text-lg font-bold text-white">{Object.values(bankAccountDetails).filter(a => a.balance >= 0).length}</div>
                                <div className="text-white/80 text-xs">إيجابية</div>
                            </div>
                        </div>
                    </div>
                )}
                        
                {/* ملخص البطاقات الائتمانية */}
                {creditCardsSummary.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3 text-center">ملخص البطاقات الائتمانية</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {creditCardsSummary.map((card) => (
                                <div key={card.id} className={`bg-gradient-to-br ${card.color} rounded-lg p-3 shadow-lg text-white backdrop-blur-sm`}>
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-2xl font-bold mb-1">{card.logo}</div>
                                            <h3 className="text-sm font-bold line-clamp-1">{card.name}</h3>
                                            <p className="text-white/80 text-xs">{card.type}</p>
                                        </div>
                                        <p className="text-white/70 text-xs">**** {card.id.slice(-4)}</p>
                                    </div>
                            
                                    {/* المحتوى */}
                                    <div className="space-y-2">
                                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-2">
                                            <div className="text-white/80 text-xs mb-1">المستخدم</div>
                                            <div className="text-white font-bold text-sm">{formatCurrency(card.currentBalance)}</div>
                                            <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                                                <div 
                                                    className="bg-white h-1 rounded-full transition-all duration-300"
                                                    style={{ width: `${Math.min(card.usagePercentage || 0, 100)}%` }}
                                                ></div>
                            </div>
                    </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-white/10 backdrop-blur-md rounded p-1.5 text-xs">
                                                <div className="text-white/80 text-xs">الحد</div>
                                                <div className="text-white font-bold">{formatCurrency(card.limit)}</div>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-md rounded p-1.5 text-xs">
                                                <div className="text-white/80 text-xs">المتاح</div>
                                                <div className="text-white font-bold">{formatCurrency(card.availableAmount)}</div>
        </div>
                </div>
                        </div>
                        </div>
                            ))}
                        </div>
                    </div>
                )}
                </div>
            )}

            {/* 4. ملخص الفئات */}
            {pieChartData.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4 text-center">توزيع المصاريف حسب الفئات</h3>
                    
                    {/* بطاقة تنبيهات الميزانية */}
                    {budgetAlerts.length > 0 && (
                        <div className="mb-4 bg-yellow-400/10 border border-yellow-300/30 rounded-xl p-3">
                            <h4 className="text-yellow-300 font-bold mb-2 text-center">تنبيهات الميزانية</h4>
                            <div className="space-y-2">
                                {budgetAlerts.map(a => (
                                    <div key={a.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{a.icon}</span>
                                            <span className="text-white text-sm font-semibold">{a.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${a.pct >= 100 ? 'text-red-400' : 'text-yellow-300'}`}>{a.pct.toFixed(0)}%</div>
                                            <div className="text-blue-200 text-xs">{formatCurrency(a.spent)} / {formatCurrency(a.budget)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* قائمة الفئات بدون رسم بياني */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pieChartData.map((item) => (
                            <div 
                                key={item.id} 
                                className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-md rounded-lg cursor-pointer hover:bg-white/20 transition-colors border border-white/10"
                                onClick={() => onNavigateToTransactions?.(item.id)}
                            >
                                <span className="text-3xl">{item.icon}</span>
                                <div className="flex-1">
                                    <div className="text-white font-semibold">{item.name}</div>
                                    <div className="text-blue-200 text-sm">{(item.percentage || 0).toFixed(1)}% من إجمالي المصاريف</div>
                                </div>
                                <div className="text-white font-bold text-lg">
                                    {item.value.toLocaleString()} ر.س
                                </div>
                            </div>
                        ))}
            </div>
                </div>
            )}
        </div>
    );
};

export default DashboardTab;