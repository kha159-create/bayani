import React, { useMemo } from 'react';
import { FinancialCalculations, Category, CardDetails, BankAccountDetails, AppState, CardConfig } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';

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
                            <div className="text-2xl font-bold">14%</div>
                            <div className="text-white/80">نمو الادخار</div>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3">
                            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                            <div className="text-white/80">المصاريف الشهرية</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* المحلل الذكي */}
            <div className="bg-gradient-to-r from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                        🤖
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">المحلل الذكي</h3>
                        <p className="text-blue-200 text-sm">
                            لاحظت ارتفاعًا في مصروف الكافيهات بنسبة 10٪ هذا الشهر. 
                            اقترح تقليل عدد مرات الذهاب للكافيه لتوفير المال.
                        </p>
                    </div>
                </div>
            </div>

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-lg">
                    <div className="text-center text-white">
                        <div className="text-3xl mb-2">{netResult >= 0 ? '📈' : '📉'}</div>
                        <div className="text-sm font-semibold mb-1">النتيجة الصافية</div>
                        <div className={`text-2xl font-bold ${netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(netResult)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;