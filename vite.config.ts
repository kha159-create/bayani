import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = {
        ...process.env,
        ...loadEnv(mode, process.cwd(), '')
    };
    
    // طباعة جميع متغيرات البيئة للتشخيص
    console.log('🔍 Environment variables loaded:', {
        mode,
        envKeys: Object.keys(env).filter(key => key.startsWith('VITE_')),
        firebaseApiKey: env.VITE_FIREBASE_API_KEY ? '✅ موجود' : '❌ مفقود',
        firebaseProjectId: env.VITE_FIREBASE_PROJECT_ID ? '✅ موجود' : '❌ مفقود',
        geminiApiKey: env.VITE_GEMINI_API_KEY ? '✅ موجود' : '❌ مفقود'
    });
    
    return {
        base: '/fd/', // المسار الأساسي لمشروعك على GitHub Pages
        
        plugins: [
            react(),
            VitePWA({
                // ✅ تسجيل تلقائي مع تحديث
                registerType: 'autoUpdate',
                
                // ✅ إعدادات workbox محسنة
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                    runtimeCaching: [
                        {
                            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'google-fonts-cache',
                                expiration: {
                                    maxEntries: 10,
                                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                                }
                            }
                        }
                    ]
                },
                
                // ✅ إعدادات manifest محسنة
                manifest: {
                    name: 'MASROF - لوحة التحكم المالية',
                    short_name: 'MASROF',
                    description: 'تطبيق إدارة المالية الشخصية مع الذكاء الاصطناعي',
                    start_url: '/fd/',
                    scope: '/fd/',
                    theme_color: '#3b82f6',
                    background_color: '#ffffff',
                    display: 'standalone',
                    icons: [
                        {
                            src: 'icon-192.png',
                            sizes: '192x192',
                            type: 'image/png',
                            purpose: 'any maskable'
                        },
                        {
                            src: 'icon-512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any maskable'
                        }
                    ]
                }
            })
        ],
        
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        
        css: {
            postcss: './postcss.config.js',
        },
        
        define: {
            // Gemini API Keys
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
            
            // Firebase Configuration
            'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
            'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
            'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
            'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
            'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
            'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
            
            // App Environment
            'import.meta.env.VITE_APP_ENVIRONMENT': JSON.stringify(env.VITE_APP_ENVIRONMENT || 'production'),
        },
        
        build: {
            sourcemap: false,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom'],
                        firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
                        gemini: ['@google/generative-ai']
                    }
                }
            }
        },
        
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});
