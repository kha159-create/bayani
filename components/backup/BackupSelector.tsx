import React, { useState, useEffect } from 'react';
import { firebaseService } from '../../services/firebaseService';

interface BackupSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectBackup: (backupData: any) => void;
    currentUser: any;
}

interface BackupItem {
    id: string;
    timestamp: string;
    date: string;
    time: string;
    size: string;
    description: string;
}

const BackupSelector: React.FC<BackupSelectorProps> = ({ isOpen, onClose, onSelectBackup, currentUser }) => {
    const [backups, setBackups] = useState<BackupItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadBackups();
        }
    }, [isOpen]);

    const loadBackups = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const result = await firebaseService.getAllDocuments('backups');

            if (result.success && Array.isArray(result.data)) {
                const formattedBackups = result.data
                    .map((backup: any, index: number) => {
                        const timestamp = backup.timestamp || backup.date || Date.now();
                        const date = new Date(timestamp);
                        return {
                            id: backup.id || `backup-${index}`,
                            timestamp: String(timestamp),
                            date: date.toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }),
                            time: date.toLocaleTimeString('ar-SA', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            size: formatBackupSize(backup.size || 0),
                            description: backup.description || `نسخة احتياطية ${index + 1}`
                        };
                    })
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                setBackups(formattedBackups);
            } else {
                setBackups([]);
            }
        } catch (error) {
            console.error('خطأ في جلب النسخ الاحتياطية:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatBackupSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSelectBackup = async () => {
        if (!selectedBackup) return;

        try {
            const result = await firebaseService.getData('backups', selectedBackup);
            if (result.success) {
                onSelectBackup(result.data);
                onClose();
            } else {
                console.error('خطأ في جلب النسخة الاحتياطية:', result.error);
            }
        } catch (error) {
            console.error('خطأ في جلب النسخة الاحتياطية:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-gradient-to-br from-slate-800 to-blue-900 w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl border border-blue-400/20 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800/50 to-blue-900/50 border-b border-blue-400/20 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">اختيار النسخة الاحتياطية</h2>
                            <p className="text-blue-200 text-sm">اختر النسخة التي تريد استعادتها</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-blue-300 hover:text-white transition-colors text-2xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-blue-200">جاري تحميل النسخ الاحتياطية...</p>
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">📦</div>
                            <h3 className="text-xl font-bold text-white mb-2">لا توجد نسخ احتياطية</h3>
                            <p className="text-blue-200">لم يتم العثور على أي نسخ احتياطية في السحابة</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {backups.map((backup) => (
                                <div
                                    key={backup.id}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                                        selectedBackup === backup.id
                                            ? 'border-cyan-400 bg-cyan-500/20'
                                            : 'border-blue-400/30 bg-slate-700/30 hover:border-blue-400/50 hover:bg-slate-700/50'
                                    }`}
                                    onClick={() => setSelectedBackup(backup.id)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                            <span className="text-white font-semibold text-sm">نسخة احتياطية</span>
                                        </div>
                                        {selectedBackup === backup.id && (
                                            <div className="text-cyan-400">✓</div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-white font-bold">{backup.date}</p>
                                            <p className="text-blue-300 text-sm">{backup.time}</p>
                                        </div>
                                        
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-blue-200">الحجم:</span>
                                            <span className="text-white">{backup.size}</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-blue-200">الوصف:</span>
                                            <span className="text-white truncate">{backup.description}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gradient-to-r from-slate-800/50 to-blue-900/50 border-t border-blue-400/20 p-6">
                    <div className="flex justify-between items-center">
                        <div className="text-blue-200 text-sm">
                            {selectedBackup ? 'تم اختيار النسخة الاحتياطية' : 'اختر نسخة احتياطية للاستعادة'}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSelectBackup}
                                disabled={!selectedBackup}
                                className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                استعادة النسخة المحددة
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackupSelector;

