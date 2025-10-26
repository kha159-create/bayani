import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
    onUpdateProfile: (data: { displayName: string; email: string; photoURL?: string }) => Promise<void>;
    onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    onClose,
    currentUser,
    onUpdateProfile,
    onChangePassword,
}) => {
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [updateError, setUpdateError] = useState('');

    useEffect(() => {
        if (currentUser) {
            setDisplayName(currentUser.displayName || '');
            setEmail(currentUser.email || '');
            setPhotoURL(currentUser.photoURL || '');
        }
    }, [currentUser]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdateError('');
        try {
            await onUpdateProfile({ displayName, email, photoURL });
            onClose();
        } catch (error: any) {
            setUpdateError(error.message || 'حدث خطأ أثناء تحديث الملف الشخصي');
        }
    };

    const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        
        if (newPassword !== confirmNewPassword) {
            setPasswordError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
            return;
        }
        
        if (newPassword.length < 6) {
            setPasswordError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
            return;
        }
        
        try {
            await onChangePassword(currentPassword, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            onClose();
        } catch (error: any) {
            setPasswordError(error.message || 'حدث خطأ أثناء تغيير كلمة المرور');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800/95 to-blue-900/95 backdrop-blur-lg border border-blue-400/20 rounded-2xl p-6 shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-blue-300 hover:text-white transition-colors z-10"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-2xl font-bold text-white mb-6 text-center">الملف الشخصي</h2>

                {/* تحديث الملف الشخصي */}
                <form onSubmit={handleProfileSubmit} className="space-y-4 mb-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
                            {photoURL ? (
                                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                                    {(displayName || email || 'U').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="photoUpload"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        setPhotoURL(event.target?.result as string);
                                    };
                                    reader.readAsDataURL(e.target.files[0]);
                                }
                            }}
                        />
                        <label 
                            htmlFor="photoUpload" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg cursor-pointer transition-colors"
                        >
                            تغيير الصورة
                        </label>
                    </div>

                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-blue-200 mb-1">
                            الاسم
                        </label>
                        <input
                            type="text"
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-1">
                            البريد الإلكتروني
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                            required
                        />
                    </div>

                    {updateError && <p className="text-red-400 text-sm">{updateError}</p>}

                    <button 
                        type="submit" 
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
                    >
                        حفظ التغييرات
                    </button>
                </form>

                {/* تغيير كلمة المرور */}
                <div className="border-t border-blue-400/20 pt-4">
                    <h3 className="text-xl font-bold text-white mb-4 text-center">تغيير كلمة المرور</h3>
                    <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-blue-200 mb-1">
                                كلمة المرور الحالية
                            </label>
                            <input
                                type="password"
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-blue-200 mb-1">
                                كلمة المرور الجديدة
                            </label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-blue-200 mb-1">
                                تأكيد كلمة المرور الجديدة
                            </label>
                            <input
                                type="password"
                                id="confirmNewPassword"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="w-full p-3 bg-slate-700/50 border border-blue-400/20 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                                required
                            />
                        </div>

                        {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}

                        <button 
                            type="submit" 
                            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-orange-700 transition-all duration-300"
                        >
                            تغيير كلمة المرور
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
