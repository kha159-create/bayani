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

    // حساب ملخص البطاقات الائتمانية - نفس منطق صفحة إدارة البطاقات
    const creditCardsSummary = useMemo(() => {
        return Object.values(state.cards || {}).map(card => {
            // استخدام نفس منطق الحساب من calculations.cardDetails
            const cardTransactions = state.transactions.filter(t => t.paymentMethod === card.id);
            let balance = 0;
            
            // حساب الرصيد المستخدم من جميع المعاملات
            cardTransactions.forEach(t => {
                if (t.type === 'expense' || t.type === 'bnpl-payment') {
                    balance += t.amount;
                } else if (t.type === 'income' && t.description?.includes('سداد')) {
                    balance -= t.amount;
                } else if (t.type.endsWith('-payment') && t.type === `${card.id}-payment`) {
                    balance -= t.amount;
                }
            });
            
            const available = card.limit - balance;
            const usagePercentage = (balance / card.limit) * 100;
            
            return {
                id: card.id,
                name: card.name,
                type: getCardTypeAndLogo(card.name).type,
                logo: getCardTypeAndLogo(card.name).logo,
                currentBalance: balance,
                usedAmount: balance,
                availableAmount: available,
                limit: card.limit,
                usagePercentage: usagePercentage
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
            <div className="bg-gradient-to-br from-cyan-400/90 to-blue-500/90 backdrop-blur-xl border border-cyan-300/30 rounded-3xl p-8 shadow-2xl">
                <div className="text-center text-white mb-6">
                    <h2 className="text-2xl font-bold mb-2">نظرة عامة</h2>
                    <div className="text-5xl font-bold mb-4">{formatCurrency(totalBankBalance)}</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30">
                            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
                            <div className="text-white/80">إجمالي الدخل</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30">
                            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                            <div className="text-white/80">إجمالي المصاريف</div>
                        </div>
                    </div>
                </div>
                        
                {/* ملخص البطاقات الائتمانية */}
                {creditCardsSummary.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-bold text-white mb-4 text-center">ملخص البطاقات الائتمانية</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {creditCardsSummary.map((card) => {
                                const cardInfo = getCardTypeAndLogo(card.name);
                        
                                return (
                                    <div key={card.id} className={`bg-gradient-to-br ${cardInfo.color} rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 text-white backdrop-blur-sm`}>
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="text-left">
                                                <div className="text-4xl font-bold mb-2">{cardInfo.logo}</div>
                                                <h3 className="text-lg font-bold">{card.name}</h3>
                                                <p className="text-white/80 text-sm">{cardInfo.type}</p>
                                                <p className="text-white/70 text-xs mt-1">**** {card.id.slice(-4)}</p>
                                            </div>
                                        </div>
                                
                                        {/* Card Content - Layout عمودي */}
                                        <div className="space-y-3">
                                            {/* الرصيد المستخدم - كبير وواضح */}
                                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                                                <div className="text-white/80 text-xs mb-1">الرصيد المستخدم</div>
                                                <div className="text-white font-bold text-2xl mb-2">{formatCurrency(card.currentBalance)}</div>
                                                <div className="w-full bg-white/20 rounded-full h-2">
                                                    <div 
                                                        className="bg-white h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(card.usagePercentage || 0, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-white/60 text-xs mt-1">{(card.usagePercentage || 0).toFixed(1)}% مستخدم</div>
                                            </div>
                                
                                            {/* معلومات إضافية - Grid */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3">
                                                    <div className="text-white/80 text-xs mb-1">الرصيد المتاح</div>
                                                    <div className="text-white font-bold text-sm">{formatCurrency(card.availableAmount)}</div>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3">
                                                    <div className="text-white/80 text-xs mb-1">الحد الائتماني</div>
                                                    <div className="text-white font-bold text-sm">{formatCurrency(card.limit)}</div>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3">
                                                    <div className="text-white/80 text-xs mb-1">المتبقي</div>
                                                    <div className="text-white font-bold text-sm">{formatCurrency(card.currentBalance)}</div>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3">
                                                    <div className="text-white/80 text-xs mb-1">المدفوع</div>
                                                    <div className="text-white font-bold text-sm">{formatCurrency(card.availableAmount)}</div>
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
                <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6 text-center">توزيع المصاريف حسب الفئات</h3>
                    
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        {/* الرسم البياني الدائري - أكبر حجماً */}
                        <div className="flex-shrink-0">
                            <svg width="300" height="300" viewBox="0 0 200 200" className="transform -rotate-90">
                                {pieChartData.map((item, index) => {
                                    let cumulativePercentage = 0;
                                    for (let i = 0; i < index; i++) {
                                        cumulativePercentage += pieChartData[i].percentage;
                                    }
                                    
                                    const radius = 80;
                                    const centerX = 100;
                                    const centerY = 100;
                                    
                                    const startAngle = (cumulativePercentage * 360) / 100;
                                    const endAngle = ((cumulativePercentage + item.percentage) * 360) / 100;
                                    
                                    const startAngleRad = (startAngle * Math.PI) / 180;
                                    const endAngleRad = (endAngle * Math.PI) / 180;
                                    
                                    const x1 = centerX + radius * Math.cos(startAngleRad);
                                    const y1 = centerY + radius * Math.sin(startAngleRad);
                                    const x2 = centerX + radius * Math.cos(endAngleRad);
                                    const y2 = centerY + radius * Math.sin(endAngleRad);
                                    
                                    const largeArcFlag = item.percentage > 50 ? 1 : 0;
                                    
                                    const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                        
                        return (
                                        <path
                                            key={item.id}
                                            d={pathData}
                                            fill={item.color}
                                            stroke="rgba(255, 255, 255, 0.1)"
                                            strokeWidth="1"
                                            className="hover:opacity-80 transition-opacity duration-300"
                                        />
                                    );
                                })}
                            </svg>
                                </div>
                                
                        {/* مفتاح الألوان - متناسق حول الرسم البياني */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {pieChartData.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={() => onNavigateToTransactions?.(item.id)}
                                >
                                    <div 
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-2xl">{item.icon}</span>
                                    <div className="flex-1">
                                        <div className="text-white font-semibold">{item.name}</div>
                                        <div className="text-blue-200 text-sm">{(item.percentage || 0).toFixed(1)}%</div>
                                    </div>
                                    <div className="text-white font-bold">
                                        {item.value.toLocaleString()} ريال
                </div>
            </div>
                            ))}
                </div>
            </div>
                </div>
            )}
        </div>
    );
};

export default DashboardTab;