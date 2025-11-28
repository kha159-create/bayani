import React, { useState, useMemo } from 'react';
import { Transaction, Category, AppState, CardConfig, BankAccountConfig } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';
import { TrashIcon } from '../common/Icons';

interface TransactionsTabProps {
    transactions: Transaction[];
    allTransactions: Transaction[];
    categories: Category[];
    deleteTransaction: (id: string) => void;
    editTransaction: (id: string) => void;
    state: AppState;
    darkMode?: boolean;
    language?: 'ar' | 'en';
    initialCategoryFilter?: string;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ 
    transactions, 
    allTransactions,
    categories, 
    deleteTransaction,
    editTransaction,
    state, 
    darkMode = false, 
    language = 'ar',
    initialCategoryFilter
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMethod, setFilterMethod] = useState('');
    const [filterCategory, setFilterCategory] = useState(initialCategoryFilter || '');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const getPaymentMethodName = (key: string): string => {
        const standardMethods: { [key: string]: string } = {
            'cash': '💵 نقدي',
            'tabby-bnpl': '📱 تابي (BNPL)', 
            'tamara-bnpl': '📱 تمارا (BNPL)'
        };
        if (standardMethods[key]) return standardMethods[key];
        if (state.cards[key]) return `💳 ${state.cards[key].name}`;
        if (state.bankAccounts[key]) return `🏦 ${state.bankAccounts[key].name}`;
        return key;
    };
    
    const getTransactionTypeName = (key: string): string => {
        const standardTypes: { [key: string]: string } = {
            'income': '💰 دخل', 
            'expense': '💸 مصاريف',
            'bnpl-payment': '📱 سداد قسط', 
            'investment-deposit': '💹 إيداع استثماري',
            'investment-withdrawal': '💹 سحب استثماري'
        };
        if (standardTypes[key]) return standardTypes[key];
        if (key.endsWith('-payment')) {
            const cardId = key.replace('-payment', '');
            if (state.cards[cardId]) return `💳 سداد ${state.cards[cardId].name}`;
        }
        return key;
    };

    const filteredTransactions = useMemo(() => {
        // Start with filtered transactions (already filtered by month from App.tsx)
        let filteredData = transactions;

        // Apply date range filter if specified
        if (dateFrom && dateTo) {
            const startDate = new Date(dateFrom);
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            filteredData = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= startDate && transactionDate <= endDate;
            });
        }

        // Apply other filters (search, method, category)
        filteredData = filteredData.filter(t => {
            const term = searchTerm.toLowerCase();
            const category = categories.find(c => c.id === t.categoryId);
            const searchMatch = t.description.toLowerCase().includes(term) || category?.name.toLowerCase().includes(term);
            const methodMatch = !filterMethod || t.paymentMethod === filterMethod;
            const categoryMatch = !filterCategory || t.categoryId === filterCategory;
            return searchMatch && methodMatch && categoryMatch;
        });

        // Sort ALL transactions by date first, then by entry time (ID timestamp)
        return filteredData.sort((a, b) => {
            // First sort by transaction date (newest date first)
            const aDate = new Date(a.date);
            const bDate = new Date(b.date);
            const dateComparison = bDate.getTime() - aDate.getTime();
            
            // If dates are the same, sort by entry time (ID contains timestamp) - newest first
            if (dateComparison === 0) {
                const aTime = parseInt(a.id.replace('trans-', '').split('-')[0]);
                const bTime = parseInt(b.id.replace('trans-', '').split('-')[0]);
                return bTime - aTime;
            }
            
            return dateComparison;
        });
    }, [transactions, searchTerm, filterMethod, filterCategory, dateFrom, dateTo, categories]);

    const totals = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            const isPositive = t.type === 'income' || t.type.toString().includes('payment') || t.type === 'investment-withdrawal';
            if (isPositive) {
                acc.positive += t.amount;
            } else {
                acc.negative += t.amount;
            }
            return acc;
        }, { positive: 0, negative: 0 });
    }, [filteredTransactions]);


    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6">📋 سجل المعاملات</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end p-4 bg-slate-700/30 rounded-xl mb-6">
                    <div>
                        <label htmlFor="dateFrom" className="block text-sm font-medium text-blue-200 mb-1">من تاريخ</label>
                        <input 
                            type="date" 
                            id="dateFrom" 
                            value={dateFrom} 
                            onChange={e => setDateFrom(e.target.value)} 
                            className="w-full p-2 bg-slate-600/50 border border-blue-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="dateTo" className="block text-sm font-medium text-blue-200 mb-1">إلى تاريخ</label>
                        <input 
                            type="date" 
                            id="dateTo" 
                            value={dateTo} 
                            onChange={e => setDateTo(e.target.value)} 
                            className="w-full p-2 bg-slate-600/50 border border-blue-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="filterMethod" className="block text-sm font-medium text-blue-200 mb-1">وسيلة الدفع</label>
                        <select 
                            id="filterMethod" 
                            value={filterMethod} 
                            onChange={e => setFilterMethod(e.target.value)} 
                            className="w-full p-2 bg-slate-600/50 border border-blue-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                           <option value="">كل الوسائل</option>
                            {Object.values(state.bankAccounts).map((account: BankAccountConfig) => <option key={account.id} value={account.id}>🏦 {account.name}</option>)}
                            <option value="cash">💵 نقدي</option>
                            {Object.values(state.cards).map((card: CardConfig) => <option key={card.id} value={card.id}>💳 {card.name}</option>)}
                            <option value="tabby-bnpl">📱 تابي</option>
                            <option value="tamara-bnpl">📱 تمارا</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filterCategory" className="block text-sm font-medium text-blue-200 mb-1">الفئة</label>
                         <select 
                            id="filterCategory" 
                            value={filterCategory} 
                            onChange={e => setFilterCategory(e.target.value)} 
                            className="w-full p-2 bg-slate-600/50 border border-blue-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">كل الفئات</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                    </div>
                     <div className="sm:col-span-2 lg:col-span-3">
                        <label htmlFor="searchTerm" className="block text-sm font-medium text-blue-200 mb-1">بحث بالوصف</label>
                        <input 
                            type="text" 
                            id="searchTerm" 
                            placeholder="🔍..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full p-2 bg-slate-600/50 border border-blue-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-200"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl p-4 border border-emerald-400/30">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-lg text-emerald-400">إجمالي الإيجابي</h3>
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <span className="text-emerald-400 text-xl">💰</span>
                            </div>
                        </div>
                        <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30">
                            <p className="font-bold text-sm text-emerald-400">{formatCurrency(totals.positive)}</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl p-4 border border-red-400/30">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-lg text-red-400">إجمالي السلبي</h3>
                            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                <span className="text-red-400 text-xl">💸</span>
                            </div>
                        </div>
                        <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                            <p className="font-bold text-sm text-red-400">{formatCurrency(totals.negative)}</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl p-4 border border-cyan-400/30">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-lg text-cyan-400">الصافي</h3>
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                <span className="text-cyan-400 text-xl">📊</span>
                            </div>
                        </div>
                        <div className="bg-cyan-500/10 p-3 rounded-lg border border-cyan-500/30">
                            <p className="font-bold text-sm text-cyan-400">{formatCurrency(totals.positive - totals.negative)}</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-blue-400/30">
                            <tr>
                                <th className="text-right py-3 px-4 font-semibold text-blue-200">التاريخ</th>
                                <th className="text-right py-3 px-4 font-semibold text-blue-200">الوسيلة</th>
                                <th className="text-right py-3 px-4 font-semibold text-blue-200">النوع</th>
                                <th className="text-right py-3 px-4 font-semibold text-blue-200">المبلغ</th>
                                <th className="text-right py-3 px-4 font-semibold text-blue-200">الفئة / الوصف</th>
                                <th className="text-center py-3 px-4 font-semibold text-blue-200"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(t => {
                                const category = categories.find(c => c.id === t.categoryId);
                                const isPositive = t.type === 'income' || t.type.toString().includes('payment') || t.type === 'investment-withdrawal';
                                return (
                                <tr key={t.id} className="border-b border-blue-400/20 hover:bg-slate-700/30 transition-colors">
                                    <td className="p-3 text-white">{t.date}</td>
                                    <td className="p-3 text-white">{getPaymentMethodName(t.paymentMethod)}</td>
                                    <td className="p-3 text-white">{getTransactionTypeName(t.type)}</td>
                                    <td className={`p-3 font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isPositive ? '+' : '-'} {formatCurrency(t.amount)}
                                    </td>
                                    <td className="p-3">
                                        <div className="text-white">{category ? `${category.icon} ${category.name}` : 'غير محدد'}</div>
                                        <div className="text-blue-300 text-xs mt-1 break-words">{t.description || '-'}</div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex gap-2 justify-center">
                                            <button 
                                                onClick={() => editTransaction(t.id)} 
                                                className="text-blue-400 hover:text-cyan-400 p-1 transition-colors" 
                                                title="تعديل الحركة"
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                onClick={() => deleteTransaction(t.id)} 
                                                className="text-blue-400 hover:text-red-400 p-1 transition-colors" 
                                                title="حذف الحركة"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                     {filteredTransactions.length === 0 && (
                        <div className="text-center p-8 text-blue-200">
                            <p>لا توجد معاملات تطابق الفلاتر المحددة.</p>
                            <p className="text-xs mt-1">جرب توسيع النطاق الزمني أو تعديل الفلاتر الأخرى.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransactionsTab;