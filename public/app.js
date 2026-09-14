/**
 * THE STUDY VAULT - Frontend Application
 * Handles animations, subject drawer compartments, direct downloads, and Owner Mode.
 */

// Global State
const state = {
  subjects: [],
  categories: [],
  materials: [],
  currentSubjectId: null,
  currentCategoryFilter: 'ALL',
  adminToken: sessionStorage.getItem('vault_admin_token') || null,
  isOwnerMode: false,
  pendingDeleteMaterial: null
};

// Fun Toast Messages for Downloads
const DOWNLOAD_JOKES = [
  "Downloading! Don't just save it, actually read it 😂",
  "Study material secured. Zero excuses left now! 🫡",
  "Academic weapon status: LOADING... 🧠",
  "File grabbed! Please tell me we're actually studying tonight. ☕",
  "Download started! 5 minutes of study, 4 hours of phone scrolling? 📱",
  "Grabbed! May the exam grading curve be ever in your favor. 🎯"
];

// File Type Info Helper
function getFileInfo(fileType) {
  switch (fileType) {
    case 'pdf':
      return { icon: '📄', label: 'PDF', class: 'file-badge-pdf' };
    case 'ppt':
      return { icon: '📊', label: 'PPT', class: 'file-badge-ppt' };
    case 'doc':
      return { icon: '📝', label: 'DOC', class: 'file-badge-doc' };
    case 'zip':
      return { icon: '📦', label: 'ZIP', class: 'file-badge-zip' };
    default:
      return { icon: '🗂️', label: 'FILE', class: 'file-badge-other' };
  }
}

// Format File Size Helper
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format Date Helper
function formatDate(dateString) {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
}

