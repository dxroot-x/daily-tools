/* ── Sidebar ──────────────────────────────────── */
function toggleCategory(btn) {
    btn.classList.toggle("open");
    const items = btn.nextElementSibling;
    items.classList.toggle("open");
}

function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("overlay").classList.add("open");
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("open");
}

// Highlight active nav item & auto-open its category
document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
    document.querySelectorAll(".nav-item").forEach(a => {
        if (a.getAttribute("href") === path) {
            a.classList.add("active");
            const items = a.closest(".nav-items");
            if (items) {
                items.classList.add("open");
                const btn = items.previousElementSibling;
                if (btn) btn.classList.add("open");
            }
        }
    });

    initUploadZone();
    initToolForm();
    initDependentOptions();
    initSearch();

    // Escape key closes sidebar on mobile
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const sidebar = document.getElementById("sidebar");
            if (sidebar.classList.contains("open")) {
                closeSidebar();
            }
        }
    });
});


/* ── Search ──────────────────────────────────── */
function initSearch() {
    const input = document.getElementById("tool-search");
    if (!input) return;

    // "/" keyboard shortcut to focus search
    document.addEventListener("keydown", (e) => {
        if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
            e.preventDefault();
            input.focus();
        }
        if (e.key === "Escape" && document.activeElement === input) {
            input.value = "";
            input.blur();
            filterTools("");
        }
    });

    input.addEventListener("input", (e) => {
        filterTools(e.target.value.toLowerCase().trim());
    });
}

function filterTools(query) {
    const categories = document.querySelectorAll(".nav-category");
    categories.forEach(cat => {
        const items = cat.querySelectorAll(".nav-item");
        let anyVisible = false;

        items.forEach(item => {
            const name = item.dataset.toolName || item.textContent.toLowerCase();
            if (!query || name.includes(query)) {
                item.style.display = "";
                anyVisible = true;
            } else {
                item.style.display = "none";
            }
        });

        // Show/hide category based on matching children
        cat.style.display = anyVisible ? "" : "none";

        // Auto-open categories with matches during search
        if (query && anyVisible) {
            const btn = cat.querySelector(".nav-category-btn");
            const navItems = cat.querySelector(".nav-items");
            if (btn && navItems) {
                btn.classList.add("open");
                navItems.classList.add("open");
            }
        }
    });
}


/* ── Upload Zone ──────────────────────────────── */
let selectedFiles = [];

