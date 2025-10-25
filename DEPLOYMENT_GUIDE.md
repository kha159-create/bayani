# 🚀 دليل نشر Bayani على GitHub

## 📍 **معلومات المستودع:**
- **المستودع**: `kha159-create/bayani`
- **الرابط**: https://github.com/kha159-create/bayani
- **التطبيق**: Bayani - لوحة التحكم المالية الذكية

## 🌐 **الروابط المهمة:**

### 🔗 **روابط GitHub:**
- **المستودع الرئيسي**: https://github.com/kha159-create/bayani
- **الصفحة الرئيسية**: https://github.com/kha159-create/bayani#readme
- **المشاكل (Issues)**: https://github.com/kha159-create/bayani/issues
- **الطلبات (Pull Requests)**: https://github.com/kha159-create/bayani/pulls

### 🚀 **روابط النشر:**
- **GitHub Pages**: https://kha159-create.github.io/bayani
- **التطبيق المباشر**: https://kha159-create.github.io/bayani/fd/

## 📋 **معلومات المشروع:**

### 🎯 **الوصف:**
```
Bayani - لوحة التحكم المالية الذكية مع الذكاء الاصطناعي
تطبيق إدارة مالية شخصية متطور يستخدم الذكاء الاصطناعي لتسهيل إدارة الأموال الشخصية
```

### 🏷️ **العلامات (Tags):**
- `financial-dashboard`
- `react`
- `typescript`
- `firebase`
- `gemini-ai`
- `pwa`
- `arabic`
- `bayani`

### 📊 **الإحصائيات:**
- **اللغة الأساسية**: TypeScript
- **الإطار**: React + Vite
- **قاعدة البيانات**: Firebase
- **الذكاء الاصطناعي**: Gemini AI
- **التصميم**: Tailwind CSS

## 🔧 **إعدادات النشر:**

### 📁 **هيكل المشروع:**
```
bayani/
├── public/
│   ├── logo.jpg
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── components/
│   ├── services/
│   └── utils/
├── .env.local
├── package.json
└── README.md
```

### ⚙️ **متغيرات البيئة:**
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Gemini API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key

# App Configuration
VITE_APP_ENVIRONMENT=production
```

## 🚀 **خطوات النشر:**

### 1. **نسخ المستودع:**
```bash
git clone https://github.com/kha159-create/bayani.git
cd bayani
```

### 2. **تثبيت المتطلبات:**
```bash
npm install
```

### 3. **إعداد متغيرات البيئة:**
```bash
# انسخ ملف .env.local
cp .env.example .env.local

# املأ المفاتيح المطلوبة
# Firebase API Keys
# Gemini API Key
```

### 4. **تشغيل التطبيق محلياً:**
```bash
npm run dev
```

### 5. **بناء التطبيق للإنتاج:**
```bash
npm run build
```

### 6. **معاينة الإنتاج:**
```bash
npm run preview
```

## 🌐 **النشر على GitHub Pages:**

### 📋 **إعدادات GitHub Pages:**
1. اذهب إلى **Settings** في المستودع
2. انتقل إلى **Pages** في القائمة الجانبية
3. اختر **Source**: Deploy from a branch
4. اختر **Branch**: main
5. اختر **Folder**: / (root)
6. اضغط **Save**

### 🔄 **النشر التلقائي:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm install
    - name: Build
      run: npm run build
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## 📱 **ميزات التطبيق:**

### 🎨 **الهوية الجديدة:**
- **الاسم**: Bayani
- **الشعار**: صورة مخصصة
- **الألوان**: #031A2E إلى #052E4D
- **الخطوط**: Cairo للعناوين، Tajawal للنصوص

### 🤖 **الذكاء الاصطناعي:**
- **Gemini AI**: تحليل مالي ذكي
- **المحلل الذكي**: نصائح مالية شخصية
- **تحليل النصوص**: تصنيف تلقائي للمعاملات

### 🔥 **Firebase:**
- **المصادقة**: تسجيل دخول آمن
- **قاعدة البيانات**: تخزين البيانات
- **النسخ السحابية**: نسخ احتياطية تلقائية

### 📊 **الميزات المالية:**
- **إدارة المعاملات**: إضافة وتتبع المعاملات
- **البطاقات الائتمانية**: إدارة الديون والحدود
- **الحسابات البنكية**: تتبع الأرصدة
- **الأقساط**: إدارة أقساط تابي وتمارا
- **الاستثمار**: تتبع المحفظة الاستثمارية

## 🔧 **التطوير:**

### 📝 **إضافة ميزات جديدة:**
1. إنشاء فرع جديد: `git checkout -b feature/new-feature`
2. تطوير الميزة
3. رفع التغييرات: `git push origin feature/new-feature`
4. إنشاء Pull Request

### 🐛 **إصلاح الأخطاء:**
1. إنشاء فرع للأخطاء: `git checkout -b bugfix/fix-name`
2. إصلاح الخطأ
3. رفع التغييرات
4. إنشاء Pull Request

### 📋 **إدارة المشاكل:**
- استخدم **Issues** لتتبع المشاكل
- استخدم **Projects** لإدارة المهام
- استخدم **Milestones** لتتبع الإصدارات

## 📞 **الدعم:**

### 🆘 **المساعدة:**
- **GitHub Issues**: للإبلاغ عن المشاكل
- **Discussions**: للمناقشات والأفكار
- **Wiki**: للوثائق التفصيلية

### 📧 **التواصل:**
- **البريد الإلكتروني**: kha.als@outlook.com
- **الهاتف**: 966567028690

## 🎉 **النتيجة النهائية:**

✅ **التطبيق منشور على GitHub**
✅ **متاح للجمهور**
✅ **يمكن التطوير عليه**
✅ **يمكن النشر منه**

**🚀 Bayani جاهز للعالم!**
