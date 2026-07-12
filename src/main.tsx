import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// iOS Safari: set --app-height to actual inner height so layout never
// goes behind the bottom address bar (100vh includes the hidden chrome).
function updateAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}
updateAppHeight();
window.addEventListener('resize', updateAppHeight);
// orientationchange fires before innerHeight updates → delay
window.addEventListener('orientationchange', () => setTimeout(updateAppHeight, 200));

// Offline/installable support — audio is synthesized, so caching the JS/CSS/HTML
// shell alone is enough for a full offline session once loaded once.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