// DOM Elements
const elements = {
  subjectsGrid: document.getElementById('subjectsGrid'),
  totalMaterialsCount: document.getElementById('totalMaterialsCount'),
  
  // Compartment Overlay & Drawer
  compartmentOverlay: document.getElementById('compartmentOverlay'),
  compartmentBackdrop: document.getElementById('compartmentBackdrop'),
  compartmentHeader: document.getElementById('compartmentHeader'),
  drawerSubjectEmoji: document.getElementById('drawerSubjectEmoji'),
  drawerSubjectCode: document.getElementById('drawerSubjectCode'),
  drawerCountBadge: document.getElementById('drawerCountBadge'),
  drawerTagline: document.getElementById('drawerTagline'),
  closeDrawerBtn: document.getElementById('closeDrawerBtn'),
  closeDrawerSecondaryBtn: document.getElementById('closeDrawerSecondaryBtn'),
  categoryPillsBar: document.getElementById('categoryPillsBar'),
  materialsList: document.getElementById('materialsList'),
  drawerEmptyState: document.getElementById('drawerEmptyState'),
  openUploadBtn: document.getElementById('openUploadBtn'),
  emptyUploadBtn: document.getElementById('emptyUploadBtn'),

  // Owner Mode Elements
  ownerToggleBtn: document.getElementById('ownerToggleBtn'),
  ownerLockIcon: document.getElementById('ownerLockIcon'),
  ownerStatusText: document.getElementById('ownerStatusText'),
  ownerPillFloat: document.getElementById('ownerPillFloat'),
  ownerLogoutBtn: document.getElementById('ownerLogoutBtn'),

  // Auth Modal
  authModalOverlay: document.getElementById('authModalOverlay'),
  authModalBackdrop: document.getElementById('authModalBackdrop'),
  closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
  cancelAuthBtn: document.getElementById('cancelAuthBtn'),
  authForm: document.getElementById('authForm'),
  adminPasswordInput: document.getElementById('adminPasswordInput'),
  togglePasswordEyeBtn: document.getElementById('togglePasswordEyeBtn'),
  authErrorMsg: document.getElementById('authErrorMsg'),

  // Upload Modal
  uploadModalOverlay: document.getElementById('uploadModalOverlay'),
  uploadModalBackdrop: document.getElementById('uploadModalBackdrop'),
  closeUploadModalBtn: document.getElementById('closeUploadModalBtn'),
  cancelUploadBtn: document.getElementById('cancelUploadBtn'),
  uploadForm: document.getElementById('uploadForm'),
  uploadSubjectSelect: document.getElementById('uploadSubjectSelect'),
  uploadCategorySelect: document.getElementById('uploadCategorySelect'),
  uploadModuleGroup: document.getElementById('uploadModuleGroup'),
  uploadModuleInput: document.getElementById('uploadModuleInput'),
  moduleDatalist: document.getElementById('moduleDatalist'),
  uploadTitleInput: document.getElementById('uploadTitleInput'),
  fileDropzone: document.getElementById('fileDropzone'),
  filePickerInput: document.getElementById('filePickerInput'),
  dropzoneContent: document.getElementById('dropzoneContent'),
  selectedFileBadge: document.getElementById('selectedFileBadge'),
  selectedFileIcon: document.getElementById('selectedFileIcon'),
  selectedFileName: document.getElementById('selectedFileName'),
  selectedFileSize: document.getElementById('selectedFileSize'),
  clearFileBtn: document.getElementById('clearFileBtn'),
  uploadErrorMsg: document.getElementById('uploadErrorMsg'),
  uploadBtnText: document.getElementById('uploadBtnText'),
  submitUploadBtn: document.getElementById('submitUploadBtn'),

  // Delete Modal
  deleteModalOverlay: document.getElementById('deleteModalOverlay'),
  deleteModalBackdrop: document.getElementById('deleteModalBackdrop'),
  closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
  deleteMaterialName: document.getElementById('deleteMaterialName'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

  // Toast
  toastContainer: document.getElementById('toastContainer')
};

/* ==========================================================
   INITIALIZATION & API CALLS
   ========================================================== */
async function init() {
  bindEvents();
  await checkOwnerAuth();
  await fetchVaultData();
}

async function fetchVaultData() {
  try {
    const res = await fetch('/api/vault');
    if (!res.ok) throw new Error('Failed to load vault data');
    const data = await res.json();
    
    state.subjects = data.subjects || [];
    state.categories = data.categories || [];
    state.materials = data.materials || [];

    renderStats();
    renderSubjectCards();

    // If a compartment is open, re-render it
    if (state.currentSubjectId) {
      renderCompartment(state.currentSubjectId);
    }
  } catch (err) {
    console.error('Error fetching vault data:', err);
    showToast('Failed to connect to the study vault.', 'error');
  }
}

async function checkOwnerAuth() {
  if (!state.adminToken) {
    setOwnerMode(false);
    return;
  }

  try {
    const res = await fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${state.adminToken}` }
    });
    if (res.ok) {
      setOwnerMode(true);
    } else {
      sessionStorage.removeItem('vault_admin_token');
      state.adminToken = null;
      setOwnerMode(false);
    }
  } catch (err) {
    setOwnerMode(false);
  }
}

function setOwnerMode(isActive) {
  state.isOwnerMode = isActive;

  if (isActive) {
    elements.ownerLockIcon.textContent = '👑';
    elements.ownerStatusText.textContent = 'Owner Active';
    elements.ownerPillFloat.classList.remove('hidden');
    elements.openUploadBtn.classList.remove('hidden');
    elements.emptyUploadBtn.classList.remove('hidden');
  } else {
    elements.ownerLockIcon.textContent = '🔒';
    elements.ownerStatusText.textContent = 'Owner Mode';
    elements.ownerPillFloat.classList.add('hidden');
    elements.openUploadBtn.classList.add('hidden');
    elements.emptyUploadBtn.classList.add('hidden');
  }

  // If drawer is currently open, re-render to update delete/upload buttons
  if (state.currentSubjectId) {
    renderCompartment(state.currentSubjectId);
  }
}

/* ==========================================================
   RENDER FUNCTIONS
   ========================================================== */
function renderStats() {
  elements.totalMaterialsCount.textContent = state.materials.length;
}

function renderSubjectCards() {
  elements.subjectsGrid.innerHTML = '';

  state.subjects.forEach(subject => {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.style.setProperty('--card-accent', subject.accent);
    card.style.setProperty('--card-bg-tint', subject.bgTint);

    // Count materials for this subject
    const subjectMaterials = state.materials.filter(m => m.subject === subject.id);
    const count = subjectMaterials.length;

    // Distinct category icons present for this subject
    const presentCategoryIds = [...new Set(subjectMaterials.map(m => m.category))];
    const categoryIconsHtml = presentCategoryIds.map(catId => {
      const catObj = state.categories.find(c => c.id === catId);
      return catObj ? `<span>${catObj.emoji}</span>` : '';
    }).join(' ');

    card.innerHTML = `
      <div class="card-top-row">
        <div class="card-emoji-container">
          <span>${subject.emoji}</span>
        </div>
        <span class="card-count-badge">${count} ${count === 1 ? 'item' : 'materials'}</span>
      </div>

      <div class="card-content">
        <h2 class="card-code">${subject.name}</h2>
        <p class="card-fullname">${subject.fullName}</p>
        <p class="card-tagline">"${subject.tagline}"</p>
      </div>

      <div class="card-bottom-row">
        <div class="card-category-previews">
          ${categoryIconsHtml || '<span style="font-size: 0.78rem; color: #A4B0BE;">Fresh shelf</span>'}
        </div>
        <button type="button" class="card-action-btn">
          <span>Open Compartment</span> →
        </button>
      </div>
    `;

    card.addEventListener('click', () => {
      openCompartment(subject.id);
    });

    elements.subjectsGrid.appendChild(card);
  });
}

function openCompartment(subjectId) {
  const subject = state.subjects.find(s => s.id === subjectId);
  if (!subject) return;

  state.currentSubjectId = subjectId;
  state.currentCategoryFilter = 'ALL';

  // Apply theme to drawer
  elements.compartmentHeader.style.setProperty('--header-bg', subject.bgTint);
  elements.drawerSubjectEmoji.textContent = subject.emoji;
  elements.drawerSubjectCode.textContent = subject.name;
  elements.drawerTagline.textContent = `"${subject.tagline}"`;

  renderCompartment(subjectId);

  // Show overlay with spring animation
  elements.compartmentOverlay.classList.add('active');
  elements.compartmentOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCompartment() {
  elements.compartmentOverlay.classList.remove('active');
  elements.compartmentOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  state.currentSubjectId = null;
}

function renderCompartment(subjectId) {
  const allSubjectMaterials = state.materials.filter(m => m.subject === subjectId);
  elements.drawerCountBadge.textContent = `${allSubjectMaterials.length} ${allSubjectMaterials.length === 1 ? 'material' : 'materials'}`;

  // Find present categories in this subject
  const presentCategoryMap = new Map();
  allSubjectMaterials.forEach(m => {
    presentCategoryMap.set(m.category, (presentCategoryMap.get(m.category) || 0) + 1);
  });

  // Render Category Filter Pills
  elements.categoryPillsBar.innerHTML = '';

  if (allSubjectMaterials.length > 0) {
    elements.categoryPillsBar.classList.remove('hidden');

    // "All" Pill
    const allPill = document.createElement('button');
    allPill.type = 'button';
    allPill.className = `cat-pill ${state.currentCategoryFilter === 'ALL' ? 'active' : ''}`;
    allPill.innerHTML = `<span>✨ All</span> <span class="cat-pill-count">${allSubjectMaterials.length}</span>`;
    allPill.addEventListener('click', () => {
      state.currentCategoryFilter = 'ALL';
      renderCompartment(subjectId);
    });
    elements.categoryPillsBar.appendChild(allPill);

    // Filter pills for categories with materials
    state.categories.forEach(cat => {
      if (presentCategoryMap.has(cat.id)) {
        const count = presentCategoryMap.get(cat.id);
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `cat-pill ${state.currentCategoryFilter === cat.id ? 'active' : ''}`;
        pill.innerHTML = `<span>${cat.emoji} ${cat.name}</span> <span class="cat-pill-count">${count}</span>`;
        pill.addEventListener('click', () => {
          state.currentCategoryFilter = cat.id;
          renderCompartment(subjectId);
        });
        elements.categoryPillsBar.appendChild(pill);
      }
    });
  } else {
    elements.categoryPillsBar.classList.add('hidden');
  }

  // Filter materials based on selected pill
  let filteredMaterials = allSubjectMaterials;
  if (state.currentCategoryFilter !== 'ALL') {
    filteredMaterials = allSubjectMaterials.filter(m => m.category === state.currentCategoryFilter);
  }

  // Render Material List
  elements.materialsList.innerHTML = '';

  if (filteredMaterials.length === 0) {
    elements.drawerEmptyState.classList.remove('hidden');
    elements.materialsList.classList.add('hidden');
  } else {
    elements.drawerEmptyState.classList.add('hidden');
    elements.materialsList.classList.remove('hidden');

    if (state.currentCategoryFilter === 'ALL') {
      // Group by category
      state.categories.forEach(cat => {
        const groupItems = filteredMaterials.filter(m => m.category === cat.id);
        if (groupItems.length > 0) {
          const groupHeader = document.createElement('div');
          groupHeader.className = 'category-group-header';
          groupHeader.innerHTML = `
            <span class="category-group-badge">${cat.emoji}</span>
            <span>${cat.name}</span>
            <span style="font-size: 0.78rem; color: var(--text-muted);">(${groupItems.length})</span>
          `;
          elements.materialsList.appendChild(groupHeader);

          if (cat.id === 'Notes') {
            renderNotesWithModules(groupItems, elements.materialsList);
          } else {
            groupItems.forEach(mat => {
              elements.materialsList.appendChild(createMaterialCard(mat));
            });
          }
        }
      });
    } else {
      // Single category view
      if (state.currentCategoryFilter === 'Notes') {
        renderNotesWithModules(filteredMaterials, elements.materialsList);
      } else {
        filteredMaterials.forEach(mat => {
          elements.materialsList.appendChild(createMaterialCard(mat));
        });
      }
    }
  }
}

function renderNotesWithModules(notesMaterials, container) {
  // Group notes materials by module
  const moduleMap = new Map();

  notesMaterials.forEach(m => {
    const mod = (m.module && m.module.trim()) ? m.module.trim() : 'General Notes';
    if (!moduleMap.has(mod)) {
      moduleMap.set(mod, []);
    }
    moduleMap.get(mod).push(m);
  });

  moduleMap.forEach((mats, moduleTitle) => {
    // Separate into PDFs/Documents, PPTs/Slides, and others
    const pdfItems = mats.filter(m => m.fileType === 'pdf' || m.fileType === 'doc');
    const pptItems = mats.filter(m => m.fileType === 'ppt');
    const otherItems = mats.filter(m => m.fileType !== 'pdf' && m.fileType !== 'doc' && m.fileType !== 'ppt');

    const folderCard = document.createElement('div');
    folderCard.className = 'module-folder-card open';

    folderCard.innerHTML = `
      <div class="module-folder-header">
        <div class="module-folder-title-left">
          <span class="module-folder-icon">📁</span>
          <span class="module-folder-name">${escapeHtml(moduleTitle)}</span>
          <span class="module-folder-count">${mats.length} ${mats.length === 1 ? 'item' : 'items'}</span>
        </div>
        <span class="module-folder-chevron">▼</span>
      </div>
      <div class="module-folder-content">
        ${pdfItems.length > 0 ? `
          <div class="module-sub-section">
            <div class="module-sub-header sub-pdf">
              <span class="module-sub-badge">📄</span>
              <span>PDFs &amp; Reading Notes (${pdfItems.length})</span>
            </div>
            <div class="module-sub-items sub-items-pdf"></div>
          </div>
        ` : ''}

        ${pptItems.length > 0 ? `
          <div class="module-sub-section">
            <div class="module-sub-header sub-ppt">
              <span class="module-sub-badge">📊</span>
              <span>PPTs &amp; Lecture Slides (${pptItems.length})</span>
            </div>
            <div class="module-sub-items sub-items-ppt"></div>
          </div>
        ` : ''}

        ${otherItems.length > 0 ? `
          <div class="module-sub-section">
            <div class="module-sub-header sub-other">
              <span class="module-sub-badge">📦</span>
              <span>Other Documents (${otherItems.length})</span>
            </div>
            <div class="module-sub-items sub-items-other"></div>
          </div>
        ` : ''}
      </div>
    `;

    // Folder collapse / expand toggle
    const header = folderCard.querySelector('.module-folder-header');
    header.addEventListener('click', () => {
      folderCard.classList.toggle('open');
    });

    // Populate separated sub-sections
    const pdfContainer = folderCard.querySelector('.sub-items-pdf');
    if (pdfContainer) {
      pdfItems.forEach(item => pdfContainer.appendChild(createMaterialCard(item)));
    }

    const pptContainer = folderCard.querySelector('.sub-items-ppt');
    if (pptContainer) {
      pptItems.forEach(item => pptContainer.appendChild(createMaterialCard(item)));
    }

    const otherContainer = folderCard.querySelector('.sub-items-other');
    if (otherContainer) {
      otherItems.forEach(item => otherContainer.appendChild(createMaterialCard(item)));
    }

    container.appendChild(folderCard);
  });
}

function createMaterialCard(material) {
  const card = document.createElement('div');
  card.className = 'material-row-card';

  const fileInfo = getFileInfo(material.fileType);
  const sizeText = formatBytes(material.size);
  const dateText = formatDate(material.createdAt);

  const deleteBtnHtml = state.isOwnerMode ? `
    <button type="button" class="btn-delete-mat" title="Delete Material" data-id="${material.id}">
      🗑️
    </button>
  ` : '';

  card.innerHTML = `
    <div class="material-info">
      <div class="file-type-badge ${fileInfo.class}">
        <span class="file-badge-icon">${fileInfo.icon}</span>
        <span>${fileInfo.label}</span>
      </div>
      <div class="material-text">
        <h4 class="material-title" title="${escapeHtml(material.title)}">${escapeHtml(material.title)}</h4>
        <div class="material-meta">
          <span>${sizeText}</span>
          <span>•</span>
          <span>${dateText}</span>
          <span>•</span>
          <span style="color: #636E72;">${escapeHtml(material.originalFilename)}</span>
        </div>
      </div>
    </div>

    <div class="material-actions">
      <a href="/api/download/${material.id}" class="btn-download" data-id="${material.id}" data-title="${escapeHtml(material.title)}">
        <span>↓</span> Download
      </a>
      ${deleteBtnHtml}
    </div>
  `;

  // Download Click Handler for fun toast
  const downloadBtn = card.querySelector('.btn-download');
  downloadBtn.addEventListener('click', (e) => {
    triggerDownloadFeedback(material.title);
  });

  // Delete Click Handler (Owner)
  if (state.isOwnerMode) {
    const deleteBtn = card.querySelector('.btn-delete-mat');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        promptDeleteMaterial(material);
      });
    }
  }

  return card;
}

function triggerDownloadFeedback(title) {
  const joke = DOWNLOAD_JOKES[Math.floor(Math.random() * DOWNLOAD_JOKES.length)];
  showToast(joke, 'info');
}

/* ==========================================================
   OWNER MODE: AUTHENTICATION
   ========================================================== */
function openAuthModal() {
  if (state.isOwnerMode) {
    if (confirm('Logout from Owner Mode?')) {
      logoutOwner();
    }
    return;
  }

  elements.adminPasswordInput.value = '';
  elements.authErrorMsg.classList.add('hidden');
  elements.authModalOverlay.classList.add('active');
  elements.authModalOverlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => elements.adminPasswordInput.focus(), 150);
}

function closeAuthModal() {
  elements.authModalOverlay.classList.remove('active');
  elements.authModalOverlay.setAttribute('aria-hidden', 'true');
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const password = elements.adminPasswordInput.value.trim();
  if (!password) return;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (!res.ok) {
      elements.authErrorMsg.textContent = data.error || 'Wrong password!';
      elements.authErrorMsg.classList.remove('hidden');
      return;
    }

    // Success
    state.adminToken = data.token;
    sessionStorage.setItem('vault_admin_token', data.token);
    setOwnerMode(true);
    closeAuthModal();
    showToast(data.message || 'Owner Mode unlocked! 👑', 'success');
  } catch (err) {
    elements.authErrorMsg.textContent = 'Server connection failed.';
    elements.authErrorMsg.classList.remove('hidden');
  }
}

function logoutOwner() {
  state.adminToken = null;
  sessionStorage.removeItem('vault_admin_token');
  setOwnerMode(false);
  showToast('Logged out of Owner Mode. Back to friend view! 👋', 'info');
}

/* ==========================================================
   OWNER MODE: UPLOAD MATERIAL
   ========================================================== */
function openUploadModal() {
  if (!state.isOwnerMode) {
    openAuthModal();
    return;
  }

  // Preselect active subject if available
  if (state.currentSubjectId) {
    elements.uploadSubjectSelect.value = state.currentSubjectId;
  }

  // Reset inputs
  elements.uploadForm.reset();
  if (state.currentSubjectId) elements.uploadSubjectSelect.value = state.currentSubjectId;
  if (elements.uploadModuleInput) elements.uploadModuleInput.value = '';
  clearFileSelection();
  elements.uploadErrorMsg.classList.add('hidden');
  populateModuleDatalist();

  elements.uploadModalOverlay.classList.add('active');
  elements.uploadModalOverlay.setAttribute('aria-hidden', 'false');
}

function populateModuleDatalist() {
  if (!elements.moduleDatalist) return;
  const selectedSubject = elements.uploadSubjectSelect.value;
  const existingModules = [...new Set(
    state.materials
      .filter(m => m.subject === selectedSubject && m.module && m.module.trim())
      .map(m => m.module.trim())
  )];

  elements.moduleDatalist.innerHTML = '';
  existingModules.forEach(mod => {
    const opt = document.createElement('option');
    opt.value = mod;
    elements.moduleDatalist.appendChild(opt);
  });
}

function closeUploadModal() {
  elements.uploadModalOverlay.classList.remove('active');
  elements.uploadModalOverlay.setAttribute('aria-hidden', 'true');
  clearFileSelection();
}

function handleFileSelection(file) {
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  const fileInfo = getFileInfo(ext);

  elements.selectedFileIcon.textContent = fileInfo.icon;
  elements.selectedFileName.textContent = file.name;
  elements.selectedFileSize.textContent = `(${formatBytes(file.size)})`;

  elements.dropzoneContent.classList.add('hidden');
  elements.selectedFileBadge.classList.remove('hidden');

  // Auto-fill title if empty
  if (!elements.uploadTitleInput.value) {
    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    elements.uploadTitleInput.value = rawName;
  }
}

function clearFileSelection() {
  elements.filePickerInput.value = '';
  elements.dropzoneContent.classList.remove('hidden');
  elements.selectedFileBadge.classList.add('hidden');
}

async function handleUploadSubmit(e) {
  e.preventDefault();

  const file = elements.filePickerInput.files[0];
  if (!file) {
    elements.uploadErrorMsg.textContent = 'Please choose a file to upload!';
    elements.uploadErrorMsg.classList.remove('hidden');
    return;
  }

  const subject = elements.uploadSubjectSelect.value;
  const category = elements.uploadCategorySelect.value;
  const moduleName = elements.uploadModuleInput ? elements.uploadModuleInput.value.trim() : '';
  const title = elements.uploadTitleInput.value.trim() || file.name;

  const formData = new FormData();
  formData.append('subject', subject);
  formData.append('category', category);
  formData.append('module', moduleName);
  formData.append('title', title);
  formData.append('file', file);

  // Loading state
  elements.submitUploadBtn.disabled = true;
  elements.uploadBtnText.textContent = 'Uploading to vault... ⏳';

  try {
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.adminToken}`
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload material.');
    }

    // Success
    closeUploadModal();
    showToast(data.message || 'Material stashed in vault! 🚀', 'success');
    await fetchVaultData();
  } catch (err) {
    elements.uploadErrorMsg.textContent = err.message;
    elements.uploadErrorMsg.classList.remove('hidden');
  } finally {
    elements.submitUploadBtn.disabled = false;
    elements.uploadBtnText.textContent = '🚀 Stash in Vault';
  }
}

