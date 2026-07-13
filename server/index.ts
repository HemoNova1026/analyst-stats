import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // API 端點：讀取 Google Sheets CSV 並返回 JSON
  app.get("/api/analysts-data", async (_req, res) => {
    try {
      const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSBshk6G2cVXteIp9tuA_Fgdpb1LqR6futGlI2luo_Z0bKj2W6u42iTJbkhC0GB-x77pXrLom_ifu5Y/pub?output=csv";
      
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error("Failed to fetch CSV");
      
      const csv = await response.text();
      const lines = csv.split('\n').filter((line: string) => line.trim());
      
      const data: { [date: string]: { [analyst: string]: { friends: number; blockRate: number } } } = {};
      const uniqueDates = new Set<string>();
      const daihuaSet = new Set<string>();
      const dalaiSet = new Set<string>();
      
      // 跳過標題行
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 6) continue;
        
        const analyst = parts[0].trim();
        const dateStr = parts[1].trim();
        const friendsStr = parts[2].trim().replace(/,/g, '');
        const blockRateStr = parts[5].trim();
        
        if (!analyst || !dateStr) continue;
        
        // 轉換日期格式 (2026/6/21 -> 20260621)
        const [year, month, day] = dateStr.split('/');
        const dateNum = `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`;
        
        const friends = parseInt(friendsStr) || 0;
        const blockRate = parseFloat(blockRateStr) || 0;
        
        uniqueDates.add(dateNum);
        
        if (!data[dateNum]) {
          data[dateNum] = {};
        }
        
        data[dateNum][analyst] = { friends, blockRate };
        
        // 分類分析師
        if (!analyst.includes('YT')) {
          if (
            analyst === '丁兆宇' ||
            analyst === '劉艾綸' ||
            analyst === '阮蕙慈' ||
            analyst === '洪士哲' ||
            analyst === '張志誠' ||
            analyst === '林睿閎' ||
            analyst === '顏至恆' ||
            analyst === '羅文彬'
          ) {
            daihuaSet.add(analyst);
          } else if (analyst) {
            dalaiSet.add(analyst);
          }
        }
      }
      
      const sortedDates = Array.from(uniqueDates).sort();
      
      res.json({
        dates: sortedDates,
        daihua_analysts: Array.from(daihuaSet).sort(),
        dalai_analysts: Array.from(dalaiSet).sort(),
        analysts_by_date: data,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
