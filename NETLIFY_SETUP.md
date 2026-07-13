# Netlify 部署指南

## 快速開始

### 1. 準備 GitHub 倉庫
```bash
# 初始化 git（如果還沒有）
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/analyst-stats.git
git push -u origin main
```

### 2. 連接 Netlify
1. 訪問 https://app.netlify.com
2. 點擊 "New site from Git"
3. 選擇 GitHub，授權並選擇 `analyst-stats` 倉庫
4. 構建設定：
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 點擊 "Deploy site"

### 3. 自動更新設定
GitHub Actions 已配置為每天午夜 UTC 時間自動：
1. 抓取最新 CSV 資料
2. 更新 `client/src/data/analysts_by_date.json`
3. 提交變更到 GitHub
4. Netlify 自動重新部署

### 4. 手動觸發更新
在 GitHub 倉庫的 "Actions" 標籤中，找到 "Update Data Daily" 工作流程，點擊 "Run workflow" 手動執行。

## 檔案說明
- `netlify.toml` - Netlify 構建配置
- `.github/workflows/update-data.yml` - GitHub Actions 自動化工作流程
- `generate_data.py` - 從 CSV 生成 JSON 資料的腳本

## 時區設定
目前 GitHub Actions 使用 UTC 時間運行（每天 00:00）。
如需修改時間，編輯 `.github/workflows/update-data.yml` 中的 cron 表達式。

例如：
- `0 8 * * *` = 每天 08:00 UTC
- `0 16 * * *` = 每天 16:00 UTC
