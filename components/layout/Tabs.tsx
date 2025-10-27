import React, { useState } from 'react';
import { Tab } from '../../types';
import { HomeIcon, ChartBarIcon, ListBulletIcon, EllipsisIcon } from '../common/Icons';
import { t } from '../../translations';

interface TabsProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    language?: 'ar' | 'en';
}

const getTabs = (language: 'ar' | 'en' = 'ar'): { id: Tab; label: string; icon?: React.FC<{className?: string}> }[] => [
    { id: 'summary', label: `📊 ${t('tab.summary', language)}`, icon: HomeIcon },
    { id: 'transactions', label: `💳 ${t('tab.transactions', language)}`, icon: ListBulletIcon },
    { id: 'budget', label: `✨ ${t('tab.budget', language)}` },
    { id: 'investment', label: `💹 ${t('tab.investment', language)}` },
    { id: 'ai-assistant', label: `🤖 ${t('tab.ai.assistant', language)}` },
    { id: 'cards', label: `💳 ${t('tab.cards', language)}` },
    { id: 'bank', label: `🏦 ${t('tab.bank', language)}` },
    { id: 'installments', label: `📱 ${t('tab.installments', language)}` },
    { id: 'debts-loans', label: `📊 ${t('tab.debts.loans', language)}` },
    { id: 'settings', label: `⚙️ ${t('tab.settings', language)}` },
];

const mainMobileTabs: Tab[] = ['summary', 'transactions'];

const TabsComponent: React.FC<TabsProps> = ({ activeTab, setActiveTab, language = 'ar' }) => {
    const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);
    const ALL_TABS = getTabs(language);

    const handleTabClick = (tabId: Tab) => {
        setActiveTab(tabId);
        setMoreMenuOpen(false);
    };

    const mainTabs = ALL_TABS.filter(tab => mainMobileTabs.includes(tab.id));
    const moreTabs = ALL_TABS.filter(tab => !mainMobileTabs.includes(tab.id));

    return (
        <>
            {/* Top Bar for Desktop */}
            <div className="hidden md:flex flex-wrap justify-center mb-8 bg-gradient-to-r from-[#031A2E]/50 to-[#052E4D]/50 backdrop-blur-lg border border-blue-400/20 rounded-xl p-2 shadow-lg">
                {ALL_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={`px-4 py-2 mx-1 mb-1 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all duration-300 ${
                            activeTab === tab.id 
                                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg' 
                                : 'text-blue-200 hover:bg-blue-800/30 hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Bottom Nav for Mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-r from-[#031A2E]/95 to-[#052E4D]/95 backdrop-blur-lg border-t border-blue-400/20 z-40 flex justify-around items-center shadow-lg">
                {mainTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => handleTabClick(tab.id)} className={`flex flex-col items-center justify-center gap-1 transition-colors w-full h-full ${activeTab === tab.id ? 'text-cyan-400' : 'text-blue-200 hover:text-white'}`}>
                            {Icon && <Icon />}
                            <span className="text-xs">{tab.label.split(' ')[1]}</span>
                        </button>
                    )
                })}
                 <button onClick={() => setMoreMenuOpen(!isMoreMenuOpen)} className={`flex flex-col items-center justify-center gap-1 transition-colors w-full h-full ${isMoreMenuOpen ? 'text-cyan-400' : 'text-blue-200 hover:text-white'}`}>
                    <EllipsisIcon />
                    <span className="text-xs">المزيد</span>
                </button>
            </div>

            {/* More Menu Modal for Mobile */}
            {isMoreMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-end" onClick={() => setMoreMenuOpen(false)}>
                    <div className="bg-gradient-to-br from-[#031A2E] to-[#052E4D] w-full rounded-t-2xl p-4 border-t border-blue-400/20 animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-1 bg-blue-400/50 rounded-full mx-auto mb-4"></div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            {moreTabs.map(tab => (
                                <button key={tab.id} onClick={() => handleTabClick(tab.id)} className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-all duration-300 ${activeTab === tab.id ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg' : 'bg-slate-700/50 text-blue-200 hover:bg-blue-800/30 hover:text-white'}`}>
                                    <span className="text-2xl">{tab.label.split(' ')[0]}</span>
                                    <span className="text-xs font-semibold">{tab.label.split(' ')[1]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TabsComponent;