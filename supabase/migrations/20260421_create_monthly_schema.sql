CREATE TABLE IF NOT EXISTS broker_monthly (
  -- Primary Key composite
  month_date      DATE        NOT NULL,
  -- Ngày đầu tháng. VD: 2026-01-01, 2026-02-01, 2026-03-01
  -- Khi upload tháng 4 → chỉ cần thêm rows với month_date = 2026-04-01

  ma_mg           TEXT        NOT NULL,
  -- Mã môi giới, luôn UPPERCASE. VD: MG197, MG011

  -- Thông tin định danh
  ho_ten          TEXT        NOT NULL,
  team            TEXT        NOT NULL,
  chi_nhanh       TEXT        NOT NULL,
  -- 5 giá trị: 'Hội Sở chính', 'Chi nhánh Hồ Chí Minh',
  --            'Chi nhánh Hà Nội', 'Chi nhánh Đà Nẵng', 'Phòng Giao dịch Cần Thơ'

  -- Phí giao dịch
  fee             BIGINT      NOT NULL DEFAULT 0,
  -- Phí GD net cả tháng (VND). Từ cột CUR_MON_CMSN trong file Excel

  -- Dư nợ Margin (giá trị bình quân tháng)
  mar_margin      BIGINT      NOT NULL DEFAULT 0,
  -- Margin cổ phiếu thông thường. Từ CUR_AVG_MRGN_LND

  mar_3ben        BIGINT      NOT NULL DEFAULT 0,
  -- Margin 3 bên. Từ CUR_AVG_B3_LND

  mar_ungtruoc    BIGINT      NOT NULL DEFAULT 0,
  -- Margin ứng trước. Từ CUR_AVG_UT_LND

  mar_tong        BIGINT      NOT NULL DEFAULT 0,
  -- Tổng = mar_margin + mar_3ben + mar_ungtruoc (tính thêm, không có trong raw)

  -- Tài khoản Active
  active          INTEGER     NOT NULL DEFAULT 0,
  -- Số TK active trong tháng. Từ CUR_MON_ACTIVE hoặc CUR_MON_OWN_ACTIVE

  -- Metadata
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (month_date, ma_mg)
);

-- Indexes
-- Indexes
CREATE INDEX IF NOT EXISTS idx_bm_month_date ON broker_monthly(month_date);
CREATE INDEX IF NOT EXISTS idx_bm_ma_mg      ON broker_monthly(ma_mg);
CREATE INDEX IF NOT EXISTS idx_bm_chi_nhanh  ON broker_monthly(chi_nhanh);
CREATE INDEX IF NOT EXISTS idx_bm_team       ON broker_monthly(team);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_bm_updated_at ON broker_monthly;
CREATE TRIGGER trg_bm_updated_at
  BEFORE UPDATE ON broker_monthly
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- View tính MoM cho từng môi giới
-- Dùng LAG() để lấy giá trị tháng trước, tính tuyệt đối và %
CREATE OR REPLACE VIEW v_broker_mom AS
SELECT
  curr.month_date,
  curr.ma_mg,
  curr.ho_ten,
  curr.team,
  curr.chi_nhanh,

  -- Phí GD
  curr.fee                                      AS fee_nay,
  prev.fee                                      AS fee_truoc,
  curr.fee - COALESCE(prev.fee, 0)              AS fee_tuyet_doi,
  CASE WHEN COALESCE(prev.fee, 0) > 0
    THEN ROUND((curr.fee - prev.fee)::NUMERIC / prev.fee * 100, 2)
    ELSE NULL
  END                                           AS fee_pct,

  -- Dư nợ Margin tổng
  curr.mar_tong                                 AS mar_nay,
  COALESCE(prev.mar_tong, 0)                    AS mar_truoc,
  curr.mar_tong - COALESCE(prev.mar_tong, 0)   AS mar_tuyet_doi,
  CASE WHEN COALESCE(prev.mar_tong, 0) > 0
    THEN ROUND((curr.mar_tong - prev.mar_tong)::NUMERIC / prev.mar_tong * 100, 2)
    ELSE NULL
  END                                           AS mar_pct,

  -- Chi tiết margin
  curr.mar_margin, curr.mar_3ben, curr.mar_ungtruoc,

  -- Active
  curr.active                                   AS active_nay,
  COALESCE(prev.active, 0)                      AS active_truoc,
  curr.active - COALESCE(prev.active, 0)        AS active_tuyet_doi,
  CASE WHEN COALESCE(prev.active, 0) > 0
    THEN ROUND((curr.active - prev.active)::NUMERIC / prev.active * 100, 2)
    ELSE NULL
  END                                           AS active_pct

