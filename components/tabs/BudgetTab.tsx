
import React, { useState } from 'react';
import { AppState } from '../../types';
import { generateBudgetPlan } from '../../services/geminiService';
import { t } from '../../translations';

interface BudgetTabProps {
    state: AppState;
    setLoading: (loading: boolean, text?: string) => void;
    setModal: (config: any) => void;
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const BudgetTab: React.FC<BudgetTabProps> = ({ state, setLoading, setModal, darkMode = false, language = 'ar' }) => {
    const [budgetInput, setBudgetInput] = useState('');
    const [budgetPlan, setBudgetPlan] = useState('');

    const handleGenerateBudget = async () => {
        const totalBudget = parseFloat(budgetInput);
        if (isNaN(totalBudget) || totalBudget <= 0) {
            setModal({ title: t('error', language), body: `<p>${t('invalid.amount', language)}</p>`, confirmText: t('confirm', language), hideCancel: true });
            return;
        }

        setLoading(true, t('loading', language));
        setBudgetPlan('');

        try {
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
            const recentTransactions = state.transactions.filter(t => new Date(t.date) >= sixtyDaysAgo && t.type === 'expense');
            if (recentTransactions.length < 5) {
                throw new Error("لا توجد بيانات كافية عن إنفاقك لإنشاء خطة دقيقة. يرجى إضافة 5 معاملات على الأقل.");
            }

            const planMarkdown = await generateBudgetPlan(totalBudget, state.categories, recentTransactions);
            setBudgetPlan(planMarkdown);

        } catch (error) {
            const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
            setModal({ title: t('error', language), body: `<p>${message}</p>`, confirmText: t('confirm', language), hideCancel: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card p-6 animate-fade-in">
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>✨ {t('budget', language)}</h3>
            <div className={`flex flex-col sm:flex-row items-end gap-4 mb-6 p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div className="flex-grow">
                    <label htmlFor="monthly-budget-input" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t('budget.limit', language)}</label>
                    <input 
                        type="number" 
                        id="monthly-budget-input" 
                        className={`w-full p-2 ${darkMode ? 'bg-slate-600 text-slate-200 border-slate-500' : 'bg-white text-slate-900 border-gray-300'} border rounded`} 
                        placeholder="5000"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                    />
                </div>
                <button onClick={handleGenerateBudget} className="w-full sm:w-auto px-6 py-2 magical-button text-white rounded-lg font-semibold flex-shrink-0">✨ {t('generate.report', language)}</button>
            </div>
            <div className="prose max-w-none">
                {budgetPlan ? (
                    <div className={darkMode ? 'text-slate-200' : 'text-slate-900'} dangerouslySetInnerHTML={{ __html: budgetPlan.replace(/### (.*)/g, `<h4 class="text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'} mt-3 mb-2">$1</h4>`).replace(/\n/g, '<br />') }}></div>
                ) : (
                    <p className={`text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('no.data', language)}</p>
                )}
            </div>
        </div>
    );
};

export default BudgetTab;