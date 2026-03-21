const fs = require('fs');
const file = 'agent/timeline.md';
let content = fs.readFileSync(file, 'utf8');

const entry = `
| 2026-03-21 20:58 | 调整文章页桌面端布局 & 修复移动端目录缺失 & 修复测试 | \`src/styles/article.css\`, \`src/pages/posts/[slug].astro\`, \`src/components/post/PostToc.astro\`, \`tests/e2e/*\` | 满足用户“正文内容再靠左一些，保留目录位置不变”的需求，修正超宽屏和默认桌面屏的左侧位移变量，增加右侧偏移列变量；同时修复了由于此前重构左侧栏 TOC 导致的移动端 TOC \`<details>\` 彻底丢失问题；更新 E2E 测试中断言的排版位置、容器选择器与字体大小逻辑，使 20 个页面测试全部通过。 |
`;

content = content.replace(/(---\n)/, `$1${entry}`);
fs.writeFileSync(file, content);
