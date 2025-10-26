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

    // تحديد نوع البطاقة وشعارها
    const getCardTypeAndLogo = (cardName: string) => {
        const name = cardName.toLowerCase();
        if (name.includes('visa') || name.includes('فيزا')) {
            return { type: 'Visa', logo: 'VISA', color: 'from-blue-600 to-blue-800' };
        }
        if (name.includes('mastercard') || name.includes('ماستر')) {
            return { type: 'Mastercard', logo: '●●', color: 'from-red-500 to-orange-500' };
        }
        if (name.includes('amex') || name.includes('أمريكان')) {
            return { type: 'American Express', logo: '●●', color: 'from-green-600 to-blue-600' };
        }
        return { type: 'Credit Card', logo: '●●', color: 'from-gray-600 to-gray-800' };
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
                type: getCardTypeAndLogo(card.name).type,
                logo: getCardTypeAndLogo(card.name).logo,
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {creditCardsSummary.map((card) => {
                                const cardInfo = getCardTypeAndLogo(card.name);
                                const usagePercentage = (card.currentBalance / card.limit) * 100;
                                const available = card.limit - card.currentBalance;
                        
                        return (
                                    <div key={card.id} className={`bg-gradient-to-br ${cardInfo.color} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-white`}>
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold">{cardInfo.logo}</span>
                                                <div>
                                                    <h3 className="text-xl font-bold">{card.name}</h3>
                                                    <p className="text-white/80 text-sm">{cardInfo.type}</p>
                                    </div>
                                            </div>
                                            <span className="text-white/70 text-xs">**** {card.id.slice(-4)}</span>
                                </div>
                                
                                        {/* Card Content */}
                                        <div className="space-y-4">
                                            {/* الرصيد المستخدم */}
                                            <div className="bg-white/10 rounded-xl p-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-white/80 text-sm">الرصيد المستخدم</span>
                                                    <span className="text-white font-bold text-lg">{formatCurrency(card.currentBalance)}</span>
                                                </div>
                                                <div className="w-full bg-white/20 rounded-full h-2">
                                                    <div 
                                                        className="bg-white h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-white/60 text-xs mt-1">{usagePercentage.toFixed(1)}% مستخدم</div>
                                </div>
                                
                                            {/* معلومات إضافية */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-white/10 rounded-lg p-3">
                                                    <div className="text-white/80 text-xs mb-1">الرصيد المتاح</div>
                                                    <div className="text-white font-bold">{formatCurrency(available)}</div>
                                                </div>
                                                <div className="bg-white/10 rounded-lg p-3">
                                                    <div className="text-white/80 text-xs mb-1">الحد الائتماني</div>
                                                    <div className="text-white font-bold">{formatCurrency(card.limit)}</div>
                                                </div>
                                                <div className="bg-white/10 rounded-lg p-3">
                                                    <div className="text-white/80 text-xs mb-1">المتبقي</div>
                                                    <div className="text-white font-bold">{formatCurrency(card.currentBalance)}</div>
                                                </div>
                                                <div className="bg-white/10 rounded-lg p-3">
                                                    <div className="text-white/80 text-xs mb-1">المدفوع</div>
                                                    <div className="text-white font-bold">{formatCurrency(available)}</div>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                    onCategoryClick={onNavigateToTransactions}
                />
            )}
        </div>
    );
};

export default DashboardTab;