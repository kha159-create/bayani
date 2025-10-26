import React, { useMemo } from 'react';
import { AppState, CardConfig, Transaction, CardDetails, FinancialCalculations } from '../../types';
import { TrashIcon } from '../common/Icons';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';

// دالة تحديد نوع البطاقة وشعارها
const getCardTypeAndLogo = (card: any) => {
    if (card.cardType) {
        switch (card.cardType) {
            case 'visa':
                return { type: 'Visa', logo: 'VISA', color: 'from-blue-600 to-blue-800' };
            case 'mastercard':
                return { type: 'Mastercard', logo: '●●', color: 'from-red-500 to-orange-500' };
            case 'amex':
                return { type: 'American Express', logo: '●●', color: 'from-green-600 to-blue-600' };
            default:
                return { type: 'Credit Card', logo: '●●', color: 'from-gray-600 to-gray-800' };
        }
    }
    
    // Fallback للبطاقات القديمة
    const name = card.name.toLowerCase();
    if (name.includes('visa') || name.includes('فيزا')) {
        return { type: 'Visa', logo: 'VISA', color: 'from-blue-600 to-blue-800' };
    }
    if (name.includes('mastercard') || name.includes('ماستر')) {
        return { type: 'Mastercard', logo: '●●', color: 'from-red-500 to-orange-500' };
    }
    if (name.includes('amex') || name.includes('أمريكان')) {
        return { type: 'American Express', logo: '●●', color: 'from-green-600 to-blue-600' };
    }
    return { type: 'Credit Card', logo: '●●', color: 'from-gray-600 to-gray-800' };
};

interface CardsTabProps {
    state: AppState;
    calculations: FinancialCalculations;
    openCardFormModal: (cardId?: string) => void;
    deleteCard: (cardId: string) => void;
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const CardsTab: React.FC<CardsTabProps> = ({ state, calculations, openCardFormModal, deleteCard, darkMode = false, language = 'ar' }) => {
    const cardDetails = calculations.cardDetails;

    return (
        <div className="space-y-6">
            {/* العنوان */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">البطاقات الائتمانية</h2>
                <p className="text-blue-200">إدارة بطاقاتك الائتمانية</p>
            </div>

            {/* إضافة بطاقة جديدة */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <div className="text-center">
                    <button
                        onClick={() => openCardFormModal()}
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-3 px-6 rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 shadow-lg"
                    >
                        + إضافة بطاقة جديدة
                    </button>
                </div>
            </div>

            {/* قائمة البطاقات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(cardDetails).map((card, index) => {
                    const cardInfo = getCardTypeAndLogo(card);
                    const usagePercentage = (card.balance / card.limit) * 100;
                    const available = card.limit - card.balance;
                    
                    return (
                        <div key={card.id} className={`bg-gradient-to-br ${cardInfo.color} rounded-lg p-3 shadow-lg text-white backdrop-blur-sm`}>
                            {/* Header */}
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-2xl font-bold mb-1">{cardInfo.logo}</div>
                                    <h3 className="text-sm font-bold line-clamp-1">{card.name}</h3>
                                    <p className="text-white/80 text-xs">{cardInfo.type}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openCardFormModal(card.id)}
                                        className="bg-white/20 backdrop-blur-sm text-white p-1 rounded text-xs hover:bg-white/30 transition-colors"
                                        title="تعديل البطاقة"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => deleteCard(card.id)}
                                        className="bg-red-500/20 backdrop-blur-sm text-white p-1 rounded text-xs hover:bg-red-500/30 transition-colors"
                                        title="حذف البطاقة"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            {/* المحتوى */}
                            <div className="space-y-2">
                                <div className="bg-white/10 backdrop-blur-md rounded-lg p-2">
                                    <div className="text-white/80 text-xs mb-1">المستخدم</div>
                                    <div className="text-white font-bold text-sm">{formatCurrency(card.balance)}</div>
                                    <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                                        <div 
                                            className="bg-white h-1 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/10 backdrop-blur-md rounded p-1.5 text-xs">
                                        <div className="text-white/80 text-xs">الحد</div>
                                        <div className="text-white font-bold">{formatCurrency(card.limit)}</div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded p-1.5 text-xs">
                                        <div className="text-white/80 text-xs">المتاح</div>
                                        <div className="text-white font-bold">{formatCurrency(available)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ملخص البطاقات */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">ملخص البطاقات</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-300 mb-1">
                            {Object.values(cardDetails).length}
                        </div>
                        <div className="text-blue-200 text-sm">إجمالي البطاقات</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-300 mb-1">
                            {formatCurrency(Object.values(cardDetails).reduce((sum, card) => sum + card.balance, 0))}
                        </div>
                        <div className="text-blue-200 text-sm">إجمالي الرصيد المستخدم</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-300 mb-1">
                            {formatCurrency(Object.values(cardDetails).reduce((sum, card) => sum + card.limit, 0))}
                        </div>
                        <div className="text-blue-200 text-sm">إجمالي الحد الائتماني</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardsTab;