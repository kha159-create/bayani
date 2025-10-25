
import React, { useState, useEffect } from 'react';
import { BankAccountConfig } from '../../types';
import { t } from '../../translations';
import { XMarkIcon } from '../common/Icons';

interface BankAccountFormProps {
    onClose: () => void;
    onSave: (account: Omit<BankAccountConfig, 'id'>, id?: string) => void;
    initialData?: BankAccountConfig | null;
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const BankAccountForm: React.FC<BankAccountFormProps> = ({ onClose, onSave, initialData, darkMode = false, language = 'ar' }) => {
    const [account, setAccount] = useState<Omit<BankAccountConfig, 'id'>>({
        name: '',
        balance: 0,
        currency: 'SAR',
        smsSamples: [],
    });

    useEffect(() => {
        if (initialData) {
            setAccount(initialData);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        if (name === 'smsSamples') {
            setAccount(prev => ({ ...prev, smsSamples: value.split(',').map(k => k.trim()).filter(Boolean) }));
        } else {
            setAccount(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(account, initialData?.id);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-br from-slate-800/95 to-blue-900/95 backdrop-blur-lg border border-blue-400/20 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">{initialData ? 'تعديل الحساب' : 'إضافة حساب بنكي'}</h2>
                        <button onClick={onClose} className="text-blue-200 hover:text-white"><XMarkIcon /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                            <label htmlFor="name" className="block text-sm font-medium text-blue-200 mb-1">اسم الحساب</label>
                            <input type="text" name="name" value={account.name} onChange={handleChange} className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white placeholder-blue-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="balance" className="block text-sm font-medium text-blue-200 mb-1">الرصيد الافتتاحي</label>
                                <input type="number" name="balance" value={account.balance} onChange={handleChange} className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white placeholder-blue-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400" required step="10" />
                            </div>
                            <div>
                                <label htmlFor="currency" className="block text-sm font-medium text-blue-200 mb-1">العملة</label>
                                <select name="currency" value={account.currency || 'SAR'} onChange={handleChange} className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400" required>
                                    <option value="SAR" className="bg-slate-800 text-white">🇸🇦 ريال سعودي (SAR)</option>
                                    <option value="AED" className="bg-slate-800 text-white">🇦🇪 درهم إماراتي (AED)</option>
                                    <option value="USD" className="bg-slate-800 text-white">🇺🇸 دولار أمريكي (USD)</option>
                                    <option value="EUR" className="bg-slate-800 text-white">🇪🇺 يورو (EUR)</option>
                                    <option value="GBP" className="bg-slate-800 text-white">🇬🇧 جنيه إسترليني (GBP)</option>
                                    <option value="JOD" className="bg-slate-800 text-white">🇯🇴 دينار أردني (JOD)</option>
                                    <option value="KWD" className="bg-slate-800 text-white">🇰🇼 دينار كويتي (KWD)</option>
                                    <option value="QAR" className="bg-slate-800 text-white">🇶🇦 ريال قطري (QAR)</option>
                                    <option value="BHD" className="bg-slate-800 text-white">🇧🇭 دينار بحريني (BHD)</option>
                                    <option value="OMR" className="bg-slate-800 text-white">🇴🇲 ريال عماني (OMR)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="smsSamples" className="block text-sm font-medium text-blue-200 mb-1">الكلمات المفتاحية للرسائل (افصل بفواصل)</label>
                            <input 
                                type="text" 
                                name="smsSamples" 
                                value={account.smsSamples?.join(', ') || ''} 
                                onChange={handleChange} 
                                className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white placeholder-blue-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400" 
                                placeholder="مثال: Alrajhi, الراجحي, مدى"
                            />
                            <p className="text-xs text-blue-300 mt-1">كلمات فريدة من رسائل البنك للمساعدة في التعرف التلقائي عند لصق نص رسالة.</p>
                        </div>
                        <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg mt-6 hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 shadow-lg">{initialData ? 'حفظ التعديلات' : 'إضافة الحساب'}</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BankAccountForm;
