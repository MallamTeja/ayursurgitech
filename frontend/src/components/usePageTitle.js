import { useEffect } from 'react';

// Every route used to share one <title>, which fails WCAG 2.4.2, and a client-side navigation
// changes no document a screen reader watches — so the title is also mirrored into the live
// region Layout renders, which is what actually gets spoken on a route change.
// Native document.title in an effect. No helmet, no library.
export default function usePageTitle(title) {
  useEffect(() => {
    if (!title) return; // pages that title themselves from fetched data wait for it
    document.title = `${title} — AayursurgiTech`;
    const announcer = document.getElementById('route-announcer');
    if (announcer) announcer.textContent = title;
  }, [title]);
}
