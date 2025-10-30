# Crisis Alert Project

Một ứng dụng web full-stack (Next.js, Node.js, MySQL) được container hóa bằng Docker, dùng để theo dõi và phân tích các đề cập (mentions) về thương hiệu hoặc từ khóa.

---

## Mục đích

Ứng dụng cảnh báo tiêu cực, cho phép quản lý theo dõi thông tin quan trọng, bao gồm alerts, case studies, posts và quản lý người dùng.

---

## ✨ Tính năng chính

* **Xác thực người dùng:** Đăng ký và đăng nhập an toàn sử dụng JSON Web Tokens (JWT).
* **Quản lý Cảnh báo (Alerts):** Người dùng có thể tạo/sửa/xóa các "Alerts" tùy chỉnh, chỉ định các từ khóa (keywords) và nền tảng (platforms) cần theo dõi.
* **Tự động Liên kết:** Backend có một endpoint (`POST /api/posts`) để (crawler/scanner) đẩy dữ liệu "Post" mới vào. Hệ thống sẽ tự động quét và liên kết các Post này với các Alert phù hợp.
* **Fetch dữ liệu hiệu quả:** Toàn bộ 6 trang chính (`Dashboard`, `Alerts`, `Alert [id]`, `Mentions`, `CaseStudies`, `CaseStudy [id]`) đều sử dụng `useSWR` để quản lý fetch, cache, và revalidation dữ liệu.
* **Bộ lọc Linh hoạt:**
    * Sử dụng component `FilterBar.jsx` tái sử dụng (reusable) trên 5 trang.
    * Lọc theo thời gian thực (với `debounce`) theo từ khóa.
    * Lọc đa lựa chọn (multi-select) cho Platform, Sentiment, Status, Severity.
    * State của bộ lọc được quản lý trên URL (`searchParams`) trên các trang chi tiết.
* **Quản lý Case Study:** Nhóm các posts liên quan đến một alert thành một "Case Study" để phân tích.
* **Bảo mật Backend:** Tất cả các route API đều được bảo vệ và xác thực (validation) đầu vào bằng `express-validator` để chống lỗi 400/500.

---

## 🛠️ Ngăn xếp Công nghệ (Tech Stack)

| Phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React, Next.js, `useSWR`, Tailwind CSS |
| **Backend** | Node.js, Express.js, Sequelize (ORM) |
| **Database** | MySQL 8.0 |
| **DevOps** | Docker, Docker Compose |
| **Bảo mật** | JWT (jsonwebtoken), `express-validator` |

---

## 🚀 Cài đặt & Chạy chương trình (Docker)

Project này được thiết kế để chạy hoàn toàn bằng Docker Compose. Bạn không cần cài đặt Node.js hay MySQL trên máy.

### Yêu cầu
* [Docker](https://www.docker.com/products/docker-desktop/) (Đã bao gồm Docker Compose)
* Git để clone project

## 1. Clone repository

```bash
git clone [https://github.com/RankOutsider/crisis-alert.git](https://github.com/RankOutsider/crisis-alert.git)
cd crisis-alert

## Yêu cầu

* Node.js >= 18
* npm >= 9
* (Backend) Database phù hợp (ví dụ SQL Server hoặc MongoDB)
* Git để clone project

---

## Cấu trúc project

```
backend/       # Server Node.js
frontend/      # Frontend Next.js + React
.gitignore     # Loại trừ file không cần thiết
README.md      # File hướng dẫn này
```

* `backend/` chứa server, routes, controllers, models và middleware.
* `frontend/` chứa ứng dụng React/Next.js, components, pages và styles.
* File `.env` nằm trong `backend/` và không được commit lên GitHub.

---

## Cài đặt

### 1. Clone repository

```bash
git clone <URL_repository_của_bạn>
cd crisis-alert
```

### 2. Cài đặt backend

```bash
cd backend
npm install
```

* Tạo file `.env` trong `backend/` dựa trên mẫu `.env.example` (nếu có) và thêm các biến môi trường cần thiết.

FILE .env gồm
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=crisis_alert_db

JWT_SECRET=your_jwt_secret_here

EMAIL_USER=your_email_here
EMAIL_PASS=your_email_password_here
EMAIL_HOST=smtp.gmail.com


### 3. Cài đặt frontend

```bash
cd ../frontend
npm install
```

---

## Chạy chương trình

### Backend

```bash
cd backend
npm run dev
```

* Mặc định server sẽ chạy trên `http://localhost:5000` (tuỳ cấu hình trong `.env`)

### Frontend

```bash
cd frontend
npm run dev
```

* Mặc định ứng dụng chạy trên `http://localhost:3000`

---

## Lưu ý quan trọng

* Không commit file `backend/.env` lên GitHub.
* Mọi thay đổi về `.env` phải giữ cục bộ trên máy.
* Nếu muốn đồng bộ README hoặc các thay đổi cấu hình giữa các branch, hãy sử dụng:

```bash
git checkout development
git merge master
git push origin development
```

---

## Git cơ bản

### Commit thay đổi

```bash
git add .
git commit -m "Mô tả thay đổi"
```

### Push lên GitHub

```bash
git push origin <tên-branch>
```

### Merge branch development → master

```bash
git checkout master
git merge development
git push origin master
```

---

## Liên hệ

Nếu gặp vấn đề khi chạy project hoặc cần thay đổi cấu hình, liên hệ trực tiếp với người phát triển để được hướng dẫn.