/* ==========================================================
   OWNER MODE: DELETE MATERIAL
   ========================================================== */
function promptDeleteMaterial(material) {
  state.pendingDeleteMaterial = material;
  elements.deleteMaterialName.textContent = `"${material.title}"`;
  elements.deleteModalOverlay.classList.add('active');
  elements.deleteModalOverlay.setAttribute('aria-hidden', 'false');
}

function closeDeleteModal() {
  elements.deleteModalOverlay.classList.remove('active');
  elements.deleteModalOverlay.setAttribute('aria-hidden', 'true');
  state.pendingDeleteMaterial = null;
}

async function handleConfirmDelete() {
  if (!state.pendingDeleteMaterial) return;

  const id = state.pendingDeleteMaterial.id;
  elements.confirmDeleteBtn.disabled = true;

  try {
    const res = await fetch(`/api/materials/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.adminToken}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete material.');
    }

    closeDeleteModal();
    showToast(data.message || 'Material deleted! 🗑️', 'info');
    await fetchVaultData();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    elements.confirmDeleteBtn.disabled = false;
  }
}

/* ==========================================================
   TOAST UTILITY
   ========================================================== */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✨';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
  elements.toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================
   EVENT LISTENERS
   ========================================================== */
function bindEvents() {
  // Drawer close events
  elements.closeDrawerBtn.addEventListener('click', closeCompartment);
  elements.closeDrawerSecondaryBtn.addEventListener('click', closeCompartment);
  elements.compartmentBackdrop.addEventListener('click', closeCompartment);

  // Owner mode buttons
  elements.ownerToggleBtn.addEventListener('click', openAuthModal);
  elements.ownerLogoutBtn.addEventListener('click', logoutOwner);
  elements.openUploadBtn.addEventListener('click', openUploadModal);
  elements.emptyUploadBtn.addEventListener('click', openUploadModal);

  // Auth modal
  elements.closeAuthModalBtn.addEventListener('click', closeAuthModal);
  elements.cancelAuthBtn.addEventListener('click', closeAuthModal);
  elements.authModalBackdrop.addEventListener('click', closeAuthModal);
  elements.authForm.addEventListener('submit', handleAuthSubmit);
  elements.togglePasswordEyeBtn.addEventListener('click', () => {
    const input = elements.adminPasswordInput;
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Upload modal
  elements.closeUploadModalBtn.addEventListener('click', closeUploadModal);
  elements.cancelUploadBtn.addEventListener('click', closeUploadModal);
  elements.uploadModalBackdrop.addEventListener('click', closeUploadModal);
  elements.uploadForm.addEventListener('submit', handleUploadSubmit);
  elements.uploadSubjectSelect.addEventListener('change', populateModuleDatalist);

  // File Picker & Dropzone
  elements.filePickerInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  });

  elements.clearFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearFileSelection();
  });

  elements.fileDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.fileDropzone.classList.add('dragover');
  });

  elements.fileDropzone.addEventListener('dragleave', () => {
    elements.fileDropzone.classList.remove('dragover');
  });

  elements.fileDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.fileDropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      elements.filePickerInput.files = e.dataTransfer.files;
      handleFileSelection(e.dataTransfer.files[0]);
    }
  });

  // Delete modal
  elements.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  elements.deleteModalBackdrop.addEventListener('click', closeDeleteModal);
  elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  // Keyboard Shortcuts (ESC to close any open modal or drawer)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.deleteModalOverlay.classList.contains('active')) {
        closeDeleteModal();
      } else if (elements.uploadModalOverlay.classList.contains('active')) {
        closeUploadModal();
      } else if (elements.authModalOverlay.classList.contains('active')) {
        closeAuthModal();
      } else if (elements.compartmentOverlay.classList.contains('active')) {
        closeCompartment();
      }
    }
  });
}

// Kick off the application
document.addEventListener('DOMContentLoaded', init);
