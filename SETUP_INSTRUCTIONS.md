# تعليمات إعداد Bayani للتشغيل المحلي

## 🚀 إعداد متغيرات البيئة

### 1. إعداد Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد أو استخدم مشروع موجود
3. اذهب إلى "Project Settings" > "General"
4. في قسم "Your apps"، اضغط "Add app" واختر "Web"
5. سجل اسم التطبيق (مثل: "Bayani")
6. انسخ إعدادات Firebase إلى ملف `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. إعداد Firestore Database

1. في Firebase Console، اذهب إلى "Firestore Database"
2. اضغط "Create database"
3. اختر "Start in test mode" (للاختبار)
4. اختر موقع قاعدة البيانات (الأقرب لك)

### 3. إعداد Authentication

1. في Firebase Console، اذهب إلى "Authentication"
2. اضغط "Get started"
3. اذهب إلى "Sign-in method"
4. فعّل "Email/Password"

### 4. إعداد قواعد Firestore

في Firebase Console > Firestore Database > Rules، استبدل القواعد بـ:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. إعداد Gemini API

1. اذهب إلى [Google AI Studio](https://aistudio.google.com/)
2. سجل دخول بحساب Google
3. اضغط "Get API Key"
4. أنشئ مفتاح جديد
5. انسخ المفتاح إلى ملف `.env.local`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 📁 ملف .env.local النهائي

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Gemini API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# App Configuration
VITE_APP_ENVIRONMENT=development
```

## 🏃‍♂️ تشغيل التطبيق

```bash
# تثبيت المتطلبات
npm install

# تشغيل التطبيق في وضع التطوير
npm run dev

# بناء التطبيق للإنتاج
npm run build
```

## ✅ التحقق من الإعداد

بعد تشغيل التطبيق، تحقق من:

1. **Console Logs**: يجب أن ترى رسائل نجاح للإعدادات
2. **Firebase**: يجب أن يعمل تسجيل الدخول/التسجيل
3. **Gemini**: يجب أن يعمل المحلل الذكي
4. **التصميم**: يجب أن ترى الهوية الجديدة "Bayani"

## 🔧 استكشاف الأخطاء

### مشاكل شائعة:

1. **"Firebase غير مهيأ"**: تحقق من متغيرات البيئة
2. **"Gemini API Error"**: تحقق من مفتاح API
3. **"Permission denied"**: تحقق من قواعد Firestore
4. **تصميم لا يظهر**: تأكد من تحديث المتصفح (Ctrl+F5)

## 📞 الدعم

إذا واجهت مشاكل، تحقق من:
- Console في المتصفح للأخطاء
- ملف `.env.local` موجود وصحيح
- جميع المتغيرات مملوءة بقيم صحيحة
- Firebase و Gemini يعملان بشكل صحيح

---

**تم تطوير Bayani باستخدام أحدث التقنيات لضمان الأداء الأمثل والأمان الكامل لبياناتك المالية.**


