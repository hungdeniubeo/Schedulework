<div align="center">

# 🗓️ ScheduleWork

### *Xếp ca làm việc — kéo, thả, xong ngay.*

**Không server. Không internet. Không drama.**
**Chỉ có bạn, chiếc Mac, và lịch làm tuần này.**

![Platform](https://img.shields.io/badge/platform-macOS-black?style=for-the-badge&logo=apple)
![Offline](https://img.shields.io/badge/offline-100%25-brightgreen?style=for-the-badge)
![Built with](https://img.shields.io/badge/built%20with-Tauri%20%2B%20React-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-active%20dev-orange?style=for-the-badge)

</div>

---

## 🎯 Tại sao ScheduleWork tồn tại

Xếp lịch ca làm bằng Excel thì được, nhưng dò trùng ca bằng mắt thì... thôi khỏi. ScheduleWork sinh ra để bạn **kéo — thả — xuất ảnh**, còn việc phát hiện ca chồng chéo, tính thống kê Sáng/Trưa/Tối thì để máy lo.

Không tài khoản. Không đăng nhập. Không mất dữ liệu vì mất mạng — vì **chẳng cần mạng**.

---

## ⚡ Tính năng nổi bật

| | |
|---|---|
| 🖱️ **Kéo & thả** | Gán ca chỉ bằng một cú kéo thả vào ô Nhân viên × Ngày |
| 👥 **Quản lý nhóm** | Meat / Soup / Salad — hoặc tự đặt tên khu vực của bạn |
| ⚠️ **Bắt lỗi tự động** | Ca chồng giờ? Viền đỏ + cảnh báo hiện ngay, không cần dò |
| 🕒 **Ca gãy đôi (split shift)** | 09:00–12:00 rồi nghỉ, quay lại 17:00–21:00 — thoải mái |
| 📊 **Thống kê S / T / Đ** | Tự đếm số ca Sáng – Trưa – Đêm mỗi ngày, sửa tay cũng được |
| 🖼️ **Xuất ảnh nét căng** | PNG độ phân giải cao (tới 3×), đẹp như bảng Excel thật |
| 💾 **100% offline** | Dữ liệu nằm im trên máy bạn, không đi đâu cả |

---

## 🛠️ Bộ công cụ đứng sau

```
Tauri  ×  React  ×  TypeScript  ×  Vite  ×  Tailwind  ×  Rust
```

Nhẹ, nhanh, và không ngốn RAM như Electron.

---

## 🚀 Bắt đầu trong 4 bước

<details>
<summary><b>1️⃣ Cài Xcode Command Line Tools</b></summary>

```bash
xcode-select --install
```
Có rồi thì bỏ qua bước này.
</details>

<details>
<summary><b>2️⃣ Cài Rust</b></summary>

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```
</details>

<details>
<summary><b>3️⃣ Cài dependencies</b></summary>

```bash
cd ~/lich-ca
npm install
```
</details>

<details>
<summary><b>4️⃣ Chạy thử</b></summary>

```bash
npm run tauri dev
```
🎉 Xong! Mở app lên và bắt đầu xếp ca.
</details>

---

## 📦 Đóng gói cho macOS

```bash
cd ~/lich-ca
npm run tauri build
```

File build nằm ở `src-tauri/target/release/bundle/`:

| Chip | App | DMG |
|---|---|---|
| 🍏 Apple Silicon | `macos/Lich ca.app` | `dmg/Lich ca_0.1.0_aarch64.dmg` |
| 💻 Intel | *(tương tự, đổi `aarch64` → `x64`)* | |

Mở file `.dmg`, kéo ScheduleWork vào **Applications** — xong.

---

## 🖱️ Cách gán ca

**Cách 1 — Kéo & thả**
Kéo loại ca từ panel bên phải, thả vào ô `Nhân viên × Ngày`.

**Cách 2 — Chọn & click**
Chọn loại ca → click vào ô lịch muốn gán.
Nhấn `Esc` hoặc bấm **Deselect** để thoát chế độ gán ca.

---

## 👥 Quản lý nhân viên & nhóm

- 🔍 Tìm nhân viên theo tên
- 🧩 Lọc lịch theo nhóm
- ✏️ Sửa tên nhân viên / tên nhóm

Khu vực mặc định: **Meat · Soup · Salad** — mỗi khu có icon riêng và tiêu đề canh giữa, dễ nhìn kể cả khi lịch dài.

---

## 🎨 Tuỳ chỉnh loại ca

Bấm icon ✏️ cạnh loại ca để chỉnh:
- Tên ca
- Giờ bắt đầu / kết thúc
- Màu hiển thị

> ⚠️ Đổi giờ ca sẽ khiến ScheduleWork kiểm tra lại **mọi lịch đang dùng ca đó**. Nếu gây xung đột, thay đổi sẽ **không được lưu**.

---

## ⚠️ Bắt lỗi trùng ca

ScheduleWork tự động phát hiện ca chồng giờ của cùng một nhân viên trong cùng một ngày:

- 🔴 Viền đỏ quanh ca bị lỗi
- ⚠️ Icon cảnh báo hiện ra
- 🕒 Hiển thị rõ khung giờ trùng nhau

Kéo ca vào chỗ không hợp lệ? Nó tự động **bật lại vị trí cũ** — không hỏng gì cả.

---

## 🕒 Luật xếp ca

**Ca nối đuôi nhau — OK:**
```
10:00 – 14:00  →  14:00 – 18:00   ✅ hợp lệ
```

**Ca gãy đôi (split shift):**
```
09:00 – 12:00   (làm)
12:00 – 17:00   (nghỉ — có thể xếp ca khác vào đây)
17:00 – 21:00   (làm)
```
Hai khoảng làm việc của ca gãy đôi **không được chồng lên nhau**.

**Chưa hỗ trợ:** ca qua đêm kiểu `22:00 – 06:00`. Giờ kết thúc luôn phải sau giờ bắt đầu.

---

## 📊 Thống kê Sáng / Trưa / Đêm

| Ký hiệu | Khung giờ |
|:---:|---|
| **S** | Sáng — trước 14:00 |
| **T** | Trưa — 14:00 đến 17:00 |
| **Đ** | Đêm/Tối — từ 17:00 |

Ca nào rơi vào nhiều khung giờ thì được tính vào khung giờ có **phần thời gian lớn nhất**. Muốn sửa tay cũng được — xoá giá trị đã sửa là tự quay về số tính toán gốc.

---

## 🖼️ Xuất lịch tuần

Bấm **Export Schedule** → lưu cả lịch tuần thành ảnh PNG chất lượng cao, gồm:

📌 Tiêu đề lịch · 📅 Khoảng ngày trong tuần · 👥 Danh sách nhân viên · 🎨 Ca đã gán · 📊 Thống kê nhân sự

> 🔍 Bộ lọc tìm kiếm/nhóm chỉ ảnh hưởng giao diện — ảnh xuất ra **luôn đầy đủ cả tuần**.

Nếu lịch hiện tại đang có ca trùng giờ hoặc giờ không hợp lệ, ScheduleWork sẽ chỉ rõ nhân viên – ngày – khung giờ trùng, và **chặn xuất ảnh** cho tới khi bạn sửa xong.

---

## 🗑️ Xoá lịch tuần hiện tại

**Clear Current Week** chỉ xoá ca của tuần đang xem (có hỏi xác nhận trước khi xoá). Không đụng đến: lịch các tuần khác, nhân viên, nhóm, loại ca, hay cài đặt ứng dụng.

---

## 💾 Dữ liệu nằm ở đâu?

```
~/Library/Application Support/com.lichca.scheduler/data.json
```

Không server, không cloud, không ai đọc được trừ bạn.

---

## 🧪 Test

```bash
npm test
```

Bộ test bao phủ: phát hiện trùng ca · ca nối đuôi · ca gãy đôi · kiểm tra giờ làm hợp lệ.

---

## 📁 Cấu trúc dự án

```
ScheduleWork/
├── src/               # React frontend
├── src-tauri/         # Tauri / Rust backend
├── tests/             # Logic xếp lịch
├── public/            # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🔒 Offline-first, thật sự offline

Không đăng nhập · không tài khoản · không server · không cần mạng · dữ liệu ở lại trên máy bạn.

Hợp cho quán ăn, cửa hàng, nhóm nhỏ — bất kỳ ai cần xếp ca tuần mà không muốn đau đầu.

---

<div align="center">

### 📌 Đang phát triển tích cực

Bug report, feature request, góp ý — đều được chào đón 🙌

</div>