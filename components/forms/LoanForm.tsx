import React, { useState, useEffect } from 'react';
import { Loan, LoanType, BankAccountConfig } from '../../types';
import { t } from '../../translations';
import { XMarkIcon } from '../common/Icons';

interface LoanFormProps {
    onClose: () => void;
    onSave: (loan: Loan) => void;
    initialData?: Loan | null;
    bankAccounts: { [key: string]: BankAccountConfig };
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const LoanForm: React.FC<LoanFormProps> = ({ onClose, onSave, initialData, bankAccounts, darkMode = false, language = 'ar' }) => {
    const [loan, setLoan] = useState<Omit<Loan, 'id' | 'createdAt'>>({
        type: 'car',
        name: '',
        totalAmount: 0,
        downPayment: 0,
        finalPayment: 0,
        monthlyPayment: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        remainingMonths: 0,
        totalMonths: 0,
        lender: '',
        status: 'active',
        linkedAccount: '',
        prepaidAmount: 0,
        prepaidInstallments: 0
    });

    const [errors, setErrors] = useState<{[key: string]: string}>({});

    useEffect(() => {
        if (initialData) {
            setLoan(initialData);
        }
    }, [initialData]);

    // حساب المدة الإجمالية والمتبقية
    useEffect(() => {
        if (loan.totalAmount > 0 && loan.downPayment >= 0 && loan.finalPayment >= 0 && loan.monthlyPayment > 0) {
            const remainingAmount = loan.totalAmount - loan.downPayment - loan.finalPayment - (loan.prepaidAmount || 0);
            if (remainingAmount > 0) {
                const totalMonths = Math.ceil(remainingAmount / loan.monthlyPayment);
                const startDate = new Date(loan.startDate);
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + totalMonths);
                
                setLoan(prev => ({
                    ...prev,
                    totalMonths,
                    endDate: endDate.toISOString().split('T')[0],
                    remainingMonths: totalMonths
                }));
            }
        }
    }, [loan.totalAmount, loan.downPayment, loan.finalPayment, loan.monthlyPayment, loan.startDate, loan.prepaidAmount]);

    // حساب الأقساط المدفوعة مسبقاً
    useEffect(() => {
        if (loan.prepaidAmount && loan.monthlyPayment > 0) {
            const prepaidInstallments = Math.floor(loan.prepaidAmount / loan.monthlyPayment);
            setLoan(prev => ({
                ...prev,
                prepaidInstallments
            }));
        } else {
            setLoan(prev => ({
                ...prev,
                prepaidInstallments: 0
            }));
        }
    }, [loan.prepaidAmount, loan.monthlyPayment]);

    const loanTypes: { value: LoanType; label: string; icon: string }[] = [
        { value: 'car', label: 'سيارة', icon: '🚗' },
        { value: 'house', label: 'بيت', icon: '🏠' },
        { value: 'personal', label: 'شخصي', icon: '👤' },
        { value: 'business', label: 'تجاري', icon: '💼' },
        { value: 'education', label: 'تعليمي', icon: '🎓' }
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLoan(prev => ({
            ...prev,
            [name]: name.includes('Amount') || name.includes('Payment') || name.includes('Months') 
                ? parseFloat(value) || 0 
                : value
        }));
        
        // مسح الخطأ عند التعديل
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};

        if (!loan.name.trim()) {
            newErrors.name = 'اسم القرض مطلوب';
        }

        if (loan.totalAmount <= 0) {
            newErrors.totalAmount = 'المبلغ الإجمالي يجب أن يكون أكبر من صفر';
        }

        if (loan.downPayment < 0) {
            newErrors.downPayment = 'الدفعة الأولى لا يمكن أن تكون سالبة';
        }

        if (loan.finalPayment < 0) {
            newErrors.finalPayment = 'الدفعة الأخيرة لا يمكن أن تكون سالبة';
        }

        if (loan.monthlyPayment <= 0) {
            newErrors.monthlyPayment = 'القسط الشهري يجب أن يكون أكبر من صفر';
        }

        if (!loan.lender.trim()) {
            newErrors.lender = 'اسم البنك أو المؤسسة مطلوب';
        }

        if (!loan.startDate) {
            newErrors.startDate = 'تاريخ بداية القرض مطلوب';
        }

        // التحقق من أن مجموع الدفعات لا يتجاوز المبلغ الإجمالي
        if (loan.downPayment + loan.finalPayment >= loan.totalAmount) {
            newErrors.downPayment = 'مجموع الدفعة الأولى والأخيرة يجب أن يكون أقل من المبلغ الإجمالي';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const loanData: Loan = {
            ...loan,
            id: initialData?.id || `loan-${Date.now()}`,
            createdAt: initialData?.createdAt || new Date().toISOString()
        };

        onSave(loanData);
    };

