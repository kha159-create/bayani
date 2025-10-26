import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// تسجيل PWA install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt available');
  e.preventDefault();
  deferredPrompt = e;
  
  // إظهار زر التثبيت
  const installButton = document.createElement('button');
  installButton.textContent = 'تثبيت التطبيق';
  installButton.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  installButton.onclick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ User accepted the install prompt');
        } else {
          console.log('❌ User dismissed the install prompt');
        }
        deferredPrompt = null;
        installButton.remove();
      });
    }
  };
  
  document.body.appendChild(installButton);
});

// إخفاء زر التثبيت بعد التثبيت
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA was installed');
  const installButton = document.querySelector('button[onclick]');
  if (installButton) {
    installButton.remove();
  }
});