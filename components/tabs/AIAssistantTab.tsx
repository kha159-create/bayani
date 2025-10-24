import React, { useState, useRef, useEffect } from 'react';
import { FinancialCalculations, Transaction, AppState } from '../../types';
import { analyzeCompleteFinancialData } from '../../services/geminiService';

interface AIAssistantTabProps {
    calculations: FinancialCalculations;
    filteredTransactions: Transaction[];
    allTransactions: Transaction[];
    state: AppState;
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

const AIAssistantTab: React.FC<AIAssistantTabProps> = ({ 
    calculations, 
    filteredTransactions, 
    allTransactions, 
    state, 
    darkMode = false, 
    language = 'ar' 
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'مرحباً! أنا المحلل الذكي لبياني. كيف يمكنني مساعدتك اليوم؟',
            isUser: false,
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const completeData = {
                calculations,
                transactions: allTransactions,
                categories: state.categories,
                cards: state.cards,
                bankAccounts: state.bankAccounts,
                investments: state.investments
            };

            const response = await analyzeCompleteFinancialData(inputText, completeData);
            
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response,
                isUser: false,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'عذراً، حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
                isUser: false,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
            {/* العنوان */}
            <div className="bg-gradient-to-r from-slate-800/50 to-blue-900/50 backdrop-blur-lg border-b border-blue-400/20 p-4">
                <h2 className="text-2xl font-bold text-white text-center">المحلل الذكي — مدعوم بذكاء بياني</h2>
            </div>

            {/* منطقة المحادثة */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl ${
                            message.isUser 
                                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white' 
                                : 'bg-slate-700/50 text-blue-200 border border-blue-400/20'
                        } rounded-2xl p-4 shadow-lg`}>
                            {!message.isUser && (
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-sm">
                                        🤖
                                    </div>
                                    <span className="text-xs font-semibold">المحلل الذكي</span>
                                </div>
                            )}
                            <p className="text-sm leading-relaxed">{message.text}</p>
                            <div className="text-xs opacity-70 mt-2">
                                {message.timestamp.toLocaleTimeString('ar-SA', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </div>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-700/50 text-blue-200 border border-blue-400/20 rounded-2xl p-4 shadow-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-sm">
                                    🤖
                                </div>
                                <span className="text-xs font-semibold">المحلل الذكي</span>
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* شريط إدخال النص */}
            <div className="bg-gradient-to-r from-slate-800/50 to-blue-900/50 backdrop-blur-lg border-t border-blue-400/20 p-4">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="اكتب سؤالك هنا..."
                        className="flex-1 p-3 bg-slate-700/50 border border-blue-400/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isLoading}
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white p-3 rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        <span className="text-xl">✈️</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistantTab;