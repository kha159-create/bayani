import React, { useEffect, useRef, useMemo } from 'react';
import { FinancialCalculations, Category, Transaction } from '../../types';
import type { Chart } from 'chart.js';
import { t } from '../../translations';

interface AnalysisTabProps {
    calculations: FinancialCalculations;
    categories: Category[];
    allTransactions: Transaction[];
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ calculations, categories, allTransactions, darkMode = false, language = 'ar' }) => {
    const pieChartRef = useRef<HTMLCanvasElement>(null);
    const barChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<{ pie?: Chart, bar?: Chart }>({});

    const categoryExpenseData = useMemo(() => {
        return Object.entries(calculations.expensesByCategory)
        .map(([categoryId, amount]) => {
            const category = categories.find(c => c.id === categoryId);
            return {
                name: category ? `${category.icon} ${category.name}` : 'غير محدد',
                value: amount as number,
            };
        })
        .sort((a, b) => b.value - a.value);
    }, [calculations.expensesByCategory, categories]);

    const monthlyData = useMemo(() => {
        const result: { [key: string]: { income: number; expenses: number } } = {};
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthString = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            result[monthString] = { income: 0, expenses: 0 };
        }
        
        allTransactions.forEach(t => {
            const date = new Date(t.date);
            const monthString = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            if (result[monthString]) {
                 if (t.type === 'income') result[monthString].income += t.amount;
                 if (t.type === 'expense' || t.type === 'bnpl-payment') result[monthString].expenses += t.amount;
            }
        });

        return {
            labels: Object.keys(result),
            income: Object.values(result).map(d => d.income),
            expenses: Object.values(result).map(d => d.expenses)
        };
    }, [allTransactions]);

    useEffect(() => {
        const initCharts = async () => {
            const { Chart, registerables } = await import('chart.js');
            Chart.register(...registerables);

            // تدمير الرسوم البيانية الموجودة
            if (chartInstances.current.pie) {
                chartInstances.current.pie.destroy();
            }
            if (chartInstances.current.bar) {
                chartInstances.current.bar.destroy();
            }

            // الرسم الدائري لتوزيع المصاريف
            if (pieChartRef.current) {
                const ctx = pieChartRef.current.getContext('2d');
                if (ctx) {
                    chartInstances.current.pie = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: categoryExpenseData.map(d => d.name),
                            datasets: [{
                                data: categoryExpenseData.map(d => d.value),
                                backgroundColor: [
                                    '#00B2FF',
                                    '#A0D2EB',
                                    '#3B82F6',
                                    '#1E40AF',
                                    '#1E3A8A',
                                    '#1D4ED8',
                                    '#2563EB',
                                    '#3B82F6'
                                ],
                                borderWidth: 0,
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        color: '#FFFFFF',
                                        font: {
                                            size: 12
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }

            // الرسم البياني العمودي للدخل والمصاريف
            if (barChartRef.current) {
                const ctx = barChartRef.current.getContext('2d');
                if (ctx) {
                    chartInstances.current.bar = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: monthlyData.labels,
                            datasets: [
                                {
                                    label: 'الدخل',
                                    data: monthlyData.income,
                                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                                    borderColor: '#10B981',
                                    borderWidth: 2,
                                },
                                {
                                    label: 'المصاريف',
                                    data: monthlyData.expenses,
                                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                    borderColor: '#EF4444',
                                    borderWidth: 2,
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    labels: {
                                        color: '#FFFFFF',
                                        font: {
                                            size: 12
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    ticks: {
                                        color: '#FFFFFF'
                                    },
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.1)'
                                    }
                                },
                                y: {
                                    ticks: {
                                        color: '#FFFFFF'
                                    },
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.1)'
                                    }
                                }
                            }
                        }
                    });
                }
            }
        };

        initCharts();
    }, [categoryExpenseData, monthlyData]);

    return (
        <div className="space-y-6">
            {/* العنوان */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">تحليل بياني الذكي</h2>
                <p className="text-blue-200">تحليل شامل لإنفاقك المالي</p>
            </div>

            {/* الرسم الدائري لتوزيع المصاريف */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">توزيع المصاريف حسب الفئات</h3>
                <div className="h-80">
                    <canvas ref={pieChartRef}></canvas>
                </div>
            </div>

            {/* الرسم البياني العمودي */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">مقارنة الدخل والمصاريف (6 أشهر)</h3>
                <div className="h-80">
                    <canvas ref={barChartRef}></canvas>
                </div>
            </div>

            {/* ملاحظات الذكاء المالي */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">ملاحظات الذكاء المالي</h3>
                <div className="space-y-4">
                    <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-400/30">
                        <p className="text-blue-200">
                            <span className="font-semibold">الأسبوع الماضي:</span> وفّرت 8٪ أكثر من المعتاد. استمر في هذا النمط الإيجابي!
                        </p>
                    </div>
                    <div className="bg-green-500/20 rounded-xl p-4 border border-green-400/30">
                        <p className="text-green-200">
                            <span className="font-semibold">المواصلات:</span> إنفاقك على المواصلات أقل من المتوسط الوطني بنسبة 15٪.
                        </p>
                    </div>
                    <div className="bg-yellow-500/20 rounded-xl p-4 border border-yellow-400/30">
                        <p className="text-yellow-200">
                            <span className="font-semibold">التسوق:</span> لاحظنا زيادة في مصروفات التسوق بنسبة 12٪. راجع قائمة المشتريات.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisTab;