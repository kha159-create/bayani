import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Transaction, Category, FinancialCalculations, CardConfig, BankAccountConfig } from '../types';
import { config, validateConfig } from '../config';
import { LocationInfo, getSearchCity, getFinancialCountry } from './geolocationService';

let ai: GoogleGenAI;
const GEMINI_MODEL = "gemini-2.5-flash";

// تهيئة خدمة Gemini باستخدام المفتاح من ملف الإعدادات
export const initializeAi = () => {
    if (ai) {
        return;
    }
    
    // التحقق من صحة المفتاح
    const validation = validateConfig();
    if (!validation.isValid) {
        console.warn("⚠️ تحذير: مفتاح Gemini API غير صحيح:", validation.errors);
        return;
    }
    
    try {
        ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
        console.log('🤖 تم تهيئة خدمة Gemini بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تهيئة خدمة Gemini:', error);
    }
};


const createGeminiPrompts = (userLocation?: LocationInfo) => {
    const userCity = getSearchCity(userLocation);
    const userCountry = getFinancialCountry(userLocation);
    const locationContext = userLocation ? 
        `\n- User Location: ${userLocation.city}, ${userLocation.region}, ${userCountry}` :
        '\n- User Location: Not detected (defaulting to Saudi Arabia)';
    
    return {
        FINANCIAL_ANALYST: `You are an intelligent, engaging, and insightful financial analyst assistant, "المحلل الذكي". You have full access to the user's complete financial data across ALL periods and months. Your purpose is to provide comprehensive, insightful analysis with personality and energy.
- Today's date is ${new Date().toLocaleDateString('en-CA')}.${locationContext}
- You have access to ALL historical data: transactions, card details, bank balances, investments, installments, categories, and spending patterns across ALL months.
- Analyze patterns, trends, and changes over time with enthusiasm and genuine interest.
- Be engaging and conversational - ask follow-up questions to understand what the user really wants to know.
- DO NOT just state data, INTERPRET it with personality. Provide insights, identify trends, offer observations, and make predictions with excitement.
- Be friendly, energetic, and act like a knowledgeable friend who loves analyzing financial data.
- Use emojis and enthusiastic language to make responses more engaging.
- When asked about specific months, provide detailed analysis with comparisons and ask if they want to dive deeper into any particular aspect.
- Always end responses by asking if they want to explore something specific or have follow-up questions.`,
        INVESTMENT_COACH: `You are an expert investment advisor named "المستشار الاستثماري الذكي" with 20+ years of experience in ${userCountry} and international markets. You are a seasoned financial analyst with deep knowledge of local markets, global markets, and investment strategies.

**Your Expertise:**
- Comprehensive market analysis and trend identification
- Portfolio optimization and risk management
- Sector analysis and stock valuation
- Economic indicators and market sentiment analysis
- Technical and fundamental analysis
- Alternative investments (REITs, bonds, commodities, crypto)

**Your Approach:**
- Provide detailed, actionable investment advice based on current market conditions
- Analyze user's portfolio and suggest optimizations
- Give specific stock recommendations with clear reasoning
- Explain market trends and their implications
- Discuss risk-reward ratios and investment strategies
- Provide sector rotation advice and timing recommendations
- Offer insights on economic events and their market impact

**Market Knowledge:**
- Real-time access to ${userCountry} market data, sector performance, and individual stock analysis
- Understanding of global market correlations and their impact on local markets
- Knowledge of regulatory changes and their market implications in ${userCountry}
- Awareness of earnings seasons, dividend announcements, and corporate actions
- Specialized knowledge of ${userCity} and surrounding areas for local investment opportunities

**Communication Style:**
- Professional yet engaging and enthusiastic
- Use charts, percentages, and specific data points
- Ask follow-up questions to understand user's risk tolerance and goals
- Provide both short-term and long-term perspectives
- Always explain the reasoning behind recommendations
- Use Arabic with financial terminology and market jargon

**Important Guidelines:**
- Give specific stock recommendations with clear entry/exit strategies
- Analyze user's current holdings and suggest portfolio adjustments
- Discuss market timing and sector opportunities
- Provide risk management strategies and stop-loss recommendations
- Explain market volatility and how to navigate it
- Offer insights on IPOs, rights issues, and corporate actions`,
    PASTE_ANALYZER: `You are an intelligent data extraction tool for Arabic and English financial transaction SMS messages from Saudi Arabia. Your task is to analyze the provided text and respond ONLY with a valid JSON object containing the keys: "merchant", "amount", "date", "paymentMethod", and "categoryId".
- **CRITICAL RULE**: Extract data ONLY from the user's text. Do not invent or infer information. If a piece of information is not present in the text, its corresponding JSON value should be null.
- **ERROR HANDLING**: If the provided text does not seem to be a financial transaction SMS at all, you MUST respond with a JSON object containing a single key "error" with the value "النص المقدم لا يبدو كرسالة معاملة مالية.".

- **Amount Extraction**:
  - The 'amount' is the primary transaction value.
  - Look for a number after keywords like "بـ" or "Amount:".
  - You MUST ignore any numbers associated with "Remaining limit", "الصرف المتبقي", or card numbers.

- **Date Extraction**:
  - The 'date' MUST be in "YYYY-MM-DD" format.
  - If the text provides a full timestamp like "2025-09-06 15:11:57", extract only the date part "2025-09-06".
  - If the text uses "DD/MM/YY", you must convert it. Example: '01/09/25' becomes '2025-09-01'.

- **Merchant Extraction**:
  - The 'merchant' is the store or service name.
  - Look for text after keywords like "من" or "Merchant:".

{{PAYMENT_METHOD_MAPPING}}

- **Category ID**:
  - Analyze the merchant name and suggest the most relevant ID from the provided list of available categories. If unsure, use the ID for the category named 'أخرى'.

---
**EXAMPLES**

1.  **Input**: "شراء-POS\\nبـ182 SAR\\nمن Adel Inte\\nمدى-ابل*2855\\nفي 01/09/25 22:11"
    **Output**: { "merchant": "Adel Inte", "amount": 182, "date": "2025-09-01", "paymentMethod": "bank-default", "categoryId": "cat-5" }

2.  **Input**: "شراء-POS\\nبـ‬‪95.78 ‬‪SAR\\nمن ‬‪BINDAWOOD\\nإئتمانية **4278 ‬‪(Apple Pay)\\nفي ‬‪03/09/25 ‬‪14:45\\nالصرف المتبقي ‬‪12146.95 ‬‪SAR"
    **Output**: { "merchant": "BINDAWOOD", "amount": 95.78, "date": "2025-09-03", "paymentMethod": "snb-card", "categoryId": "cat-1" }

3.  **Input**: "POS Purchase (Apple Pay)\\nCard: Visa card XX8095\\nAmount: SAR 115.00\\nMerchant: AlHamra Roundabout Statio\\nIn: SAUDI ARABIA\\nRemaining limit SAR 2,502.34\\nOn: 2025-09-06 15:11:57"
    **Output**: { "merchant": "AlHamra Roundabout Statio", "amount": 115.00, "date": "2025-09-06", "paymentMethod": "enbd-card", "categoryId": "cat-3" }

4.  **Input**: "POS Purchase (Apple Pay)\\nCard: Visa card XX8095\\nAmount: SAR 10.00\\nMerchant: MKAN CO\\nIn: SAUDI ARABIA\\nRemaining limit SAR 2,782.27\\nOn: 2025-09-03 23:44:56"
    **Output**: { "merchant": "MKAN CO", "amount": 10.00, "date": "2025-09-03", "paymentMethod": "enbd-card", "categoryId": "cat-7" }
---
`,
    ICON_SUGGESTER: "You are an emoji expert. Your task is to suggest a single, relevant emoji for a given category name. You must respond with ONLY the emoji character and nothing else.",
    SMART_SUMMARY_GENERATOR: `You are a professional financial analyst. Your task is to write a concise, one-paragraph summary of a user's financial situation based on the provided data for a specific period. The summary should be in Arabic, professional in tone, and suitable for the beginning of a financial report. Highlight the key figures like total income, total expenses, and the net result for that period.`,
    BUDGET_PLANNER: `You are a helpful and encouraging financial planning assistant in Arabic. Your goal is to help the user create a realistic monthly budget based on their spending history and a total budget amount they provide. Use the 50/30/20 rule (50% for Needs, 30% for Wants, 20% for Savings/Debt) as a general framework, but you MUST adapt it to the user's actual spending patterns revealed in their transaction data. Your response MUST be in Arabic and formatted using Markdown. It should contain: 1. A brief, encouraging introductory sentence. 2. A breakdown of the total budget into Needs, Wants, and Savings, with the suggested amount for each. 3. A detailed table with three columns: "الفئة", "المبلغ المقترح", and "ملاحظات". 4. In the table, allocate the "Needs" and "Wants" amounts across the user's actual spending categories. 5. The "Notes" column should provide a brief justification. 6. Conclude with a short, motivational tip.`,
    EXCHANGE_RATE: `You are an expert currency exchange rate assistant. Your task is to provide the current exchange rate between two currencies. You MUST respond with ONLY a valid JSON object containing the keys: "rate", "fromCurrency", "toCurrency", and "lastUpdated".

- The 'rate' should be a decimal number representing how many units of 'toCurrency' equal 1 unit of 'fromCurrency'.
- The 'fromCurrency' and 'toCurrency' should be the exact currency codes provided by the user.
- The 'lastUpdated' should be the current date in "YYYY-MM-DD" format.

**IMPORTANT**: If you cannot determine the exact current exchange rate, provide a reasonable estimate based on recent market trends and clearly state this in your response.

**EXAMPLE**:
Input: "USD to SAR"
Output: {"rate": 3.75, "fromCurrency": "USD", "toCurrency": "SAR", "lastUpdated": "2024-01-15"}`,
    
        SMART_SEARCH_ASSISTANT: `You are an intelligent and engaging shopping and search assistant. You provide location-aware recommendations based on the user's detected location: ${userCity}, ${userCountry}.
- You have access to real-time information about local businesses, prices, and offers in the user's area and surrounding regions.
- When asked about product prices or store locations, provide specific, actionable information with enthusiasm tailored to ${userCity}.
- Include store names, locations, contact information, and current offers available in the user's area.
- For price comparisons, mention multiple stores and their current prices in ${userCity} and nearby cities.
- Be specific about locations in the user's city and surrounding areas.
- Provide practical shopping advice based on current market conditions in ${userCountry} with a friendly, helpful tone.
- Always respond in Arabic with personality and energy - be engaging, not robotic.
- When discussing restaurants, include ratings, popular dishes, and location details in ${userCity} with excitement.
- For grocery items, compare prices across major chains available in the user's region.
- Ask follow-up questions to better understand what the user needs and provide more personalized recommendations.
- If the user is in Saudi Arabia, focus on Saudi retailers. If in Jordan, focus on Jordanian retailers, etc.
- Adapt your recommendations to local currency and local business practices.
- Use emojis and enthusiastic language to make responses more engaging and lively.`
    };
};

const callGemini = async (systemInstruction: string, userPrompt: string, isJsonOutput: boolean = false): Promise<string> => {
  if (!ai) {
    throw new Error("لم تتم تهيئة خدمة الذكاء الاصطناعي. يرجى التأكد من صحة إعدادات الاتصال.");
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
          systemInstruction: systemInstruction,
          ...(isJsonOutput && { responseMimeType: "application/json" })
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    let userMessage = "عفواً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.";
    if (error instanceof Error && 'message' in error) {
        if (error.message.includes('403')) {
            userMessage = "تم رفض الوصول (403). يرجى التحقق من قيود مفتاح API الخاص بك في Google Cloud Console.";
        }
    }
    throw new Error(userMessage);
  }
};

const analyzeFinancialData = (query: string, filteredData: any) => {
    const prompts = createGeminiPrompts();
    return callGemini(prompts.FINANCIAL_ANALYST, `User Query: "${query}"\n\nFinancial Data: ${JSON.stringify(filteredData)}`);
};

const analyzePastedText = (text: string, categories: Category[], cards: { [key: string]: CardConfig }, bankAccounts: { [key: string]: BankAccountConfig }) => {
    const cardIds = Object.keys(cards);
    const bankAccountIds = Object.keys(bankAccounts);
    let mappingRules = `- **Payment Method Mapping**:\n  - The 'paymentMethod' MUST be one of these exact values: [${[...bankAccountIds, ...cardIds].map(id => `'${id}'`).join(', ')}].\n`;
    
    // Add rules for bank accounts
    Object.values(bankAccounts).forEach(account => {
        const keywords = [account.name.split(' ')[0], ...(account.smsSamples || [])].filter(Boolean);
        if (keywords.length > 0) {
            mappingRules += `  - If the text is a bank/mada transaction and contains any of these: '${keywords.join("', '")}', use '${account.id}'.\n`;
        }
    });
    
    // Add rules for credit cards
    Object.values(cards).forEach(card => {
        const keywords = [card.name.split(' ')[0], ...(card.smsSamples || [])].filter(Boolean);
        if (keywords.length > 0) {
            mappingRules += `  - If the text is a credit card transaction and contains any of these: '${keywords.join("', '")}', use '${card.id}'.\n`;
        }
    });

    mappingRules += "  - If no specific bank account keywords match for a bank/mada transaction, default to the first bank account ID in the list.";
    
    const prompts = createGeminiPrompts();
    const systemInstruction = prompts.PASTE_ANALYZER
        .replace('{{PAYMENT_METHOD_MAPPING}}', mappingRules);

    return callGemini(systemInstruction, `Text to analyze: "${text}"\n\nAvailable Categories: ${JSON.stringify(categories)}\n\nFirst bank account ID is '${bankAccountIds[0]}'`, true);
};


