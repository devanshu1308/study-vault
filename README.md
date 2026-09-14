# 📚 THE STUDY VAULT
> *"Because apparently we have to study."*

A tiny, fun, highly animated digital vault where college friends can open one shared link, view 5 subjects, and directly download notes, PYQs, and lab manuals in 1 click.

Built with **Zero Bloat**:
- 🎨 **Playful tactile UI** with soft pastel themes, doodles, spring animations, and funny college copy.
- 🚀 **100% Direct Downloads** (real PDFs, PPTs, ZIPs — no Google Drive redirects).
- 🔒 **Owner-Only Upload & Delete** enforced securely at the server level via JWT.
- 👥 **Zero Login for Friends** (they just open the link and grab what they need).

---

## 🤖 The 5 Official Subjects

1. **🤖 AIML** — *"Okay, let's pretend we're prepared."*
2. **✨ GAI** — *"Prompt engineering our way through finals."*
3. **🧠 QCAI** — *"In a superposition of passing and failing."*
4. **👁️ CV** — *"I can see my GPA dropping in 4K."*
5. **📊 APS** — *"The probability of passing is non-zero."*

---

## ⚡ Quick Start (Run Locally in 30 Seconds)

### Prerequisites
- Node.js (v18 or higher recommended)

### 1. Install & Run
```bash
# Navigate to the project folder
cd study-vault

# Install dependencies (Express, Multer, JWT, etc.)
npm install

# Start the vault server
npm start
```

### 2. Open in Browser
Visit [http://localhost:3000](http://localhost:3000)

---

## 👑 Owner Mode (How to Upload & Delete)

You are the only person who can upload and delete materials. Friends will only see download buttons.

### Default Password:
```
studyvault2026
```
*(You can change this anytime inside your `.env` file!)*

### How to use Owner Mode:
1. Scroll to the bottom of the page and click the **`🔒 Owner Mode`** button (or the key icon).
2. Enter your password (`studyvault2026`) and click **Unlock Vault**.
3. A floating **`👑 Owner Mode Active`** badge will appear.
4. Click into any subject:
   - Click **`➕ Add Material`** to upload a new PDF, PPTX, or ZIP.
   - Click **`🗑️`** next to any file to permanently purge it from the vault.
5. When you are done, click **Logout** on the floating badge to return to standard friend view.

---

## 📂 Project Structure

```text
study-vault/
├── package.json               # Node.js dependencies
├── server.js                  # Tiny Express server, API & secure auth (~180 lines)
├── .env                       # Local secrets (PORT, ADMIN_PASSWORD, JWT_SECRET)
├── .env.example               # Template for environment variables
├── seed.js                    # Starter script that generates initial sample materials
├── data/
│   └── vault.json             # Lightweight JSON database for file metadata
├── uploads/                   # Local storage for all uploaded PDFs & study files
├── public/
│   ├── index.html             # Single-page vault app + OpenGraph link previews
│   ├── style.css              # Custom playful styling, spring animations & doodles
│   ├── app.js                 # Frontend interactions, drawer physics & owner controls
│   └── assets/
│       ├── favicon.svg        # Custom animated-style SVG favicon
│       └── og-preview.svg     # Social preview card for WhatsApp/Discord shares
└── README.md                  # This guide!
```

---

## 🌐 How to Deploy & Share with Friends (For Free)

The easiest way to put the vault online so friends can access it from anywhere:

### Option A: Deploy to Render (Recommended & Free)
1. Push this folder to a GitHub repository.
2. Sign in to [Render.com](https://render.com) and click **New +** -> **Web Service**.
3. Select your GitHub repository.
4. Settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `ADMIN_PASSWORD` = `your_chosen_secret_password`
   - `JWT_SECRET` = `a_random_secret_string`
6. Click **Deploy Web Service**!
7. Render will give you an HTTPS link like `https://our-study-vault.onrender.com`. Send that to your friends!

*(Tip: If you want files to persist permanently on Render free tier restarts, attach a small Persistent Disk to `/uploads`, or keep your essential notes committed to the repo).*

### Option B: Deploy to Railway or Fly.io
Railway and Fly.io also support one-click deployment from GitHub with persistent disk mounts for `/uploads`.

---

## 📱 Rich Social Sharing Previews
When you paste your deployed link into **WhatsApp, Discord, Telegram, or iMessage**, it will automatically display a custom preview card with:
- **Title**: `📚 THE STUDY VAULT`
- **Subtitle**: `"Because apparently we have to study."`
- **Image**: An attractive branded banner showing the 5 subject cards.

---

## 🛠️ Modifying Quotes or Secrets
- Change the owner password: edit `ADMIN_PASSWORD` in `.env`.
- Change subject quotes or colors: edit the `SUBJECTS` array in `server.js`.
