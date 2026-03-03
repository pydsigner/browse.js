// Demo initialization with generated thumbnails and folders using the class
import { BrowseJS } from '../src/browse.js';

function svgDataUrl(text, bg = '#c7ddff', w = 480, h = 320) {
    const safeText = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `<?xml version='1.0' encoding='utf-8'?><svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
        `<rect width='100%' height='100%' fill='${bg}' rx='8' />` +
        `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-size='28' fill='#073763'>${safeText}</text>` +
        `</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const colors = ['#c7ddff', '#ffd7d7', '#e4ffd7', '#fff3c7', '#e6dcff', '#dff7ff'];
function makeFile(i) {
    return {
        name: `File-${i}.png`,
        thumbnail: svgDataUrl(`File ${i}`,
        colors[i % colors.length]),
        meta: { size: (Math.random() * 200000 | 0), type: 'image/png' }
    };
}

const demoFiles = [
    { name: 'Photos', children: [makeFile(1), makeFile(2), makeFile(3)] },
    { name: 'Documents', children: [{ name: 'Resume.pdf', meta: { size: 43212, type: 'application/pdf' } }, { name: 'Specs.docx', meta: { size: 12345 } }] },
    makeFile(4),
    makeFile(5),
    { name: 'schedule_with_a_long_long_long_name.pdf', meta: { size: 4312, type: 'application/pdf' } },
    { name: 'Archives', children: [{ name: 'old.zip', meta: { size: 987654 } }] },
    makeFile(6)
];

function readFileAsDataURL(file) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
    });
}

const sharedOpts = {
    rootName: 'Home',
    onSelect(selection, indices) {
        console.log('selected', selection.map(s => s && s.name), indices);
    },
    onCreateFolder(name) {
        console.log('create folder', name);
        // return a new folder item to be added
        return { name, children: [] };
    },
    async onUpload(files) {
        // Convert File objects into FileItem objects, create thumbnails for images
        const items = await Promise.all(files.map(async (f) => {
            let thumb = undefined;
            if (f.type && f.type.startsWith('image/')) {
                try { thumb = await readFileAsDataURL(f); } catch (e) { thumb = undefined; }
            }
            return { name: f.name, thumbnail: thumb, meta: { size: f.size, type: f.type } };
        }));
        return items;
    }
};

const selector = new BrowseJS('browsejs', demoFiles, sharedOpts);
const selectorMulti = new BrowseJS('browsejs-multi', structuredClone(demoFiles), { ...sharedOpts, multiSelect: true });

window.browseJS = selector;
window.browseJSMulti = selectorMulti;