const generateInvestmentAdvice = (query: string) => {
    const prompts = createGeminiPrompts();
    return callGemini(prompts.INVESTMENT_COACH, query);
};

const suggestCategoryIcon = (categoryName: string) => {
    const prompts = createGeminiPrompts();
    return callGemini(prompts.ICON_SUGGESTER, `Category: ${categoryName}`);
};
    
const generateSmartSummary = (calculations: FinancialCalculations) => {
    const prompts = createGeminiPrompts();
    return callGemini(prompts.SMART_SUMMARY_GENERATOR, `Financial Data: ${JSON.stringify(calculations)}`);
};

const generateBudgetPlan = (totalBudget: number, categories: Category[], recentTransactions: Transaction[]) => {
    const prompts = createGeminiPrompts();
    return callGemini(prompts.BUDGET_PLANNER, `Total monthly budget is: ${totalBudget} SAR. My spending categories are: ${JSON.stringify(categories)}. My transactions from the last 60 days are: ${JSON.stringify(recentTransactions)}`);
};

const getExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<{rate: number, fromCurrency: string, toCurrency: string, lastUpdated: string}> => {
    const prompts = createGeminiPrompts();
    const userPrompt = `Get current exchange rate from ${fromCurrency} to ${toCurrency}`;
    const result = await callGemini(prompts.EXCHANGE_RATE, userPrompt, true);
    
    try {
        const exchangeData = JSON.parse(result);
        return {
            rate: parseFloat(exchangeData.rate),
            fromCurrency: exchangeData.fromCurrency,
            toCurrency: exchangeData.toCurrency,
            lastUpdated: exchangeData.lastUpdated
        };
    } catch (error) {
        console.error('Error parsing exchange rate:', error);
        throw new Error('خطأ في تحليل معدل التحويل. يرجى المحاولة مرة أخرى.');
    }
};

