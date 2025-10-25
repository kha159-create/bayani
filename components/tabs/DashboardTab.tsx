import React, { useMemo } from 'react';
import { FinancialCalculations, Category, CardDetails, BankAccountDetails, AppState, CardConfig } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';
import AzkarCard from '../common/AzkarCard';

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

    return (
        <div className="space-y-6">
            {/* بطاقة الرصيد الحالي الكبيرة */}
            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-8 shadow-2xl">
                <div className="text-center text-white">
                    <h2 className="text-2xl font-bold mb-2">الرصيد الحالي</h2>
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
            </div>

            {/* بطاقة الأذكار */}
            <AzkarCard darkMode={darkMode} />

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