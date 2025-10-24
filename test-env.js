// اختبار متغيرات البيئة
console.log('🔍 اختبار متغيرات البيئة:');
console.log('VITE_FIREBASE_API_KEY:', process.env.VITE_FIREBASE_API_KEY ? '✅ موجود' : '❌ مفقود');
console.log('VITE_FIREBASE_PROJECT_ID:', process.env.VITE_FIREBASE_PROJECT_ID ? '✅ موجود' : '❌ مفقود');
console.log('VITE_GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY ? '✅ موجود' : '❌ مفقود');

// قراءة ملف .env.local مباشرة
const fs = require('fs');
const path = require('path');

try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    console.log('\n📄 محتوى ملف .env.local:');
    console.log(envContent);
} catch (error) {
    console.log('❌ خطأ في قراءة ملف .env.local:', error.message);
}

