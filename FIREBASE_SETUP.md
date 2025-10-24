# 🔥 إعداد Firebase - دليل شامل

## ⚠️ حل مشكلة "Missing or insufficient permissions"

### المشكلة:
```
FirebaseError: Missing or insufficient permissions.
```

### السبب:
- قواعد Firestore الافتراضية تمنع الوصول لجميع المستخدمين
- المستخدم غير مسجل دخول أو غير مصرح له

## 🛠️ الحلول:

### الحل 1: تحديث قواعد Firestore (الأفضل)

1. **اذهب إلى Firebase Console:**
   - https://console.firebase.google.com/
   - اختر مشروعك

2. **اذهب إلى Firestore Database:**
   - من القائمة الجانبية > Firestore Database
   - اختر تبويب "Rules"

3. **استبدل القواعد الحالية بهذا الكود:**
   ```javascript
   rules_version = '2';
   
   service cloud.firestore {
     match /databases/{database}/documents {
       // قاعدة عامة: المستخدمون المسجلون فقط يمكنهم الوصول للبيانات
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
       
       // قاعدة محددة للمستخدمين - كل مستخدم يمكنه الوصول لبياناته فقط
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // قاعدة للنسخ الاحتياطية - المستخدمون المسجلون فقط
       match /backups/{backupId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

4. **اضغط "Publish" لحفظ القواعد**

### الحل 2: قواعد مؤقتة للتطوير (غير آمنة)

⚠️ **تحذير: هذه القواعد غير آمنة ولا تستخدم في الإنتاج!**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // يسمح للجميع
    }
  }
}
```

## 🔐 إعداد Authentication

### 1. تفعيل Authentication في Firebase Console:

1. **اذهب إلى Authentication:**
   - من القائمة الجانبية > Authentication
   - اختر تبويب "Sign-in method"

2. **فعل طرق تسجيل الدخول:**
   - **Email/Password**: مفعل افتراضياً
   - **Google**: اختياري
   - **Anonymous**: للاختبار فقط

### 2. إعداد مستخدمين للاختبار:

1. **اذهب إلى تبويب "Users":**
2. **اضغط "Add user":**
3. **أدخل email وكلمة مرور**

## 🧪 اختبار الإعداد

### 1. تحقق من الاتصال:
```javascript
// في console المتصفح
console.log('Firebase config:', window.firebaseConfig);
```

### 2. تحقق من تسجيل الدخول:
```javascript
// في console المتصفح
firebase.auth().onAuthStateChanged(user => {
  console.log('User:', user);
});
```

### 3. اختبار قراءة البيانات:
```javascript
// في console المتصفح
firebase.firestore().collection('users').get()
  .then(snapshot => console.log('Data:', snapshot.docs))
  .catch(error => console.error('Error:', error));
```

## 🔧 استكشاف الأخطاء

### خطأ "Permission denied":
- ✅ تأكد من تسجيل المستخدم دخول
- ✅ تأكد من صحة قواعد Firestore
- ✅ تأكد من صحة مفاتيح Firebase

### خطأ "Network error":
- ✅ تأكد من الاتصال بالإنترنت
- ✅ تأكد من صحة مفاتيح Firebase
- ✅ تحقق من إعدادات Firewall

### خطأ "Invalid API key":
- ✅ تأكد من صحة VITE_FIREBASE_API_KEY
- ✅ تأكد من إضافة المفتاح في GitHub Secrets
- ✅ تأكد من إعادة بناء المشروع بعد تغيير المفاتيح

## 📱 إعداد GitHub Secrets

اذهب إلى Settings > Secrets and variables > Actions في مستودع GitHub وأضف:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🚀 بعد الإعداد

1. **أعد بناء المشروع:**
   ```bash
   npm run build
   ```

2. **ارفع التغييرات:**
   ```bash
   git add .
   git commit -m "Fix Firebase permissions"
   git push origin main
   ```

3. **تحقق من النشر:**
   - انتظر GitHub Actions
   - تحقق من الموقع المنشور

## 📞 الدعم

إذا استمرت المشكلة:
1. تحقق من console المتصفح للأخطاء
2. تحقق من Firebase Console > Functions > Logs
3. تأكد من صحة جميع المفاتيح
4. جرب تسجيل خروج وتسجيل دخول جديد