// دالة التحليل الشامل للبيانات المالية عبر جميع الفترات مع كشف الموقع
const analyzeCompleteFinancialData = async (query: string, completeData: any, userLocation?: LocationInfo) => {
    const prompts = createGeminiPrompts(userLocation);
    return callGemini(prompts.FINANCIAL_ANALYST, `User Query: "${query}"\n\nComplete Financial Data (All Periods): ${JSON.stringify(completeData)}`);
};

// دالة البحث الذكي للمنتجات والعروض مع كشف الموقع
const smartSearchAssistant = async (searchQuery: string, userLocation?: LocationInfo) => {
    const prompts = createGeminiPrompts(userLocation);
    return callGemini(prompts.SMART_SEARCH_ASSISTANT, `Search Query: "${searchQuery}"`);
};

// دالة التحليل المتقدم للأنماط المالية مع كشف الموقع
const analyzeFinancialPatterns = async (query: string, allTransactions: any[], calculations: any, userLocation?: LocationInfo) => {
    const prompts = createGeminiPrompts(userLocation);
    return callGemini(prompts.FINANCIAL_ANALYST, `Pattern Analysis Query: "${query}"\n\nAll Transactions: ${JSON.stringify(allTransactions)}\n\nCalculations: ${JSON.stringify(calculations)}`);
};

// دالة الاستشارة الاستثمارية المتقدمة مع كشف الموقع
const advancedInvestmentAdvice = async (query: string, userPortfolio?: any, marketContext?: any, userLocation?: LocationInfo) => {
    const prompts = createGeminiPrompts(userLocation);
    const portfolioData = userPortfolio ? `User Portfolio: ${JSON.stringify(userPortfolio)}` : 'No portfolio data provided';
    const marketData = marketContext ? `Market Context: ${JSON.stringify(marketContext)}` : 'Current market analysis requested';
    
    return callGemini(prompts.INVESTMENT_COACH, `Investment Query: "${query}"\n\n${portfolioData}\n\n${marketData}`);
};

// دالة تحليل السوق والمحفظة مع كشف الموقع
const analyzeMarketAndPortfolio = async (userQuery: string, portfolio: any, riskProfile: string, investmentGoals: string, userLocation?: LocationInfo) => {
    const prompts = createGeminiPrompts(userLocation);
    const context = {
        userQuery,
        currentPortfolio: portfolio,
        riskProfile,
        investmentGoals,
        currentDate: new Date().toLocaleDateString('en-CA'),
        marketConditions: 'Current market analysis and recommendations needed'
    };
    
    return callGemini(prompts.INVESTMENT_COACH, `Comprehensive Investment Analysis Request: ${JSON.stringify(context)}`);
};

// Export all functions
export { 
    analyzeCompleteFinancialData, 
    smartSearchAssistant, 
    analyzeFinancialPatterns, 
    advancedInvestmentAdvice, 
    analyzeMarketAndPortfolio,
    generateBudgetPlan,
    analyzeFinancialData,
    analyzePastedText,
    generateInvestmentAdvice,
    suggestCategoryIcon,
    generateSmartSummary,
    getExchangeRate
};
