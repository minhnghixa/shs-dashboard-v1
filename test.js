const fs = require('fs');
const env = {};
if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/['"]/g, '');
  });
}
const { createClient } = require('@supabase/supabase-js');
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) { console.log('Missing env variables'); process.exit(1); }
const sb = createClient(url, key);
(async () => {
  const { data, error } = await sb.from('brokers').select('*');
  if (error) { console.error('DB Error', error); return; }
  
  let diffCount = 0;
  let totalTong = 0;
  let totalSum = 0;
  data.forEach(b => {
    const tong = Number(b.mar_tong_nay) || 0;
    const margin = Number(b.mar_margin_nay) || 0;
    const baBen = Number(b.mar_3ben_nay) || 0;
    const ungTruoc = Number(b.mar_ungtruoc_nay) || 0;
    
    totalTong += tong;
    totalSum += (margin + baBen + ungTruoc);
    
    const sum = margin + baBen + ungTruoc;
    // float precision diff > 0.05
    if (Math.abs(tong - sum) > 0.05) {
      console.log(`Mg: ${b.ma_mg} Name: ${b.ho_ten} | DB mar_tong_nay: ${tong.toFixed(4)} | Sum(parts): ${sum.toFixed(4)}`);
      diffCount++;
    }
  });

  console.log('Total cases with difference > 0.05:', diffCount);
  console.log('Total mar_tong_nay in DB:', totalTong.toFixed(2));
  console.log('Total Sum of 3 columns:', totalSum.toFixed(2));
})()
