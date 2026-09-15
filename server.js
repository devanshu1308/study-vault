require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'studyvault2026';
const JWT_SECRET = process.env.JWT_SECRET || 'study-vault-super-secret-key-2026';

// Directories — use persistent disk on Render (/var/data) if available, otherwise fall back to local
const PERSISTENT_DIR = process.env.PERSISTENT_DIR || __dirname;
const DATA_DIR = path.join(PERSISTENT_DIR, 'data');
const VAULT_FILE = path.join(DATA_DIR, 'vault.json');
const UPLOADS_DIR = path.join(PERSISTENT_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Seed vault.json with built-in seed data if vault is empty on first boot
const SEED_FILE = path.join(__dirname, 'data', 'vault.json');
if (!fs.existsSync(VAULT_FILE)) {
  if (fs.existsSync(SEED_FILE)) {
    fs.copyFileSync(SEED_FILE, VAULT_FILE);
    console.log('Initialized vault.json from seed data.');
  } else {
    fs.writeFileSync(VAULT_FILE, '[]', 'utf-8');
  }
}

// Strict Subject Definitions
const SUBJECTS = [
  {
    id: 'AIML',
    name: 'AIML',
    emoji: '🤖',
    fullName: 'Artificial Intelligence & Machine Learning',
    tagline: "Okay, let's pretend we're prepared.",
    accent: '#7C5CFC',
    bgTint: '#F3EFFF'
  },
  {
    id: 'GAI',
    name: 'GAI',
    emoji: '✨',
    fullName: 'Generative AI',
    tagline: 'Prompt engineering our way through finals.',
    accent: '#FF6B6B',
    bgTint: '#FFF0F0'
  },
  {
    id: 'QCAI',
    name: 'QCAI',
    emoji: '🧠',
    fullName: 'Quantum Computing & AI',
    tagline: 'In a superposition of passing and failing.',
    accent: '#00B894',
    bgTint: '#E6FAF5'
  },
  {
    id: 'CV',
    name: 'CV',
    emoji: '👁️',
    fullName: 'Computer Vision',
    tagline: 'I can see my GPA dropping in 4K.',
    accent: '#FD79A8',
    bgTint: '#FFF0F6'
  },
  {
    id: 'APS',
    name: 'APS',
    emoji: '📊',
    fullName: 'Applied Probability & Statistics',
    tagline: 'The probability of passing is non-zero.',
    accent: '#FFA502',
    bgTint: '#FFF8E7'
  }
];

// Supported Categories
const CATEGORIES = [
  { id: 'Notes', name: 'Notes', emoji: '📖' },
  { id: 'PYQs', name: 'PYQs', emoji: '📝' },
  { id: 'Labs', name: 'Labs', emoji: '🧪' },
  { id: 'PPTs', name: 'PPTs', emoji: '📊' },
  { id: 'Assignments', name: 'Assignments', emoji: '📚' },
  { id: 'Important', name: 'Important', emoji: '⭐' },
  { id: 'Other', name: 'Other', emoji: '📦' }
];

// Helper: detect file type from extension
function detectFileType(filename) {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (['pdf'].includes(ext)) return 'pdf';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'ppt';
  if (['doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext)) return 'doc';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'zip';
  return 'other';
}

// Helper: read/write vault JSON
function getVaultData() {
  try {
    const raw = fs.readFileSync(VAULT_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading vault.json:', err);
    return [];
  }
}

function saveVaultData(data) {
  fs.writeFileSync(VAULT_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB max limit
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve index.html with dynamically resolved absolute OpenGraph URLs
app.get(['/', '/index.html'], (req, res) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : (req.secure ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const baseUrl = `${protocol}://${host}`;

  try {
    let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf-8');
    html = html.replace(/https:\/\/study-vault-lncl\.onrender\.com/g, baseUrl);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// Security Middleware: Owner verification
function requireOwnerAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Master key required for this action.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid key. Please login again.' });
  }
}

// ==========================================
// PUBLIC ENDPOINTS (Friends & Owner)
// ==========================================

// 1. Get entire vault state
app.get('/api/vault', (req, res) => {
  const materials = getVaultData();
  res.json({
    subjects: SUBJECTS,
    categories: CATEGORIES,
    materials: materials
  });
});

// 2. Direct 1-Click File Download
app.get('/api/download/:id', (req, res) => {
  const materials = getVaultData();
  const material = materials.find(m => m.id === req.params.id);

  if (!material) {
    return res.status(404).send('Material not found in vault.');
  }

  const filePath = path.join(UPLOADS_DIR, material.storageFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Physical file missing on server.');
  }

  // Force browser download with original filename
  res.download(filePath, material.originalFilename, (err) => {
    if (err && !res.headersSent) {
      res.status(500).send('Error downloading file.');
    }
  });
});

// ==========================================
// ADMIN / OWNER ENDPOINTS
// ==========================================

// Owner Login
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password! Are you really the owner? 🤨' });
  }

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    success: true,
    token,
    message: 'Welcome back, Vault Master! 👑'
  });
});

// Verify current token
app.get('/api/auth/verify', requireOwnerAuth, (req, res) => {
  res.json({ valid: true, role: 'admin' });
});

// Owner Upload Material (PROTECTED)
app.post('/api/materials', requireOwnerAuth, upload.single('file'), (req, res) => {
  const { subject, category, title, module } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Please choose a file to upload.' });
  }

  if (!subject || !SUBJECTS.some(s => s.id === subject)) {
    return res.status(400).json({ error: 'Invalid subject. Must be one of the 5 official subjects.' });
  }

  if (!category || !CATEGORIES.some(c => c.id === category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  const materialTitle = (title && title.trim()) ? title.trim() : req.file.originalname;
  const fileType = detectFileType(req.file.originalname);
  const moduleName = (module && module.trim()) ? module.trim() : (category === 'Notes' ? 'General Notes' : '');

  const newMaterial = {
    id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    subject,
    category,
    module: moduleName,
    title: materialTitle,
    originalFilename: req.file.originalname,
    storageFilename: req.file.filename,
    fileType,
    size: req.file.size,
    createdAt: new Date().toISOString()
  };

  const materials = getVaultData();
  materials.unshift(newMaterial); // Add to beginning
  saveVaultData(materials);

  res.status(201).json({
    success: true,
    material: newMaterial,
    message: 'Material safely stored in vault! 🚀'
  });
});

// Owner Delete Material (PROTECTED)
app.delete('/api/materials/:id', requireOwnerAuth, (req, res) => {
  const materials = getVaultData();
  const index = materials.findIndex(m => m.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Material not found in vault.' });
  }

  const [deletedMaterial] = materials.splice(index, 1);
  saveVaultData(materials);

  // Remove physical file from disk
  const filePath = path.join(UPLOADS_DIR, deletedMaterial.storageFilename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Failed to unlink file:', err);
    }
  }

  res.json({
    success: true,
    message: `"${deletedMaterial.title}" vanished into the void! 🗑️`
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n===========================================`);
  console.log(`📚 THE STUDY VAULT is running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🔑 Owner Password: ${ADMIN_PASSWORD}`);
  console.log(`===========================================\n`);
});
