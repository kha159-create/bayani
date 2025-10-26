import React, { useMemo } from 'react';
import { FinancialCalculations, Category, CardDetails, BankAccountDetails, AppState, CardConfig } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';
import AzkarCard from '../common/AzkarCard';
import PieChart from '../common/PieChart';

interface DashboardTabProps {
    calculations: FinancialCalculations;
    categories: Category[];
    state: AppState;
    darkMode?: boolean;
    language?: 'ar' | 'en';
    onNavigateToTransactions?: (categoryId?: string) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ calculations, categories, state, darkMode = false, language = 'ar', onNavigateToTransactions }) => {
    const totalBankBalance = calculations.totalBankBalance;
    const totalExpenses = calculations.totalExpenses;
    const totalIncome = calculations.totalIncome;
    const netResult = totalIncome - totalExpenses;

    const topCategories = useMemo(() => {
        return Object.entries(calculations.expensesByCategory)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 4)
            .map(([categoryId, amount]) => {
                const category = categories.find(c => c.id === categoryId);
                return {
                    id: categoryId,
                    name: category?.name || t('other', language),
                    icon: category?.icon || '📊',
                    amount: amount as number
                };
            });
    }, [calculations.expensesByCategory, categories, language]);

    // تحديد نوع البطاقة
    const getCardType = (cardName: string) => {
        const name = cardName.toLowerCase();
        if (name.includes('visa') || name.includes('فيزا')) return 'Visa';
        if (name.includes('mastercard') || name.includes('ماستر')) return 'Mastercard';
        if (name.includes('amex') || name.includes('أمريكان')) return 'American Express';
        return 'Credit Card';
    };

    // تحديد شعار البطاقة
    const getCardLogo = (cardName: string) => {
        const name = cardName.toLowerCase();
        if (name.includes('visa') || name.includes('فيزا')) return '💳';
        if (name.includes('mastercard') || name.includes('ماستر')) return '💳';
        if (name.includes('amex') || name.includes('أمريكان')) return '💳';
        return '💳';
    };

    // حساب ملخص البطاقات الائتمانية
    const creditCardsSummary = useMemo(() => {
        return Object.values(state.cards || {}).map(card => {
            const cardTransactions = state.transactions.filter(t => t.paymentMethod === card.id);
            let currentBalance = 0;
            let usedAmount = 0;
            
            cardTransactions.forEach(t => {
                if (t.type === 'expense') {
                    currentBalance += t.amount;
                    usedAmount += t.amount;
                } else if (t.type === 'income' && t.description?.includes('سداد')) {
                    currentBalance -= t.amount;
                }
            });
            
            const availableAmount = card.limit - currentBalance;
            
            return {
                id: card.id,
                name: card.name,
                type: getCardType(card.name),
                logo: getCardLogo(card.name),
                currentBalance,
                usedAmount,
                availableAmount,
                limit: card.limit
            };
        });
    }, [state.cards, state.transactions]);

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

        return Object.entries(calculations.expensesByCategory)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 8) // أخذ أعلى 8 فئات
            .map(([categoryId, amount], index) => {
                const category = categories.find(c => c.id === categoryId);
                return {
                    id: categoryId,
                    name: category?.name || t('other', language),
                    value: amount as number,
                    color: colors[index % colors.length],
                    icon: category?.icon || '📊'
                };
            });
    }, [calculations.expensesByCategory, categories, language]);

                return (
        <div className="space-y-6">
            {/* بطاقة النظرة العامة */}
            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-8 shadow-2xl">
                <div className="text-center text-white mb-6">
                    <h2 className="text-2xl font-bold mb-2">نظرة عامة</h2>
                    <div className="text-5xl font-bold mb-4">{formatCurrency(totalBankBalance)}</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white/20 rounded-xl p-3">
                            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
                            <div className="text-white/80">إجمالي الدخل</div>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3">
                            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                            <div className="text-white/80">إجمالي المصاريف</div>
                            </div>
                    </div>
                </div>

                {/* ملخص البطاقات الائتمانية */}
                {creditCardsSummary.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-bold text-white mb-4 text-center">ملخص البطاقات الائتمانية</h3>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {creditCardsSummary.map((card) => (
                                <div key={card.id} className="flex-shrink-0 w-64 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{card.logo}</span>
                                            <span className="text-white font-semibold text-sm">{card.type}</span>
                                        </div>
                                        <span className="text-white/70 text-xs">**** 1234</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/80 text-sm">الرصيد الحالي</span>
                                            <span className="text-white font-bold">{formatCurrency(card.currentBalance)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/80 text-sm">الرصيد المستحق</span>
                                            <span className="text-orange-300 font-bold">{formatCurrency(card.usedAmount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/80 text-sm">المتاح</span>
                                            <span className="text-green-300 font-bold">{formatCurrency(card.availableAmount)}</span>
                                        </div>
                        </div>
                        </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* بطاقة الأذكار */}
            <AzkarCard darkMode={darkMode} />

            {/* الرسم البياني الدائري للفئات */}
            {pieChartData.length > 0 && (
                <PieChart 
                    data={pieChartData} 
                    total={totalExpenses} 
                />
            )}

            {/* فئات المصاريف الرئيسية */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {topCategories.map((category, index) => (
                    <div key={category.id} className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => onNavigateToTransactions?.(category.id)}>
                        <div className="text-center text-white">
                            <div className="text-3xl mb-2">{category.icon}</div>
                            <div className="text-sm font-semibold mb-1">{category.name}</div>
                            <div className="text-lg font-bold">{formatCurrency(category.amount)}</div>
                                    </div>
                                </div>
                ))}
                                </div>
                                
            {/* بطاقات إضافية للمعلومات المالية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-lg">
                    <div className="text-center text-white">
                        <div className="text-3xl mb-2">💰</div>
                        <div className="text-sm font-semibold mb-1">إجمالي الدخل</div>
                        <div className="text-2xl font-bold text-green-400">{formatCurrency(totalIncome)}</div>
                                    </div>
                                </div>

                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-lg">
                    <div className="text-center text-white">
                        <div className="text-3xl mb-2">💸</div>
                        <div className="text-sm font-semibold mb-1">إجمالي المصاريف</div>
                        <div className="text-2xl font-bold text-red-400">{formatCurrency(totalExpenses)}</div>
                            </div>
                </div>
            </div>

            {/* بطاقات الرصيد المستحق والمتبقي للبطاقات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-lg">
                    <div className="text-center text-white">
                        <div className="text-3xl mb-2">💳</div>
                        <div className="text-sm font-semibold mb-1">الرصيد المستحق</div>
                        <div className="text-2xl font-bold text-orange-400">{formatCurrency(calculations.totalCardDebt || 0)}</div>
                        <div className="text-xs text-blue-200 mt-1">إجمالي المبالغ المستحقة على البطاقات</div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-lg">
                    <div className="text-center text-white">
                        <div className="text-3xl mb-2">💎</div>
                        <div className="text-sm font-semibold mb-1">الرصيد المتبقي</div>
                        <div className="text-2xl font-bold text-cyan-400">{formatCurrency(calculations.totalCardBalance || 0)}</div>
                        <div className="text-xs text-blue-200 mt-1">إجمالي الرصيد المتبقي في البطاقات</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;