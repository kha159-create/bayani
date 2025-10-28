
import React, { useEffect, useMemo, useState } from 'react';
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

    // الميزانيات لكل فئة (تخزين محلي حتى لا نغيّر هيكل الحالة العامة)
    const [categoryBudgets, setCategoryBudgets] = useState<{ [categoryId: string]: number }>({});

    useEffect(() => {
        try {
            const saved = localStorage.getItem('bayani_category_budgets');
            if (saved) setCategoryBudgets(JSON.parse(saved));
        } catch {}
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('bayani_category_budgets', JSON.stringify(categoryBudgets));
        } catch {}
    }, [categoryBudgets]);

    // مصاريف حسب الفئة (طوال الوقت)
    const spentByCategory = useMemo(() => {
        const map: { [id: string]: number } = {};
        state.transactions.forEach(t => {
            if ((t.type === 'expense' || t.type === 'bnpl-payment' || t.type === 'investment-deposit') && t.categoryId) {
                map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
            }
        });
        return map;
    }, [state.transactions]);

    const totalBudget = useMemo(() => Object.values(categoryBudgets).reduce((s, v) => s + (v || 0), 0), [categoryBudgets]);
    const totalSpent = useMemo(() => Object.values(spentByCategory).reduce((s, v) => s + (v || 0), 0), [spentByCategory]);
    const totalRemaining = Math.max(totalBudget - totalSpent, 0);
    const compliance = totalBudget > 0 ? Math.max(0, Math.min(100, (1 - (totalSpent / totalBudget)) * 100)) : 100;

    // اقتراح ميزانيات اعتماداً على متوسط آخر 3 أشهر
    const buildSuggestedBudgets = (): { [id: string]: number } => {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const sums: { [id: string]: number } = {};
        state.transactions.forEach(t => {
            if ((t.type === 'expense' || t.type === 'bnpl-payment' || t.type === 'investment-deposit') && t.categoryId) {
                const d = new Date(t.date);
                if (d >= threeMonthsAgo) {
                    sums[t.categoryId] = (sums[t.categoryId] || 0) + t.amount;
                }
            }
        });
        const suggestions: { [id: string]: number } = {};
        Object.entries(sums).forEach(([id, sum]) => {
            suggestions[id] = Math.round((sum / 3) * 100) / 100; // متوسط شهري تقريبي
        });
        return suggestions;
    };

    const applyAutoDistribute = () => {
        // اجمع الدخل المتوقع من متوسط آخر 3 أشهر دخل
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const incomeSum = state.transactions
            .filter(t => t.type === 'income' && new Date(t.date) >= threeMonthsAgo)
            .reduce((s, t) => s + t.amount, 0);
        const expectedMonthlyIncome = incomeSum > 0 ? incomeSum / 3 : 0;

        // مصروفات 90 يوم لتحديد نسب التوزيع بين الفئات
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const catSums: { [id: string]: number } = {};
        let totalExpenses90 = 0;
        state.transactions.forEach(t => {
            const d = new Date(t.date);
            if ((t.type === 'expense' || t.type === 'bnpl-payment' || t.type === 'investment-deposit') && t.categoryId && d >= ninetyDaysAgo) {
                catSums[t.categoryId] = (catSums[t.categoryId] || 0) + t.amount;
                totalExpenses90 += t.amount;
            }
        });

        // إذا لم يوجد دخل، استخدم مجموع المقترحات (متوسط 3 أشهر) كميزانية كلية مؤقتة
        const suggestions = buildSuggestedBudgets();
        const totalSuggested = Object.values(suggestions).reduce((s, v) => s + v, 0);
        const budgetPool = expectedMonthlyIncome > 0 ? expectedMonthlyIncome : totalSuggested;

        // وزّع الميزانية حسب نسب الإنفاق التاريخية مع حد أدنى صغير للفئات النادرة
        const next: { [id: string]: number } = {};
        state.categories.forEach(c => {
            const ratio = totalExpenses90 > 0 ? (catSums[c.id] || 0) / totalExpenses90 : 0;
            let proposed = budgetPool * ratio;
            if (proposed === 0 && (suggestions[c.id] || 0) > 0) proposed = suggestions[c.id];
            next[c.id] = Math.round(proposed * 100) / 100;
        });
        setCategoryBudgets(next);
        setModal({ title: 'تم', body: '<p>توزيع ذكي حسب الدخل والإنفاق لـ 90 يوماً.</p>', confirmText: 'موافق', hideCancel: true });
    };

    const applyAutoTune = () => {
        const suggestions = buildSuggestedBudgets();
        const next: { [id: string]: number } = { ...categoryBudgets };
        // الفئات ذات الميزانية 0 تُضبط إلى المقترح إن وجد، والفئات بلا إنفاق تُعاد إلى 0
        state.categories.forEach(c => {
            const spent = spentByCategory[c.id] || 0;
            const current = next[c.id] || 0;
            if (current === 0 && suggestions[c.id]) next[c.id] = suggestions[c.id];
            if (spent === 0) next[c.id] = 0;
        });
        setCategoryBudgets(next);
        setModal({ title: 'تم', body: '<p>ضبط تلقائي: تفعيل المقترحات للفئات الصفرية وتصغير غير المستخدمة إلى 0.</p>', confirmText: 'موافق', hideCancel: true });
    };

    const normalizeAmount = (val: string): number => {
        if (!val) return NaN;
        const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
        let s = val.trim();
        s = s.replace(/[\u066B\u066C]/g, '.'); // Arabic decimal/grouping
        s = s.replace(/[،٬\s,_]/g, ''); // common group separators
        s = s.replace(/[\u0660-\u0669]/g, (d) => String(arabicDigits.indexOf(d))); // arabic-indic to ascii
        // if multiple dots, keep first
        const parts = s.split('.');
        if (parts.length > 2) s = parts.shift() + '.' + parts.join('');
        return parseFloat(s);
    };

    const handleGenerateBudget = async () => {
        // اسمح بترك الحقل فارغاً: سنعتمد إجمالي الميزانيات أو متوسط الدخل
        let targetBudget = normalizeAmount(budgetInput);
        if (isNaN(targetBudget) || targetBudget <= 0) {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const incomeSum = state.transactions
                .filter(t => t.type === 'income' && new Date(t.date) >= threeMonthsAgo)
                .reduce((s, t) => s + t.amount, 0);
            const expectedMonthlyIncome = incomeSum > 0 ? incomeSum / 3 : 0;

            targetBudget = totalBudget > 0 ? totalBudget : expectedMonthlyIncome;
            if (!targetBudget || targetBudget <= 0) {
                setModal({ title: t('error', language), body: `<p>الرجاء إدخال مبلغ الميزانية الإجمالي أولاً (مثال: 5000 أو ٥٠٠٠).</p>`, confirmText: t('confirm', language), hideCancel: true });
                return;
            }
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

            const planMarkdown = await generateBudgetPlan(targetBudget, state.categories, recentTransactions);
            setBudgetPlan(planMarkdown);

        } catch (error) {
            const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
            setModal({ title: t('error', language), body: `<p>${message}</p>`, confirmText: t('confirm', language), hideCancel: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ملخص علوي صغير */}
            <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-4 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-3 text-center">ملخص الميزانية</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/10 rounded-lg p-2">
                        <div className="text-white text-sm">إجمالي الميزانية</div>
                        <div className="text-cyan-400 font-bold">{totalBudget.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                        <div className="text-white text-sm">إجمالي المصروف</div>
                        <div className="text-red-400 font-bold">{totalSpent.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                        <div className="text-white text-sm">المتبقي</div>
                        <div className="text-green-400 font-bold">{totalRemaining.toLocaleString()}</div>
                    </div>
                </div>
                <div className="mt-3">
                    <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 h-2 rounded-full" style={{ width: `${100 - compliance}%` }}></div>
                    </div>
                    <div className="text-center text-xs text-blue-200 mt-1">نسبة الالتزام: {compliance.toFixed(1)}%</div>
                </div>
            </div>

            {/* أدوات التوزيع */}
            <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-4 shadow-xl">
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                    <div className="flex items-end gap-2">
                        <div>
                            <label htmlFor="ai-total-budget" className="block text-xs text-blue-200 mb-1">إجمالي الميزانية</label>
                            <input id="ai-total-budget" type="number" className="w-36 text-right bg-white/10 text-white placeholder-blue-200 border border-white/20 rounded px-2 py-1 text-sm" placeholder="مثلاً 5000" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} />
                        </div>
                        <button onClick={handleGenerateBudget} className="px-3 py-2 rounded-lg text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">✨ إنشاء خطة بالذكاء</button>
                    </div>
                    <button onClick={applyAutoDistribute} className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">توزيع تلقائي (آخر 3 أشهر)</button>
                    <button onClick={applyAutoTune} className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">ضبط تلقائي</button>
                </div>
            </div>

            {/* بطاقات الفئات - تمرير أفقي */}
            <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-4 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-3">ميزانية الفئات</h3>
                <div className="overflow-x-auto">
                    <div className="grid grid-flow-col auto-cols-[80%] sm:auto-cols-[45%] gap-3 pb-2">
                        {state.categories.map(cat => {
                            const budget = categoryBudgets[cat.id] || 0;
                            const spent = spentByCategory[cat.id] || 0;
                            const remaining = Math.max(budget - spent, 0);
                            const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
                            const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-400' : 'bg-green-400';
                            return (
                                <div key={cat.id} className="bg-white/10 rounded-xl p-3 min-h-[150px] flex flex-col border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-white font-semibold line-clamp-1 flex items-center gap-2"><span className="text-xl">{cat.icon}</span>{cat.name}</div>
                                        <input
                                            type="number"
                                            className="w-24 text-right bg-white/10 text-white placeholder-blue-200 border border-white/20 rounded px-2 py-1 text-sm"
                                            placeholder="الميزانية"
                                            value={budget || ''}
                                            onChange={e => setCategoryBudgets(prev => ({ ...prev, [cat.id]: Number(e.target.value || 0) }))}
                                        />
                                    </div>
                                    <div className="text-blue-200 text-xs mb-1">المصروف: {spent.toLocaleString()}</div>
                                    <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                                        <div className={`${barColor} h-2 rounded-full`} style={{ width: `${pct}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-blue-200">
                                        <span>المتبقي: {remaining.toLocaleString()}</span>
                                        <span>{pct.toFixed(1)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* مخرجات الذكاء الاصطناعي */}
            <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-4 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-3">اقتراح الخطة</h3>
                <div className="prose max-w-none">
                    {budgetPlan ? (
                        <div className={darkMode ? 'text-slate-200' : 'text-slate-900'} dangerouslySetInnerHTML={{ __html: budgetPlan.replace(/### (.*)/g, `<h4 class=\"text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'} mt-3 mb-2\">$1</h4>`).replace(/\n/g, '<br />') }}></div>
                    ) : (
                        <p className="text-center text-blue-200">لا توجد خطة حالياً</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BudgetTab;