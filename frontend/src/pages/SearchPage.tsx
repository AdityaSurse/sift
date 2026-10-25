/**
 * Backward-compatibility re-export for SearchPage.
 * Why: The two-pane job browser is now hosted at JobsPage (/jobs), while /search redirects to /jobs.
 */
export { JobsPage as SearchPage, JobsPage as default } from './JobsPage';
