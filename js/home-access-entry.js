import { initHomeAccess } from './components/home-access.js?v=20260919-2';

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHomeAccess, { once: true });
else initHomeAccess();
