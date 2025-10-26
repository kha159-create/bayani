import React, { useMemo } from 'react';
import { AppState, BankAccountConfig, Transaction, FinancialCalculations, Category } from '../../types';
import { TrashIcon } from '../common/Icons';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';
import { getBankLogo } from '../../services/bankLogoService';

interface BankTabProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    calculations: FinancialCalculations;
    filteredTransactions: Transaction[];
    categories: Category[];
    setModal: (config: any) => void;
    openBankAccountFormModal: (accountId?: string) => void;
    deleteBankAccount: (accountId: string) => void;
    openTransferModal: () => void;
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const BankTab: React.FC<BankTabProps> = ({ 
    state, 
    setState, 
    calculations, 
    filteredTransactions, 
    categories, 
    setModal, 
    openBankAccountFormModal, 
    deleteBankAccount, 
    openTransferModal,
    darkMode = false, 
    language = 'ar' 
}) => {
    const bankAccountDetails = calculations.bankAccountDetails;

    return (
        <div className="space-y-6">
            {/* العنوان */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">الحسابات البنكية</h2>
                <p className="text-blue-200">إدارة حساباتك البنكية</p>
            </div>

            {/* إضافة حساب جديد */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => openBankAccountFormModal()}
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-3 px-6 rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 shadow-lg"
                    >
                        + إضافة حساب جديد
                    </button>
                    {Object.keys(bankAccountDetails).length > 1 && (
                        <button
                            onClick={openTransferModal}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg"
                        >
                            💸 تحويل بين الحسابات
                        </button>
                    )}
                </div>
            </div>

            {/* قائمة الحسابات البنكية */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(bankAccountDetails).map((account, index) => (
                    <div key={account.id} className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{account.logo || getBankLogo(account.bankName || '')}</span>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{account.name}</h3>
                                        {account.bankName && (
                                            <p className="text-blue-200 text-sm">{account.bankName}</p>
                                        )}
                                        <p className="text-blue-200 text-xs">{account.accountType === 'current' ? 'حساب جاري' : account.accountType === 'savings' ? 'حساب توفير' : account.accountType === 'investment' ? 'حساب استثماري' : 'حساب تجاري'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openBankAccountFormModal(account.id)}
                                    className="bg-blue-500/20 text-blue-300 p-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => deleteBankAccount(account.id)}
                                    className="bg-red-500/20 text-red-300 p-2 rounded-lg hover:bg-red-500/30 transition-colors"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* الرصيد الحالي */}
                            <div className="bg-slate-700/30 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-200 text-sm">الرصيد الحالي</span>
                                    <span className={`font-bold text-2xl ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(account.balance)}
                                    </span>
            </div>
        </div>

                            {/* نوع الحساب */}
                            <div className="bg-slate-700/30 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-200 text-sm">نوع الحساب</span>
                                    <span className="text-white font-semibold">{account.type}</span>
        </div>
            </div>

                            {/* البنك */}
                            <div className="bg-slate-700/30 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-200 text-sm">البنك</span>
                                    <span className="text-white font-semibold">{account.bankName}</span>
            </div>
        </div>
    </div>

                        {/* ملخص الحساب */}
                        <div className="mt-4 pt-4 border-t border-blue-400/20">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-blue-200 text-xs">الرصيد</p>
                                    <p className={`font-bold ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(account.balance)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-blue-200 text-xs">الحالة</p>
                                    <p className={`font-bold ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {account.balance >= 0 ? 'إيجابي' : 'سلبي'}
                                    </p>
                                </div>
                            </div>
                </div>
            </div>
               ))}
            </div>

            {/* رسالة عدم وجود حسابات */}
            {Object.values(bankAccountDetails).length === 0 && (
                <div className="text-center py-8">
                    <div className="text-6xl mb-4">🏦</div>
                    <h3 className="text-xl font-bold text-white mb-2">لا توجد حسابات بنكية</h3>
                    <p className="text-blue-200">أضف حسابك البنكي الأول للبدء</p>
                </div>
            )}

            {/* ملخص الحسابات */}
            {Object.values(bankAccountDetails).length > 0 && (
                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">ملخص الحسابات البنكية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">
                                {formatCurrency(Object.values(bankAccountDetails).reduce((sum, account) => sum + account.balance, 0))}
                            </p>
                            <p className="text-blue-200 text-sm">إجمالي الرصيد</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-400">
                                {Object.values(bankAccountDetails).length}
                            </p>
                            <p className="text-blue-200 text-sm">عدد الحسابات</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-cyan-400">
                                {Object.values(bankAccountDetails).filter(account => account.balance >= 0).length}
                            </p>
                            <p className="text-blue-200 text-sm">حسابات إيجابية</p>
                        </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default BankTab;