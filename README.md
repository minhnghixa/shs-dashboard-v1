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
2. Mở file `supabase/migrations/20260101_create_brokers.sql`
3. Copy toàn bộ nội dung → paste vào SQL Editor → **Run**

---

## Bước 4 — Cấu hình .env.local

Mở file `.env.local` và điền thông tin:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
2. Upload file `broker_normalized.xlsx` (file đã chuẩn hóa)
3. Xem trước 10 dòng đầu → Click **Import**
4. Dashboard tự động refresh dữ liệu

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

1. Mở file Excel mới nhất
2. Chạy lại 7 bước normalization (xem sheet `normalization_log` trong `broker_normalized.xlsx`)
3. Upload file mới vào màn **Dữ liệu** → Import
4. Dashboard tự cập nhật (upsert theo `ma_mg`)

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
