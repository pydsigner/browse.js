// Create a data URL from raw SVG markup
function svgDataUrlFromSvg(svg) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function escapeText(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function svgDocumentIcon(label, bg = '#e9eefc', w = 240, h = 310) {
    const safe = escapeText(label || '');
    const fold = 84;

    // Draw page body leaving out the folded corner area
    const bodyPath = `M0 0 H${w - fold} L${w} ${fold} V${h} H0 Z`;
    // Draw the folded corner as a darker layer on top
    const foldPath = `M${w - fold} 0 v${fold} h${fold} Z`;

    const svg = `<?xml version='1.0' encoding='utf-8'?><svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
        `<path d='${bodyPath}' fill='${bg}' stroke='#0b12200a' stroke-linejoin='round'/>` +
        `<path d='${foldPath}' fill='#0000001a' stroke='#0b122005'/>` +
        `<text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' font-family='Inter,Arial,Helvetica,sans-serif' font-size='36' fill='#0b1220'>${safe}</text>` +
        `</svg>`;
    return svgDataUrlFromSvg(svg);
}

function svgFolderIcon(label, bg = '#ffd7a8', w = 420, h = 320) {
    const safe = escapeText(label || '');
    const tabH = 44;
    const tabW = 120;
    const svg = `<?xml version='1.0' encoding='utf-8'?><svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
        `<rect x='6' y='34' rx='12' ry='12' width='${w - 12}' height='${h - 40}' fill='${bg}' stroke='#0b12200a'/>` +
        `<rect x='18' y='12' rx='8' ry='8' width='${tabW}' height='${tabH}' fill='${bg}'/>` +
        `<text x='50%' y='62%' dominant-baseline='middle' text-anchor='middle' font-family='Inter,Arial,Helvetica,sans-serif' font-size='36' fill='#0b1220'>${safe}</text>` +
        `</svg>`;
    return svgDataUrlFromSvg(svg);
}

const svgContextActionIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">' +
    '<path stroke="currentColor" stroke-linecap="round" stroke-width="3" d="M6 12 h0.01"></path>' +
    '<path stroke="currentColor" stroke-linecap="round" stroke-width="3" d="M12 12 h0.01"></path>' +
    '<path stroke="currentColor" stroke-linecap="round" stroke-width="3" d="M18 12 h0.01"></path></svg>';

const DEFAULT_ICON_RULES = [
    { icon: svgDocumentIcon('IMG', '#c7ddff'), typeMatch: t => t.startsWith('image/'), exts: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.avif'] },
    { icon: svgDocumentIcon('PDF', '#ffd7d7'), typeMatch: t => t === 'application/pdf', exts: ['.pdf'] },
    { icon: svgDocumentIcon('AUD', '#e6dcff'), typeMatch: t => t.startsWith('audio/'), exts: ['.mp3', '.wav', '.m4a', '.flac'] },
    { icon: svgDocumentIcon('VID', '#dff7ff'), typeMatch: t => t.startsWith('video/'), exts: ['.mp4', '.mov', '.webm', '.mkv'] },
    { icon: svgDocumentIcon('DOC', '#dfe6ff'), typeMatch: t => ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(t), exts: ['.doc', '.docx', '.odt'] },
    { icon: svgDocumentIcon('XLS', '#e4ffd7'), typeMatch: t => ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(t), exts: ['.xls', '.xlsx', '.ods', '.csv'] },
    { icon: svgDocumentIcon('ZIP', '#fffed7'), typeMatch: t => t.includes('zip') || t === 'application/x-zip-compressed', exts: ['.zip', '.tar', '.gz'] },
    { icon: svgDocumentIcon('TXT', '#eaeaea'), typeMatch: t => t.startsWith('text/'), exts: ['.txt', '.md', '.log'] },
];


/**
 * @typedef {Object} IconRule
 * @property {string} icon - The icon URL
 * @property {function(string):boolean} [typeMatch] - Optional function to match against the MIME type of a file
 * @property {string[]} [exts] - Optional array of file extensions (with dot) to match against the file name
 */

/**
 * @typedef {Object} FileItem
 * @property {string} name - The display name of the file or folder
 * @property {string} [thumbnail] - Optional data URL for the thumbnail image
 * @property {Object} [meta] - Optional metadata object with additional info (e.g. size, type)
 * @property {FileItem[]} [children] - If present, indicates this item is a folder containing these child items
 */

/**
 * @typedef {Object} FileAction
 * @property {string} [icon] - Optional icon URL
 * @property {string} [label] - Label for the action
 * @property {function(FileItem):void} action - Callback invoked when the action is selected.
 */

/**
 * @typedef {Object} BrowseJSOptions
 * @property {string} [rootName] - The display name for the root folder (default: "Root")
 * @property {function(FileItem, number):void} [onSelect] - Callback when a file is selected, receives the file item and its index
 * @property {string} [detailsText] - Default text to show in the details pane when no selection is made (default: "Select a file")
 * @property {Object} [icons] - Custom icons configuration
 * @property {IconRule[]} [icons.rules] - Custom rules for determining icons based on MIME type or file extension
 * @property {string} [icons.folder] - Custom icon URL for folders
 * @property {string} [icons.default] - Custom icon URL for files that don't match any rule
 * @property {boolean} [multiSelect] - If true, allows selecting multiple files (default: false)
 * @property {function(string):?(FileItem)} [onCreateFolder] - Optional callback invoked when creating a new folder. If it returns a FileItem, it will be added to the current folder.
 * @property {function(File[]):?(FileItem|FileItem[])} [onUpload] - Optional callback invoked when files are uploaded. If it returns FileItem(s), they'll be added to the current folder.
 * @property {function(FileItem):FileAction[]} [onContext] - Optional callback invoked when the context menu is activated for a file. If it returns FileActions, they'll be displayed in the context menu.
 */

export class BrowseJS {
    /**
     * @param {string|Element} container - The the container element to render the gallery into. Can be a DOM element, ID, or selector string.
     * @param {FileItem[]} files - An array of file items to display in the root folder
     * @param {BrowseJSOptions} opts - Configuration options (see BrowseJSOptions typedef for details)
     */
    constructor(container, files = [], opts = {}) {
        if (container instanceof Element) { this.container = container; }
        else {
            const containerElement = document.getElementById(container) || document.querySelector(container);
            if (!containerElement) throw new Error('Container not found: ' + container);
            this.container = containerElement;
        }
        this.opts = opts;
        this.iconRules = opts.icons && opts.icons.rules ? opts.icons.rules : DEFAULT_ICON_RULES;
        this.folderIcon = opts.icons && opts.icons.folder ? opts.icons.folder : svgFolderIcon('');
        this.defaultIcon = opts.icons && opts.icons.default ? opts.icons.default : svgDocumentIcon('?', '#e9eefc');
        this.multi = Boolean(opts.multiSelect);
        this.selectedIndices = new Set();
        this.stack = [{ name: opts.rootName || 'Root', files }];

        // create breadcrumb and details elements and insert around the gallery container
        this.breadcrumbEl = document.createElement('nav');
        this.breadcrumbEl.className = 'breadcrumb';
        this.breadcrumbEl.setAttribute('aria-label', 'Breadcrumb');

        // crumbs wrapper and controls container
        this.crumbsWrap = document.createElement('div');
        this.crumbsWrap.className = 'crumbs-wrap';
        this.controlsEl = document.createElement('div');
        this.controlsEl.className = 'crumb-controls';
        this.breadcrumbEl.appendChild(this.crumbsWrap);
        this.breadcrumbEl.appendChild(this.controlsEl);

        this.detailsEl = document.createElement('aside');
        this.detailsEl.className = 'details';
        this.detailsEl.setAttribute('aria-live', 'polite');
        this.detailsEl.textContent = opts.detailsText || 'Select a file';

        // Insert breadcrumb, gallery grid and details inside the gallery container
        this.container.innerHTML = '';
        this.galleryEl = document.createElement('div');
        this.galleryEl.className = 'gallery-grid';
        this.container.appendChild(this.breadcrumbEl);
        this.container.appendChild(this.galleryEl);
        this.container.appendChild(this.detailsEl);

        this._fileInput = document.createElement('input');
        this._fileInput.type = 'file';
        this._fileInput.style.display = 'none';
        this.container.appendChild(this._fileInput);

        // bind events to the inner gallery grid
        this.container.classList.add('browsejs');
        this.galleryEl.tabIndex = 0;

        // drag & drop support: highlight container on dragover, accept drops
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.container.classList.add('dragover');
        });
        document.addEventListener('dragleave', (e) => {
            this.container.classList.remove('dragover');
        });
        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            this.container.classList.remove('dragover');
            const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
            if (files.length === 0) return;
            this.handleDropFiles(files);
        });

        this.render();
    }

    getIconForItem(item) {
        if (item.children) return this.folderIcon;
        const type = item.meta && item.meta.type ? String(item.meta.type).toLowerCase() : '';
        const name = item.name ? String(item.name).toLowerCase() : '';

        if (type) {
            for (const r of this.iconRules) {
                if (r.typeMatch && r.typeMatch(type)) return r.icon;
            }
        }
        for (const r of this.iconRules) {
            if (r.exts) {
                for (const e of r.exts) {
                    if (name.endsWith(e)) return r.icon;
                }
            }
        }
        return this.defaultIcon;
    }

    render() {
        this.galleryEl.innerHTML = '';
        const list = this.currentFiles();
        list.forEach((f, i) => {
            const card = document.createElement('button');
            card.className = 'card';
            card.type = 'button';
            card.dataset.index = i;
            card.title = f.name;

            const img = document.createElement('img');
            img.alt = f.name || '';
            img.src = f.thumbnail || this.getIconForItem(f);

            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.textContent = f.name;

            card.appendChild(img);
            card.appendChild(meta);

            if (this.opts.onContext) {
                const menu = document.createElement('div');
                menu.className = 'ctx-menu';
                menu.innerHTML = svgContextActionIcon;
                menu.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const prevSel = this.galleryEl.getElementsByClassName('ctx-menu selected').item(0);
                    if (prevSel) {
                        prevSel.removeChild(prevSel.getElementsByClassName('ctx-popup').item(0));
                        prevSel.classList.remove('selected');
                    }
                    menu.classList.add('selected');
                    const ctxItems = this.opts.onContext(f);

                    const ctxPop = document.createElement('div');
                    ctxPop.className = 'ctx-popup';

                    // Avoid menu clipping
                    const gridWidth = window.getComputedStyle(this.galleryEl).getPropertyValue('grid-template-columns').split(' ').length;
                    if (i % gridWidth === 0 || gridWidth - (i % gridWidth) > 2) {
                        ctxPop.classList.add('ctx-right');
                    } else {
                        ctxPop.classList.add('ctx-left');
                    }

                    ctxItems.forEach((item) => {
                        const ctxEntry = document.createElement('div');
                        ctxEntry.className = 'ctx-item';
                        if (item.icon) {
                            const ctxIcon = document.createElement('img');
                            ctxIcon.src = item.icon;
                            ctxEntry.appendChild(ctxIcon);
                        }
                        if (item.label) {
                            ctxEntry.appendChild(document.createTextNode(item.label));
                        }
                        ctxEntry.addEventListener('click', (e) => {
                            item.action(f);
                            console.log('entry', e, menu, ctxPop);
                            menu.removeChild(ctxPop);
                            menu.classList.remove('selected');
                            e.stopPropagation();
                        }, {once: true});
                        ctxPop.appendChild(ctxEntry);
                    });
                    this.container.addEventListener('click', () => {
                        // May have already been triggered by another handler
                        // above.
                        try {
                            menu.removeChild(ctxPop);
                            menu.classList.remove('selected');
                        }
                        catch {}
                    }, {once: true});
                    menu.appendChild(ctxPop);
                });
                card.appendChild(menu);
            }

            if (f.children && Array.isArray(f.children)) {
                card.addEventListener('click', () => this.enterFolder(i));
                card.addEventListener('keyup', (e) => { if (e.key === 'Enter') this.enterFolder(i); });
            } else {
                card.addEventListener('click', () => this.select(i));
                card.addEventListener('keyup', (e) => { if (e.key === 'Enter') this.select(i); });
            }

            this.galleryEl.appendChild(card);
        });
        this.updateSelectionUI();
        this.renderBreadcrumb();
    }

    updateSelectionUI() {
        const cards = this.galleryEl.querySelectorAll('.card');
        cards.forEach(c => {
            const idx = Number(c.dataset.index);
            if (this.selectedIndices.has(idx)) c.classList.add('selected');
            else c.classList.remove('selected');
        });
        this.renderDetails();
    }

    renderDetails() {
        if (!this.detailsEl) return;
        const activeList = this.currentFiles();
        if (this.selectedIndices.size === 0) { this.detailsEl.innerHTML = '<p class="small">No selection</p>'; }
        // If multiple selected, show a simple list and count
        else if (this.selectedIndices.size > 1) {
            const indices = Array.from(this.selectedIndices).sort();
            this.detailsEl.innerHTML = '';
            const header = document.createElement('div');
            header.innerHTML = `<strong>${indices.length} item${indices.length > 1 ? 's' : ''} selected</strong>`;
            this.detailsEl.appendChild(header);
            const list = document.createElement('div');
            list.className = 'small';
            list.innerHTML = indices.map(i => `<div>${escapeText((activeList[i] && activeList[i].name) || 'Untitled')}</div>`).join('');
            this.detailsEl.appendChild(list);
        }
        else {
            const index = Array.from(this.selectedIndices)[0];
            const item = activeList[index];
            if (!item) { this.detailsEl.innerHTML = '<p class="small">No selection</p>'; return; }
            this.detailsEl.innerHTML = '';
            const img = document.createElement('img');
            img.className = 'preview';
            img.src = item.thumbnail || this.galleryEl.querySelector(`.card[data-index="${index}"] img`)?.src || this.getIconForItem(item);
            img.alt = item.name || 'preview';
            const name = document.createElement('div');
            name.innerHTML = `<strong>${item.name || 'Untitled'}</strong>`;
            const meta = document.createElement('div');
            meta.className = 'small';

            if (item.meta && typeof item.meta === 'object') {
                meta.innerHTML = Object.entries(item.meta).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join('');
            } else if (item.meta) {
                meta.textContent = String(item.meta);
            } else {
                meta.textContent = '';
            }

            this.detailsEl.appendChild(img);
            this.detailsEl.appendChild(name);
            this.detailsEl.appendChild(meta);
        }
    }

    renderBreadcrumb() {
        if (!this.breadcrumbEl) return;
        this.crumbsWrap.innerHTML = '';
        this.stack.forEach((s, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'crumb';
            btn.textContent = s.name;
            btn.addEventListener('click', () => this.goToCrumb(idx));
            this.crumbsWrap.appendChild(btn);
            if (idx < this.stack.length - 1) {
                const sep = document.createElement('span'); sep.className = 'sep'; sep.textContent = '»';
                this.crumbsWrap.appendChild(sep);
            }
        });

        this.controlsEl.innerHTML = '';
        const hasCreate = typeof this.opts.onCreateFolder === 'function';
        const hasUpload = typeof this.opts.onUpload === 'function';
        if (hasCreate) {
            const createBtn = document.createElement('button');
            createBtn.type = 'button';
            createBtn.className = 'crumb-action';
            createBtn.textContent = 'New Folder';
            createBtn.addEventListener('click', () => this.handleCreateFolder());
            this.controlsEl.appendChild(createBtn);
        }

        if (hasUpload) {
            const uploadBtn = document.createElement('button');
            uploadBtn.type = 'button';
            uploadBtn.className = 'crumb-action';
            uploadBtn.textContent = 'Upload';
            uploadBtn.addEventListener('click', () => this.handleUpload());
            this.controlsEl.appendChild(uploadBtn);
        }
    }

    currentFolder() {return this.stack.map(s => s.name + '/').slice(1).join();}

    currentFiles() { return this.stack[this.stack.length - 1].files; }

    addFiles(files) {
        if (!Array.isArray(files)) files = [files];
        const current = this.currentFiles();
        current.push(...files);
        this.render();
    }

    getSelectedPaths() {
        const activeList = this.currentFiles();
        const basePath = this.currentFolder();
        const paths = [];
        Array.from(this.selectedIndices).forEach(i => {
            const item = activeList[i];
            if (item) {
                paths.push(basePath + item.name);
            }
        });
        return paths;
    }

    async handleCreateFolder() {
        if (this._creatingFolder) return;
        this._creatingFolder = true;

        const current = this.currentFiles();

        const card = document.createElement('div');
        card.className = 'card creating';
        card.tabIndex = 0;

        const img = document.createElement('img');
        img.alt = 'Folder';
        img.src = this.folderIcon;

        const meta = document.createElement('div');
        meta.className = 'meta';

        const nameEl = document.createElement('div');
        nameEl.className = 'editable-name';
        nameEl.contentEditable = 'true';
        nameEl.spellcheck = false;
        nameEl.textContent = '';

        meta.appendChild(nameEl);
        card.appendChild(img);
        card.appendChild(meta);

        this.galleryEl.insertBefore(card, this.galleryEl.firstChild);

        // focus and select text
        nameEl.focus();
        try {
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(nameEl);
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (e) { /* ignore selection errors */ }

        const cleanup = () => {
            this._creatingFolder = false;
            if (card.parentNode) card.parentNode.removeChild(card);
        };

        const commit = async () => {
            const name = nameEl.textContent.trim();
            if (!name) { cleanup(); return; }
            if (typeof this.opts.onCreateFolder === 'function') {
                const res = await this.opts.onCreateFolder(name);
                if (res) { current.splice(0, 0, res); }
                else { cleanup(); return; }
            } else {
                current.splice(0, 0, { name, children: [] });
            }
            this._creatingFolder = false;
            this.render();
        };

        const onKey = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameEl.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cleanup();
            }
        };

        nameEl.addEventListener('keydown', onKey);
        nameEl.addEventListener('blur', () => {
            // commit on blur (allow Enter's blur to fire first)
            setTimeout(() => {
                if (!this._creatingFolder) return;
                commit();
            }, 0);
        }, { once: true });
    }

    async handleUpload() {
        if (typeof this.opts.onUpload !== 'function') return;
        this._fileInput.value = '';
        this._fileInput.multiple = true;
        this._fileInput.onchange = async () => {
            const files = Array.from(this._fileInput.files || []);
            if (files.length === 0) return;
            try {
                const res = await this.opts.onUpload(files);
                if (res) {
                    const current = this.currentFiles();
                    if (Array.isArray(res)) current.push(...res); else current.push(res);
                    this.render();
                }
            } catch (err) { console.error('onUpload error', err); }
        };
        this._fileInput.click();
    }

    async handleDropFiles(files) {
        if (!files || files.length === 0) return;
        if (typeof this.opts.onUpload !== 'function') return;
        try {
            const res = await this.opts.onUpload(files);
            if (res) {
                const current = this.currentFiles();
                if (Array.isArray(res)) current.push(...res); else current.push(res);
                this.render();
            }
        } catch (err) { console.error('onUpload error', err); }
    }

    select(i) {
        const activeList = this.currentFiles();
        if (this.multi) {
            if (this.selectedIndices.has(i)) {
                this.selectedIndices.delete(i);
            }
            else {
                this.selectedIndices.add(i);
            }
        } else {
            if (this.selectedIndices.has(i)) {
                this.selectedIndices.clear();
            }
            else {
                this.selectedIndices.clear();
                this.selectedIndices.add(i);
            }
        }
        this.updateSelectionUI();
        if (typeof this.opts.onSelect === 'function') {
            const indices = Array.from(this.selectedIndices).sort((a, b) => a - b);
            const items = indices.map(idx => activeList[idx]);
            this.opts.onSelect(items, indices);
        }
    }

    enterFolder(i) {
        const f = this.currentFiles()[i];
        if (!f || !Array.isArray(f.children)) return;
        this.stack.push({ name: f.name || 'Folder', files: f.children });
        this.selectedIndices.clear();
        this.render();
    }

    goToCrumb(idx) {
        this.stack = this.stack.slice(0, idx + 1);
        this.selectedIndices.clear();
        this.render();
    }
}