    const bankAccountOptions = Object.values(bankAccounts).map(account => ({
        value: account.id,
        label: `${account.name} (${account.currency})`
    }));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">{initialData ? 'تعديل القرض' : 'إضافة قرض جديد'}</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XMarkIcon /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* نوع القرض واسم القرض */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-slate-600 mb-2">نوع القرض</label>
                                <select
                                    id="type"
                                    name="type"
                                    value={loan.type}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    {loanTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-2">اسم القرض</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={loan.name}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="مثل: قرض سيارة تويوتا"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>
                        </div>

                        {/* المبالغ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="totalAmount" className="block text-sm font-medium text-slate-600 mb-2">المبلغ الإجمالي</label>
                                <input
                                    type="number"
                                    id="totalAmount"
                                    name="totalAmount"
                                    value={loan.totalAmount}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                                {errors.totalAmount && <p className="text-red-500 text-sm mt-1">{errors.totalAmount}</p>}
                            </div>

                            <div>
                                <label htmlFor="downPayment" className="block text-sm font-medium text-slate-600 mb-2">الدفعة الأولى</label>
                                <input
                                    type="number"
                                    id="downPayment"
                                    name="downPayment"
                                    value={loan.downPayment}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                                {errors.downPayment && <p className="text-red-500 text-sm mt-1">{errors.downPayment}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="finalPayment" className="block text-sm font-medium text-slate-600 mb-2">الدفعة الأخيرة</label>
                                <input
                                    type="number"
                                    id="finalPayment"
                                    name="finalPayment"
                                    value={loan.finalPayment}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                                {errors.finalPayment && <p className="text-red-500 text-sm mt-1">{errors.finalPayment}</p>}
                            </div>

                            <div>
                                <label htmlFor="monthlyPayment" className="block text-sm font-medium text-slate-600 mb-2">القسط الشهري</label>
                                <input
                                    type="number"
                                    id="monthlyPayment"
                                    name="monthlyPayment"
                                    value={loan.monthlyPayment}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    step="0.01"
                                    min="0"
                                    required
                                />
                                {errors.monthlyPayment && <p className="text-red-500 text-sm mt-1">{errors.monthlyPayment}</p>}
                            </div>
                        </div>

                        {/* المبلغ المدفوع مسبقاً */}
                        <div>
                            <label htmlFor="prepaidAmount" className="block text-sm font-medium text-slate-600 mb-2">المبلغ المدفوع مسبقاً (اختياري)</label>
                            <input
                                type="number"
                                id="prepaidAmount"
                                name="prepaidAmount"
                                value={loan.prepaidAmount || 0}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                step="0.01"
                                min="0"
                                placeholder="0"
                            />
                            <p className="text-sm text-slate-500 mt-1">المبلغ الذي تم دفعه قبل إضافة القرض للنظام</p>
                            {(loan.prepaidAmount || 0) > 0 && (
                                <div className="bg-blue-50 p-3 rounded-lg mt-2">
                                    <p className="text-blue-700 font-semibold text-sm">
                                        الأقساط المدفوعة مسبقاً: {loan.prepaidInstallments || 0} قسط
                                    </p>
                                    <p className="text-blue-600 text-sm">
                                        المبلغ المتبقي: {formatCurrency(loan.totalAmount - loan.downPayment - loan.finalPayment - (loan.prepaidAmount || 0))} ريال
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* التواريخ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-slate-600 mb-2">تاريخ بداية القرض</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={loan.startDate}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                            </div>

                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-slate-600 mb-2">تاريخ انتهاء القرض (محسوب تلقائياً)</label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={loan.endDate || ''}
                                    className="w-full p-3 border border-slate-300 rounded-lg bg-gray-50"
                                    disabled
                                />
                            </div>
                        </div>

                        {/* معلومات إضافية */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="lender" className="block text-sm font-medium text-slate-600 mb-2">البنك أو المؤسسة</label>
                                <input
                                    type="text"
                                    id="lender"
                                    name="lender"
                                    value={loan.lender}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="مثل: البنك الأهلي التجاري"
                                    required
                                />
                                {errors.lender && <p className="text-red-500 text-sm mt-1">{errors.lender}</p>}
                            </div>

                            <div>
                                <label htmlFor="linkedAccount" className="block text-sm font-medium text-slate-600 mb-2">ربط بالحساب البنكي (اختياري)</label>
                                <select
                                    id="linkedAccount"
                                    name="linkedAccount"
                                    value={loan.linkedAccount}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">اختر حساب بنكي</option>
                                    {bankAccountOptions.map(account => (
                                        <option key={account.value} value={account.value}>
                                            {account.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* معلومات محسوبة */}
                        {loan.totalMonths > 0 && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-800 mb-2">المعلومات المحسوبة</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-700">المدة الإجمالية:</span>
                                        <span className="font-semibold text-blue-900"> {loan.totalMonths} شهر</span>
                                    </div>
                                    <div>
                                        <span className="text-blue-700">المدة المتبقية:</span>
                                        <span className="font-semibold text-blue-900"> {loan.remainingMonths} شهر</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* أزرار */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                {initialData ? 'حفظ التعديلات' : 'إضافة القرض'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoanForm;
