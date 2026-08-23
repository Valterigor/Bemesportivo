import { initBackToTop } from './components/back-to-top.js';
import { initSiteBreadcrumb } from './components/site-breadcrumb.js';
import { initSiteFooter } from './components/site-footer.js?v=20260723-1';
import { initSiteNavigation } from './components/site-navigation.js?v=20260823-1';
import { initPrivacyConsent } from './components/privacy-consent.js';
import { initMediaQuality } from './components/media-quality.js?v=20260723-1';
import { initAnalytics } from './components/analytics.js?v=20260723-1';
import { initCommunityComments } from './components/community-comments.js?v=20260813-1';
import { initJourneyReset } from './components/journey-reset.js?v=20260813-1';

const TRANSIENT_SUCCESS_PATTERN = /\b(salv(?:o|a|os|as)|publicad(?:o|a|os|as)|atualizad(?:o|a|os|as)|conclu[ií]d(?:o|a|os|as)|registrad(?:o|a|os|as)|recebid(?:o|a|os|as)|tudo certo)\b/i;
const transientStatusTimers = new WeakMap();

function scheduleTransientSuccess(target) {
  if (!(target instanceof HTMLElement) || target.children.length || !target.matches('[role="status"], [aria-live]')) return;
  const message = target.textContent.trim();
  window.clearTimeout(transientStatusTimers.get(target));
  if (!message || !TRANSIENT_SUCCESS_PATTERN.test(message)) return;
  const timer = window.setTimeout(() => {
    if (target.textContent.trim() !== message) return;
    target.textContent = '';
    target.removeAttribute('data-tone');
    transientStatusTimers.delete(target);
  }, 5000);
  transientStatusTimers.set(target, timer);
}

function initTransientSuccessFeedback() {
  const observer = new MutationObserver(mutations => {
    const targets = new Set();
    mutations.forEach(mutation => {
      const element = mutation.target.nodeType === Node.TEXT_NODE ? mutation.target.parentElement : mutation.target;
      const status = element?.closest?.('[role="status"], [aria-live]');
      if (status) targets.add(status);
    });
    targets.forEach(scheduleTransientSuccess);
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });
}

initSiteNavigation();
initSiteBreadcrumb();
initSiteFooter();
initBackToTop();
initPrivacyConsent();
initAnalytics();
initMediaQuality();
initJourneyReset();
initCommunityComments();
initTransientSuccessFeedback();
