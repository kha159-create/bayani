import React, { useState } from 'react';
import { DebtToMe, DebtFromMe } from '../../types';
import { t } from '../../translations';
import { XMarkIcon } from '../common/Icons';

interface DebtFormProps {
    onClose: () => void;
    onSave: (debt: Omit<DebtToMe, 'id' | 'createdAt'> | Omit<DebtFromMe, 'id' | 'createdAt'>, id?: string) => void;
    initialData?: DebtToMe | DebtFromMe | null;
    type: 'toMe' | 'fromMe';
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const DebtForm: React.FC<DebtFormProps> = ({ onClose, onSave, initialData, type, darkMode = false, language = 'ar' }) => {
    const [debt, setDebt] = useState({
        [type === 'toMe' ? 'debtor' : 'creditor']: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending' as 'pending' | 'partial' | 'paid',
        source: '', // مصدر الدين
        reason: '' // السبب
    });

    const [errors, setErrors] = useState<{[key: string]: string}>({});

    React.useEffect(() => {
        if (initialData) {
            setDebt(initialData);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDebt(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) || 0 : value
        }));
        
        // مسح الخطأ عند التعديل
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};

        if (!debt[type === 'toMe' ? 'debtor' : 'creditor']) {
            newErrors[type === 'toMe' ? 'debtor' : 'creditor'] = 'اسم المدين/الدائن مطلوب';
        }

        if (debt.amount <= 0) {
            newErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر';
        }

        if (!debt.description.trim()) {
            newErrors.description = 'وصف الدين مطلوب';
        }

        if (!debt.date) {
            newErrors.date = 'تاريخ الدين مطلوب';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        onSave(debt as any, initialData?.id);
    };

    const isToMe = type === 'toMe';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">
                            {isToMe ? 'إضافة دين لي' : 'إضافة دين علي'}
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <XMarkIcon />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* اسم المدين/الدائن */}
                        <div>
                            <label htmlFor={isToMe ? 'debtor' : 'creditor'} className="block text-sm font-medium text-slate-600 mb-2">
                                {isToMe ? 'اسم المدين' : 'اسم الدائن'}
                            </label>
                            <input
                                type="text"
                                id={isToMe ? 'debtor' : 'creditor'}
                                name={isToMe ? 'debtor' : 'creditor'}
                                value={debt[isToMe ? 'debtor' : 'creditor']}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={isToMe ? 'اسم الشخص الذي يدين لي' : 'اسم الشخص الذي أدين له'}
                                required
                            />
                            {errors[isToMe ? 'debtor' : 'creditor'] && (
                                <p className="text-red-500 text-sm mt-1">{errors[isToMe ? 'debtor' : 'creditor']}</p>
                            )}
                        </div>

                        {/* المبلغ */}
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-2">المبلغ</label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={debt.amount}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                required
                            />
                            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                        </div>

                        {/* مصدر الدين */}
                        <div>
                            <label htmlFor="source" className="block text-sm font-medium text-slate-600 mb-2">
                                {isToMe ? 'من أين دينني' : 'أين أضفت الدين'}
                            </label>
                            <input
                                type="text"
                                id="source"
                                name="source"
                                value={debt.source}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={isToMe ? 'مثال: بنك الراجحي، تطبيق ستور' : 'مثال: بنك الأهلي، تطبيق تابي'}
                            />
                        </div>

                        {/* السبب */}
                        <div>
                            <label htmlFor="reason" className="block text-sm font-medium text-slate-600 mb-2">السبب (اختياري)</label>
                            <textarea
                                id="reason"
                                name="reason"
                                value={debt.reason}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="سبب الدين أو تفاصيل إضافية..."
                            />
                        </div>

                        {/* الوصف */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-2">وصف الدين</label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                value={debt.description}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="وصف مختصر للدين"
                                required
                            />
                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                        </div>

                        {/* التاريخ */}
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-600 mb-2">تاريخ الدين</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={debt.date}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                        </div>

                        {/* الحالة */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-600 mb-2">الحالة</label>
                            <select
                                id="status"
                                name="status"
                                value={debt.status}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="pending">معلق</option>
                                <option value="partial">جزئي</option>
                                <option value="paid">مدفوع</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {isToMe ? 'إضافة الدين' : 'إضافة الدين'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DebtForm;
