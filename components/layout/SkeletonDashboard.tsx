import React from 'react';
import { t } from '../../translations';

const Shimmer: React.FC<{ className?: string; darkMode?: boolean }> = ({ className, darkMode = false }) => (
    <div className={`absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-${darkMode ? 'slate-700/80' : 'slate-200/80'} to-transparent ${className}`}></div>
);

const SkeletonCard: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => (
    <div className="glass-card p-6 h-96 relative overflow-hidden">
        <div className={`h-6 w-1/2 rounded mb-6 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
        <div className="space-y-4">
            <div className={`h-4 w-full rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            <div className={`h-4 w-5/6 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            <div className={`h-4 w-full rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            <div className={`h-4 w-3/4 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
        </div>
        <Shimmer darkMode={darkMode} />
    </div>
);

const SkeletonDashboard: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => {
    return (
        <div className="container mx-auto px-2 sm:px-4 max-w-7xl mt-8 mb-20">
            {/* Header placeholder */}
             <div className="h-16 mb-3"></div>
            <div className={`flex flex-wrap justify-center mb-8 rounded-xl p-2 h-14 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    );
};

export default SkeletonDashboard;