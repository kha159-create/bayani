
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
        { value: 1, label: 'يناير' },
        { value: 2, label: 'فبراير' },
        { value: 3, label: 'مارس' },
        { value: 4, label: 'أبريل' },
        { value: 5, label: 'مايو' },
        { value: 6, label: 'يونيو' },
        { value: 7, label: 'يوليو' },
        { value: 8, label: 'أغسطس' },
        { value: 9, label: 'سبتمبر' },
        { value: 10, label: 'أكتوبر' },
        { value: 11, label: 'نوفمبر' },
        { value: 12, label: 'ديسمبر' }
    ]), []);

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

    const getUserDisplayName = () => {
        if (currentUser?.displayName) {
            return currentUser.displayName.split(' ')[0]; // الاسم الأول فقط
        }
        if (currentUser?.email) {
            return currentUser.email.split('@')[0];
        }
        return 'المستخدم';
    };

    return (
        <header className="bg-gradient-to-r from-[#031A2E]/90 to-[#052E4D]/90 backdrop-blur-xl border-b border-blue-400/30 py-4 shadow-2xl relative z-30">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                    {/* اليسار: شعار التطبيق */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 p-1">
                            <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xl">B</span>
                            </div>
                        </div>
                        <div className="text-center sm:text-right">
                            <h1 className="text-2xl font-bold text-white tracking-wide bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">بياني</h1>
                        </div>
                    </div>

                    {/* الوسط: فلتر التاريخ */}
                    <div className="flex items-center gap-3 bg-gradient-to-r from-slate-800/50 to-blue-900/50 backdrop-blur-lg border border-blue-400/20 p-2 rounded-xl shadow-lg">
                        <select value={selectedYear} onChange={(e) => onYearChange(parseInt(e.target.value))} className="bg-transparent text-white font-bold border-0 focus:ring-0 appearance-none p-2 rounded-lg text-center min-w-[80px]">
                            {years.map(y => <option key={y} value={y} className="bg-slate-800 text-white">{y}</option>)}
                        </select>
                        <div className="w-px h-6 bg-blue-400/30"></div>
                        <select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className="bg-transparent text-white font-bold border-0 focus:ring-0 appearance-none p-2 rounded-lg text-center min-w-[120px]">
                            {months.map(m => <option key={m.value} value={m.value} className="bg-slate-800 text-white">{m.label}</option>)}
                        </select>
                    </div>

                    {/* اليمين: صورة المستخدم واسمه */}
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-white font-semibold text-lg">مرحباً، {getUserDisplayName()}</p>
                            <p className="text-blue-200 text-sm">كل شيء عن مالي… في بياني</p>
                        </div>
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-12 h-12 rounded-full overflow-hidden shadow-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 p-1 hover:scale-105 transition-transform duration-300"
                            >
                                <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">
                                        {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </button>
                            
                            {/* قائمة المستخدم المنسدلة */}
                            {isDropdownOpen && (
                                <div className="absolute left-0 mt-2 w-48 bg-gradient-to-br from-slate-800/95 to-blue-900/95 backdrop-blur-lg border border-blue-400/20 rounded-xl shadow-2xl z-50">
                                    <div className="p-2">
                                        <div className="px-3 py-2 text-white font-semibold border-b border-blue-400/20">
                                            {getUserDisplayName()}
                                        </div>
                                        <button
                                            onClick={() => {
                                                onAddTransaction();
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-blue-200 hover:text-white hover:bg-blue-500/20 rounded-lg transition-colors"
                                        >
                                            <PlusIcon />
                                            إضافة حركة
                                        </button>
                                        <button
                                            onClick={() => {
                                                onSignOut();
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            تسجيل الخروج
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;