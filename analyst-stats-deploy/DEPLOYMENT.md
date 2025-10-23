# 自動化部署設定指南

本專案使用 GitHub Actions 自動從 Google Sheets 更新資料，並透過 Netlify 部署網站。

## 設定步驟

### 1. 將專案推送到 GitHub

```bash
# 在本地專案目錄執行
git remote add origin https://github.com/你的用戶名/analyst-stats.git
git branch -M main
git push -u origin main
```

### 2. 在 Netlify 設定網站

1. 登入 [Netlify](https://app.netlify.com/)
2. 點擊 "Add new site" → "Import an existing project"
3. 選擇 "GitHub" 並授權
4. 選擇您的 `analyst-stats` 倉庫
5. 建置設定會自動從 `netlify.toml` 讀取
6. 點擊 "Deploy site"

### 3. 取得 Netlify Build Hook

1. 在 Netlify 網站設定中，進入 "Build & deploy" → "Build hooks"
2. 點擊 "Add build hook"
3. 輸入名稱（例如：`GitHub Actions Auto Update`）
4. 選擇分支（通常是 `main`）
5. 點擊 "Save"
6. 複製產生的 Build Hook URL（類似：`https://api.netlify.com/build_hooks/xxxxx`）

### 4. 在 GitHub 設定 Secret

1. 前往您的 GitHub 倉庫
2. 點擊 "Settings" → "Secrets and variables" → "Actions"
3. 點擊 "New repository secret"
4. 名稱：`NETLIFY_BUILD_HOOK`
5. 值：貼上剛才複製的 Build Hook URL
6. 點擊 "Add secret"

### 5. 測試自動化流程

#### 手動觸發測試

1. 前往 GitHub 倉庫的 "Actions" 頁面
2. 選擇 "Update Data from Google Sheets" 工作流程
3. 點擊 "Run workflow" → "Run workflow"
4. 等待執行完成（約 1-2 分鐘）
5. 檢查 Netlify 是否開始重新部署

#### 自動執行時間

- 工作流程會在每天台灣時間早上 8:00 自動執行
- 如果 Google Sheets 的資料有更新，會自動：
  1. 下載最新的 CSV 檔案
  2. 提交到 GitHub
  3. 觸發 Netlify 重新部署

## 工作流程說明

### 自動更新流程

```
每天 08:00 (台灣時間)
    ↓
GitHub Actions 啟動
    ↓
下載 Google Sheets CSV
    ↓
檢查資料是否有變更
    ↓
如果有變更：
  - 提交到 GitHub
  - 觸發 Netlify 部署
    ↓
網站自動更新完成
```

### 檔案說明

- `.github/workflows/update-data.yml`: GitHub Actions 工作流程配置
- `netlify.toml`: Netlify 部署配置
- `client/public/analyst_data.csv`: 資料檔案（會自動更新）

## 注意事項

1. **Google Sheets 必須保持「發布到網路」狀態**
2. **GitHub 倉庫必須是 public 或有適當的權限設定**
3. **Netlify Build Hook 必須保密**，不要公開分享
4. 如果需要修改自動更新時間，編輯 `.github/workflows/update-data.yml` 中的 `cron` 設定

## 時區說明

Cron 表達式使用 UTC 時間：
- `0 0 * * *` = UTC 00:00 = 台灣時間 08:00
- `0 12 * * *` = UTC 12:00 = 台灣時間 20:00
- `0 */6 * * *` = 每 6 小時執行一次

## 疑難排解

### 如果自動更新沒有執行

1. 檢查 GitHub Actions 頁面是否有錯誤訊息
2. 確認 `NETLIFY_BUILD_HOOK` Secret 是否設定正確
3. 確認 Google Sheets 的公開發布連結是否正常

### 如果資料沒有更新

1. 檢查 Google Sheets 是否真的有新資料
2. 手動觸發 GitHub Actions 工作流程測試
3. 查看 GitHub Actions 的執行日誌

### 如果 Netlify 部署失敗

1. 檢查 Netlify 的部署日誌
2. 確認 `netlify.toml` 配置是否正確
3. 確認所有依賴套件都已正確安裝

## 手動更新

如果需要立即更新資料：

1. 前往 GitHub 倉庫的 "Actions" 頁面
2. 選擇 "Update Data from Google Sheets"
3. 點擊 "Run workflow"
4. 等待執行完成

## 成本說明

- **GitHub Actions**: 公開倉庫免費，私有倉庫每月 2000 分鐘免費額度
- **Netlify**: 免費方案包含 100GB 流量和 300 分鐘建置時間
- 本專案的自動化流程每天執行一次，遠低於免費額度

## 聯絡支援

如有任何問題，請查看：
- [GitHub Actions 文件](https://docs.github.com/en/actions)
- [Netlify 文件](https://docs.netlify.com/)

