import { applyGetPermalinks } from './utils/permalinks';
import navigation from './data/navigation.json';

// Navigation content is edited in CloudCannon via src/data/navigation.json.
// Raw `href` values there are plain paths (or `{ type, url }` objects for blog,
// category, tag, and asset links); `applyGetPermalinks` resolves them to final
// URLs at build time so editors never touch permalink helpers.
export const headerData = applyGetPermalinks(navigation.header) as typeof navigation.header;
export const footerData = applyGetPermalinks(navigation.footer) as typeof navigation.footer;
