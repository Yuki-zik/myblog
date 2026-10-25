import { test, expect } from '@playwright/test';
import { searchIndexItems, type SearchIndexItem } from '../../src/lib/search';
import { evidenceRecords } from '../../src/lib/agents/observatory';

for (const prefix of ['', '/en']) {
  test(`${prefix || 'zh'} built index retrieves both languages without duplicates`, async ({ request, page }, testInfo) => {
    const response = await request.get(`${prefix}/search-index.json`);
    expect(response.ok()).toBe(true);
    const items: SearchIndexItem[] = await response.json();
    expect(new Set(items.map(item => item.url)).size).toBe(items.length);
    const cases = [
      ['语音隐私', '/papers/duap'],
      ['段落锚点', '/posts/paragraph-anchor-design'],
      ['knowledge network', '/topics/knowledge-network'],
      ['锚点 设计', '/posts/paragraph-anchor-design'],
      ['anchor design', '/posts/paragraph-anchor-design'],
      ['AI safety', '/author'], ['模型安全', '/author'], ['观察站', '/agents']
    ];
    for (const [query, path] of cases) {
      const matches = searchIndexItems(items, query);
      expect(matches.some(item => item.url.startsWith(prefix + path)), query).toBe(true);
    }
    expect(searchIndexItems(items, 'anchor nonexistentzz')).toEqual([]);
    await page.goto(prefix || '/');
    await page.locator('[data-search-trigger]').click();
    const input = page.locator('#site-search-input');
    for (const query of ['段落锚点', 'anchor design', '观察站']) {
      await input.fill(query);
      const destination = query === '观察站' ? '/agents' : '/posts/paragraph-anchor-design';
      const link = page.locator(`.header-search-result-link[href="${prefix}${destination}"]`);
      await expect(link).toBeVisible();
      await expect(link).toContainText(prefix ? 'English' : '中文');
    }
    await page.screenshot({ path: testInfo.outputPath(`search-${prefix ? 'en' : 'zh'}.png`) });
  });
}

test('English observatory and home share translated data, methods and downloads', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/en/agents');
  await expect(page.locator('h1')).toHaveText('Agent Work Observatory');
  const main = page.locator('.agent-observatory');
  await expect(main.locator('[data-agent-instrument]')).toHaveCount(4);
  await expect(main.locator('[data-agent-instruments]')).toHaveAttribute('data-ready','true');
  await main.locator('[data-agent-reference] > summary').click();
  expect(await main.textContent()).not.toMatch(/[\u4e00-\u9fff]/u);
  for (const label of await main.locator('[aria-label]').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')))) expect(label).not.toMatch(/[\u4e00-\u9fff]/u);
  await expect(main.locator('.agent-observatory-timeline > li')).toHaveCount(evidenceRecords.length);
  for (const record of evidenceRecords) {
    const entry = page.locator(`#evidence-${record.id}`);
    await entry.locator('summary').click();
    await expect(entry.locator('a')).toHaveAttribute('href', record.url);
  }
  const download = page.getByRole('link', { name: 'Download daily log template' });
  const href = await download.getAttribute('href');
  const text = decodeURIComponent(href!.split(',')[1]);
  expect(text).toContain('Leave unmeasured values blank');
  expect(text).not.toMatch(/[\u4e00-\u9fff]/u);
  const downloaded = page.waitForEvent('download');
  await download.click();
  expect((await downloaded).suggestedFilename()).toBe('agent-work-log-template.md');
  await expect(page.getByRole('link', { name: 'Download empty data file' })).toHaveAttribute('href', '/agent-observatory-template.json');
  await page.screenshot({ path: testInfo.outputPath('agents-en-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('agents-en-mobile.png'), fullPage: true });
  await page.goto('/en');
  const widget = page.locator('.agent-observatory-entry');
  await expect(widget).toBeVisible();
  expect(await widget.textContent()).not.toMatch(/[\u4e00-\u9fff]/u);
  await expect(widget).toHaveAttribute('href', '/en/agents');
  await widget.screenshot({ path: testInfo.outputPath('widget-en-mobile.png') });
  await page.goto('/en/agents');
  await page.locator('[data-attention-part="review"]').click();
  await expect(page.locator('[data-attention-output]')).toHaveText('45 min');
  await expect(page.locator('[data-attention-description]')).toContainText('Check results');
  await page.locator('[data-delivery-next]').click();
  await expect(page.locator('[data-delivery-index]')).toHaveText('2 / 3');
  await page.locator('[data-rework-reset]').click();
  await expect(page.locator('[data-rework-output]')).toHaveText('0 min');
  expect(errors).toEqual([]);
});
