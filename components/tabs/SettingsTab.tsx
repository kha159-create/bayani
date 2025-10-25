import React, { useState } from 'react';
import { AppState } from '../../types';
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