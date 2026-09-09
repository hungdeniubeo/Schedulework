# ScheduleWork

A modern desktop application for macOS designed to simplify weekly employee shift scheduling.

ScheduleWork provides an intuitive drag-and-drop interface for assigning shifts, managing employees by work area, detecting scheduling conflicts, tracking staffing levels, and exporting weekly schedules as high-quality images.

The application works completely **offline**, requires no account, and does not need an Internet connection. All data is stored locally on the user's device.

---

## ✨ Features

* 📅 Weekly employee shift scheduling
* 🖱️ Drag-and-drop shift assignment
* 👥 Employee and workgroup management
* 🔍 Employee search and group filtering
* 🎨 Customizable shift names, working hours, and colors
* ⚠️ Automatic shift conflict detection
* 🕒 Split shift support
* 📊 Automatic staffing statistics by time period
* 🖼️ Export weekly schedules as high-resolution PNG images
* 💾 Local data storage
* 🌐 Fully offline operation
* 🍎 Native macOS desktop application

---

## 🛠️ Tech Stack

ScheduleWork is built with:

* **Tauri**
* **React**
* **TypeScript**
* **Vite**
* **Tailwind CSS**
* **Rust**

---

## 🚀 Development Setup

### Requirements

Before running the project, make sure you have the following installed:

* Node.js
* Rust
* Xcode Command Line Tools

### 1. Install Xcode Command Line Tools

```bash
xcode-select --install
```

If they are already installed, you can skip this step.

### 2. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

### 3. Install Dependencies

Navigate to the project directory:

```bash
cd ~/lich-ca
```

Then install the required dependencies:

```bash
npm install
```

### 4. Start the Application

Run the development version with:

```bash
npm run tauri dev
```

---

## 📦 Build for macOS

To generate the `.app` and `.dmg` packages:

```bash
cd ~/lich-ca
npm run tauri build
```

After a successful build, the generated files will be available under:

```text
src-tauri/target/release/bundle/
```

### Apple Silicon

Application bundle:

```text
src-tauri/target/release/bundle/macos/Lich ca.app
```

DMG installer:

```text
src-tauri/target/release/bundle/dmg/Lich ca_0.1.0_aarch64.dmg
```

### Intel Mac

On Intel-based Macs, the generated package may use:

```text
x64
```

instead of:

```text
aarch64
```

To install the application, open the `.dmg` file and drag ScheduleWork into the **Applications** folder.

---

## 📖 Usage

### Navigate the Schedule

Use the top navigation controls to select:

* Month
* Year
* Week

The **Today** button returns the schedule to the current week.

---

## 🖱️ Assigning Shifts

There are two ways to assign a shift to an employee.

### Drag and Drop

Drag a shift type from the right-side panel and drop it into the appropriate:

```text
Employee × Day
```

cell.

### Select a Shift

Select a shift type and click the desired schedule cell.

Press:

```text
Esc
```

or click:

```text
Deselect
```

to exit shift assignment mode.

---

## 👥 Employee and Group Management

ScheduleWork allows you to:

* Search employees by name
* Filter the schedule by group
* Edit employee names
* Edit group names

The default work areas are:

* Meat
* Soup
* Salad

Each area has its own icon and centered heading, making large schedules easier to scan.

---

## 🎨 Shift Type Management

Click the edit icon next to a shift type to modify:

* Shift name
* Start time
* End time
* Display color

When shift hours are changed, ScheduleWork checks every schedule that currently uses that shift type.

If the change creates a scheduling conflict, the update will not be saved.

---

## ⚠️ Shift Conflict Detection

ScheduleWork automatically detects overlapping shifts for the same employee on the same day.

When a conflict is detected:

* The affected shift is highlighted with a red border
* A warning icon is displayed
* The conflicting time range is shown

If a shift is dragged to an invalid location, it remains in its original position.

---

## 🕒 Scheduling Rules

Back-to-back shifts are allowed.

For example:

```text
10:00 – 14:00
14:00 – 18:00
```

is considered valid.

### Split Shifts

Split shifts only occupy the actual working periods.

For example:

```text
09:00 – 12:00
17:00 – 21:00
```

The gap between:

```text
12:00 – 17:00
```

can still be used for another shift.

The two working periods of a split shift cannot overlap with each other.

---

## 🌙 Shift Limitations

ScheduleWork currently supports shifts within a single calendar day.

Overnight shifts such as:

```text
22:00 – 06:00
```

are not currently supported.

The end time must always be later than the start time.

---

## 📊 Morning / Afternoon / Evening Statistics

At the bottom of the schedule, three summary rows automatically calculate staffing levels for:

```text
S / T / Đ
```

These correspond to:

| Label | Time Period                |
| ----- | -------------------------- |
| S     | Morning — before 14:00     |
| T     | Afternoon — 14:00 to 17:00 |
| Đ     | Evening — from 17:00       |

Each working period is automatically classified into one of these time ranges.

If a shift spans multiple periods, it is assigned to the period containing the largest portion of its working time.

Statistics can also be edited manually.

If a manually entered value is cleared, ScheduleWork automatically returns to the calculated value.

---

## 🖼️ Export Schedule

Click **Export Schedule** to save the entire current week's schedule as a PNG image.

The exported image includes:

* Weekly schedule
* Schedule title
* Week date range
* Employee list
* Assigned shifts
* Staffing statistics

Images are exported at high resolution, up to **3× scale**, to keep text and table content sharp.

The application uses a native **Save As** dialog and defaults to the user's **Pictures** folder.

> Search and group filters only affect the visible interface. The exported image always includes the full weekly schedule.

If the current schedule contains overlapping shifts or invalid working hours, ScheduleWork displays detailed information including:

* Employee name
* Date
* Conflicting time range

These issues must be resolved before the schedule can be exported.

---

## 🗑️ Clear Current Week

The:

```text
Clear Current Week
```

feature removes only the shifts from the currently displayed week.

A confirmation dialog is shown before the data is deleted.

The following data remains unchanged:

* Schedules from other weeks
* Employees
* Groups
* Shift types
* Application settings

---

## 💾 Local Data Storage

ScheduleWork operates entirely offline.

Application data is stored locally at:

```text
~/Library/Application Support/com.lichca.scheduler/data.json
```

No data needs to be uploaded to a server, and no Internet connection is required for normal operation.

---

## 🧪 Testing

Run the scheduling logic tests with:

```bash
npm test
```

The test suite covers important scheduling behavior such as:

* Shift conflict detection
* Back-to-back shifts
* Split shifts
* Working-hour validation

---

## 📁 Project Structure

```text
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

## 🔒 Offline First

ScheduleWork is designed with an **offline-first** approach.

This means:

* No sign-in required
* No account required
* No server required
* No Internet connection required
* User data remains on the local device

ScheduleWork is suitable for restaurants, stores, small businesses, and teams that need a simple and efficient tool for managing weekly employee schedules.

---

## 📌 Project Status

ScheduleWork is currently under active development.

Bug reports, feature requests, and improvement suggestions are welcome.
