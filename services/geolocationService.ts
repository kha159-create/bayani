// خدمة كشف الموقع الجغرافي للمستخدم
export interface LocationInfo {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface GeolocationResult {
  success: boolean;
  location?: LocationInfo;
  error?: string;
  method?: 'gps' | 'ip' | 'manual';
}

// كشف الموقع باستخدام GPS (الأكثر دقة)
export const getLocationByGPS = (): Promise<GeolocationResult> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'GPS غير متوفر في هذا المتصفح',
        method: 'gps'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // استخدام خدمة reverse geocoding للحصول على معلومات الموقع
          const locationInfo = await getLocationFromCoordinates(latitude, longitude);
          
          resolve({
            success: true,
            location: locationInfo,
            method: 'gps'
          });
        } catch (error) {
          resolve({
            success: false,
            error: 'فشل في تحديد الموقع من الإحداثيات',
            method: 'gps'
          });
        }
      },
      (error) => {
        let errorMessage = 'فشل في تحديد الموقع';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'تم رفض إذن الوصول للموقع';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'معلومات الموقع غير متوفرة';
            break;
          case error.TIMEOUT:
            errorMessage = 'انتهت مهلة طلب الموقع';
            break;
        }
        
        resolve({
          success: false,
          error: errorMessage,
          method: 'gps'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 دقائق
      }
    );
  });
};

// كشف الموقع باستخدام IP (احتياطي)
export const getLocationByIP = async (): Promise<GeolocationResult> => {
  try {
    // استخدام خدمة مجانية لكشف الموقع من IP
    const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,timezone,lat,lon');
    const data = await response.json();
    
    if (data.status === 'success') {
      const locationInfo: LocationInfo = {
        country: data.country,
        countryCode: data.countryCode,
        region: data.regionName,
        city: data.city,
        timezone: data.timezone,
        coordinates: {
          lat: data.lat,
          lng: data.lon
        }
      };
      
      return {
        success: true,
        location: locationInfo,
        method: 'ip'
      };
    } else {
      return {
        success: false,
        error: 'فشل في تحديد الموقع من IP',
        method: 'ip'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'خطأ في الاتصال بخدمة كشف الموقع',
      method: 'ip'
    };
  }
};

// تحويل الإحداثيات إلى معلومات موقع
const getLocationFromCoordinates = async (lat: number, lng: number): Promise<LocationInfo> => {
  try {
    // استخدام خدمة Nominatim المجانية
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=ar,en`
    );
    const data = await response.json();
    
    if (data && data.address) {
      return {
        country: data.address.country || 'غير محدد',
        countryCode: data.address.country_code?.toUpperCase() || '',
        region: data.address.state || data.address.region || 'غير محدد',
        city: data.address.city || data.address.town || data.address.village || 'غير محدد',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        coordinates: { lat, lng }
      };
    } else {
      throw new Error('لا توجد بيانات موقع');
    }
  } catch (error) {
    // fallback للمعلومات الأساسية
    return {
      country: 'غير محدد',
      countryCode: '',
      region: 'غير محدد',
      city: 'غير محدد',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      coordinates: { lat, lng }
    };
  }
};

// كشف الموقع التلقائي (GPS أولاً، ثم IP)
export const detectUserLocation = async (): Promise<GeolocationResult> => {
  console.log('🌍 بدء كشف الموقع الجغرافي...');
  
  // محاولة GPS أولاً (الأكثر دقة)
  const gpsResult = await getLocationByGPS();
  if (gpsResult.success) {
    console.log('✅ تم تحديد الموقع باستخدام GPS:', gpsResult.location);
    return gpsResult;
  }
  
  console.log('⚠️ فشل GPS، جاري المحاولة باستخدام IP...');
  
  // إذا فشل GPS، استخدم IP
  const ipResult = await getLocationByIP();
  if (ipResult.success) {
    console.log('✅ تم تحديد الموقع باستخدام IP:', ipResult.location);
    return ipResult;
  }
  
  console.log('❌ فشل في تحديد الموقع');
  return {
    success: false,
    error: 'فشل في تحديد الموقع الجغرافي',
    method: 'ip'
  };
};

// تحديد المدينة المناسبة للبحث حسب الموقع
export const getSearchCity = (location?: LocationInfo): string => {
  if (!location) return 'الرياض'; // افتراضي
  
  const { country, city, region } = location;
  
  // المملكة العربية السعودية
  if (country === 'Saudi Arabia' || country === 'السعودية') {
    return city || region || 'الرياض';
  }
  
  // دول عربية أخرى
  if (country === 'Jordan' || country === 'الأردن') {
    return 'عمان';
  }
  
  if (country === 'Palestine' || country === 'فلسطين') {
    return 'رام الله';
  }
  
  if (country === 'Egypt' || country === 'مصر') {
    return 'القاهرة';
  }
  
  if (country === 'UAE' || country === 'الإمارات') {
    return 'دبي';
  }
  
  if (country === 'Kuwait' || country === 'الكويت') {
    return 'الكويت';
  }
  
  if (country === 'Qatar' || country === 'قطر') {
    return 'الدوحة';
  }
  
  if (country === 'Bahrain' || country === 'البحرين') {
    return 'المنامة';
  }
  
  if (country === 'Oman' || country === 'عمان') {
    return 'مسقط';
  }
  
  // دول أخرى - استخدام المدينة المحلية أو الافتراضي
  return city || 'الرياض';
};

// تحديد البلد للمعاملات المالية
export const getFinancialCountry = (location?: LocationInfo): string => {
  if (!location) return 'السعودية';
  
  const { country } = location;
  
  // تحديد البلد باللغة العربية
  const countryMap: { [key: string]: string } = {
    'Saudi Arabia': 'السعودية',
    'Jordan': 'الأردن',
    'Palestine': 'فلسطين',
    'Egypt': 'مصر',
    'UAE': 'الإمارات',
    'Kuwait': 'الكويت',
    'Qatar': 'قطر',
    'Bahrain': 'البحرين',
    'Oman': 'عمان',
    'Lebanon': 'لبنان',
    'Iraq': 'العراق',
    'Syria': 'سوريا',
    'Yemen': 'اليمن',
    'Libya': 'ليبيا',
    'Tunisia': 'تونس',
    'Algeria': 'الجزائر',
    'Morocco': 'المغرب',
    'Sudan': 'السودان',
    'Turkey': 'تركيا',
    'Iran': 'إيران'
  };
  
  return countryMap[country] || country || 'السعودية';
};
