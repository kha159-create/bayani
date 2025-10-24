import React, { useEffect, useState } from 'react';
import { t } from '../../translations';

interface NotificationManagerProps {
    notifications: boolean;
    onToggle: () => void;
    language?: 'ar' | 'en';
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ notifications, onToggle, language = 'ar' }) => {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setPermission(permission);
        }
    };

    const showNotification = (title: string, body: string) => {
        if (notifications && permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/icon-192.png',
                badge: '/icon-192.png'
            });
        }
    };

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
                {t('notifications', language)}
            </span>
            <button
                onClick={onToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    notifications ? 'bg-blue-600' : 'bg-slate-200'
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
                <span className="absolute left-1 top-1 text-xs">
                    {notifications ? '🔔' : '🔕'}
                </span>
            </button>
            {permission !== 'granted' && notifications && (
                <button
                    onClick={requestPermission}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
{t('enable.notifications', language)}
                </button>
            )}
        </div>
    );
};

export default NotificationManager;
