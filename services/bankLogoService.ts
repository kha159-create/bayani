// خدمة جلب شعارات البنوك السعودية
export interface BankInfo {
    name: string;
    logo: string;
    englishName: string;
}

// قاعدة بيانات البنوك السعودية مع شعاراتها
const SAUDI_BANKS: BankInfo[] = [
    {
        name: "البنك الأهلي السعودي",
        englishName: "AlAhli Bank",
        logo: "🏦"
    },
    {
        name: "البنك السعودي للاستثمار",
        englishName: "Saudi Investment Bank",
        logo: "🏛️"
    },
    {
        name: "البنك السعودي الفرنسي",
        englishName: "Banque Saudi Fransi",
        logo: "🏦"
    },
    {
        name: "البنك السعودي الهولندي",
        englishName: "Saudi Hollandi Bank",
        logo: "🏦"
    },
    {
        name: "البنك السعودي البريطاني",
        englishName: "Saudi British Bank",
        logo: "🏦"
    },
    {
        name: "بنك الراجحي",
        englishName: "Al Rajhi Bank",
        logo: "🏦"
    },
    {
        name: "بنك الرياض",
        englishName: "Riyad Bank",
        logo: "🏦"
    },
    {
        name: "بنك ساب",
        englishName: "SABB Bank",
        logo: "🏦"
    },
    {
        name: "البنك العربي الوطني",
        englishName: "Arab National Bank",
        logo: "🏦"
    },
    {
        name: "بنك الجزيرة",
        englishName: "Bank AlJazira",
        logo: "🏦"
    },
    {
        name: "بنك الإنماء",
        englishName: "Alinma Bank",
        logo: "🏦"
    },
    {
        name: "البنك السعودي للتنمية",
        englishName: "Saudi Development Bank",
        logo: "🏦"
    }
];

// دالة البحث عن شعار البنك
export const getBankLogo = (bankName: string): string => {
    if (!bankName) return "🏦";
    
    const normalizedName = bankName.toLowerCase().trim();
    
    // البحث المباشر
    for (const bank of SAUDI_BANKS) {
        if (bank.name.toLowerCase().includes(normalizedName) || 
            bank.englishName.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(bank.name.toLowerCase()) ||
            normalizedName.includes(bank.englishName.toLowerCase())) {
            return bank.logo;
        }
    }
    
    // البحث بالكلمات المفتاحية
    const keywords = [
        { keyword: "أهلي", logo: "🏦" },
        { keyword: "alahli", logo: "🏦" },
        { keyword: "راجحي", logo: "🏦" },
        { keyword: "rajhi", logo: "🏦" },
        { keyword: "رياض", logo: "🏦" },
        { keyword: "riyad", logo: "🏦" },
        { keyword: "ساب", logo: "🏦" },
        { keyword: "sabb", logo: "🏦" },
        { keyword: "عربي", logo: "🏦" },
        { keyword: "arab", logo: "🏦" },
        { keyword: "جزيرة", logo: "🏦" },
        { keyword: "jazira", logo: "🏦" },
        { keyword: "إنماء", logo: "🏦" },
        { keyword: "alinma", logo: "🏦" },
        { keyword: "فرنسي", logo: "🏦" },
        { keyword: "fransi", logo: "🏦" },
        { keyword: "هولندي", logo: "🏦" },
        { keyword: "hollandi", logo: "🏦" },
        { keyword: "بريطاني", logo: "🏦" },
        { keyword: "british", logo: "🏦" }
    ];
    
    for (const { keyword, logo } of keywords) {
        if (normalizedName.includes(keyword)) {
            return logo;
        }
    }
    
    return "🏦"; // شعار افتراضي
};

// دالة الحصول على معلومات البنك
export const getBankInfo = (bankName: string): BankInfo | null => {
    if (!bankName) return null;
    
    const normalizedName = bankName.toLowerCase().trim();
    
    for (const bank of SAUDI_BANKS) {
        if (bank.name.toLowerCase().includes(normalizedName) || 
            bank.englishName.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(bank.name.toLowerCase()) ||
            normalizedName.includes(bank.englishName.toLowerCase())) {
            return bank;
        }
    }
    
    return null;
};

// دالة الحصول على قائمة جميع البنوك السعودية
export const getAllSaudiBanks = (): BankInfo[] => {
    return SAUDI_BANKS;
};
