import React, { useMemo } from 'react';
import { AppState, CardConfig, Transaction, CardDetails, FinancialCalculations } from '../../types';
import { TrashIcon } from '../common/Icons';
import { formatCurrency } from '../../utils/formatting';
import { t } from '../../translations';

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
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-4 px-8 rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 shadow-lg"
                    >
                        + إضافة بطاقة جديدة
                    </button>
                </div>
            </div>

            {/* قائمة البطاقات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(cardDetails).map((card, index) => (
                    <div key={card.id} className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{card.name}</h3>
                                <p className="text-blue-200 text-sm">بطاقة ائتمانية</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openCardFormModal(card.id)}
                                    className="bg-blue-500/20 text-blue-300 p-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => deleteCard(card.id)}
                                    className="bg-red-500/20 text-red-300 p-2 rounded-lg hover:bg-red-500/30 transition-colors"
                                >
                                    🗑️
                                </button>
                        </div>
                    </div>

                        <div className="space-y-4">
                            {/* الرصيد المستخدم */}
                            <div className="bg-slate-700/30 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-200 text-sm">الرصيد المستخدم</span>
                                    <span className="text-red-400 font-bold text-lg">{formatCurrency(card.balance)}</span>
                                </div>
                                <div className="mt-2">
                                    <div className="w-full bg-slate-600 rounded-full h-2">
                                        <div 
                                            className="bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${card.usagePercentage}%` }}
                                        ></div>
                    </div>
                                    <p className="text-xs text-blue-300 mt-1">{card.usagePercentage.toFixed(1)}% مستخدم</p>
                    </div>
                </div>

                            {/* الرصيد المتاح */}
                            <div className="bg-slate-700/30 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-200 text-sm">الرصيد المتاح</span>
                                    <span className="text-green-400 font-bold text-lg">{formatCurrency(card.available)}</span>
                        </div>
                        </div>

                            {/* الحد الائتماني */}
                            <div className="bg-slate-700/30 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-200 text-sm">الحد الائتماني</span>
                                    <span className="text-white font-bold text-lg">{formatCurrency(card.limit)}</span>
                        </div>
                    </div>
                </div>

                        {/* ملخص البطاقة */}
                        <div className="mt-4 pt-4 border-t border-blue-400/20">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-blue-200 text-xs">المدفوع</p>
                                    <p className="text-white font-bold">{formatCurrency(card.limit - card.balance)}</p>
                                </div>
                                <div>
                                    <p className="text-blue-200 text-xs">المتبقي</p>
                                    <p className="text-white font-bold">{formatCurrency(card.balance)}</p>
            </div>
                </div>
            </div>
        </div>
                ))}
            </div>

            {/* رسالة عدم وجود بطاقات */}
            {Object.values(cardDetails).length === 0 && (
                <div className="text-center py-8">
                    <div className="text-6xl mb-4">💳</div>
                    <h3 className="text-xl font-bold text-white mb-2">لا توجد بطاقات ائتمانية</h3>
                    <p className="text-blue-200">أضف بطاقتك الأولى للبدء</p>
                </div>
            )}

            {/* ملخص البطاقات */}
            {Object.values(cardDetails).length > 0 && (
                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">ملخص البطاقات</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-400">
                                {formatCurrency(Object.values(cardDetails).reduce((sum, card) => sum + card.balance, 0))}
                            </p>
                            <p className="text-blue-200 text-sm">إجمالي الديون</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">
                                {formatCurrency(Object.values(cardDetails).reduce((sum, card) => sum + card.available, 0))}
                            </p>
                            <p className="text-blue-200 text-sm">إجمالي المتاح</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">
                                {formatCurrency(Object.values(cardDetails).reduce((sum, card) => sum + card.limit, 0))}
                            </p>
                            <p className="text-blue-200 text-sm">إجمالي الحدود</p>
            </div>
            </div>
                </div>
            )}
        </div>
    );
};

export default CardsTab;
