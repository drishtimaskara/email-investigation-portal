# Email Investigation Portal

Mailbox-style Alternate Reality Game (ARG) investigation portal built with Express.js, React, and an embedded SQLite database (zero-configuration, no external database server needed).

---

## 1. Project Overview

Players investigate the case of a missing person by exploring protagonist **Navya Mulay's** mailbox archive, documents, evidence, and clues.

Key Mechanics:
- **Protagonist Mailbox Access:** Players log into their assigned team/investigator accounts and explore Navya Mulay's email repository.
- **Server-Side Hint Tracking:** Hints are held securely on the server and only unlocked progressive clues are returned upon request. No hint text is visible in client source code.
- **Quota Enforcement:** Each team can unlock a maximum of 5 hints total.
- **Admin Control Panel:** Game Masters can create accounts for participating teams, monitor real-time hint unlocks, and view investigation activity.

---

## 2. Quick Start

### A. Start Backend Server
```bash
cd server
npm install
npm start
```
The server will start on `http://localhost:5001`. On first launch, it automatically initializes the database schema and seeds initial users, hints, and emails.

### B. Start Frontend Client
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 3. Default Login Credentials

| Role | Username | Password | Notes |
|------|----------|----------|-------|
| **Admin (Game Master)** | `admin` | `admin123` | Has access to Admin Panel (`/admin`) and user creation |
| **Player (Investigator)** | `player1` | `player123` | Default investigative team account |
| **Player (Investigator)** | `investigator` | `investigator123` | Secondary test team account |

---

## 4. Features

### A. Authentication & Investigation Perspective
- JWT-based authentication.
- Players sign in with credentials assigned by the Game Master.
- Upon login, players view protagonist **Navya Mulay's** (`navya.mulay@campus.example`) inbox, sent messages, drafts, and trash.
- Navbar clearly displays both the investigation subject (Navya Mulay) and the active investigator identity.

### B. Secure Hints System
- Modules: `Git`, `MIRROR`, `Notes`, `OSINT`.
- Hints are stored exclusively on the server (`database/investigation.db`).
- Locked hints never leak content to the client bundle or network responses.
- Teams click `+` on a module to unlock the next progressive hint.
- Server validates quota (max 5 hints per team) and logs each unlock with a timestamp.

### C. Admin Control Panel (`/admin`)
- Accessible only to administrators (`admin` account).
- **Team Management:** Add new user accounts with custom usernames, team display names, and passwords.
- **Quota Monitoring:** View hint usage progress bars (`X / 5 hints used`) for each team.
- **Real-time Audit Log:** Detailed log of which team unlocked which hint and when.
