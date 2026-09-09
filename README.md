<div align="center">

# 🗓️ ScheduleWork

### *Drag it. Drop it. Ship the schedule.*

**No server. No internet. No drama.**
**Just you, your machine, and this week's shifts.**

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-black?style=for-the-badge&logo=apple)
![Offline](https://img.shields.io/badge/offline-100%25-brightgreen?style=for-the-badge)
![Built with](https://img.shields.io/badge/built%20with-Tauri%20%2B%20React-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-active%20dev-orange?style=for-the-badge)

</div>

---

## 🎯 Why ScheduleWork exists

Building shift schedules in Excel works — until you have to eyeball it for overlapping shifts. ScheduleWork is built for **drag — drop — export**, while the app handles conflict detection and Morning/Afternoon/Evening stats for you.

No account. No login. No lost data from a dropped connection — because **there's no connection to drop**.

---

## ⚡ Highlights

| | |
|---|---|
| 🖱️ **Drag & drop** | Assign a shift with one drag into an Employee × Day cell |
| 👥 **Group management** | Meat / Soup / Salad by default — or rename to whatever fits your team |
| ⚠️ **Automatic conflict detection** | Overlapping shift? Red border + warning, instantly |
| 🕒 **Split shifts** | 09:00–12:00, break, back for 17:00–21:00 — no problem |
| 📊 **S / T / Đ stats** | Auto-counts Morning / Afternoon / Evening shifts per day, editable by hand |
| 🖼️ **Crisp exports** | High-resolution JPG (up to 3× scale), sharp like a real spreadsheet |
| 💾 **100% offline** | Your data stays on your machine, full stop |

---

## 🛠️ Stack behind the curtain

```
Tauri  ×  React  ×  TypeScript  ×  Vite  ×  Tailwind  ×  Rust
```

Light, fast, and doesn't eat RAM the way Electron does.

---

## 🍎 Setup — macOS

<details>
<summary><b>1️⃣ Install Xcode Command Line Tools</b></summary>

```bash
xcode-select --install
```
Skip if already installed.
</details>

<details>
<summary><b>2️⃣ Install Rust</b></summary>

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```
</details>

<details>
<summary><b>3️⃣ Install dependencies</b></summary>

```bash
cd ~/lich-ca
npm install
```
</details>

<details>
<summary><b>4️⃣ Run it</b></summary>

```bash
npm run tauri dev
```
🎉 That's it — the app should launch.
</details>

---

## 🪟 Setup — Windows

<details>
<summary><b>1️⃣ Install prerequisites</b></summary>

Tauri on Windows needs the **Microsoft C++ Build Tools** and **WebView2** (WebView2 already ships with most Windows 10/11 machines, but installing manually never hurts):

- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — during install, check **"Desktop development with C++"**
- [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
</details>

<details>
<summary><b>2️⃣ Install Rust</b></summary>

Download and run `rustup-init.exe` from [rustup.rs](https://rustup.rs), or via winget:

```powershell
winget install --id Rustlang.Rustup
```

Restart your terminal afterward so `cargo` shows up on `PATH`.
</details>

<details>
<summary><b>3️⃣ Install Node.js</b></summary>

```powershell
winget install OpenJS.NodeJS.LTS
```
</details>

<details>
<summary><b>4️⃣ Install dependencies</b></summary>

```powershell
cd ~\lich-ca
npm install
```
</details>

<details>
<summary><b>5️⃣ Run it</b></summary>

```powershell
npm run tauri dev
```
🎉 Same command as macOS — Tauri handles the platform differences under the hood.
</details>

---

## 📦 Building for release

```bash
cd ~/lich-ca
npm run tauri build
```

Output lands in `src-tauri/target/release/bundle/`:

| Platform | Output |
|---|---|
| 🍏 Apple Silicon | `.app` in `macos/`, `.dmg` in `dmg/Lich ca_0.1.0_aarch64.dmg` |
| 💻 Intel Mac | same as above, `x64` instead of `aarch64` |
| 🪟 Windows | `.msi` installer in `bundle/msi/`, and/or `.exe` in `bundle/nsis/` |

**macOS:** open the `.dmg`, drag ScheduleWork into **Applications**.
**Windows:** run the `.msi` or `.exe` installer and follow the prompts.

---

## 🖱️ Assigning shifts

**Option 1 — Drag & drop**
Drag a shift type from the right-side panel, drop it into an `Employee × Day` cell.

**Option 2 — Select & click**
Select a shift type → click the target schedule cell.
Press `Esc` or click **Deselect** to exit assignment mode.

---

## 👥 Employees & groups

- 🔍 Search employees by name
- 🧩 Filter the schedule by group
- ✏️ Click a group or employee name directly to rename it
- 🗑️ Hover to reveal a **×** button and delete a group or employee

Default work areas: **Meat · Soup · Salad** — each with its own icon and centered heading, so long schedules stay easy to scan.

---

## 🎨 Editing shift types

Click a shift type to edit it in place:
- Shift name
- Start / end time
- Display color

Hover over a shift type to reveal a **×** button and delete it.

> ⚠️ Changing a shift's hours re-checks **every schedule currently using that shift type**. If it creates a conflict, the change **won't be saved**.

---

## ⚠️ Conflict detection

ScheduleWork automatically flags overlapping shifts for the same employee on the same day:

- 🔴 Red border around the affected shift
- ⚠️ Warning icon
- 🕒 The conflicting time range shown clearly

Drag a shift somewhere invalid, and it **snaps back** to its original spot — nothing breaks.

---

## 🕒 Scheduling rules

**Back-to-back shifts — fine:**
```
10:00 – 14:00  →  14:00 – 18:00   ✅ valid
```

**Split shifts:**
```
09:00 – 12:00   (working)
12:00 – 17:00   (gap — free for another shift)
17:00 – 21:00   (working)
```
The two working periods of a split shift **cannot overlap each other**.

**Not supported yet:** overnight shifts like `22:00 – 06:00`. End time must always be later than start time.

---

## 📊 Morning / Afternoon / Evening stats

| Label | Time range |
|:---:|---|
| **S** | Morning — before 14:00 |
| **T** | Afternoon — 14:00 to 17:00 |
| **Đ** | Evening — from 17:00 |

A shift spanning multiple periods is counted toward whichever period holds the **largest share of its working time**. Values can be edited by hand — clear a manual entry and it snaps back to the calculated value.

---

## 🖼️ Exporting the schedule

Click **Export Schedule** to save the full week as a high-resolution JPG, including:

📌 Schedule title · 📅 Week date range · 👥 Employee list · 🎨 Assigned shifts · 📊 Staffing stats

> 🔍 Search/group filters only affect the visible UI — the exported image **always includes the full week**.

If the current schedule has overlapping shifts or invalid hours, ScheduleWork shows exactly which employee, date, and time range conflict, and **blocks export** until it's fixed.

---

## 🗑️ Clearing the current week

**Clear Current Week** removes only the shifts for the week you're viewing (with a confirmation prompt first). Untouched: other weeks' schedules, employees, groups, shift types, and app settings.

---

## 💾 Where your data lives

```
~/Library/Application Support/com.lichca.scheduler/data.json
```

*(Windows equivalent: `%APPDATA%\com.lichca.scheduler\data.json`)*

No server, no cloud, no one reads it but you.

---

## 🧪 Testing

```bash
npm test
```

Covers: conflict detection · back-to-back shifts · split shifts · working-hour validation.

---

## 📁 Project structure

```
ScheduleWork/
├── src/               # React frontend
├── src-tauri/         # Tauri / Rust backend
├── tests/             # Scheduling logic tests
├── public/            # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🔒 Actually offline-first

No sign-in · no account · no server · no internet connection required · your data stays on your device.

Built for restaurants, retail stores, and small teams who need a simple, efficient way to manage weekly shift schedules.

---

<div align="center">

### 📌 Actively in development

Bug reports, feature requests, and suggestions are all welcome 🙌

</div>
