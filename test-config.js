// اختبار متغيرات البيئة في Vite
import { config } from './config.js';

console.log('🔍 اختبار متغيرات البيئة في Vite:');
console.log('Firebase API Key:', config.firebase.apiKey ? '✅ موجود' : '❌ مفقود');
console.log('Firebase Project ID:', config.firebase.projectId ? '✅ موجود' : '❌ مفقود');
console.log('Gemini API Key:', config.gemini.apiKey ? '✅ موجود' : '❌ مفقود');

console.log('\n📊 تفاصيل الإعدادات:');
console.log('Firebase API Key:', config.firebase.apiKey);
console.log('Firebase Project ID:', config.firebase.projectId);
console.log('Gemini API Key:', config.gemini.apiKey ? 'مخفي' : 'غير موجود');

