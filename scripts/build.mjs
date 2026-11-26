// Bundles and minifies the local CSS and JS into dist/, then points
// index.html and sw.js at the new files. Run `npm run build` after editing
// anything in css/ or js/; CI fails if the committed bundles are stale.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Load order matters: later files extend NuvioApp.prototype and override styles.
const CSS = [
    'base', 'layout', 'components', 'dashboard', 'tasks-focus', 'productivity', 'tracking',
    'personal', 'responsive', 'auth', 'motion', 'ai-chat', 'ai-page'
].map(name => `css/${name}.css`);
const JS = [
    'supabase-config', 'supabase-client', 'app', 'auth', 'i18n', 'storage', 'ui', 'dashboard',
    'tasks', 'focus', 'habits', 'tracking', 'prayer-reports', 'main', 'cloud-sync', 'ai-page'
].map(name => `js/${name}.js`);

const read = file => readFileSync(join(root, file), 'utf8');
const hash = text => createHash('sha256').update(text).digest('hex').slice(0, 10);

async function bundle(files, loader, separator) {
    const source = files.map(file => `/* ${file} */\n${read(file)}`).join(separator);
    const { code } = await transform(source, { loader, minify: true, target: 'es2020', legalComments: 'none' });
    return code;
}

function replaceBlock(text, start, end, body, file) {
    const from = text.indexOf(start);
    const to = text.indexOf(end, from);
    if (from === -1 || to === -1) throw new Error(`${file}: missing ${start} ... ${end}`);
    return text.slice(0, from + start.length) + body + text.slice(to);
}

const css = await bundle(CSS, 'css', '\n');
const js = await bundle(JS, 'js', '\n;\n');
const cssUrl = `./dist/nuvio.min.css?v=${hash(css)}`;
const jsUrl = `./dist/nuvio.min.js?v=${hash(js)}`;

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/nuvio.min.css'), css);
writeFileSync(join(root, 'dist/nuvio.min.js'), js);

let html = read('index.html');
html = replaceBlock(html, '<!-- build:css -->', '<!-- /build:css -->',
    `\n    <link rel="stylesheet" href="${cssUrl}">\n    `, 'index.html');
html = replaceBlock(html, '<!-- build:js -->', '<!-- /build:js -->',
    `\n    <script src="${jsUrl}"></script>\n    `, 'index.html');
writeFileSync(join(root, 'index.html'), html);

let sw = read('sw.js');
sw = replaceBlock(sw, '// build:assets', '// /build:assets',
    `\n    '${cssUrl}',\n    '${jsUrl}',\n    `, 'sw.js');
sw = sw.replace(/const CACHE_NAME = 'nuvio-v(\d+)(?:-[0-9a-f]+)?';/,
    (_, version) => `const CACHE_NAME = 'nuvio-v${version}-${hash(css + js)}';`);
writeFileSync(join(root, 'sw.js'), sw);

console.log(`dist/nuvio.min.css ${css.length} bytes, dist/nuvio.min.js ${js.length} bytes`);
