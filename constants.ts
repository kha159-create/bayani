import { AppState } from './types';

export const getInitialState = (): AppState => ({
  transactions: [],
  categories: [
    { id: 'cat-1', name: 'بقالة', icon: '🛒' },
    { id: 'cat-2', name: 'مطاعم', icon: '🍔' },
    { id: 'cat-3', name: 'وقود', icon: '⛽' },
    { id: 'cat-4', name: 'فواتير', icon: '🧾' },
    { id: 'cat-9', name: 'سداد فواتير', icon: '💳' },
    { id: 'cat-5', name: 'تسوق', icon: '🛍️' },
    { id: 'cat-6', name: 'إيجار', icon: '🏠' },
    { id: 'cat-8', name: 'صيدلية', icon: '💊' },
    { id: 'cat-7', name: 'أخرى', icon: '💸' },
  ],
  installments: [],
  investments: {
      currentValue: 0
  },
  cards: {
    'snb-card': { id: 'snb-card', name: 'SNB الأهلي', limit: 26000, dueDay: 15, statementDay: 25, smsSamples: ['SNB', 'الأهلي', 'إئتمانية'] },
    'enbd-card': { id: 'enbd-card', name: 'ENBD الإمارات', limit: 10000, dueDay: 18, statementDay: 28, smsSamples: ['ENBD', 'الإمارات', 'Visa card'] },
  },
  bankAccounts: {
    'bank-default': { id: 'bank-default', name: 'حساب البنك', balance: 0, currency: 'SAR', smsSamples: ['مدى', 'mada', 'Alrajhi', 'الراجحي', 'Inma', 'الإنماء', 'بنك'] }
  },
           loans: {},
           debtsToMe: {},
           debtsFromMe: {},
           settings: {
               darkMode: false,
               language: 'ar',
               notifications: true
           }
         });
