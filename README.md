# Crisis Alert Project

## Mục đích

Ứng dụng cảnh báo tiêu cực, cho phép quản lý theo dõi thông tin quan trọng, bao gồm alerts, case studies, posts và quản lý người dùng.

---

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
