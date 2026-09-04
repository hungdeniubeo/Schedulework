# Lịch ca

Ứng dụng desktop macOS (Tauri) để xếp ca làm việc theo tuần. Dữ liệu lưu local trong `data.json` (thư mục app data), không cần internet.

## Chạy lúc phát triển

Cần **Node.js**, **Rust** và **Xcode Command Line Tools**.

```bash
# 1) Xcode Command Line Tools (nếu chưa có)
xcode-select --install

# 2) Rust (nếu chưa có)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# 3) Node (nvm / Homebrew đều được), rồi:
cd ~/lich-ca
npm install
npm run tauri dev
```

## Đóng gói .app / .dmg

```bash
cd ~/lich-ca
npm run tauri build
```

File nằm tại:

- `src-tauri/target/release/bundle/macos/Lich ca.app`
- `src-tauri/target/release/bundle/dmg/Lich ca_0.1.0_aarch64.dmg` (hoặc `x64` trên Intel)

Mở file `.dmg` rồi kéo app vào Applications. Dữ liệu lịch nằm ở:

`~/Library/Application Support/com.lichca.scheduler/data.json`

## Dùng app

- Chọn tháng / năm / tuần trên thanh trên.
- Kéo loại ca từ cột phải thả vào ô nhân viên × ngày.
- Click tên nhóm / nhân viên / ca để sửa; hover hiện nút × để xóa.
- **Xuất ảnh** lưu JPG (hộp thoại Save As, mặc định thư mục Ảnh).
