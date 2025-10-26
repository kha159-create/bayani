
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { PlusIcon } from '../common/Icons';
import { t } from '../../translations';

interface HeaderProps {
    selectedYear: number;
    selectedMonth: number | 'all';
    onYearChange: (year: number) => void;
    onMonthChange: (month: number | 'all') => void;
    currentUser: any;
    onSignOut: () => void;
    onOpenProfile: () => void;
    getUserDisplayName: () => string;
}

const Header: React.FC<HeaderProps> = ({ 
    selectedYear, 
    selectedMonth, 
    onYearChange, 
    onMonthChange, 
    currentUser, 
    onSignOut,
    onOpenProfile,
    getUserDisplayName
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [greeting, setGreeting] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // تحديد التحية حسب الوقت
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setGreeting('صباح الخير');
        } else if (hour >= 12 && hour < 17) {
            setGreeting('مساء الخير');
        } else {
            setGreeting('مساء الخير');
        }
    }, []);

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

    return (
        <header className="relative z-30">
            {/* الهيدر مع منحنى نصف دائرة */}
            <div className="bg-gradient-to-r from-[#031A2E]/90 to-[#052E4D]/90 backdrop-blur-xl shadow-2xl pb-8 md:pb-12 relative overflow-visible">
                {/* منحنى نصف دائرة */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-screen-2xl">
                    <div className="relative w-full h-16 md:h-24 overflow-hidden">
                        {/* نصف دائرة */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-24 md:h-32 bg-gradient-to-r from-[#031A2E]/90 to-[#052E4D]/90 rounded-t-full"></div>
                        {/* التاريخ في المنتصف */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 transform -translate-y-6 md:-translate-y-8 z-10">
                            <div className="bg-gradient-to-r from-slate-800/90 to-blue-900/90 backdrop-blur-lg border-2 border-cyan-400/40 rounded-2xl shadow-2xl px-3 py-2 md:px-4 md:py-3">
                                <div className="flex items-center gap-2 md:gap-3 text-white">
                                    <select 
                                        value={selectedYear} 
                                        onChange={(e) => onYearChange(parseInt(e.target.value))} 
                                        className="bg-transparent text-cyan-300 font-bold text-xs md:text-base border-0 focus:ring-0 appearance-none cursor-pointer hover:text-white transition-colors min-w-[60px] md:min-w-[80px] text-center"
                                    >
                                        {years.map(y => <option key={y} value={y} className="bg-slate-800 text-white">{y}</option>)}
                                    </select>
                                    <div className="w-px h-5 md:h-6 bg-cyan-400/30"></div>
                                    <select 
                                        value={selectedMonth} 
                                        onChange={(e) => onMonthChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} 
                                        className="bg-transparent text-cyan-300 font-bold text-xs md:text-base border-0 focus:ring-0 appearance-none cursor-pointer hover:text-white transition-colors min-w-[80px] md:min-w-[120px] text-center"
                                    >
                                        {months.map(m => <option key={m.value} value={m.value} className="bg-slate-800 text-white">{m.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="container mx-auto px-2 md:px-4 pt-2 md:pt-4">
                    <div className="flex justify-between items-center gap-2 overflow-x-auto">
                        {/* اليسار: شعار التطبيق واسمه */}
                        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden shadow-lg bg-white border border-blue-400/30 p-1">
                                <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="Bayani Logo" className="w-full h-full object-contain rounded-lg" />
                            </div>
                            <div className="text-right hidden sm:block">
                                <h1 className="text-base md:text-xl font-bold text-white tracking-wide">بياني</h1>
                                <p className="text-xs text-white font-medium">كل شيء عن مالي… في بياني</p>
                            </div>
                        </div>

                        {/* اليمين: صورة المستخدم واسمه */}
                        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="text-right hidden sm:block text-white font-semibold text-sm md:text-lg hover:text-cyan-400 transition-colors"
                            >
                                {greeting}، {getUserDisplayName().split(' ')[0]}
                            </button>
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shadow-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 p-0.5 md:p-1 hover:scale-105 transition-transform duration-300"
                                >
                                    {currentUser?.photoURL ? (
                                        <img 
                                            src={currentUser.photoURL} 
                                            alt="User Avatar" 
                                            className="w-full h-full object-cover rounded-full" 
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">
                                                {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </button>
                                
                                {/* قائمة المستخدم المنسدلة */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-72 bg-gradient-to-br from-slate-800/95 to-blue-900/95 backdrop-blur-lg border border-blue-400/20 rounded-xl shadow-2xl z-[100]">
                                        {/* معلومات المستخدم */}
                                        <div className="p-4 border-b border-blue-400/20">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                                                    {currentUser?.photoURL ? (
                                                        <img src={currentUser.photoURL} alt="User Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-white font-bold text-xl">
                                                            {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{getUserDisplayName()}</h3>
                                                    <p className="text-sm text-blue-200">{currentUser?.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* خيارات القائمة */}
                                        <div className="py-2">
                                            <button
                                                onClick={() => {
                                                    onOpenProfile();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="block w-full text-right px-4 py-3 text-blue-200 hover:text-white hover:bg-blue-500/20 transition-colors flex items-center gap-3"
                                            >
                                                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                الملف الشخصي
                                            </button>
                                            <button className="block w-full text-right px-4 py-3 text-blue-200 hover:text-white hover:bg-blue-500/20 transition-colors flex items-center gap-3">
                                                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
                                                </svg>
                                                الإشعارات
                                            </button>
                                            <div className="border-t border-blue-400/20 mt-2 pt-2">
                                                <button
                                                    onClick={() => {
                                                        onSignOut();
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="block w-full text-right px-4 py-3 text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-colors flex items-center gap-3"
                                                >
                                                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    تسجيل الخروج
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;