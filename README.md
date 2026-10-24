# 1in8b-birth-picker[README.md](https://github.com/user-attachments/files/33900950/README.md)
# 1 trong 8 tỷ — Chọn nơi sinh

Userscript cho [1in8b.life](https://1in8b.life/vi/) giúp bạn chọn thủ công quốc gia nơi nhân vật bắt đầu cuộc đời, thay vì để trò chơi tự chọn quốc gia theo thống kê.

> **Lưu ý:** Đây là công cụ không chính thức do cộng đồng tạo ra; không liên kết hay được bảo trợ bởi 1in8b.life. Trang gốc có thể thay đổi, khiến userscript cần được cập nhật.

## Cài đặt nhanh

### Bước 1 — Cài Tampermonkey

Tampermonkey là tiện ích quản lý userscript cho trình duyệt. Hãy cài từ cửa hàng tiện ích chính thức của trình duyệt:

- [Chrome / Chromium](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/)

### Bước 2 — Cài userscript

1. Đảm bảo Tampermonkey đã được bật.
2. Mở tệp cài đặt trực tiếp bên dưới:

   **[Cài đặt 1in8b — Chọn nơi sinh](https://raw.githubusercontent.com/Raiiito/1in8b-birth-picker/main/1in8b-birth-picker.user.js)**

3. Trên trang Tampermonkey mở ra, xem lại tên script rồi nhấn **Install**.

### Bước 3 — Sử dụng

1. Mở [1in8b.life bản tiếng Việt](https://1in8b.life/vi/) hoặc một bản ngôn ngữ khác.
2. Nếu trang đã mở từ trước, tải lại trang. Nếu cần, nhấn `Ctrl + F5` để tải lại hoàn toàn.
3. Nhấn nút **🌍 Nơi sinh** ở góc dưới bên trái.
4. Tìm theo tên quốc gia hoặc mã ISO 3 chữ cái, ví dụ `VNM`.
5. Chọn một quốc gia. Lựa chọn được lưu trong trình duyệt và áp dụng cho lần bắt đầu cuộc đời tiếp theo.
6. Để trở về lựa chọn ngẫu nhiên, mở bộ chọn và chọn **🎲 Ngẫu nhiên (mặc định)**.

## Lưu ý khi sử dụng

- Lựa chọn nơi sinh được lưu trong `localStorage` của trang bằng khóa `bornpicker.iso`; dữ liệu này nằm trong trình duyệt hiện tại.
- Bộ chọn chỉ ép quốc gia cho nhân vật chính. Các nhân vật dùng để so sánh vẫn theo cơ chế của trò chơi.
- Khi nhập mã lớp trong chế độ giáo dục, script không ép quốc gia để tránh làm lệch kết quả chung của lớp.
- Script can thiệp vào hàm JavaScript của trang đang chạy. Nếu nhà phát triển 1in8b.life thay đổi mã nguồn, chức năng có thể ngừng hoạt động cho đến khi script được cập nhật.

## Khắc phục sự cố

**Không thấy nút “Nơi sinh”**

1. Kiểm tra Tampermonkey đang bật.
2. Mở Tampermonkey và xác nhận script `1 trong 8 tỷ — Chọn nơi sinh` đã được bật.
3. Tải lại trang bằng `Ctrl + F5`.
4. Thử mở lại trang sau khi tắt rồi bật script.

**Nút hiển thị “chưa kết nối”**

Điều này có nghĩa là script chưa tìm được các hàm hoặc dữ liệu nội bộ của trò chơi. Tải lại trang và thử lại. Nếu lỗi tiếp diễn, mã nguồn game có thể đã thay đổi; hãy mở [Issues](https://github.com/Raiiito/1in8b-birth-picker/issues) và cung cấp thông tin lỗi (không đăng dữ liệu cá nhân).

**Muốn kiểm tra bằng Console**

Mở DevTools bằng `F12`, chọn tab **Console**, rồi chạy các lệnh:

```js
bornPicker.get();       // Xem mã quốc gia đang chọn
bornPicker.set('VNM');  // Chọn Việt Nam
bornPicker.set('');     // Trở lại chế độ ngẫu nhiên
bornPicker.list();      // Xem danh sách quốc gia
bornPicker.hooked;      // Kiểm tra script đã kết nối với game chưa
```

## Cập nhật

Userscript khai báo `@updateURL` và `@downloadURL` trỏ tới bản trên nhánh `main`. Khi phát hành cập nhật:

1. Sửa `1in8b-birth-picker.user.js` trong repository.
2. Tăng giá trị `@version` trong khối metadata `==UserScript==` (ví dụ `1.0.0` → `1.0.1`).
3. Commit thay đổi. Tampermonkey sẽ kiểm tra cập nhật theo lịch và thiết lập cập nhật của trình duyệt; bạn cũng có thể kiểm tra thủ công trong bảng điều khiển Tampermonkey.

## Nguồn mã

- Repository: [Raiiito/1in8b-birth-picker](https://github.com/Raiiito/1in8b-birth-picker)
- Userscript: [1in8b-birth-picker.user.js](https://github.com/Raiiito/1in8b-birth-picker/blob/main/1in8b-birth-picker.user.js)
- Link cài đặt: [Raw userscript](https://raw.githubusercontent.com/Raiiito/1in8b-birth-picker/main/1in8b-birth-picker.user.js)
