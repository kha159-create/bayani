import React, { useState } from 'react';
import { firebaseService } from '../../services/firebaseService';
import { t } from '../../translations';

interface UserProfileProps {
    user: any;
    onSignOut: () => void;
    darkMode?: boolean;
    language?: 'ar' | 'en';
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onSignOut, darkMode = false, language = 'ar' }) => {
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            const result = await firebaseService.signOut();
            if (result.success) {
                onSignOut();
            }
        } catch (error) {
            console.error('خطأ في تسجيل الخروج:', error);
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <div className="text-right">
                <p className="font-semibold text-slate-800">{user.displayName || 'المستخدم'}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </span>
            </div>
            <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
                {isSigningOut ? '⏳' : '🚪 خروج'}
            </button>
        </div>
    );
};

export default UserProfile;
