

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { PlusIcon } from '../common/Icons';
import { t } from '../../translations';

interface HeaderProps {
    selectedYear: number;
    selectedMonth: number | 'all';
    onYearChange: (year: number) => void;
    onMonthChange: (month: number | 'all') => void;
    onAddTransaction: () => void;
    currentUser: any;
    onSignOut: () => void;
    language?: 'ar' | 'en';
    darkMode?: boolean;
    notifications?: boolean;
    onToggleDarkMode?: () => void;
    onToggleNotifications?: () => void;
    onToggleLanguage?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    selectedYear, 
    selectedMonth, 
    onYearChange, 
    onMonthChange, 
    onAddTransaction, 
    currentUser, 
    onSignOut, 
    language = 'ar',
    darkMode = false,
    notifications = false,
    onToggleDarkMode,
    onToggleNotifications,
    onToggleLanguage
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear + 1; y >= 2020; y--) {
            years.push(y);
        }
        return years;
    }, []);

    const months = useMemo(() => ([
        { value: 'all', label: 'كل الشهور' },
        { value: 1, label: 'يناير' }, { value: 2, label: 'فبراير' }, { value: 3, label: 'مارس' },
        { value: 4, label: 'أبريل' }, { value: 5, label: 'مايو' }, { value: 6, label: 'يونيو' },
        { value: 7, label: 'يوليو' }, { value: 8, label: 'أغسطس' }, { value: 9, label: 'سبتمبر' },
        { value: 10, label: 'أكتوبر' }, { value: 11, label: 'نوفمبر' }, { value: 12, label: 'ديسمبر' }
    ]), []);

    // إغلاق القائمة المنسدلة عند النقر خارجها
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // الحصول على اسم المستخدم من displayName أو email
    const getUserDisplayName = () => {
        if (currentUser.displayName) {
            return currentUser.displayName;
        }
        if (currentUser.email) {
            // استخراج الجزء قبل @ من الإيميل
            return currentUser.email.split('@')[0];
        }
        return 'المستخدم';
    };

    return (
        <header className="bg-gradient-to-r from-[#031A2E]/80 to-[#052E4D]/80 backdrop-blur-lg border-b border-blue-400/20 py-3 shadow-lg relative z-30">
            <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-right gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shadow-lg">
                            <img src="/bayani/logo.jpg" alt="Bayani Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">بياني</h1>
                            <p className="text-xs text-blue-200">كل شيء عن مالي… في بياني</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 p-1.5 rounded-lg">
                            <select value={selectedYear} onChange={(e) => onYearChange(parseInt(e.target.value))} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold border-0 focus:ring-0 appearance-none p-2 rounded-md">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold border-0 focus:ring-0 appearance-none p-2 rounded-md">
                                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        
                        {/* قائمة المستخدم المنسدلة */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <div className="text-right">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{getUserDisplayName()}</p>
                                </div>
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-bold text-sm">
                                        {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <svg 
                                    className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* القائمة المنسدلة */}
                            {isDropdownOpen && (
                                <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-[9999]">
                                    {/* معلومات المستخدم */}
                                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{getUserDisplayName()}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                                    </div>


                                    {/* الإشعارات */}
                                    <button
                                        onClick={() => {
                                            onToggleNotifications?.();
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{notifications ? '🔔' : '🔕'}</span>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {t('notifications', language)}
                                            </span>
                                        </div>
                                        <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                            notifications ? 'bg-blue-600' : 'bg-slate-200'
                                        }`}>
                                            <span
                                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                                    notifications ? 'translate-x-5' : 'translate-x-1'
                                                }`}
                                            />
                                        </div>
                                    </button>

                                    {/* اللغة */}
                                    <button
                                        onClick={() => {
                                            onToggleLanguage?.();
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">🌐</span>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {t('language', language)}
                                            </span>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                            darkMode ? 'bg-blue-500' : 'bg-blue-600'
                                        }`}>
                                            <span className="text-white font-bold text-xs">
                                                {language === 'ar' ? 'A' : 'E'}
                                            </span>
                                        </div>
                                    </button>

                                    {/* خط فاصل */}
                                    <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>

                                    {/* الخروج */}
                                    <button
                                        onClick={() => {
                                            onSignOut();
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                                    >
                                        <span className="text-lg">🚪</span>
                                        <span className="text-sm font-medium">خروج</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <button onClick={onAddTransaction} className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-all duration-300">
                            <PlusIcon className="w-5 h-5" />
                            <span>{t('add.transaction', language)}</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;