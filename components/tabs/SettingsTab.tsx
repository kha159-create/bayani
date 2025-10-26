import React, { useState, useEffect } from 'react';
import { AppState, Category } from '../../types';
import { firebaseService } from '../../services/firebaseService';
import { initializeAi, suggestCategoryIcon } from '../../services/geminiService';
import { t } from '../../translations';
import BackupSelector from '../backup/BackupSelector';

interface SettingsTabProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    setModal: (config: any) => void;
    setLoading: (loading: boolean) => void;
    onRestore: () => void;
    darkMode?: boolean;
    language?: 'ar' | 'en';
    onSaveToCloud?: () => void;
    onRestoreFromCloud?: () => void;
    onDownloadBackup?: () => void;
    onRestoreFromFile?: (file: File) => void;
    currentUser?: any;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ 
    state, 
    setState, 
    setModal, 
    setLoading, 
    onRestore, 
    darkMode = false, 
    language = 'ar',
    onSaveToCloud,
    onRestoreFromCloud,
    onDownloadBackup,
    onRestoreFromFile,
    currentUser
}) => {
    const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
    const [isGeminiConnected, setIsGeminiConnected] = useState(false);
    const [showBackupSelector, setShowBackupSelector] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
    const [isSuggestingIcon, setIsSuggestingIcon] = useState(false);

    // التحقق من حالة الاتصال
    useEffect(() => {
        const checkConnections = async () => {
            // التحقق من Firebase
            try {
                const user = await firebaseService.getCurrentUser();
                setIsFirebaseConnected(!!user);
                console.log('🔥 Firebase connection status:', !!user);
                } catch (error) {
                console.error('❌ Firebase connection error:', error);
                setIsFirebaseConnected(false);
            }

            // التحقق من Gemini
            try {
                const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
                setIsGeminiConnected(!!geminiApiKey);
                console.log('🤖 Gemini API key status:', !!geminiApiKey);
        } catch (error) {
                console.error('❌ Gemini connection error:', error);
                setIsGeminiConnected(false);
            }
        };

        checkConnections();
    }, []);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && onRestoreFromFile) {
            onRestoreFromFile(file);
        }
    };

    const handleBackupSelect = (backupData: any) => {
        if (onRestoreFromCloud) {
            onRestoreFromCloud();
        }
        setModal({
            title: 'تم استعادة النسخة الاحتياطية',
            body: '<p>تم استعادة النسخة الاحتياطية بنجاح!</p>',
            hideCancel: true,
            confirmText: 'موافق'
        });
    };

    const handleRestoreFromCloud = () => {
        if (currentUser) {
            setShowBackupSelector(true);
            } else {
            setModal({ 
                title: 'خطأ',
                body: '<p>يجب تسجيل الدخول أولاً لاستخدام النسخ السحابية.</p>',
                hideCancel: true, 
                confirmText: 'موافق'
            });
        }
    };

    const handleSuggestIcon = async () => {
        if (!newCategory.name.trim()) {
            setModal({ 
                title: 'خطأ', 
                body: '<p>يرجى إدخال اسم الفئة أولاً</p>', 
                hideCancel: true, 
                confirmText: 'موافق' 
            });
            return;
        }

        try {
            setIsSuggestingIcon(true);
            await initializeAi();
            const iconSuggestion = await suggestCategoryIcon(newCategory.name.trim());
            
            if (iconSuggestion && iconSuggestion.trim()) {
                setNewCategory(prev => ({ ...prev, icon: iconSuggestion.trim() }));
            }
        } catch (error: any) {
            console.error('خطأ في اقتراح الأيقونة:', error);
            setModal({ 
                title: 'خطأ', 
                body: `<p>حدث خطأ أثناء اقتراح الأيقونة: ${error.message}</p>`, 
                hideCancel: true, 
                confirmText: 'موافق' 
            });
        } finally {
            setIsSuggestingIcon(false);
        }
    };

    const handleAddCategory = () => {
        if (!newCategory.name.trim() || !newCategory.icon.trim()) {
            setModal({ 
                title: 'خطأ', 
                body: '<p>يرجى إدخال الاسم والأيقونة</p>', 
                hideCancel: true, 
                confirmText: 'موافق' 
            });
            return;
        }

        const newId = `cat-${Date.now()}`;
        const category: Category = {
            id: newId,
            name: newCategory.name.trim(),
            icon: newCategory.icon.trim()
        };

        setState(prev => ({
            ...prev,
            categories: [...prev.categories, category]
        }));

        setNewCategory({ name: '', icon: '' });
            setModal({ 
            title: 'تم بنجاح', 
            body: '<p>تم إضافة الفئة بنجاح!</p>', 
                hideCancel: true, 
            confirmText: 'موافق' 
            });
    };

    const handleDeleteCategory = (id: string) => {
        if (state.transactions.some(t => t.categoryId === id)) {
            setModal({ 
                title: 'لا يمكن الحذف', 
                body: '<p>لا يمكن حذف فئة مستخدمة في حركات مالية</p>', 
                hideCancel: true, 
                confirmText: 'موافق' 
            });
        } else {
            setState(prev => ({
                ...prev,
                categories: prev.categories.filter(c => c.id !== id) 
            }));
            setModal({ 
                title: 'تم بنجاح', 
                body: '<p>تم حذف الفئة بنجاح!</p>', 
                hideCancel: true, 
                confirmText: 'موافق' 
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* العنوان */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">الإعدادات</h2>
                <p className="text-blue-200">مركز تحكم بالإعدادات والتكاملات</p>
            </div>

            {/* كروت التكاملات */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Firebase */}
                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                    <div className="text-center">
                        <div className="text-4xl mb-4">🔥</div>
                        <h3 className="text-xl font-bold text-white mb-2">Firebase</h3>
                        <p className="text-blue-200 text-sm mb-4">قاعدة البيانات السحابية</p>
                        <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                            isFirebaseConnected 
                                ? 'bg-green-500/20 text-green-400 border border-green-400/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-400/30'
                        }`}>
                            {isFirebaseConnected ? 'متصل' : 'غير متصل'}
                        </div>
                    </div>
                            </div>

                {/* Gemini */}
                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                    <div className="text-center">
                        <div className="text-4xl mb-4">🤖</div>
                        <h3 className="text-xl font-bold text-white mb-2">Gemini</h3>
                        <p className="text-blue-200 text-sm mb-4">الذكاء الاصطناعي</p>
                        <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                            isGeminiConnected 
                                ? 'bg-green-500/20 text-green-400 border border-green-400/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-400/30'
                        }`}>
                            {isGeminiConnected ? 'متصل' : 'غير متصل'}
                        </div>
                    </div>
                </div>

                {/* النسخ السحابي */}
                <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                    <div className="text-center">
                        <div className="text-4xl mb-4">☁️</div>
                        <h3 className="text-xl font-bold text-white mb-2">النسخ السحابي</h3>
                        <p className="text-blue-200 text-sm mb-4">حفظ البيانات</p>
                        <div className="space-y-2">
                            <button
                                onClick={onSaveToCloud}
                                className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold py-2 px-4 rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 text-sm"
                            >
                                حفظ للغيوم
                            </button>
                            <button
                                onClick={handleRestoreFromCloud}
                                className="w-full bg-slate-700/50 text-blue-200 font-semibold py-2 px-4 rounded-xl hover:bg-slate-600/50 transition-all duration-300 text-sm border border-blue-400/30"
                            >
                                استعادة من الغيوم
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* إعدادات النسخ الاحتياطي */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">النسخ الاحتياطي</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={onDownloadBackup}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg"
                    >
                        📥 تحميل نسخة احتياطية
                    </button>
                    <label className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg cursor-pointer text-center">
                        📤 استعادة من ملف
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                    </div>
                </div>

            {/* إدارة الفئات */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">📂 إدارة الفئات</h3>
                
                {/* إضافة فئة جديدة */}
                <div className="mb-6 p-4 bg-slate-700/30 rounded-xl">
                    <h4 className="font-semibold text-white mb-3">➕ إضافة فئة جديدة</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input
                            type="text"
                            placeholder="اسم الفئة"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                            className="px-3 py-2 bg-slate-600/50 border border-blue-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-200"
                        />
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="الأيقونة (مثل: 🍔)"
                                value={newCategory.icon}
                                onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                                className="flex-1 px-3 py-2 bg-slate-600/50 border border-blue-400/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-200"
                            />
                            <button
                                type="button"
                                onClick={handleSuggestIcon}
                                disabled={!newCategory.name.trim() || isSuggestingIcon}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="اقتراح أيقونة بالذكاء الاصطناعي"
                            >
                                {isSuggestingIcon ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    '🤖'
                                )}
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleAddCategory}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                        ➕ إضافة الفئة
                    </button>
                </div>

                {/* قائمة الفئات */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {state.categories.map((category) => (
                        <div key={category.id} className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between border border-blue-400/20">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{category.icon}</span>
                                <span className="text-sm font-medium text-white">{category.name}</span>
                            </div>
                            <button
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-red-500 hover:text-red-700 text-sm"
                                title="حذف الفئة"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* إعدادات التطبيق */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">إعدادات التطبيق</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-blue-200">اللغة</span>
                        <select
                            value={state.settings.language}
                            onChange={(e) => setState(prev => ({ 
                                ...prev, 
                                settings: { ...prev.settings, language: e.target.value as 'ar' | 'en' } 
                            }))}
                            className="bg-slate-700/50 border border-blue-400/30 rounded-xl text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ar">العربية</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* بطاقة "حول التطبيق" */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-xl text-center">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl mx-auto mb-4">
                    <img src="/bayani/logo.jpg" alt="Bayani Logo" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">بياني</h3>
                <p className="text-blue-200 mb-4">Developed by K.A Team</p>
                <p className="text-blue-300 text-sm">Powered by AI — Bayani v1.0.0</p>
            </div>

            {/* مكون اختيار النسخة الاحتياطية */}
            <BackupSelector
                isOpen={showBackupSelector}
                onClose={() => setShowBackupSelector(false)}
                onSelectBackup={handleBackupSelect}
                currentUser={currentUser}
            />
        </div>
    );
};

export default SettingsTab;