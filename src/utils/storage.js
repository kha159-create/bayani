// نظام التخزين الهجين: IndexedDB + Firebase Cloud Backup
import localforage from 'localforage';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC7QzF9xZzJ8K9L0M1N2O3P4Q5R6S7T8U9V",
  authDomain: "financial-dashboard-fd.firebaseapp.com",
  projectId: "financial-dashboard-fd",
  storageBucket: "financial-dashboard-fd.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// تهيئة Firebase مع فحص التطبيقات الموجودة
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('🔥 تم إنشاء تطبيق Firebase جديد في storage.js');
} else {
  app = getApp();
  console.log('🔥 تم استخدام تطبيق Firebase الموجود في storage.js');
}
const db = getFirestore(app);

// إعداد IndexedDB
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'MASROF',
  version: 1.0,
  storeName: 'financial_data',
  description: 'تخزين البيانات المالية'
});

// حفظ البيانات محلياً وفي السحابة
export const saveData = async (key, value) => {
  try {
    // حفظ محلياً
    await localforage.setItem(key, value);
    console.log('✅ تم حفظ البيانات محلياً:', key);
    
    // حفظ في السحابة
    await setDoc(doc(db, "userData", key), { 
      value: value,
      timestamp: new Date().toISOString(),
      version: '1.0'
    });
    console.log('☁️ تم حفظ البيانات في السحابة:', key);
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في حفظ البيانات:', error);
    return false;
  }
};

// تحميل البيانات (محلي أولاً، ثم من السحابة)
export const loadData = async (key) => {
  try {
    // محاولة التحميل من التخزين المحلي أولاً
    const localData = await localforage.getItem(key);
    if (localData) {
      console.log('📱 تم تحميل البيانات من التخزين المحلي:', key);
      return localData;
    }
    
    // إذا لم تكن موجودة محلياً، جرب السحابة
    const docRef = doc(db, "userData", key);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const cloudData = docSnap.data().value;
      // حفظ في التخزين المحلي للاستخدام المستقبلي
      await localforage.setItem(key, cloudData);
      console.log('☁️ تم تحميل البيانات من السحابة وحفظها محلياً:', key);
      return cloudData;
    }
    
    console.log('⚠️ لم يتم العثور على البيانات:', key);
    return null;
  } catch (error) {
    console.error('❌ خطأ في تحميل البيانات:', error);
    return null;
  }
};

// حفظ جميع البيانات في السحابة
export const saveToCloud = async (data) => {
  try {
    const timestamp = new Date().toISOString();
    const backupData = {
      ...data,
      backupTimestamp: timestamp,
      version: '1.0'
    };
    
    await setDoc(doc(db, "backups", `backup_${Date.now()}`), backupData);
    console.log('☁️ تم حفظ النسخة الاحتياطية في السحابة');
    return true;
  } catch (error) {
    console.error('❌ خطأ في حفظ النسخة الاحتياطية في السحابة:', error);
    return false;
  }
};

// استعادة البيانات من السحابة
export const restoreFromCloud = async () => {
  try {
    console.log('🔄 بدء استعادة البيانات من السحابة...');
    
    // الحصول على آخر نسخة احتياطية
    const backupsRef = collection(db, "backups");
    const snapshot = await getDocs(backupsRef);
    
    if (snapshot.empty) {
      throw new Error('لا توجد نسخ احتياطية في السحابة');
    }
    
    // العثور على أحدث نسخة احتياطية
    let latestBackup = null;
    let latestTimestamp = '';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.backupTimestamp > latestTimestamp) {
        latestTimestamp = data.backupTimestamp;
        latestBackup = data;
      }
    });
    
    if (!latestBackup) {
      throw new Error('لم يتم العثور على نسخة احتياطية صالحة');
    }
    
    // استعادة البيانات
    const keys = [
      'transactions', 'categories', 'cards', 'bankAccounts', 
      'installments', 'loans', 'investments', 'settings'
    ];
    
    let restoredCount = 0;
    for (const key of keys) {
      if (latestBackup[key]) {
        await localforage.setItem(key, latestBackup[key]);
        await setDoc(doc(db, "userData", key), {
          value: latestBackup[key],
          timestamp: new Date().toISOString(),
          version: '1.0'
        });
        restoredCount++;
      }
    }
    
    console.log(`✅ تم استعادة ${restoredCount} مجموعة بيانات من السحابة`);
    return {
      success: true,
      message: `تم استعادة ${restoredCount} مجموعة بيانات من السحابة`,
      timestamp: latestBackup.backupTimestamp
    };
    
  } catch (error) {
    console.error('❌ خطأ أثناء الاستعادة من السحابة:', error);
    return {
      success: false,
      message: error.message || 'حدث خطأ أثناء استعادة البيانات من السحابة'
    };
  }
};

// تحميل ملف النسخة الاحتياطية
export const downloadBackup = async () => {
  try {
    const allData = {};
    const keys = [
      'transactions', 'categories', 'cards', 'bankAccounts', 
      'installments', 'loans', 'investments', 'settings'
    ];
    
    for (const key of keys) {
      const data = await localforage.getItem(key);
      if (data) {
        allData[key] = data;
      }
    }
    
    const backupData = {
      ...allData,
      backupTimestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `masrof-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    console.log('💾 تم تحميل ملف النسخة الاحتياطية');
    return true;
  } catch (error) {
    console.error('❌ خطأ في تحميل النسخة الاحتياطية:', error);
    return false;
  }
};

// استعادة من ملف
export const restoreFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        
        // التحقق من صحة البيانات
        if (!backupData.version || !backupData.backupTimestamp) {
          throw new Error('ملف النسخة الاحتياطية غير صالح');
        }
        
        const keys = [
          'transactions', 'categories', 'cards', 'bankAccounts', 
          'installments', 'loans', 'investments', 'settings'
        ];
        
        let restoredCount = 0;
        for (const key of keys) {
          if (backupData[key]) {
            await localforage.setItem(key, backupData[key]);
            restoredCount++;
          }
        }
        
        console.log(`✅ تم استعادة ${restoredCount} مجموعة بيانات من الملف`);
        resolve({
          success: true,
          message: `تم استعادة ${restoredCount} مجموعة بيانات من الملف`,
          timestamp: backupData.backupTimestamp
        });
        
      } catch (error) {
        console.error('❌ خطأ في استعادة الملف:', error);
        reject({
          success: false,
          message: error.message || 'حدث خطأ أثناء استعادة البيانات من الملف'
        });
      }
    };
    
    reader.onerror = () => {
      reject({
        success: false,
        message: 'خطأ في قراءة الملف'
      });
    };
    
    reader.readAsText(file);
  });
};

// مسح جميع البيانات
export const clearAllData = async () => {
  try {
    await localforage.clear();
    console.log('🗑️ تم مسح جميع البيانات المحلية');
    return true;
  } catch (error) {
    console.error('❌ خطأ في مسح البيانات:', error);
    return false;
  }
};

// الحصول على معلومات التخزين
export const getStorageInfo = async () => {
  try {
    const keys = await localforage.keys();
    const info = {
      totalKeys: keys.length,
      keys: keys,
      estimatedSize: await localforage.length()
    };
    
    return info;
  } catch (error) {
    console.error('❌ خطأ في الحصول على معلومات التخزين:', error);
    return null;
  }
};
