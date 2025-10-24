import React, { useState, useMemo } from 'react';
import { Transaction, Category, AppState } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';

interface TransactionsTabProps {
    transactions: Transaction[];
    categories: Category[];
    state: AppState;
    darkMode?: boolean;
    language?: 'ar' | 'en';
    onEditTransaction?: (transaction: Transaction) => void;
    onDeleteTransaction?: (id: string) => void;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({ 
    transactions, 
    categories, 
    state, 
    darkMode = false, 
    language = 'ar',
    onEditTransaction,
    onDeleteTransaction 
}) => {
    const [filterType, setFilterType] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('all');

    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction => {
            if (filterType !== 'all' && transaction.type !== filterType) return false;
            if (filterCategory !== 'all' && transaction.categoryId !== filterCategory) return false;
            if (filterDate !== 'all') {
                const transactionDate = new Date(transaction.date);
                const now = new Date();
                const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (filterDate === 'today' && daysDiff !== 0) return false;
                if (filterDate === 'week' && daysDiff > 7) return false;
                if (filterDate === 'month' && daysDiff > 30) return false;
            }
            return true;
        });
    }, [transactions, filterType, filterCategory, filterDate]);

    const summary = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = filteredTransactions
            .filter(t => t.type === 'expense' || t.type === 'bnpl-payment')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return {
            income,
            expenses,
            net: income - expenses
        };
    }, [filteredTransactions]);

    const getCategoryIcon = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        return category?.icon || '📊';
    };

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        return category?.name || 'غير محدد';
    };

    const getAmountColor = (type: string) => {
        switch (type) {
            case 'income':
                return 'text-green-400';
            case 'expense':
            case 'bnpl-payment':
                return 'text-red-400';
            default:
                return 'text-blue-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* العنوان */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">الحركات المالية</h2>
                <p className="text-blue-200">عرض وإدارة جميع المعاملات المالية</p>
            </div>

            {/* الفلاتر */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4">فلترة الحركات</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">النوع</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full p-3 bg-slate-700/50 border border-blue-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">جميع الأنواع</option>
                            <option value="income">دخل</option>
                            <option value="expense">مصروف</option>
                            <option value="bnpl-payment">دفع أقساط</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">الفئة</label>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full p-3 bg-slate-700/50 border border-blue-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">جميع الفئات</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.icon} {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">التاريخ</label>
                        <select
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full p-3 bg-slate-700/50 border border-blue-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">جميع التواريخ</option>
                            <option value="today">اليوم</option>
                            <option value="week">هذا الأسبوع</option>
                            <option value="month">هذا الشهر</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* قائمة الحركات */}
            <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className="bg-gradient-to-r from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center text-2xl">
                                {getCategoryIcon(transaction.categoryId)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-white font-semibold">{transaction.description}</h4>
                                        <p className="text-blue-200 text-sm">{getCategoryName(transaction.categoryId)}</p>
                                        <p className="text-blue-300 text-xs">
                                            {new Date(transaction.date).toLocaleDateString('ar-SA')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-lg font-bold ${getAmountColor(transaction.type)}`}>
                                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                        </div>
                                        <div className="text-blue-300 text-xs">
                                            {transaction.type === 'income' ? 'دخل' : 
                                             transaction.type === 'expense' ? 'مصروف' : 'دفع أقساط'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* الخلاصة المالية */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4">الخلاصة المالية</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{formatCurrency(summary.income)}</div>
                        <div className="text-blue-200 text-sm">إجمالي الإيجابي</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{formatCurrency(summary.expenses)}</div>
                        <div className="text-blue-200 text-sm">إجمالي السلبي</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${summary.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(summary.net)}
                        </div>
                        <div className="text-blue-200 text-sm">الصافي</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionsTab;