# 🚀 إعداد GitHub Pages لـ Bayani

## ⚠️ **خطوات مهمة يجب اتباعها:**

### 1. **تفعيل GitHub Pages:**
```
1. اذهب إلى المستودع: https://github.com/kha159-create/bayani
2. اضغط على "Settings" في أعلى الصفحة
3. انتقل إلى "Pages" في القائمة الجانبية
4. في قسم "Source"، اختر "GitHub Actions"
5. احفظ الإعدادات
```

### 2. **التحقق من Secrets:**
```
1. في نفس الصفحة، انتقل إلى "Secrets and variables" > "Actions"
2. تأكد من وجود هذه المفاتيح:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_AUTH_DOMAIN
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_STORAGE_BUCKET
   - VITE_FIREBASE_MESSAGING_SENDER_ID
   - VITE_FIREBASE_APP_ID
   - VITE_GEMINI_API_KEY
```

### 3. **تشغيل GitHub Actions:**
```
1. اذهب إلى تبويب "Actions" في المستودع
2. اضغط على "Deploy Bayani to GitHub Pages"
3. اضغط على "Run workflow"
4. اختر "main" branch
5. اضغط "Run workflow"
```

### 4. **التحقق من النشر:**
```
1. انتظر حتى يكتمل البناء (Build)
2. انتظر حتى يكتمل النشر (Deploy)
3. اذهب إلى "Settings" > "Pages"
4. ستجد الرابط في قسم "GitHub Pages"
```

## 🔧 **إذا لم يعمل:**

### **الحل الأول - إعادة تشغيل Actions:**
```
1. اذهب إلى "Actions"
2. اضغط على آخر workflow
3. اضغط على "Re-run all jobs"
```

### **الحل الثاني - فحص الأخطاء:**
```
1. في صفحة Actions، اضغط على workflow فاشل
2. اضغط على "build" أو "deploy"
3. اقرأ رسائل الخطأ
4. أرسل لي رسالة الخطأ
```

### **الحل الثالث - فحص Secrets:**
```
1. تأكد من أن جميع المفاتيح موجودة
2. تأكد من أن المفاتيح صحيحة
3. لا تحتوي على مسافات إضافية
```

## 🌐 **الروابط المتوقعة:**

### **بعد النشر الناجح:**
- **GitHub Pages**: https://kha159-create.github.io/bayani
- **التطبيق المباشر**: https://kha159-create.github.io/bayani/

### **فحص الحالة:**
- **Actions**: https://github.com/kha159-create/bayani/actions
- **Pages Settings**: https://github.com/kha159-create/bayani/settings/pages

## 📞 **إذا استمرت المشكلة:**

### **أرسل لي:**
1. **لقطة شاشة** من صفحة Actions
2. **رسائل الخطأ** إن وجدت
3. **حالة Secrets** (بدون إظهار القيم)
4. **حالة Pages Settings**

### **معلومات إضافية:**
- **المستودع**: kha159-create/bayani
- **الفرع**: main
- **البيئة**: production

## ✅ **علامات النجاح:**

### **في Actions:**
- ✅ **Build**: نجح بدون أخطاء
- ✅ **Deploy**: نجح بدون أخطاء
- ✅ **Status**: أخضر مع علامة ✓

### **في Pages:**
- ✅ **Source**: GitHub Actions
- ✅ **Status**: ✅ Your site is published at...
- ✅ **URL**: يعمل ويفتح التطبيق

**🎯 الهدف: الحصول على رابط يعمل ويظهر تطبيق Bayani!**
