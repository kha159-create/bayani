import React, { useState } from 'react';
import { firebaseService } from '../../services/firebaseService';
import { t } from '../../translations';

interface AuthFormProps {
    onSuccess: (user: any) => void;
    onClose: () => void;
    hideCloseButton?: boolean;
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, onClose, hideCloseButton = false, darkMode = false, language = 'ar' }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let result;
            if (isLogin) {
                result = await firebaseService.signIn(formData.email, formData.password);
            } else {
                if (!formData.displayName.trim()) {
                    setError('الاسم مطلوب');
                    setLoading(false);
                    return;
                }
                result = await firebaseService.signUp(formData.email, formData.password, formData.displayName);
            }

            if (result.success) {
                onSuccess(result.user);
            } else {
                setError(result.error || 'حدث خطأ غير متوقع');
            }
        } catch (error) {
            setError('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className={`${hideCloseButton ? '' : 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] overflow-hidden'} flex items-center justify-center p-4`} style={hideCloseButton ? {} : { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-gradient-to-br from-[#031A2E]/85 to-[#052E4D]/85 backdrop-blur-2xl border border-blue-400/20 rounded-3xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
                {!hideCloseButton && (
                    <div className="flex justify-end p-3">
                        <button onClick={onClose} className="text-blue-200 hover:text-white">✕</button>
                    </div>
                )}
                <div className="px-6 pb-6 pt-2">
                    <h2 className="text-center text-2xl font-bold text-white mb-4">
                        {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label htmlFor="displayName" className="sr-only">الاسم الكامل</label>
                                <div className="flex items-center gap-3 bg-slate-800/60 border border-blue-400/20 rounded-2xl px-4 py-3">
                                    <span className="text-blue-300 text-xl">👤</span>
                                    <input
                                        type="text"
                                        id="displayName"
                                        name="displayName"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        className="flex-1 bg-transparent outline-none text-white placeholder-blue-300"
                                        placeholder="الاسم الكامل"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="sr-only">البريد الإلكتروني أو رقم الجوال</label>
                            <div className="flex items-center gap-3 bg-slate-800/60 border border-blue-400/20 rounded-2xl px-4 py-3">
                                <span className="text-blue-300 text-xl">✉️</span>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="flex-1 bg-transparent outline-none text-white placeholder-blue-300"
                                    placeholder="البريد الإلكتروني أو رقم الجوال"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="sr-only">كلمة المرور</label>
                            <div className="flex items-center gap-3 bg-slate-800/60 border border-blue-400/20 rounded-2xl px-4 py-3">
                                <span className="text-blue-300 text-xl">🔒</span>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="flex-1 bg-transparent outline-none text-white placeholder-blue-300"
                                    placeholder="كلمة المرور"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60 transition-colors shadow-lg"
                        >
                            {loading ? '⏳ جاري المعالجة...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-300 hover:text-white font-medium"
                        >
                            {isLogin ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
