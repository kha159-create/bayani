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
                <div className="flex justify-center gap-4">
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
                    <div key={account.id} className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                        {/* Header - أزرار التعديل والحذف */}
                        <div className="flex justify-between items-start mb-6">
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
                            <div className="text-right">
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
                        </div>

                        {/* المحتوى الرئيسي */}
                        <div className="space-y-4">
                            {/* الرصيد الحالي */}
                            <div className="bg-slate-700/40 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
                                <div className="text-blue-200 text-sm mb-1">الرصيد الحالي</div>
                                <div className={`text-2xl font-bold ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(account.balance)}
                                </div>
                            </div>

                            {/* نوع الحساب */}
                            <div className="bg-slate-700/40 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
                                <div className="text-blue-200 text-sm mb-1">نوع الحساب</div>
                                <div className="text-white font-bold">
                                    {account.accountType === 'current' ? 'حساب جاري' : 
                                     account.accountType === 'savings' ? 'حساب توفير' : 
                                     account.accountType === 'investment' ? 'حساب استثماري' : 'حساب تجاري'}
                                </div>
                            </div>

                            {/* البنك */}
                            <div className="bg-slate-700/40 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
                                <div className="text-blue-200 text-sm mb-1">البنك</div>
                                <div className="text-white font-bold">{account.bankName || 'غير محدد'}</div>
                            </div>
                        </div>

                        {/* التذييل */}
                        <div className="mt-4 pt-4 border-t border-blue-400/20">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-blue-200 text-xs">الحالة</div>
                                    <div className={`text-sm font-bold ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {account.balance >= 0 ? 'إيجابي' : 'سلبي'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-blue-200 text-xs">الرصيد</div>
                                    <div className={`text-sm font-bold ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(account.balance)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
               ))}
            </div>

            {/* بطاقة ملخص الحسابات البنكية - بطاقة واحدة احترافية */}
            <div className="bg-gradient-to-br from-[#0b2036]/80 to-[#0a3154]/80 backdrop-blur-2xl border border-blue-400/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">ملخص الحسابات البنكية</h3>
                    <div className="text-xs text-blue-200">الفترة الحالية</div>
                </div>

                {/* الإجمالي */}
                <div className="text-center mb-4">
                    <div className="text-blue-200 text-sm mb-1">إجمالي الرصيد</div>
                    <div className="text-3xl md:text-4xl font-extrabold text-white tracking-wide">
                        {formatCurrency(Object.values(bankAccountDetails).reduce((sum, a) => sum + (a.balance || 0), 0))}
                    </div>
                </div>

                {/* الإيداعات والسحوبات */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-right">
                        <div className="text-emerald-300 text-xs mb-1">الإيداعات</div>
                        <div className="text-emerald-400 text-lg font-bold">
                            {formatCurrency(Object.values(bankAccountDetails).reduce((sum, a) => sum + (a.deposits || 0), 0))}
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-left">
                        <div className="text-red-300 text-xs mb-1">السحوبات</div>
                        <div className="text-red-400 text-lg font-bold">
                            {formatCurrency(Object.values(bankAccountDetails).reduce((sum, a) => sum + (a.withdrawals || 0), 0))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BankTab;