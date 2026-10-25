import { describe, it, expect } from 'vitest';
import { mergeSearchEditions, scoreSearchMatch, type SearchIndexItem } from './index';
const item = (url: string, title: string, body = ''): SearchIndexItem => ({ type: 'post', url, title, body, keywords: [] });
describe('bilingual logical records', () => {
  it('pairs by URL, keeps fallback, and excludes orphans', () => {
    const zh = [item('/posts/anchor', '段落锚点设计'), item('/posts/only', '仅中文')];
    const en = [item('/posts/anchor', 'Paragraph anchor design', 'full abstract tail'), item('/posts/orphan', 'Deleted')];
    const merged = mergeSearchEditions(zh, en, 'en');
    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({ url: '/en/posts/anchor', language: 'en' });
    expect(merged[1]).toMatchObject({ url: '/posts/only', language: 'zh-CN', languageLabel: '中文 · Chinese fallback' });
    for (const locale of ['en', 'zh-CN'] as const) {
      const [paired] = mergeSearchEditions(zh, en, locale);
      for (const query of ['段落锚点', '锚点 设计', 'anchor design', 'anchor-design', 'abstract tail']) expect(scoreSearchMatch(paired, query)).toBeGreaterThan(0);
    }
  });
  it('requires every term and avoids Latin substring false positives', () => {
    const record = item('/posts/a', 'Paragraph anchor design', 'chair safety');
    expect(scoreSearchMatch(record, 'anchor nonexistent')).toBe(-1);
    expect(scoreSearchMatch(record, 'AI safety')).toBe(-1);
    expect(scoreSearchMatch(record, '!!!')).toBe(-1);
    expect(scoreSearchMatch(record, 'anchor design')).toBeGreaterThan(scoreSearchMatch(record, 'design anchor'));
  });
});
