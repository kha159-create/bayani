import React, { useState, useRef, useEffect } from 'react';
import { FinancialCalculations, Transaction, AppState, Message } from '../../types';
import { analyzeCompleteFinancialData, smartSearchAssistant, analyzeFinancialPatterns } from '../../services/geminiService';
import { detectUserLocation, LocationInfo } from '../../services/geolocationService';
import { SendIcon } from '../common/Icons';
import { t } from '../../translations';

interface AIAssistantTabProps {
    calculations: FinancialCalculations;
    filteredTransactions: Transaction[];
    allTransactions: Transaction[];
    state: AppState;
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

const AIAssistantTab: React.FC<AIAssistantTabProps> = ({ calculations, filteredTransactions, allTransactions, state, darkMode = false, language = 'ar' }) => {
    const [messages, setMessages] = useState<Message[]>([]);
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
                    
                    // إرسال رسالة ترحيب مخصصة حسب الموقع
                    const welcomeMessage = createLocationBasedWelcome(locationResult.location);
                    setMessages([welcomeMessage]);
                } else {
                    console.log('⚠️ فشل في كشف الموقع، استخدام الافتراضي');
                    // رسالة ترحيب افتراضية
                    const defaultMessage = createLocationBasedWelcome();
                    setMessages([defaultMessage]);
                }
                
                setLocationDetected(true);
            }
        };

        detectLocation();
    }, [locationDetected]);

    // إنشاء رسالة ترحيب مخصصة حسب الموقع
    const createLocationBasedWelcome = (location?: LocationInfo): Message => {
        const locationText = location ? 
            `📍 **تم كشف موقعك:** ${location.city}, ${location.region}` :
            '📍 **الموقع:** لم يتم كشف الموقع (استخدام الافتراضي)';
        
        const cityName = location?.city || 'الرياض';
        const countryName = location?.country || 'السعودية';
        
        return {
            id: '1',
            text: `مرحباً! أنا مساعدك الذكي 🤖✨

${locationText}

🔍 **يمكنني مساعدتك في:**
• تحليل بياناتك المالية عبر جميع الأشهر
• البحث عن أفضل العروض والأسعار في ${cityName} و${countryName}
• مقارنة الأسعار والمطاعم في منطقتك

💬 **اسألني مثلاً:**
• "كم صرفت هذا الشهر؟"
• "أين أفضل عروض في ${cityName}؟"
• "كم سعر الهاتف في سوق اليوم؟"
• "أفضل مطاعم في منطقتي"

ماذا تريد أن تعرف؟ 😊`,
            isUser: false,
            timestamp: new Date()
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
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
            let aiResponseText = '';
            
            // تحديد نوع الاستعلام والاستجابة المناسبة بطريقة ذكية
            const searchKeywords = ['أين', 'كم سعر', 'عروض', 'محل', 'مطعم', 'بنده', 'تميمي', 'كارفور', 'عروض', 'سعر', 'أفضل', 'تقييم', 'مطاعم', 'متاجر', 'عرض', 'أرخص', 'غالي', 'السوق', 'متجر', 'مطعم', 'مقهى', 'كوفي', 'برجر', 'بيتزا', 'شاورما', 'دجاج', 'لحم', 'سمك', 'أكل', 'طعام', 'شراب', 'مشروب', 'قهوة', 'شاي'];
            const financialKeywords = ['مصروف', 'دخل', 'ديون', 'بطاقة', 'شهر', 'تحليل', 'نمط', 'إنفاق', 'رصيد', 'قرض', 'قسط', 'استثمار', 'مالي', 'حساب', 'صرفت', 'وصل', 'تحويل', 'دفع', 'قسط', 'باقي', 'متوسط', 'إجمالي', 'شهر', 'أسبوع', 'سنة', 'مقارنة', 'تغير', 'زيادة', 'نقص', 'أعلى', 'أقل'];
            
            const isSearchQuery = searchKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()));
            const isFinancialQuery = financialKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()));
            
            if (isSearchQuery) {
                // استخدام البحث الذكي للمنتجات والعروض مع الموقع الجغرافي
                aiResponseText = await smartSearchAssistant(query, userLocation || undefined);
            } else if (isFinancialQuery) {
                // استخدام التحليل الشامل للبيانات المالية مع الموقع الجغرافي
                const completeData = {
                    currentPeriod: {
                        calculations: calculations,
                        transactions: filteredTransactions
                    },
                    allHistoricalData: {
                        allTransactions: allTransactions,
                        categories: state.categories,
                        cards: state.cards,
                        bankAccounts: state.bankAccounts,
                        loans: state.loans,
                        installments: state.installments,
                        investments: state.investments
                    },
                    state: state
                };
                aiResponseText = await analyzeCompleteFinancialData(query, completeData, userLocation || undefined);
            } else {
                // استخدام التحليل المتقدم للأنماط مع الموقع الجغرافي
                aiResponseText = await analyzeFinancialPatterns(query, allTransactions, calculations, userLocation || undefined);
            }
            
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
    
    return (
        <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ height: '70vh' }}>
            <div className="p-4 text-center flex-shrink-0">
                <h3 className="text-xl font-bold text-white">🤖 المحلل الذكي</h3>
                <p className="text-sm text-blue-200">تحليل بياناتك المالية + البحث عن أفضل العروض في السعودية</p>
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
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input 
                        type="text" 
                        value={userInput} 
                        onChange={e => setUserInput(e.target.value)} 
                        className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white placeholder-blue-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400" 
                        placeholder="اكتب سؤالك هنا..." 
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
    );
};

export default AIAssistantTab;