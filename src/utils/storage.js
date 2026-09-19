// نظام التخزين الهجين: IndexedDB + Firebase Cloud Backup
import localforage from 'localforage';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { config } from '../../config';

// إعداد Firebase عبر متغيرات البيئة
const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
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
export const saveToCloud = async (data, userId) => {
  try {
    const timestamp = new Date().toISOString();
    const backupData = {
      ...data,
      backupTimestamp: timestamp,
      version: '1.0',
      userId: userId || null
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
export const restoreFromCloud = async (userId) => {
  try {
    console.log('🔄 بدء استعادة البيانات من السحابة...');
    
    // الحصول على آخر نسخة احتياطية لِلـ userId المحدد إن توفر
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
      if (userId && data.userId && data.userId !== userId) {
        return; // تخطي نسخ مستخدمين آخرين
      }
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
// Recovery-first export: يجمع البيانات من كل المصادر المتاحة بدون الكتابة فوق أي مصدر.
// السبب: الإصدارات القديمة من بياني استخدمت localStorage وIndexedDB وFirebase في أوقات مختلفة.
export const downloadBackup = async () => {
  try {
    const candidates = [];

    const asState = (value) => {
      if (!value || typeof value !== 'object') return null;
      // بعض النسخ القديمة خزّنت الحالة داخل financialData
      if (value.financialData && typeof value.financialData === 'object') {
        return value.financialData;
      }
      return value;
    };

    const addCandidate = (source, raw) => {
      const state = asState(raw);
      if (!state || !Array.isArray(state.transactions)) return;

      const dates = state.transactions
        .map(t => t && t.date)
        .filter(Boolean)
        .sort();

      candidates.push({
        source,
        state,
        count: state.transactions.length,
        minDate: dates[0] || null,
        maxDate: dates[dates.length - 1] || null,
        lastUpdated: raw?.lastUpdated || raw?.backupTimestamp || state?.lastUpdated || null
      });
    };

    // 1) كل نسخ localStorage القديمة والجديدة، وليس أول مفتاح فقط.
    if (typeof window !== 'undefined') {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith('financial_dashboard_')) continue;
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        try {
          addCandidate(`localStorage:${key}`, JSON.parse(raw));
        } catch (e) {
          console.warn('⚠️ تعذر قراءة نسخة localStorage:', key, e);
        }
      }
    }

    // 2) IndexedDB / localforage legacy snapshot.
    const legacyKeys = [
      'transactions', 'categories', 'cards', 'bankAccounts',
      'installments', 'loans', 'investments', 'settings',
      'debtsToMe', 'debtsFromMe', 'customTransactionTypes', 'customPaymentMethods'
    ];
    const legacyState = {};
    for (const key of legacyKeys) {
      const value = await localforage.getItem(key);
      if (value !== null && value !== undefined) legacyState[key] = value;
    }
    addCandidate('indexedDB:legacy', legacyState);

    // 3) Firebase user document + cloud backups for the currently signed-in user.
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (user) {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
          addCandidate('firebase:users/current', userSnap.data());
        }

        const backupsSnap = await getDocs(collection(db, 'backups'));
        backupsSnap.forEach(item => {
          const backup = item.data();
          if (backup?.userId === user.uid) {
            addCandidate(`firebase:backup:${item.id}`, backup);
          }
        });
      }
    } catch (cloudError) {
      // النسخ المحلي يجب أن ينجح حتى لو Firebase غير متاح.
      console.warn('⚠️ تعذر فحص مصادر Firebase أثناء النسخ الاحتياطي:', cloudError);
    }

    if (candidates.length === 0) {
      throw new Error('لم يتم العثور على أي مصدر بيانات صالح');
    }

    // استخدم أغنى snapshot كقاعدة للإعدادات/الحسابات.
    candidates.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return String(b.maxDate || '').localeCompare(String(a.maxDate || ''));
    });
    const baseState = { ...candidates[0].state };

    // اجمع كل الحركات الفريدة من جميع المصادر حتى لا تضيع فترة موجودة في مصدر آخر.
    const byId = new Map();
    for (const candidate of candidates) {
      for (const tx of candidate.state.transactions || []) {
        if (!tx || !tx.id) continue;
        const existing = byId.get(tx.id);
        if (!existing || Object.keys(tx).length > Object.keys(existing).length) {
          byId.set(tx.id, tx);
        }
      }
    }

    const mergedTransactions = Array.from(byId.values()).sort((a, b) => {
      const dateCmp = String(b.date || '').localeCompare(String(a.date || ''));
      if (dateCmp !== 0) return dateCmp;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });

    const backupData = {
      ...baseState,
      transactions: mergedTransactions,
      backupTimestamp: new Date().toISOString(),
      version: '1.2',
      backupSource: 'multi-source-recovery',
      recoverySources: candidates.map(c => ({
        source: c.source,
        transactions: c.count,
        minDate: c.minDate,
        maxDate: c.maxDate,
        lastUpdated: c.lastUpdated
      }))
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `masrof-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);

    console.log(
      `💾 تم إنشاء نسخة استرداد: ${mergedTransactions.length} حركة من ${candidates.length} مصادر`
    );
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
