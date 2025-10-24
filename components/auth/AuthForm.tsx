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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">
                            {isLogin ? '🔐 تسجيل الدخول' : '📝 إنشاء حساب جديد'}
                        </h2>
                        {!hideCloseButton && (
                            <button 
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">
                                    الاسم الكامل
                                </label>
                                <input
                                    type="text"
                                    id="displayName"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="أدخل اسمك الكامل"
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                البريد الإلكتروني
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="example@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                                كلمة المرور
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="كلمة المرور"
                                required
                                minLength={6}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
                        >
                            {loading ? '⏳ جاري المعالجة...' : (isLogin ? '🔐 تسجيل الدخول' : '📝 إنشاء حساب')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
