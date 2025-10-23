# 分析師 LINE@ 統計表

即時顯示大來投顧和大華投顧分析師的 LINE@ 好友數據統計，包含累積人數、新增、封鎖等資訊，並提供互動式圖表分析。

## 功能特色

- ✅ 兩個公司分別顯示（大來投顧藍色、大華投顧紅色）
- ✅ 8 個數據欄位：當前人數、昨日新增、本周增長、本月增長、昨日封鎖、本周封鎖、本月封鎖
- ✅ 點擊分析師姓名查看詳細趨勢圖表
- ✅ 圖表支援滑鼠懸停顯示詳細數據
- ✅ 響應式設計，支援各種裝置
- ✅ 自動從 Google Sheets 更新資料（每天早上 8:00）

## 技術架構

- **前端框架**: React 19 + TypeScript
- **UI 組件**: shadcn/ui + Tailwind CSS
- **圖表庫**: Recharts
- **建置工具**: Vite
- **部署平台**: Netlify
- **自動化**: GitHub Actions

## 快速開始

### 本地開發

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 建置生產版本
pnpm build
```

### 部署到 Netlify

請參考 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解完整的自動化部署設定流程。

## 資料來源

資料來自 Google Sheets，透過公開發布的 CSV 連結讀取。

Google Sheets 連結：
https://docs.google.com/spreadsheets/d/12g0ikHklbVfCc4jdes5YQdcxyjFzTFGaeLTyIvpdvMg/edit

## 自動更新機制

本專案使用 GitHub Actions 實現自動化更新：

1. 每天早上 8:00（台灣時間）自動執行
2. 從 Google Sheets 下載最新 CSV 資料
3. 如果資料有變更，自動提交到 GitHub
4. 觸發 Netlify 重新部署網站

詳細設定請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 專案結構

```
analyst-stats/
├── .github/
│   └── workflows/
│       └── update-data.yml      # GitHub Actions 自動更新工作流程
├── client/
│   ├── public/
│   │   ├── analyst_data.csv     # 分析師資料（自動更新）
│   │   └── analyst_mapping.json # 分析師分類
│   └── src/
│       ├── components/
│       │   └── AnalystChartDialog.tsx  # 圖表對話框
│       └── pages/
│           └── Home.tsx          # 主頁面
├── netlify.toml                  # Netlify 部署配置
├── DEPLOYMENT.md                 # 部署說明文件
└── README.md                     # 本文件
```

## 維護說明

### 更新分析師分類

編輯 `client/public/analyst_mapping.json` 檔案：

```json
{
  "大來投顧": [
    "葉子暘",
    "蔡宗園",
    ...
  ],
  "大華投顧": [
    "阮蕙慈",
    "洪士哲",
    ...
  ]
}
```

### 手動觸發資料更新

1. 前往 GitHub 倉庫的 Actions 頁面
2. 選擇 "Update Data from Google Sheets" 工作流程
3. 點擊 "Run workflow"

### 修改自動更新時間

編輯 `.github/workflows/update-data.yml` 中的 cron 表達式：

```yaml
schedule:
  - cron: '0 0 * * *'  # UTC 00:00 = 台灣時間 08:00
```

## 授權

本專案僅供內部使用。

## 聯絡資訊

如有任何問題或建議，請聯繫專案維護人員。