function initUploadZone() {
    const zone = document.getElementById("upload-zone");
    const input = document.getElementById("file-input");
    if (!zone || !input) return;

    zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("dragover"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
    zone.addEventListener("drop", e => {
        e.preventDefault();
        zone.classList.remove("dragover");
        addFiles(e.dataTransfer.files);
    });

    input.addEventListener("change", () => {
        addFiles(input.files);
        input.value = "";
    });
}

function addFiles(fileList) {
    const input = document.getElementById("file-input");
    const isMultiple = input && input.hasAttribute("multiple");

    if (isMultiple) {
        selectedFiles.push(...Array.from(fileList));
    } else {
        selectedFiles = [fileList[0]];
    }
    renderFileList();
    renderImagePreview();
}

function removeFile(idx) {
    selectedFiles.splice(idx, 1);
    renderFileList();
    renderImagePreview();
}

function renderFileList() {
    const list = document.getElementById("file-list");
    const prompt = document.getElementById("upload-prompt");
    const totalEl = document.getElementById("file-total");
    if (!list) return;

    if (selectedFiles.length === 0) {
        list.innerHTML = "";
        if (prompt) prompt.style.display = "";
        if (totalEl) totalEl.style.display = "none";
        return;
    }
    if (prompt) prompt.style.display = "none";

    list.innerHTML = selectedFiles.map((f, i) => `
        <div class="file-item">
            <span><i class="bi bi-file-earmark"></i> ${escapeHtml(f.name)}
            <small>(${formatSize(f.size)})</small></span>
            <button type="button" class="remove-file" onclick="removeFile(${i})" aria-label="Remove ${escapeHtml(f.name)}">&times;</button>
        </div>
    `).join("");

    if (totalEl && selectedFiles.length > 1) {
        const totalSize = selectedFiles.reduce((s, f) => s + f.size, 0);
        totalEl.style.display = "block";
        totalEl.textContent = `${selectedFiles.length} files · ${formatSize(totalSize)} total`;
    } else if (totalEl) {
        totalEl.style.display = "none";
    }
}

function renderImagePreview() {
    const previewArea = document.getElementById("image-preview-area");
    if (!previewArea) return;

    previewArea.innerHTML = "";

    selectedFiles.forEach(f => {
        if (!f.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.className = "upload-preview-img";
            img.alt = f.name;
            previewArea.appendChild(img);
        };
        reader.readAsDataURL(f);
    });
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function scrollToResults() {
    const area = document.getElementById("result-area");
    if (area && area.style.display !== "none") {
        area.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}


/* ── Toast Notifications ─────────────────────── */
function showToast(message, type = "info", duration = 3000) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icons = {
        success: "bi-check-circle-fill",
        error: "bi-exclamation-circle-fill",
        info: "bi-info-circle-fill",
        warning: "bi-exclamation-triangle-fill"
    };

    toast.innerHTML = `
        <i class="bi ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, duration);
}


/* ── Form Submission ──────────────────────────── */
function initToolForm() {
    const form = document.getElementById("tool-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const endpoint = form.dataset.endpoint;
        if (!endpoint) return;

        const btnText = document.querySelector(".btn-text");
        const btnLoad = document.querySelector(".btn-loading");
        const submitBtn = document.getElementById("submit-btn");
        const resultArea = document.getElementById("result-area");

        // Validate: either files or text input required
        const textInput = form.querySelector("textarea[name='text']");
        if (!textInput && selectedFiles.length === 0) {
            showToast("Please select a file first.", "warning");
            return;
        }
        if (textInput && !textInput.value.trim()) {
            showToast("Please enter some text.", "warning");
            return;
        }

        // Show loading
        if (btnText) btnText.style.display = "none";
        if (btnLoad) btnLoad.style.display = "inline-flex";
        submitBtn.disabled = true;
        resultArea.style.display = "none";

        const formData = new FormData(form);

        // Remove the empty file input and add our tracked files
        formData.delete("files");
        selectedFiles.forEach(f => formData.append("files", f));

        try {
            const resp = await fetch(endpoint, { method: "POST", body: formData });

            if (!resp.ok) {
                let msg = "Processing failed.";
                try {
                    const json = await resp.json();
                    msg = json.error || msg;
                } catch (_) {}
                showError(msg);
                showToast(msg, "error", 5000);
                return;
            }

            const ct = resp.headers.get("Content-Type") || "";

            if (ct.includes("application/json")) {
                const json = await resp.json();
                if (json.error) {
                    showError(json.error);
                    showToast(json.error, "error", 5000);
                } else if (json.text !== undefined) {
                    showTextResult(json.text);
                    showToast("Text extracted successfully!", "success");
                } else if (json.data !== undefined) {
                    showTextResult(typeof json.data === "string" ? json.data : JSON.stringify(json.data, null, 2));
                    showToast("Done!", "success");
                }
            } else {
                // Binary file download
                const blob = await resp.blob();
                const cd = resp.headers.get("Content-Disposition") || "";
                let filename = "download";
                const match = cd.match(/filename="?([^";\n]+)"?/);
                if (match) filename = match[1];

                const url = URL.createObjectURL(blob);

                // If image, show preview
                if (ct.startsWith("image/")) {
                    showFileResult(url, filename, true);
                } else {
                    showFileResult(url, filename, false);
                }
                showToast(`File "${filename}" ready for download!`, "success");
            }
        } catch (err) {
            showError("Network error: " + err.message);
            showToast("Network error: " + err.message, "error", 5000);
        } finally {
            if (btnText) btnText.style.display = "";
            if (btnLoad) btnLoad.style.display = "none";
            submitBtn.disabled = false;
        }
    });
}

function showError(msg) {
    const area = document.getElementById("result-area");
    area.style.display = "block";
    document.getElementById("result-success").style.display = "none";
    document.getElementById("result-text")?.style.setProperty("display", "none");
    const errEl = document.getElementById("result-error");
    errEl.style.display = "flex";
    document.getElementById("error-message").textContent = msg;
    scrollToResults();
}

function showFileResult(url, filename, isImage) {
    const area = document.getElementById("result-area");
    area.style.display = "block";
    document.getElementById("result-error").style.display = "none";
    document.getElementById("result-text")?.style.setProperty("display", "none");

    const success = document.getElementById("result-success");
    success.style.display = "flex";
    document.getElementById("result-message").textContent = "File ready!";

    const btn = document.getElementById("download-btn");
    btn.href = url;
    btn.download = filename;
    btn.textContent = "";
    btn.innerHTML = '<i class="bi bi-download"></i> Download ' + filename;

    const preview = document.getElementById("result-preview");
    if (isImage) {
        preview.style.display = "block";
        preview.innerHTML = `<img src="${url}" alt="Preview">`;
    } else {
        preview.style.display = "none";
    }
    scrollToResults();
}

function showTextResult(text) {
    const area = document.getElementById("result-area");
    area.style.display = "block";
    document.getElementById("result-error").style.display = "none";
    document.getElementById("result-success").style.display = "none";

    const textBox = document.getElementById("result-text");
    if (textBox) {
        textBox.style.display = "block";
        document.getElementById("result-text-content").textContent = text;
    }
    scrollToResults();
}

function copyResult() {
    const text = document.getElementById("result-text-content")?.textContent;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById("copy-btn");
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
            btn.classList.add("copied");
            setTimeout(() => {
                btn.innerHTML = original;
                btn.classList.remove("copied");
            }, 2000);
        }
        showToast("Copied to clipboard!", "success", 2000);
    });
}


/* ── Dependent Options ────────────────────────── */
function initDependentOptions() {
    document.querySelectorAll("[data-depends-on]").forEach(el => {
        const parentName = el.dataset.dependsOn;
        const requiredVal = el.dataset.dependsValue;
        const parentInput = document.querySelector(`[name="${parentName}"]`);
        if (!parentInput) return;

        const check = () => {
            // Support comma-separated values
            const vals = requiredVal.split(",");
            el.style.display = vals.includes(parentInput.value) ? "" : "none";
        };
        parentInput.addEventListener("change", check);
        check();
    });
}


/* ── Interactive Preview Engine ───────────────── */
let previewState = null;

function getBrandColor() {
    return getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#4361ee";
}

function initInteractivePreview() {
    const previewEl = document.getElementById("interactive-preview");
    const canvas = document.getElementById("preview-canvas");
    const placeholder = document.getElementById("preview-placeholder");
    const form = document.getElementById("tool-form");
    if (!previewEl || !canvas || !form || selectedFiles.length === 0) return;

    const raw = form.dataset.interactive;
    if (!raw) return;
    const config = JSON.parse(raw);

    const file = selectedFiles[0];
    if (!file.type.startsWith("image/")) return;

    // Hide placeholder, show canvas
    if (placeholder) placeholder.style.display = "none";
    canvas.style.display = "block";

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            previewState = { img, config, ctx: null, scale: 1, offsetX: 0, offsetY: 0 };
            setupCanvas(canvas, img);
            renderToolbar(config);
            switch (config.type) {
                case "crop": initCropMode(canvas, img, config); break;
                case "rotate": initRotateMode(canvas, img, config); break;
                case "watermark": initWatermarkMode(canvas, img, config); break;
                case "resize": initResizeMode(canvas, img, config); break;
                case "favicon": initFaviconMode(canvas, img, config); break;
                default: initPreviewMode(canvas, img, config); break;
            }
        };
        img.onerror = () => {
            if (placeholder) placeholder.style.display = "flex";
            canvas.style.display = "none";
        };
        img.src = e.target.result;
    };
    reader.onerror = () => {
        if (placeholder) placeholder.style.display = "flex";
        canvas.style.display = "none";
    };
    reader.readAsDataURL(file);
}

function setupCanvas(canvas, img) {
    const wrap = canvas.parentElement;
    const maxW = wrap.clientWidth - 2;
    const maxH = Math.min(window.innerHeight * 0.7, 600);
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";
    previewState.scale = scale;
    previewState.ctx = canvas.getContext("2d");
    previewState.canvas = canvas;
}

function renderToolbar(config) {
    const toolbar = document.getElementById("preview-toolbar");
    if (!toolbar) return;
    if (!config.toolbar) { toolbar.innerHTML = ""; return; }

    const groups = {};
    config.toolbar.forEach(item => {
        const g = item.group || "default";
        if (!groups[g]) groups[g] = [];
        groups[g].push(item);
    });

    toolbar.innerHTML = Object.entries(groups).map(([name, items]) => {
        let html = `<div class="toolbar-group">`;
        if (name !== "default") html += `<span class="toolbar-label">${name}</span>`;
        html += items.map(item => {
            if (item.type === "ratio-btn") {
                return `<button class="ratio-btn" data-action="${item.action}" data-ratio="${item.ratio||""}">${item.label}</button>`;
            }
            if (item.type === "range") {
                return `<input type="range" data-action="${item.action}" min="${item.min}" max="${item.max}" value="${item.value}" step="${item.step}" style="width:120px" id="toolbar-range">`;
            }
            if (item.type === "checkbox") {
                return `<label class="checkbox-label"><input type="checkbox" data-action="${item.action}" id="toolbar-${item.action}"><span>${item.label}</span></label>`;
            }
            return `<button class="btn btn-small" data-action="${item.action}">${item.label}</button>`;
        }).join("");
        html += `</div>`;
        return html;
    }).join("");

    toolbar.querySelectorAll("[data-action]").forEach(el => {
        el.addEventListener("click", () => handleToolbarAction(el.dataset.action, el));
        if (el.type === "range") {
            el.addEventListener("input", () => handleToolbarAction(el.dataset.action, el));
        }
    });
}

function handleToolbarAction(action, el) {
    if (!previewState) return;

    switch (action) {
        case "reset":
            if (previewState.config.type === "crop") resetCrop();
            else if (previewState.config.type === "rotate") { previewState.angle = 0; previewState.flipH = false; previewState.flipV = false; drawRotatePreview(); }
            break;
        case "apply":
            applyInteractive();
            break;
        case "ratio-square":
            setCropRatio(1); break;
        case "ratio-4-3":
            setCropRatio(4/3); break;
        case "ratio-16-9":
            setCropRatio(16/9); break;
        case "ratio-9-16":
            setCropRatio(9/16); break;
        case "ratio-free":
            setCropRatio(null); break;
        case "angle":
            previewState.angle = parseInt(el.value) || 0;
            drawRotatePreview();
            break;
        case "flip-h":
            previewState.flipH = el.checked;
            drawRotatePreview();
            break;
        case "flip-v":
            previewState.flipV = el.checked;
            drawRotatePreview();
            break;
        case "opacity":
            previewState.wmOpacity = parseInt(el.value) / 100;
            drawWatermarkPreview();
            break;
        case "fontsize":
            previewState.wmFontsize = parseInt(el.value) || 36;
            drawWatermarkPreview();
            break;
    }
}

function applyInteractive() {
    const form = document.getElementById("tool-form");
    if (!form || !previewState) return;

    if (previewState.config.type === "crop") {
        const s = previewState;
        document.getElementById("crop-x").value = s.crop.x;
        document.getElementById("crop-y").value = s.crop.y;
        document.getElementById("crop-w").value = s.crop.w;
        document.getElementById("crop-h").value = s.crop.h;
        // Set mode to interactive
        const modeSelect = form.querySelector("[name='mode']");
        if (modeSelect) modeSelect.value = "interactive";
    } else if (previewState.config.type === "rotate") {
        document.getElementById("rotate-angle").value = previewState.angle || 0;
        document.getElementById("rotate-flip-h").value = previewState.flipH ? "on" : "";
        document.getElementById("rotate-flip-v").value = previewState.flipV ? "on" : "";
        const actionSelect = form.querySelector("[name='action']");
        if (actionSelect) actionSelect.value = "custom";
    } else if (previewState.config.type === "watermark") {
        document.getElementById("wm-pos-x").value = previewState.wmX ?? 0.5;
        document.getElementById("wm-pos-y").value = previewState.wmY ?? 0.5;
    }

    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
}


/* ── Crop Mode ─────────────────────────────────── */
function initCropMode(canvas, img, config) {
    const s = previewState;
    const pad = 0.05;
    s.crop = { x: pad, y: pad, w: 1 - pad * 2, h: 1 - pad * 2 };
    s.cropRatio = null;
    s.dragging = null;
    s.dragStart = { x: 0, y: 0 };
    s.dragCropStart = null;

    setCropRatio(null);
    drawCropPreview();

    canvas.addEventListener("mousedown", (e) => cropMouseDown(e, canvas));
    canvas.addEventListener("mousemove", (e) => cropMouseMove(e, canvas));
    canvas.addEventListener("mouseup", () => cropMouseUp());
    canvas.addEventListener("mouseleave", () => cropMouseUp());

    canvas.addEventListener("touchstart", (e) => { e.preventDefault(); cropMouseDown(e.touches[0], canvas); });
    canvas.addEventListener("touchmove", (e) => { e.preventDefault(); cropMouseMove(e.touches[0], canvas); });
    canvas.addEventListener("touchend", () => cropMouseUp());

    document.addEventListener("keydown", (e) => {
        if (!previewState || previewState.config.type !== "crop") return;
        if (e.key === "Enter") { e.preventDefault(); applyInteractive(); }
        if (e.key === "Escape") { e.preventDefault(); resetCrop(); }
        const nudge = e.shiftKey ? 10 : 1;
        const pixelNudge = nudge / (previewState.img.width * previewState.scale);
        if (e.key === "ArrowUp") { s.crop.y -= pixelNudge; clampCrop(); drawCropPreview(); }
        if (e.key === "ArrowDown") { s.crop.y += pixelNudge; clampCrop(); drawCropPreview(); }
        if (e.key === "ArrowLeft") { s.crop.x -= pixelNudge; clampCrop(); drawCropPreview(); }
        if (e.key === "ArrowRight") { s.crop.x += pixelNudge; clampCrop(); drawCropPreview(); }
    });
}

function resetCrop() {
    const s = previewState;
    const pad = 0.05;
    s.crop = { x: pad, y: pad, w: 1 - pad * 2, h: 1 - pad * 2 };
    setCropRatio(null);
    drawCropPreview();
}

function setCropRatio(ratio) {
    previewState.cropRatio = ratio;
    document.querySelectorAll(".ratio-btn").forEach(b => {
        const r = b.dataset.ratio;
        const active = (ratio === null && r === "free") ||
            (ratio === 1 && r === "1") ||
            (ratio === 4/3 && r === "4/3") ||
            (ratio === 16/9 && r === "16/9") ||
            (ratio === 9/16 && r === "9/16");
        b.classList.toggle("active", active);
    });
    if (ratio) enforceCropRatio();
    drawCropPreview();
}

function enforceCropRatio() {
    const s = previewState;
    if (!s.cropRatio) return;
    const r = s.cropRatio;
    if (s.crop.w / s.crop.h > r) {
        s.crop.w = s.crop.h * r;
    } else {
        s.crop.h = s.crop.w / r;
    }
    clampCrop();
}

function clampCrop() {
    const c = previewState.crop;
    if (c.x < 0) c.x = 0;
    if (c.y < 0) c.y = 0;
    if (c.x + c.w > 1) { c.x = Math.max(0, 1 - c.w); if (c.w > 1) c.w = 1; }
    if (c.y + c.h > 1) { c.y = Math.max(0, 1 - c.h); if (c.h > 1) c.h = 1; }
}

function getHandleAt(ex, ey, canvas) {
    const s = previewState;
    const cw = canvas.width, ch = canvas.height;
    const cx = s.crop.x * cw, cy = s.crop.y * ch;
    const cw_ = s.crop.w * cw, ch_ = s.crop.h * ch;
    const handleSize = 12;

    const handles = {
        nw: { x: cx, y: cy, cursor: "crop-nw" },
        n:  { x: cx + cw_ / 2, y: cy, cursor: "crop-n" },
        ne: { x: cx + cw_, y: cy, cursor: "crop-ne" },
        e:  { x: cx + cw_, y: cy + ch_ / 2, cursor: "crop-e" },
        se: { x: cx + cw_, y: cy + ch_, cursor: "crop-se" },
        s:  { x: cx + cw_ / 2, y: cy + ch_, cursor: "crop-s" },
        sw: { x: cx, y: cy + ch_, cursor: "crop-sw" },
        w:  { x: cx, y: cy + ch_ / 2, cursor: "crop-w" },
    };

    for (const [name, h] of Object.entries(handles)) {
        if (Math.abs(ex - h.x) < handleSize && Math.abs(ey - h.y) < handleSize) {
            return name;
        }
    }

    if (ex >= cx && ex <= cx + cw_ && ey >= cy && ey <= cy + ch_) {
        return "move";
    }
    return null;
}

function cropMouseDown(e, canvas) {
    const s = previewState;
    const rect = canvas.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;
    const handle = getHandleAt(ex, ey, canvas);

    if (handle) {
        s.dragging = handle;
        s.dragStart = { x: ex, y: ey };
        s.dragCropStart = { ...s.crop };
        canvas.classList.add(handle === "move" ? "crop-move" : `crop-${handle}`);
    }
}

function cropMouseMove(e, canvas) {
    const s = previewState;
    const rect = canvas.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;

    if (s.dragging) {
        const dx = (ex - s.dragStart.x) / canvas.width;
        const dy = (ey - s.dragStart.y) / canvas.height;
        const start = s.dragCropStart;

        switch (s.dragging) {
            case "move":
                s.crop.x = start.x + dx;
                s.crop.y = start.y + dy;
                break;
            case "se":
                s.crop.w = Math.max(0.01, start.w + dx);
                s.crop.h = Math.max(0.01, start.h + dy);
                break;
            case "sw":
                s.crop.x = start.x + dx;
                s.crop.w = Math.max(0.01, start.w - dx);
                s.crop.h = Math.max(0.01, start.h + dy);
                break;
            case "ne":
                s.crop.y = start.y + dy;
                s.crop.w = Math.max(0.01, start.w + dx);
                s.crop.h = Math.max(0.01, start.h - dy);
                break;
            case "nw":
                s.crop.x = start.x + dx;
                s.crop.y = start.y + dy;
                s.crop.w = Math.max(0.01, start.w - dx);
                s.crop.h = Math.max(0.01, start.h - dy);
                break;
            case "n":
                s.crop.y = start.y + dy;
                s.crop.h = Math.max(0.01, start.h - dy);
                break;
            case "s":
                s.crop.h = Math.max(0.01, start.h + dy);
                break;
            case "e":
                s.crop.w = Math.max(0.01, start.w + dx);
                break;
            case "w":
                s.crop.x = start.x + dx;
                s.crop.w = Math.max(0.01, start.w - dx);
                break;
        }

        clampCrop();
        if (s.cropRatio) enforceCropRatio();
        drawCropPreview();
    } else {
        const handle = getHandleAt(ex, ey, canvas);
        canvas.className = handle ? `crop-${handle}` : "";
    }
}

function cropMouseUp() {
    if (!previewState) return;
    previewState.dragging = null;
    if (previewState.canvas) previewState.canvas.className = "";
}

function drawCropPreview() {
    const s = previewState;
    const ctx = s.ctx;
    const canvas = s.canvas;
    const cw = canvas.width, ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(s.img, 0, 0, cw, ch);

    const cx = s.crop.x * cw, cy = s.crop.y * ch;
    const cw_ = s.crop.w * cw, ch_ = s.crop.h * ch;

    // Dark overlay outside crop
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, cw, cy);
    ctx.fillRect(0, cy, cx, ch_);
    ctx.fillRect(cx + cw_, cy, cw - cx - cw_, ch_);
    ctx.fillRect(0, cy + ch_, cw, ch - cy - ch_);

    // Crop border
    ctx.strokeStyle = getBrandColor();
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(cx, cy, cw_, ch_);
    ctx.setLineDash([]);

    // Rule of thirds
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(cx + cw_ * i / 3, cy); ctx.lineTo(cx + cw_ * i / 3, cy + ch_); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy + ch_ * i / 3); ctx.lineTo(cx + cw_, cy + ch_ * i / 3); ctx.stroke();
    }

    // Handles
    const handles = [
        { x: cx, y: cy }, { x: cx + cw_ / 2, y: cy }, { x: cx + cw_, y: cy },
        { x: cx + cw_, y: cy + ch_ / 2 }, { x: cx + cw_, y: cy + ch_ },
        { x: cx + cw_ / 2, y: cy + ch_ }, { x: cx, y: cy + ch_ }, { x: cx, y: cy + ch_ / 2 },
    ];
    handles.forEach(h => {
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = getBrandColor();
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(h.x, h.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });

    // Info
    const imgW = Math.round(s.crop.w * s.img.width);
    const imgH = Math.round(s.crop.h * s.img.height);
    const infoEl = document.getElementById("preview-info");
    if (infoEl) {
        infoEl.innerHTML = `
            <span>Selection: <strong>${imgW} × ${imgH} px</strong></span>
            <span>Ratio: <strong>${(imgW/imgH).toFixed(2)}</strong></span>
            <span style="color:var(--text-tertiary)">Drag handles · Enter=Apply · Esc=Reset</span>`;
    }
}


/* ── Rotate Mode ──────────────────────────────── */
function initRotateMode(canvas, img, config) {
    previewState.angle = 0;
    previewState.flipH = false;
    previewState.flipV = false;
    drawRotatePreview();
}

function drawRotatePreview() {
    const s = previewState;
    const ctx = s.ctx;
    const canvas = s.canvas;
    const cw = canvas.width, ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#0b0f19";
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate((s.angle * Math.PI) / 180);
    if (s.flipH) ctx.scale(-1, 1);
    if (s.flipV) ctx.scale(1, -1);
    ctx.drawImage(s.img, -cw / 2, -ch / 2, cw, ch);
    ctx.restore();

    document.getElementById("rotate-angle").value = s.angle || 0;
    document.getElementById("rotate-flip-h").value = s.flipH ? "on" : "";
    document.getElementById("rotate-flip-v").value = s.flipV ? "on" : "";

    const infoEl = document.getElementById("preview-info");
    if (infoEl) infoEl.innerHTML = `<span>Angle: <strong>${s.angle || 0}°</strong></span>`;
}


/* ── Watermark Mode ───────────────────────────── */
function initWatermarkMode(canvas, img, config) {
    previewState.wmX = 0.5;
    previewState.wmY = 0.5;
    previewState.wmOpacity = 0.4;
    previewState.wmFontsize = 36;
    previewState.wmDragging = false;

    drawWatermarkPreview();

    // Sync form fields to preview
    const textInput = document.querySelector("[name='text']");
    const opacityInput = document.querySelector("[name='opacity']");
    const fontSizeInput = document.querySelector("[name='fontsize']");
    if (textInput) textInput.addEventListener("input", () => drawWatermarkPreview());
    if (opacityInput) opacityInput.addEventListener("input", () => {
        previewState.wmOpacity = parseInt(opacityInput.value) / 100;
        drawWatermarkPreview();
    });
    if (fontSizeInput) fontSizeInput.addEventListener("input", () => {
        previewState.wmFontsize = parseInt(fontSizeInput.value) || 36;
        drawWatermarkPreview();
    });

    canvas.addEventListener("mousedown", (e) => wmMouseDown(e, canvas));
    canvas.addEventListener("mousemove", (e) => wmMouseMove(e, canvas));
    canvas.addEventListener("mouseup", () => { previewState.wmDragging = false; });
    canvas.addEventListener("touchstart", (e) => { e.preventDefault(); wmMouseDown(e.touches[0], canvas); });
    canvas.addEventListener("touchmove", (e) => { e.preventDefault(); wmMouseMove(e.touches[0], canvas); });
    canvas.addEventListener("touchend", () => { previewState.wmDragging = false; });
}

function drawWatermarkPreview() {
    const s = previewState;
    const ctx = s.ctx;
    const canvas = s.canvas;
    const cw = canvas.width, ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(s.img, 0, 0, cw, ch);

    const text = document.querySelector("[name='text']")?.value || "Watermark";
    const opacity = s.wmOpacity;
    const fontSize = Math.max(8, s.wmFontsize * s.scale);
    const px = s.wmX * cw, py = s.wmY * ch;

    ctx.save();
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = `rgba(255,255,255,${opacity})`;
    ctx.strokeStyle = `rgba(0,0,0,${opacity * 0.5})`;
    ctx.lineWidth = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(text, px, py);
    ctx.fillText(text, px, py);
    ctx.restore();

    // Store text bounds for hit testing
    const metrics = ctx.measureText(text);
    s.wmBounds = {
        x: px - metrics.width / 2, y: py - fontSize / 2,
        w: metrics.width, h: fontSize,
    };

    document.getElementById("wm-pos-x").value = s.wmX;
    document.getElementById("wm-pos-y").value = s.wmY;

    const infoEl = document.getElementById("preview-info");
    if (infoEl) infoEl.innerHTML = `<span>Drag watermark to position · <strong>Opacity: ${Math.round(opacity*100)}%</strong></span>`;
}

function wmMouseDown(e, canvas) {
    const s = previewState;
    const rect = canvas.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;

    if (s.wmBounds && ex >= s.wmBounds.x && ex <= s.wmBounds.x + s.wmBounds.w &&
        ey >= s.wmBounds.y && ey <= s.wmBounds.y + s.wmBounds.h) {
        s.wmDragging = true;
        s.wmDragOff = { x: ex - s.wmX * canvas.width, y: ey - s.wmY * canvas.height };
    }
}

function wmMouseMove(e, canvas) {
    const s = previewState;
    if (!s.wmDragging) return;
    const rect = canvas.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;
    s.wmX = Math.max(0, Math.min(1, (ex - s.wmDragOff.x) / canvas.width));
    s.wmY = Math.max(0, Math.min(1, (ey - s.wmDragOff.y) / canvas.height));
    drawWatermarkPreview();
}


/* ── Resize Mode ──────────────────────────────── */
function initResizeMode(canvas, img, config) {
    drawResizePreview();
    // Listen to dimension input changes
    const wInput = document.querySelector("[name='width']");
    const hInput = document.querySelector("[name='height']");
    if (wInput) wInput.addEventListener("input", drawResizePreview);
    if (hInput) hInput.addEventListener("input", drawResizePreview);
}

function drawResizePreview() {
    const s = previewState;
    const ctx = s.ctx;
    const canvas = s.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0b0f19";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const wInput = document.querySelector("[name='width']");
    const hInput = document.querySelector("[name='height']");
    const keepRatio = document.querySelector("[name='keep_ratio']");
    let targetW = parseInt(wInput?.value) || s.img.width;
    let targetH = parseInt(hInput?.value) || s.img.height;

    if (keepRatio?.checked) {
        if (wInput?.value && !hInput?.value) targetH = Math.round(targetW * s.img.height / s.img.width);
        else if (hInput?.value && !wInput?.value) targetW = Math.round(targetH * s.img.width / s.img.height);
    }

    const maxDim = Math.max(canvas.width, canvas.height) * 0.8;
    const previewScale = Math.min(maxDim / targetW, maxDim / targetH);
    const pw = targetW * previewScale, ph = targetH * previewScale;
    const px = (canvas.width - pw) / 2, py = (canvas.height - ph) / 2;

    ctx.drawImage(s.img, px, py, pw, ph);

    ctx.strokeStyle = getBrandColor();
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(px, py, pw, ph);
    ctx.setLineDash([]);

    const infoEl = document.getElementById("preview-info");
    if (infoEl) infoEl.innerHTML = `<span>Original: <strong>${s.img.width}×${s.img.height}</strong></span>
        <span>New: <strong>${targetW}×${targetH}</strong></span>`;
}


/* ── Preview Mode (compress, convert) ─────────── */
function initPreviewMode(canvas, img, config) {
    drawPreviewOnly();
    const infoEl = document.getElementById("preview-info");
    if (infoEl) infoEl.innerHTML = `<span>Original size: <strong>${img.width}×${img.height} px</strong></span>`;
}

function drawPreviewOnly() {
    const s = previewState;
    const ctx = s.ctx;
    const canvas = s.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(s.img, 0, 0, canvas.width, canvas.height);
}


/* ── Favicon Mode ─────────────────────────────── */
function initFaviconMode(canvas, img, config) {
    drawFaviconPreview();
    const infoEl = document.getElementById("preview-info");
    if (infoEl) infoEl.innerHTML = `<span>Source: <strong>${img.width}×${img.height}</strong></span>
        <span>Preview sizes: <strong>16, 32, 48 px</strong></span>`;
}

function drawFaviconPreview() {
    const s = previewState;
    const ctx = s.ctx;
    const canvas = s.canvas;
    const cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, cw, ch);

    // Draw checkerboard for transparent areas
    const squareSize = 6;
    for (let y = 0; y < ch; y += squareSize) {
        for (let x = 0; x < cw; x += squareSize) {
            ctx.fillStyle = ((x / squareSize + y / squareSize) % 2 === 0) ? "#1e293b" : "#0f172a";
            ctx.fillRect(x, y, squareSize, squareSize);
        }
    }

    // Original image on left side
    const srcW = cw * 0.5;
    const srcH = ch * 0.55;
    const srcX = 0;
    const srcY = (ch - srcH) / 2;
    const srcScale = Math.min(srcW / s.img.width, srcH / s.img.height);
    const iw = s.img.width * srcScale, ih = s.img.height * srcScale;
    ctx.drawImage(s.img, srcX + (srcW - iw) / 2, srcY + (srcH - ih) / 2, iw, ih);
    ctx.strokeStyle = getBrandColor();
    ctx.lineWidth = 1;
    ctx.strokeRect(srcX, srcY, srcW, srcH);

    // Favicon size grid on right side
    const sizes = [16, 32, 48];
    const gap = 20;
    const gridX = cw * 0.5 + 20;
    const gridW = cw * 0.5 - 40;
    const totalH = sizes.length * (gap + 48) + gap;
    const gridY = (ch - totalH) / 2;

    sizes.forEach((size, i) => {
        const y = gridY + i * (48 + gap);
        const x = gridX + (gridW - size) / 2;

        // Draw label
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px Inter, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(`${size}×${size}`, x - 8, y + size / 2 + 4);

        // Draw sized favicon
        ctx.drawImage(s.img, x, y, size, size);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
    });
}


/* ── Wire into file add ───────────────────────── */
const origAddFiles = addFiles;
addFiles = function(fileList) {
    origAddFiles(fileList);
    const previewEl = document.getElementById("interactive-preview");
    if (previewEl && selectedFiles.length > 0 && selectedFiles[0].type.startsWith("image/")) {
        initInteractivePreview();
    }
};

const origRemoveFile = removeFile;
removeFile = function(idx) {
    origRemoveFile(idx);
    const previewEl = document.getElementById("interactive-preview");
    if (selectedFiles.length === 0 && previewEl) {
        previewState = null;
        const canvas = document.getElementById("preview-canvas");
        const placeholder = document.getElementById("preview-placeholder");
        const info = document.getElementById("preview-info");
        const toolbar = document.getElementById("preview-toolbar");
        if (canvas) { canvas.style.display = "none"; canvas.width = 0; canvas.height = 0; }
        if (placeholder) placeholder.style.display = "flex";
        if (info) info.innerHTML = "";
        if (toolbar) toolbar.innerHTML = "";
    }
};
