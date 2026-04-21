# Sales Dashboard

Dashboard quản lý doanh số môi giới — Next.js 14 + Supabase + Framer Motion.

---

## Bước 1 — Cài đặt project

```bash
cd sales-dashboard
npm install
```

---

## Bước 2 — Tạo Supabase project

1. Vào **https://supabase.com** → Sign up / Login
2. Click **New project** → Đặt tên, chọn region (Singapore gần nhất)
3. Đợi project khởi động (~2 phút)
4. Vào **Settings → API** → Copy 2 giá trị:
   - `Project URL`  → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public`  → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Bước 3 — Tạo bảng trong Supabase

1. Vào **SQL Editor** trong Supabase dashboard
2. Mở file `supabase/migrations/20260421_create_monthly_schema.sql` (File cũ `20260101_create_brokers.sql` hiện không còn sử dụng)
3. Copy toàn bộ nội dung → paste vào SQL Editor → **Run**
   (Bộ mã sẽ tự động tạo cấu trúc Table `broker_monthly` dạng chuỗi thời gian cùng với các Views MoM, Quarterly... tính toán linh động)

---

## Bước 4 — Cấu hình .env.local

Mở file `.env.local` và điền thông tin:

```
NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_PROJECT_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
```

---

## Bước 5 — Chạy local

```bash
npm run dev
```

Mở **http://localhost:3000** → tự redirect vào `/dashboard`.

---

## Bước 6 — Import dữ liệu

1. Vào màn **Dữ liệu** (sidebar trái)
2. Upload file `broker_monthly_vX.xlsx` (file đã chia các sheet theo từng tháng định dạng `YYYY-MM`)
3. Xem trước 10 dòng đầu → Click **Import**
4. Dashboard tự động refresh dư liệu và bổ sung lịch sử các tháng vào Period Selector.

## Tính năng chính

- **Tổng quan (Overview):** Cung cấp biểu đồ và thẻ thống kê nhanh về doanh số, dư nợ margin, số lượng tài khoản active.
- **Drill-down Modal (Phân tích chuyên sâu):** Click vào thẻ thống kê để hiển thị chi tiết số liệu. Cho phép theo dõi thành tích từ cấp Chi nhánh → Phòng ban (Team) → Từng nhân viên môi giới.
- **Import dữ liệu:** Upload trực tiếp file excel đã chuẩn hóa, hệ thống tự động cập nhật và tính toán lại doanh số.

---

## Cấu trúc project

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx          ← Màn 1: Tổng quan
│   │   ├── sales/page.tsx    ← Màn 2: Doanh số
│   │   ├── personnel/page.tsx← Màn 3: Nhân sự
│   │   ├── data/page.tsx     ← Màn 4: Import dữ liệu
│   │   └── layout.tsx        ← Sidebar + Header
│   └── globals.css
├── components/
│   ├── dashboard/Sidebar.tsx
│   ├── dashboard/Header.tsx
│   ├── providers/QueryProvider.tsx
│   ├── ui/DrillDownModal.tsx ← Modal xem chi tiết số liệu (Drill-down)
│   └── ui/StatCard.tsx
└── lib/
    ├── supabase/client.ts    ← Browser client
    ├── supabase/server.ts    ← Server client
    ├── excel-parser.ts       ← Parse file chuẩn hóa
    ├── types.ts              ← TypeScript types
    └── utils.ts              ← fmtVND, fmtPct, colors...
```

---

## Khi có dữ liệu tháng mới

1. Mở file Excel tổng hợp
2. Đổi tên Sheet/tab dữ liệu của tháng mới sang định dạng `YYYY-MM` (ví dụ: `2026-05`). Dashboard sẽ nhận diện sheet tự động.
3. Upload file mới vào màn **Dữ liệu** → Import
4. Database sẽ tự động Upsert dữ liệu với cặp khóa `(month_date, ma_mg)` và hệ thống sẽ tự tính toán số liệu So sánh Tháng, Lũy Kế Quý ngay lập tức.

---

## Tech stack

| Layer | Thư viện |
|---|---|
| Framework | Next.js 14 App Router |
| Database | Supabase (PostgreSQL) |
| Server state | TanStack Query v5 |
| Animation | Framer Motion v11 |
| Charts | Recharts v2 |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Excel parse | SheetJS (xlsx) |
