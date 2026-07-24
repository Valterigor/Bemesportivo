import { initBackToTop } from './components/back-to-top.js';
import { initSiteBreadcrumb } from './components/site-breadcrumb.js';
import { initSiteFooter } from './components/site-footer.js?v=20260723-1';
import { initSiteNavigation } from './components/site-navigation.js?v=20260723-2';
import { initPrivacyConsent } from './components/privacy-consent.js';
import { initMediaQuality } from './components/media-quality.js?v=20260723-1';
import { initAnalytics } from './components/analytics.js?v=20260723-1';

initSiteNavigation();
initSiteBreadcrumb();
initSiteFooter();
initBackToTop();
initPrivacyConsent();
initAnalytics();
initMediaQuality();
