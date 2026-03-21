const fs = require('fs');
const file1 = 'tests/e2e/paragraph-comments.spec.ts';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace('.post-reading-toc-summary', '.post-scholar-item--toc');
fs.writeFileSync(file1, content1);

const file2 = 'tests/e2e/post-covers.spec.ts';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace("[data-toc-depth='2']", ".toc-sidebar__link--level-2");
content2 = content2.replace("[data-toc-depth='3']", ".toc-sidebar__link--level-3");
content2 = content2.replace(".post-toc-text", ".toc-sidebar__title");
content2 = content2.replace(".post-toc-text", ".toc-sidebar__title");
fs.writeFileSync(file2, content2);
