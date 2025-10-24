
import React, { useState, useEffect } from 'react';
import { CardConfig } from '../../types';
import { t } from '../../translations';
import { XMarkIcon } from '../common/Icons';

interface CardFormProps {
    onClose: () => void;
    onSave: (card: Omit<CardConfig, 'id'>, id?: string) => void;
    initialData?: CardConfig | null;
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const CardForm: React.FC<CardFormProps> = ({ onClose, onSave, initialData, darkMode = false, language = 'ar' }) => {
    const [card, setCard] = useState<Omit<CardConfig, 'id'>>({
        name: '',
        limit: 0,
        dueDay: 15,
        statementDay: 25,
        smsSamples: [],
    });

    useEffect(() => {
        if (initialData) {
            setCard(initialData);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        if (name === 'smsSamples') {
            setCard(prev => ({ ...prev, smsSamples: value.split(',').map(k => k.trim()).filter(Boolean) }));
        } else {
            setCard(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(card, initialData?.id);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">{initialData ? 'تعديل البطاقة' : 'إضافة بطاقة جديدة'}</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XMarkIcon /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">اسم البطاقة</label>
                            <input type="text" name="name" value={card.name} onChange={handleChange} className="w-full p-2" required />
                        </div>
                        <div>
                            <label htmlFor="limit" className="block text-sm font-medium text-slate-600 mb-1">الحد الائتماني</label>
                            <input type="number" name="limit" value={card.limit} onChange={handleChange} className="w-full p-2" required step="100" />
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="statementDay" className="block text-sm font-medium text-slate-600 mb-1">يوم إصدار الكشف (شهرياً)</label>
                                <input type="number" name="statementDay" value={card.statementDay} onChange={handleChange} className="w-full p-2" required min="1" max="31" />
                            </div>
                            <div>
                                <label htmlFor="dueDay" className="block text-sm font-medium text-slate-600 mb-1">يوم الاستحقاق (شهرياً)</label>
                                <input type="number" name="dueDay" value={card.dueDay} onChange={handleChange} className="w-full p-2" required min="1" max="31" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="smsSamples" className="block text-sm font-medium text-slate-600 mb-1">الكلمات المفتاحية للرسائل (افصل بفواصل)</label>
                            <input 
                                type="text" 
                                name="smsSamples" 
                                value={card.smsSamples?.join(', ') || ''} 
                                onChange={handleChange} 
                                className="w-full p-2" 
                                placeholder="مثال: SNB, الأهلي, إئتمانية"
                            />
                            <p className="text-xs text-slate-500 mt-1">كلمات فريدة من رسائل البنك للمساعدة في التعرف التلقائي عند لصق نص رسالة.</p>
                        </div>
                        <button type="submit" className="w-full py-3 magical-button text-white font-semibold rounded-lg mt-6">{initialData ? 'حفظ التعديلات' : 'إضافة البطاقة'}</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CardForm;
