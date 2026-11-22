# Live Comment Section System 🎙️💬

A real-time, interactive stage comment system designed for live presentations, conferences, meetups, and auditoriums. Audiences scan a high-visibility QR code on the stage screen with their mobile devices to submit their names and comments, which immediately appear live beside the QR code in real-time.

---

## 🌐 Live URLs

- **Live Stage Display (Projector/Screen View):**  
  👉 [https://comment-section-app-pied.vercel.app](https://comment-section-app-pied.vercel.app)
- **Audience Submission Page (Mobile Web App):**  
  👉 [https://comment-section-app-pied.vercel.app/audience](https://comment-section-app-pied.vercel.app/audience)
- **Superadmin Control Panel:**  
  👉 [https://comment-section-app-pied.vercel.app/admin](https://comment-section-app-pied.vercel.app/admin)  
  *Default Admin Password:* `admin123` (customizable in the Admin Panel)

---

## 🚀 Key Features

### 1. 🖥️ Stage / Big Screen Display (`/`)
- **Large QR Code Display:** Ultra-high contrast QR code optimized for phone camera scanning from a distance or on a projector.
- **Side-by-Side Live Feed:** Audience comments stream in real-time next to the QR code with smooth entrance animations.
- **Pinned Spotlight Card:** Superadmin can pin/spotlight standout comments with a glowing border and celebratory confetti.
- **Audio Chime:** Plays a gentle, pleasant notification chime upon new comments (toggleable).
- **Stage Controls:** Fullscreen button (`F11`), mute/unmute, and live audience counter.
- **Urgent Announcement Marquee:** Shows custom broadcast announcements configured by the administrator across the top of the screen.

### 2. 📱 Audience Mobile Web App (`/audience`)
- **Frictionless Experience:** No app installation or account signup required—scan and comment in seconds.
- **Name & Avatar Selector:** Audience chooses their name and avatar badge (persisted locally).
- **Quick Reactions & Emoji Bar:** Instant reaction buttons (`👏 Great point!`, `🔥 Amazing!`, etc.).
- **Live Upvotes:** Audience can view other comments and give hearts/likes in real-time.
- **Confetti Celebration:** Haptic/visual feedback confirming comment is live.

### 3. 🛡️ Superadmin Control Center (`/admin`)
- **Secure Access:** Password-protected portal (`admin123`).
- **Live Moderation Queue:**
  - **Approve / Reject** individual comments.
  - **Pin Spotlight:** Highlights questions or top comments prominently on the main screen.
  - **Delete:** Remove unwanted comments immediately.
- **Event Configuration:**
  - Change Event Title and Subtitle dynamically.
  - Custom QR Code target URL.
  - Toggle **Auto-Approve** (Instant comments vs strictly moderated).
  - Toggle **Accept New Comments** (Lock/Unlock live submissions).
  - **Profanity / Banned Words Filter** (automatically masks unwanted words with `***`).
  - **Broadcast Announcements** to stage.
  - Change Superadmin Password.
- **Data Export:** 1-Click CSV export of all comments with timestamps and likes.
- **Danger Zone:** Clear all comments to reset for the next event or session.

---

## 🛠️ Tech Stack & Architecture

- **Frontend & Backend:** Next.js 14 (App Router, Server Actions)
- **Styling & UI:** Tailwind CSS, Lucide Icons, Canvas Confetti
- **QR Code Generation:** `qrcode.react` with high error correction
- **Database & Realtime Sync:** Supabase (PostgreSQL with Realtime WebSocket replication)
- **Deployment:** Vercel Production (`comment-section-app-pied.vercel.app`)
- **Repository:** GitHub (`31STBn/comment-section-app`)
