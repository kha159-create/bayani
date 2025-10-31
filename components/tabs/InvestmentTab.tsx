import React, { useState, useRef, useEffect } from 'react';
import { AppState, FinancialCalculations, Message, Transaction, TransactionType, BankAccountConfig } from '../../types';
import { advancedInvestmentAdvice, analyzeMarketAndPortfolio } from '../../services/geminiService';
import { detectUserLocation, LocationInfo } from '../../services/geolocationService';
import { SendIcon } from '../common/Icons';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';

interface InvestmentTabProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    calculations: FinancialCalculations;
    setModal: (config: any) => void;
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const TypingIndicator: React.FC = () => (
  <div className="ai-bubble chat-bubble typing-indicator flex items-center space-x-1 p-3 self-start">
    <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
    <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
    <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
  </div>
);

const InvestmentTab: React.FC<InvestmentTabProps> = ({ state, setState, calculations, setModal, darkMode = false, language = 'ar' }) => {
    const [newInvestment, setNewInvestment] = useState({
        amount: '',
        type: '',
        account: ''
    });

    // حالة المحادثة مع المستشار المالي
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: '1', 
            text: `مرحباً! أنا مستشارك الاستثماري الذكي 🎯📈

💼 **خبرتي تشمل:**
• تحليل شامل لسوق تداول السعودي
• استراتيجيات استثمارية متقدمة
• إدارة المخاطر وتحسين المحافظ
• توصيات أسهم محددة مع تحليل عميق

📊 **يمكنني مساعدتك في:**
• تحليل محفظتك الحالية وتحسينها
• توصيات أسهم مع أهداف سعرية واضحة
• قراءة السوق وتوقعات الاتجاهات
• استراتيجيات دخول وخروج محددة

💡 **اسألني مثلاً:**
• "ما رأيك في أسهم أرامكو الآن؟"
• "كيف أحسن محفظتي الاستثمارية؟"
• "ما هي أفضل القطاعات للاستثمار؟"
• "أريد تحليل شامل لسوق اليوم"

أخبرني عن محفظتك وأهدافك الاستثمارية! 🚀`, 
            isUser: false,
            timestamp: new Date()
        }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<LocationInfo | null>(null);
    const [locationDetected, setLocationDetected] = useState(false);
    const chatBoxRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        chatBoxRef.current?.scrollTo(0, chatBoxRef.current.scrollHeight);
    }, [messages, isLoading]);

    // كشف الموقع الجغرافي عند تحميل المكون
    useEffect(() => {
        const detectLocation = async () => {
            if (!locationDetected) {
                console.log('🌍 بدء كشف الموقع الجغرافي...');
                const locationResult = await detectUserLocation();
                
                if (locationResult.success && locationResult.location) {
                    setUserLocation(locationResult.location);
                    console.log('✅ تم كشف الموقع:', locationResult.location);
                } else {
                    console.log('⚠️ فشل في كشف الموقع، استخدام الافتراضي');
                }
                
                setLocationDetected(true);
            }
        };

        detectLocation();
    }, [locationDetected]);

    const currentValue = state.investments?.currentValue || 0;
    // أزلنا إظهار نسبة الربح/الخسارة حسب الطلب

    const handleAddInvestment = () => {
        if (!newInvestment.amount || !newInvestment.type || !newInvestment.account) {
            setModal({
                title: 'خطأ',
                body: '<p>يرجى ملء جميع الحقول المطلوبة.</p>',
                show: true,
                onConfirm: () => setModal({ show: false })
            });
            return;
        }
        
        const investment: Transaction = {
            id: Date.now().toString(),
            amount: parseFloat(newInvestment.amount),
            date: new Date().toISOString().split('T')[0],
            description: `استثمار ${newInvestment.type}`,
            paymentMethod: newInvestment.account,
            type: 'investment' as TransactionType,
            categoryId: 'investment'
        };

        setState(prev => ({
            ...prev,
            transactions: [...prev.transactions, investment],
            investments: {
                ...prev.investments,
                currentValue: (prev.investments?.currentValue || 0) + parseFloat(newInvestment.amount)
            }
        }));

        setNewInvestment({ amount: '', type: '', account: '' });
        setModal({
            title: 'تم بنجاح',
            body: '<p>تم إضافة الاستثمار بنجاح!</p>',
            show: true,
            onConfirm: () => setModal({ show: false })
        });
    };

    const handleInvestmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const query = userInput.trim();
        if (!query || isLoading) return;

        const newUserMessage: Message = { 
            id: Date.now().toString(), 
            text: query, 
            isUser: true,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            // استخدام المستشار المالي المتقدم
            const portfolioData = {
                currentValue: currentValue,
                investments: state.investments,
                transactions: state.transactions.filter(t => t.type === 'investment')
            };

            const marketContext = {
                userLocation: userLocation,
                currentDate: new Date().toLocaleDateString('en-CA'),
                marketConditions: 'Current market analysis requested'
            };

            const aiResponseText = await advancedInvestmentAdvice(query, portfolioData, marketContext, userLocation || undefined);
            
            const newAiMessage: Message = { 
                id: (Date.now() + 1).toString(), 
                text: aiResponseText, 
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, newAiMessage]);
        } catch (error) {
            const errorMessage: Message = { 
                id: (Date.now() + 1).toString(), 
                text: error instanceof Error ? error.message : 'عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.', 
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const bankAccounts = Object.values(state.bankAccounts || {});

    return (
        <div className="space-y-6">
            {/* بطاقة القيمة الحالية للمحفظة */}
            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-8 shadow-2xl">
                <div className="text-center text-white">
                    <h2 className="text-2xl font-bold mb-2">القيمة الحالية للمحفظة</h2>
                    <div className="text-5xl font-bold mb-4">{formatCurrency(currentValue)}</div>
                    {/* أزلنا نسبة/قيمة الربح والخسارة حسب الطلب */}
                </div>
            </div>

            {/* إضافة حركة استثمارية */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">إضافة حركة استثمارية</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">المبلغ</label>
                        <input
                            type="number"
                            value={newInvestment.amount}
                            onChange={(e) => setNewInvestment(prev => ({ ...prev, amount: e.target.value }))}
                            className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white placeholder-blue-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">نوع الاستثمار</label>
                        <select
                            value={newInvestment.type}
                            onChange={(e) => setNewInvestment(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        >
                            <option value="" className="bg-slate-800 text-white">اختر النوع</option>
                            <option value="أسهم" className="bg-slate-800 text-white">أسهم</option>
                            <option value="صندوق استثماري" className="bg-slate-800 text-white">صندوق استثماري</option>
                            <option value="سندات" className="bg-slate-800 text-white">سندات</option>
                            <option value="ذهب" className="bg-slate-800 text-white">ذهب</option>
                            <option value="عملات رقمية" className="bg-slate-800 text-white">عملات رقمية</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-200 mb-2">الحساب البنكي</label>
                        <select
                            value={newInvestment.account}
                            onChange={(e) => setNewInvestment(prev => ({ ...prev, account: e.target.value }))}
                            className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        >
                            <option value="" className="bg-slate-800 text-white">اختر الحساب</option>
                            {bankAccounts.map(account => (
                                <option key={account.id} value={account.id} className="bg-slate-800 text-white">
                                    {account.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={handleAddInvestment}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 shadow-lg"
                >
                    إضافة الاستثمار
                </button>
            </div>

            {/* المستشار الاستثماري */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ height: '60vh' }}>
                <div className="p-4 text-center flex-shrink-0">
                    <h3 className="text-xl font-bold text-white">🎯 المستشار الاستثماري الذكي</h3>
                    <p className="text-sm text-blue-200">تحليل السوق وتوصيات استثمارية متقدمة</p>
                </div>
                <div ref={chatBoxRef} className="p-4 flex-grow overflow-y-auto flex flex-col gap-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`chat-bubble ${msg.isUser ? 'user-bubble' : 'ai-bubble'}`}>
                           <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                        </div>
                    ))}
                    {isLoading && <TypingIndicator />}
                </div>
                <div className="p-4 border-t border-blue-400/20 flex-shrink-0">
                    <form onSubmit={handleInvestmentSubmit} className="flex gap-2">
                        <input 
                            type="text" 
                            value={userInput} 
                            onChange={e => setUserInput(e.target.value)} 
                            className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white placeholder-blue-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400" 
                            placeholder="اسأل عن الاستثمارات والسوق..." 
                            required 
                            autoComplete="off" 
                            disabled={isLoading} 
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="p-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-lg flex-shrink-0 disabled:opacity-50 hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 shadow-lg"
                        >
                           <SendIcon />
                        </button>
                    </form>
                </div>
            </div>

            {/* زر الاستشارة السريعة العائم - تمت إزالته بناء على الطلب */}
        </div>
    );
};

export default InvestmentTab;