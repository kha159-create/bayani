import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { config, validateConfig } from '../config';

let app: any = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// تهيئة Firebase مع معالجة أفضل للأخطاء
const initializeFirebaseApp = () => {
  try {
    const validation = validateConfig();
    if (!validation.hasFirebase) {
      console.warn("⚠️ تحذير: مفاتيح Firebase API غير متوفرة. لن يتم تهيئة Firebase.");
      return { success: false, error: 'مفاتيح Firebase غير متوفرة' };
    }

    // التحقق من وجود تطبيق Firebase مسبقاً
    if (getApps().length === 0) {
      app = initializeApp(config.firebase);
      console.log('🔥 تم إنشاء تطبيق Firebase جديد');
    } else {
      app = getApp();
      console.log('🔥 تم استخدام تطبيق Firebase الموجود');
    }
    
    db = getFirestore(app);
    auth = getAuth(app);
    
    console.log('🔥 تم تهيئة Firebase بنجاح');
    return { success: true };
  } catch (error) {
    console.error('❌ خطأ في تهيئة Firebase:', error);
    return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
  }
};

// تهيئة Firebase عند تحميل الملف
const initResult = initializeFirebaseApp();

// إعداد وضع التطوير (اختياري)
if (config.app.environment === 'development' && typeof window !== 'undefined') {
  // يمكن تفعيل المحاكاة المحلية هنا إذا لزم الأمر
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
}

// دوال مساعدة لإدارة البيانات
export const firebaseService = {
  // دوال المصادقة
  async signUp(email: string, password: string, displayName: string) {
    if (!auth) {
      return { success: false, error: 'Firebase غير مهيأ' };
    }
    
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      
      // إنشاء مستند المستخدم في Firestore
      await this.saveData('users', userCredential.user.uid, {
        email,
        displayName,
        createdAt: new Date().toISOString(),
        // البيانات الافتراضية
        transactions: [],
        categories: [],
        cards: {},
        bankAccounts: {},
        investments: { currentValue: 0 },
        installments: []
      });
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('خطأ في التسجيل:', error);
      return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
    }
  },

  async signIn(email: string, password: string) {
    if (!auth) {
      return { success: false, error: 'Firebase غير مهيأ' };
    }
    
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
    }
  },

  async signOut() {
    if (!auth) {
      return { success: false, error: 'Firebase غير مهيأ' };
    }
    
    try {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
    }
  },

  async getCurrentUser() {
    if (!auth) {
      return null;
    }
    return auth.currentUser;
  },

  // دالة للاستماع لتغييرات حالة المصادقة
  async onAuthStateChanged(callback: (user: any) => void) {
    if (!auth) {
      callback(null);
      return () => {};
    }
    
    try {
      const { onAuthStateChanged } = await import('firebase/auth');
      return onAuthStateChanged(auth, (user) => {
        console.log('🔐 تغيير في حالة المصادقة:', user ? `مسجل دخول: ${user.email}` : 'غير مسجل دخول');
        callback(user);
      });
    } catch (error) {
      console.error('❌ خطأ في تحميل onAuthStateChanged:', error);
      callback(null);
      return () => {};
    }
  },

  // حفظ البيانات في Firestore
  async saveData(collection: string, docId: string, data: any) {
    if (!db) {
      return { success: false, error: 'Firebase غير مهيأ' };
    }
    
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const docRef = doc(db, collection, docId);
      await setDoc(docRef, {
        ...data,
        lastUpdated: new Date().toISOString()
      });
      return { success: true, id: docId };
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
    }
  },

  // جلب البيانات من Firestore
  async getData(collection: string, docId: string) {
    if (!db) {
      return { success: false, error: 'Firebase غير مهيأ' };
    }
    
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, collection, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() };
      } else {
        return { success: false, error: 'المستند غير موجود' };
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      
      // معالجة خاصة لأخطاء الأذونات
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          return { 
            success: false, 
            error: 'خطأ في الأذونات: تأكد من تسجيل الدخول وإعداد قواعد Firestore' 
          };
        }
        if (error.message.includes('network')) {
          return { 
            success: false, 
            error: 'خطأ في الشبكة: تحقق من الاتصال بالإنترنت' 
          };
        }
        return { success: false, error: error.message };
      }
      
      return { success: false, error: 'خطأ غير معروف' };
    }
  },

  // جلب جميع المستندات من مجموعة
  async getAllDocuments(collection: string) {
    if (!db) {
      return { success: false, error: 'Firebase غير مهيأ' };
    }
    
    try {
      const { collection: col, getDocs } = await import('firebase/firestore');
      const querySnapshot = await getDocs(col(db, collection));
      const documents: any[] = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, data: documents };
    } catch (error) {
      console.error('خطأ في جلب المستندات:', error);
      return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
    }
  },

  // حذف مستند
  async deleteDocument(collection: string, docId: string) {
    if (!db) {
      return { success: false, error: 'Firebase غير مهيأ' };
    }
    
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const docRef = doc(db, collection, docId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error('خطأ في حذف المستند:', error);
      return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
    }
  },

  // مزامنة البيانات المحلية مع Firebase
  async syncLocalDataToFirebase(userId: string, data: any) {
    try {
      return await this.saveData('users', userId, {
        financialData: data,
        syncTimestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('خطأ في مزامنة البيانات:', error);
      return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
    }
  },

  // جلب البيانات من Firebase
  async getDataFromFirebase(userId: string) {
    try {
      const result = await this.getData('users', userId);
      if (result.success && result.data?.financialData) {
        return { success: true, data: result.data.financialData };
      }
      return { success: false, error: 'لا توجد بيانات محفوظة' };
    } catch (error) {
      console.error('خطأ في جلب البيانات من Firebase:', error);
      return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
    }
  }
};

// تهيئة خدمة Firebase
export const initializeFirebase = () => {
  return initResult;
};

// تصدير التطبيق للاستخدام الخارجي إذا لزم الأمر
export default app;
