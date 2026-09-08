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
- Hoặc chọn một ca rồi nhấn vào ô để xếp lịch; nhấn **Esc** hoặc **Bỏ chọn** để kết thúc.
- Tìm nhân viên theo tên và lọc lịch theo nhóm ngay phía trên bảng.
- Nhấn tên nhóm / nhân viên để sửa; nút bút chì bên cạnh loại ca dùng để sửa giờ và màu.
- Nút **Hôm nay** trở về tuần hiện tại. Biểu tượng bảng bên phải dùng để ẩn / hiện danh sách ca.
- Ca trùng giờ được đánh dấu viền đỏ và biểu tượng cảnh báo, kể cả ca gãy.
- Khi thêm hoặc kéo ca sang ô khác, ứng dụng chặn ca trùng giờ với cùng nhân viên trong ngày đó và thông báo khoảng giờ bị trùng. Kéo không hợp lệ giữ nguyên ca ở ô cũ.
- Hai ca nối tiếp nhau được phép (ví dụ `10:00–14:00` và `14:00–18:00`). Ca gãy chỉ giữ chỗ trong các khoảng làm việc; khoảng nghỉ giữa hai ca vẫn có thể xếp thêm ca khác.
- Sửa giờ loại ca sẽ kiểm tra các lịch đã dùng loại ca đó ở mọi tuần. Thay đổi gây trùng giờ sẽ không được lưu; có thể sửa lịch liên quan trước rồi thử lại.
- Lịch cũ có ca trùng hoặc giờ không hợp lệ vẫn được giữ nguyên; ứng dụng thông báo rõ nhân viên, ngày và giờ bị trùng khi bấm **Xuất lịch**. Phải xử lý ca lỗi trước khi xuất.
- Ca hiện được nhập trong cùng một ngày, không hỗ trợ ca qua đêm. Giờ kết thúc phải sau giờ bắt đầu; ca gãy không được có hai khoảng chồng lấn.
- Ba dòng **S / T / Đ** ở cuối bảng tự đếm từng khoảng làm việc theo khung sáng (đến 14h), trưa (14h–17h) và đêm (từ 17h). Khoảng giờ giao nhiều khung được xếp vào khung chiếm nhiều thời lượng nhất. Có thể nhập lại từng ô bằng tay; xóa trắng để dùng số tự động.
- Ba khu vực làm việc cố định là **Meat, Soup, Salad**, có biểu tượng riêng và tiêu đề căn giữa để bảng dài vẫn dễ quét.
- **Xuất lịch** lưu toàn bộ lịch tuần thành PNG sắc nét ở độ phân giải tối đa 3×, kèm tiêu đề và khoảng ngày (hộp thoại Save As, mặc định thư mục Ảnh). Bộ lọc nhóm và tìm kiếm không giới hạn nội dung ảnh xuất.
- **Xóa lịch tuần này** chỉ xóa các ca trong tuần đang hiển thị sau khi xác nhận; lịch của các tuần khác, nhóm, nhân viên và loại ca được giữ nguyên.

## Kiểm tra logic xếp ca

```bash
npm test
```
