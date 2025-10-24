import React, { useState, useMemo } from 'react';
import { Transaction, Category, CardConfig } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';

interface CardReportsTabProps {
    allTransactions: Transaction[];
    categories: Category[];
    cards: { [key: string]: CardConfig };
    darkMode?: boolean;
    language?: 'ar' | 'en';
}


const CardReportsTab: React.FC<CardReportsTabProps> = ({ allTransactions, categories, cards, darkMode = false, language = 'ar' }) => {
    const [filters, setFilters] = useState({
        card: 'all',
        dateFrom: '',
        dateTo: ''
    });

    const getPaymentMethodName = (key: string): string => {
        if (cards[key]) return `💳 ${cards[key].name}`;
        const standardMethods: { [key: string]: string } = { 'mada-bank': '🏦 بنك', 'cash': '💵 نقدي', 'tabby-bnpl': '📱 تابي', 'tamara-bnpl': '📱 تمارا', 'reconciliation': '🔄 تسوية' };
        return standardMethods[key] || 'N/A';
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const filteredTransactions = useMemo(() => {
        if (!filters.dateFrom || !filters.dateTo) {
            return [];
        }
        const startDate = new Date(filters.dateFrom);
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999); // Ensure end date is inclusive

        return allTransactions.filter(t => {
            const transactionDate = new Date(t.date);
            const isCardTransaction = t.paymentMethod.includes('-card') || (t.type === 'bnpl-payment' && t.paymentMethod in cards);
            const matchesCard = (filters.card === 'all') || (t.paymentMethod === filters.card);
            const matchesDate = transactionDate >= startDate && transactionDate <= endDate;
            return isCardTransaction && matchesCard && matchesDate;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allTransactions, filters, cards]);

    const totalFilteredAmount = useMemo(() => {
        return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    }, [filteredTransactions]);

    return (
        <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-xl font-bold mb-4 text-slate-900">📝 تقارير البطاقات المخصصة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4 bg-slate-100 rounded-lg mb-6">
                <div>
                    <label htmlFor="card" className="block text-sm font-medium text-slate-600 mb-1">اختر البطاقة</label>
                    <select id="card" value={filters.card} onChange={handleFilterChange} className="w-full p-2">
                        <option value="all">جميع البطاقات</option>
                        {/* FIX: Cast `card` to CardConfig to resolve property access errors. */}
                        {Object.values(cards).map((card: CardConfig) => (
                            <option key={card.id} value={card.id}>💳 {card.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="dateFrom" className="block text-sm font-medium text-slate-600 mb-1">من تاريخ</label>
                    <input type="date" id="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="w-full p-2" />
                </div>
                <div>
                    <label htmlFor="dateTo" className="block text-sm font-medium text-slate-600 mb-1">إلى تاريخ</label>
                    <input type="date" id="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="w-full p-2" />
                </div>
            </div>

            <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg mb-4">
                <span className="font-semibold text-slate-700">إجمالي المصاريف المفلترة:</span>
                <span className="font-bold text-xl text-red-500 number-display">{formatCurrency(totalFilteredAmount)} ريال</span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-gray-200">
                        <tr>
                            <th className="text-right py-3 px-4 font-semibold">تاريخ العملية</th>
                            <th className="text-right py-3 px-4 font-semibold">تاريخ القيد</th>
                            <th className="text-right py-3 px-4 font-semibold">البطاقة</th>
                            <th className="text-right py-3 px-4 font-semibold">المبلغ</th>
                            <th className="text-right py-3 px-4 font-semibold">الفئة</th>
                            <th className="text-right py-3 px-4 font-semibold">الوصف</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.length === 0 ? (
                            <tr><td colSpan={6} className="text-center p-8 text-slate-500">الرجاء تحديد نطاق زمني لعرض النتائج.</td></tr>
                        ) : (
                            filteredTransactions.map(t => {
                                const category = categories.find(c => c.id === t.categoryId);
                                return (
                                    <tr key={t.id} className="border-b border-gray-200/50 hover:bg-gray-50">
                                        <td className="p-3">{t.date}</td>
                                        <td className="p-3">{t.postingDate || '-'}</td>
                                        <td className="p-3">{getPaymentMethodName(t.paymentMethod)}</td>
                                        <td className="p-3 font-semibold text-red-500 number-display">{formatCurrency(t.amount)}</td>
                                        <td className="p-3">{category ? `${category.icon} ${category.name}` : '-'}</td>
                                        <td className="p-3 text-slate-500">{t.description}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CardReportsTab;