import { initBackToTop } from './components/back-to-top.js';
import { initSiteBreadcrumb } from './components/site-breadcrumb.js';
import { initSiteFooter } from './components/site-footer.js?v=20260722-2';
import { initSiteNavigation } from './components/site-navigation.js';
import { initPrivacyConsent } from './components/privacy-consent.js';

initSiteNavigation();
initSiteBreadcrumb();
initSiteFooter();
initBackToTop();
initPrivacyConsent();
