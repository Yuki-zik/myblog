import { getCollection } from 'astro:content';
import { buildSearchIndex, mergeSearchEditions, type SearchIndexItem } from './index';
import { SITE_AUTHOR_PROFILE } from '../site';
import { localizeData, type Locale } from '../i18n';

function profileText(value: unknown): string {
  if (typeof value === 'string') return /^https?:|^\//.test(value) ? '' : value;
  if (Array.isArray(value)) return value.map(profileText).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(profileText).join(' ');
  return '';
}
function fixedPages(locale: Locale): SearchIndexItem[] {
  const en = locale === 'en';
  const profile = localizeData(SITE_AUTHOR_PROFILE, locale);
  return [
    { url: '/author', title: en ? 'About A-Znk' : '关于 A-Znk', summary: profile.bioShort, body: profileText(profile), keywords: [] },
    { url: '/agents', title: en ? 'Agent Work Observatory' : 'Agent 工作观察站', summary: en ? 'Personal observations, research evidence and recording methods for agent work.' : '个人 Agent 工作记录、研究证据与统计口径。', keywords: [] },
    { url: '/', title: en ? 'A-Znk · Home' : 'A-Znk · 首页', keywords: [] },
    { url: '/topics', title: en ? 'Topics' : '主题', keywords: [] },
    { url: '/papers', title: en ? 'Papers' : '论文', keywords: [] },
    { url: '/archives', title: en ? 'Archives' : '归档', keywords: [] },
    { url: '/map', title: en ? 'Wander · Knowledge map' : '漫游 · 知识地图', keywords: [] }
  ].map(item => ({ ...item, type: 'page' }));
}
export async function buildBilingualSearchIndex(locale: Locale) {
  const [posts, papers, topics, concepts, postsEn, papersEn, topicsEn, conceptsEn] = await Promise.all([
    getCollection('posts'), getCollection('papers'), getCollection('topics'), getCollection('concepts'),
    getCollection('postsEn'), getCollection('papersEn'), getCollection('topicsEn'), getCollection('conceptsEn')
  ]);
  return mergeSearchEditions(
    [...buildSearchIndex(posts, papers, topics, concepts), ...fixedPages('zh-CN')],
    [...buildSearchIndex(postsEn, papersEn, topicsEn, conceptsEn), ...fixedPages('en')], locale
  );
}
