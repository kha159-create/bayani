import React from 'react';

interface DarkModeToggleProps {
    darkMode: boolean;
    onToggle: () => void;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ darkMode, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                darkMode ? 'bg-blue-600' : 'bg-slate-200'
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
            <span className="absolute left-1 top-1 text-xs">
                {darkMode ? '🌙' : '☀️'}
            </span>
        </button>
    );
};

export default DarkModeToggle;
