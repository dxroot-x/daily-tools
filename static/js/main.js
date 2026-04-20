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
    if (!list) return;

    if (selectedFiles.length === 0) {
        list.innerHTML = "";
        if (prompt) prompt.style.display = "";
        return;
    }
    if (prompt) prompt.style.display = "none";

    list.innerHTML = selectedFiles.map((f, i) => `
        <div class="file-item">
            <span><i class="bi bi-file-earmark"></i> ${f.name}
            <small>(${formatSize(f.size)})</small></span>
            <button type="button" class="remove-file" onclick="removeFile(${i})">&times;</button>
        </div>
    `).join("");
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