FROM broker_monthly curr
LEFT JOIN broker_monthly prev
  ON  prev.ma_mg      = curr.ma_mg
  AND prev.month_date = (curr.month_date - INTERVAL '1 month')::DATE;

-- View tổng hợp theo quý cho từng môi giới
-- Dùng DATE_TRUNC('quarter') để group
DROP VIEW IF EXISTS v_broker_quarterly CASCADE;
CREATE OR REPLACE VIEW v_broker_quarterly AS
SELECT
  DATE_TRUNC('quarter', month_date)::DATE       AS quarter_date,
  -- Ví dụ: 2026-01-01 = Q1/2026, 2026-04-01 = Q2/2026

  EXTRACT(QUARTER FROM month_date)::INTEGER     AS quarter_num,
  EXTRACT(YEAR FROM month_date)::INTEGER        AS year_num,
  ma_mg,
  MAX(ho_ten)                                   AS ho_ten,
  MAX(team)                                     AS team,
  MAX(chi_nhanh)                                AS chi_nhanh,

  -- Phí: SUM cả quý
  SUM(fee)                                      AS fee_qtd,
  COUNT(DISTINCT month_date)                    AS months_count,
  -- months_count dùng để biết quý đã có đủ 3 tháng chưa

  -- Margin: Yêu cầu tính SUM (Tháng 1 + Tháng 2 + Tháng 3)
  SUM(mar_tong)                                 AS mar_tong_sum,
  SUM(mar_margin)                               AS mar_margin_sum,
  SUM(mar_3ben)                                 AS mar_3ben_sum,
  SUM(mar_ungtruoc)                             AS mar_ungtruoc_sum,

  -- Active: Yêu cầu lấy số active tháng 1 + tháng 2 + tháng 3 (SUM)
  SUM(active)                                   AS active_sum,

  -- Cho biết môi giới này có tham gia vào tháng cuối cùng của quý không (để đếm số lượng môi giới tại quý)
  (
    MAX(month_date) = (
      SELECT MAX(month_date) 
      FROM broker_monthly bm2 
      WHERE DATE_TRUNC('quarter', bm2.month_date) = DATE_TRUNC('quarter', MAX(broker_monthly.month_date))
    )
  )                                             AS is_active_last_month

FROM broker_monthly
GROUP BY
  DATE_TRUNC('quarter', month_date),
  EXTRACT(QUARTER FROM month_date),
  EXTRACT(YEAR FROM month_date),
  ma_mg;


-- Tổng hợp theo tháng, cấp chi nhánh
CREATE OR REPLACE VIEW v_branch_monthly AS
SELECT
  month_date,
  chi_nhanh,
  COUNT(DISTINCT ma_mg)   AS broker_count,
  SUM(fee)                AS fee_total,
  SUM(mar_tong)           AS mar_total,
  SUM(active)             AS active_total
FROM broker_monthly
GROUP BY month_date, chi_nhanh;

-- Tổng hợp theo tháng, cấp team
CREATE OR REPLACE VIEW v_team_monthly AS
SELECT
  month_date,
  chi_nhanh,
  team,
  COUNT(DISTINCT ma_mg)   AS broker_count,
  SUM(fee)                AS fee_total,
  SUM(mar_tong)           AS mar_total,
  SUM(active)             AS active_total
FROM broker_monthly
GROUP BY month_date, chi_nhanh, team;

-- RLS
ALTER TABLE broker_monthly ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON broker_monthly;
DROP POLICY IF EXISTS "auth_write" ON broker_monthly;
CREATE POLICY "public_read"   ON broker_monthly FOR SELECT USING (true);
CREATE POLICY "auth_write"    ON broker_monthly FOR ALL    USING (true) WITH CHECK (true);
