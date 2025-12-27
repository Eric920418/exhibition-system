# 展覽管理系統

一個專業的展覽作品管理與預約系統，使用 Next.js 16 和 React 19 構建。

## 系統架構

### 技術棧

#### 前端
- **Next.js 16** (App Router + Turbopack)
- **React 19.2**
- **TypeScript 5.3+**
- **TailwindCSS + shadcn/ui** (25 個元件)
  - 表單元件：Input, Label, Select, Checkbox, Radio Group, Textarea, Switch
  - 資料展示：Table, Card, Badge, Avatar, Separator, Skeleton
  - 互動元件：Button, Dialog, Dropdown Menu, Tabs, Popover, Alert, Calendar
  - 通知元件：Toast, Toaster
  - 進階元件：Progress, Command, Sheet
- **Craft.js** (WYSIWYG，原生 React 支援)
- **@dnd-kit/sortable** (Trello 拖拉)
- **TanStack Query v5**
- **Zustand**

#### 後端
- **Next.js API Routes**
- **Prisma ORM**
- **PostgreSQL 16**
- **Redis 7** (快取層)
- **BullMQ** (任務佇列)
- **NextAuth.js v5**
- **Swagger/OpenAPI**

#### 檔案儲存
- **MinIO** (自建 S3 相容)
- **Sharp** (圖片壓縮)
- **FFmpeg** (影片處理)

#### 即時通訊
- **Socket.io** (自建)

## 技術配置詳細說明

### 核心技術棧與版本

#### 前端框架
| 套件名稱 | 版本 | 用途 |
|---------|------|------|
| `next` | 16.0.10 | Next.js 框架（App Router + Turbopack 模式） |
| `react` | 19.2.3 | React 19 正式版本 |
| `react-dom` | 19.2.3 | React DOM 渲染器 |
| `typescript` | 5.6.3 | TypeScript 編譯器 |

#### UI 元件庫（shadcn/ui 基於 Radix UI）
| 套件名稱 | 版本 | 包含元件 |
|---------|------|---------|
| `@radix-ui/react-label` | 2.1.7 | Label 標籤 |
| `@radix-ui/react-select` | 2.2.6 | Select 下拉選單 |
| `@radix-ui/react-dialog` | 1.1.15 | Dialog 對話框 |
| `@radix-ui/react-dropdown-menu` | 2.1.16 | Dropdown Menu 下拉選單 |
| `@radix-ui/react-tabs` | 1.1.13 | Tabs 標籤頁 |
| `@radix-ui/react-toast` | 1.2.15 | Toast 通知 |
| `@radix-ui/react-switch` | 1.2.6 | Switch 開關 |
| `@radix-ui/react-checkbox` | 1.3.3 | Checkbox 複選框 |
| `@radix-ui/react-radio-group` | 1.3.8 | Radio Group 單選按鈕組 |
| `@radix-ui/react-avatar` | 1.1.10 | Avatar 頭像 |
| `@radix-ui/react-popover` | 1.1.15 | Popover 彈出層 |
| `@radix-ui/react-separator` | 1.1.7 | Separator 分隔線 |
| `@radix-ui/react-progress` | 1.1.7 | Progress 進度條 |
| `@radix-ui/react-slot` | 1.2.3 | Slot 插槽（內部使用） |

#### 樣式與工具
| 套件名稱 | 版本 | 用途 |
|---------|------|------|
| `tailwindcss` | 3.4.17 | TailwindCSS 樣式框架 |
| `autoprefixer` | 10.4.20 | CSS 自動前綴 |
| `postcss` | 8.4.49 | CSS 後處理器 |
| `class-variance-authority` | 0.7.1 | 元件樣式變體管理 |
| `tailwind-merge` | 2.2.0 | TailwindCSS class 合併工具 |
| `clsx` | 2.1.1 | className 條件組合 |
| `lucide-react` | 0.460.0 | 圖標庫 |

#### 後端與資料庫
| 套件名稱 | 版本 | 用途 |
|---------|------|------|
| `@prisma/client` | 6.0.1 | Prisma ORM 客戶端 |
| `prisma` | 6.0.1 | Prisma CLI 工具 |
| `ioredis` | 5.4.2 | Redis 客戶端 |
| `minio` | 8.0.6 | MinIO 檔案儲存客戶端 |

#### 認證與安全
| 套件名稱 | 版本 | 用途 |
|---------|------|------|
| `next-auth` | 5.0.0-beta.30 | NextAuth.js v5 Beta 認證系統 |
| `@auth/prisma-adapter` | 2.7.4 | NextAuth Prisma 適配器 |
| `bcryptjs` | 2.4.3 | 密碼雜湊加密 |
| `zod` | 3.24.1 | TypeScript 優先的 Schema 驗證 |
| `@t3-oss/env-nextjs` | 0.13.8 | 環境變數型別安全驗證 |

#### 狀態管理與資料請求
| 套件名稱 | 版本 | 用途 |
|---------|------|------|
| `zustand` | 5.0.2 | 全局狀態管理 |
| `@tanstack/react-query` | 5.62.7 | 服務端狀態管理與快取 |

#### 前台編輯器與拖拉功能
| 套件名稱 | 版本 | 用途 |
|---------|------|------|
| `@craftjs/core` | 0.2.12 | Craft.js 頁面編輯器核心 |
| `@craftjs/utils` | 0.2.5 | Craft.js 工具函數 |
| `react-contenteditable` | 3.3.7 | 可內聯編輯元件 |
| `@dnd-kit/core` | 6.3.1 | 拖放核心庫（任務看板用） |
| `@dnd-kit/utilities` | 3.2.2 | 拖放工具函數 |
| `react-rnd` | 10.5.2 | 可調整大小與拖動元件 |

#### 其他工具
| 套件名稱 | 版本 | 用途 |
|---------|------|------|
| `date-fns` | 4.1.0 | 日期處理工具 |
| `react-day-picker` | 9.11.1 | 日期選擇器 |
| `cmdk` | 1.1.1 | Command Menu 元件 |
| `recharts` | 3.6.0 | 統計圖表庫 |

### 開發環境要求

#### 必須安裝的本地服務

1. **Node.js**
   - 版本：20.9.0 或更高（Next.js 16 要求，推薦 22.x LTS）
   - 驗證指令：`node --version`

2. **PNPM**
   - 版本：8.0.0 或更高
   - 安裝指令：`npm install -g pnpm`
   - 驗證指令：`pnpm --version`

3. **PostgreSQL**
   - 版本：16.x
   - 端口：5432（預設）
   - 配置：需創建資料庫 `exhibition_db`
   - 啟動指令：
     - macOS（Homebrew）: `brew services start postgresql@16`
     - Linux（systemd）: `sudo systemctl start postgresql`

4. **Redis**
   - 版本：7.x
   - 端口：6379（預設）
   - 啟動指令：
     - macOS（Homebrew）: `brew services start redis`
     - Linux（systemd）: `sudo systemctl start redis`

5. **MinIO**（選用，用於檔案儲存測試）
   - 版本：最新版
   - 端口：9000（API）、9001（控制台）
   - 啟動指令：`minio server /data --console-address ":9001"`
   - 預設帳密：minioadmin / minioadmin

### TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ES2017",           // 目標 ECMAScript 版本
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,               // 啟用所有嚴格類型檢查
    "skipLibCheck": true,         // 跳過 .d.ts 文件檢查（加速編譯）
    "module": "esnext",
    "moduleResolution": "bundler", // Next.js 15 推薦設置
    "jsx": "preserve",            // 保留 JSX（由 Next.js 處理）
    "incremental": true,          // 增量編譯
    "paths": {
      "@/*": ["./src/*"]          // 路徑別名
    }
  }
}
```

### 環境變數配置

#### 必需環境變數

```bash
# 資料庫連接（PostgreSQL）
DATABASE_URL="postgresql://user:password@localhost:5432/exhibition_db?schema=public"

# NextAuth 認證
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="至少32字元的隨機字串"  # 使用 openssl rand -base64 32 生成

# Redis 快取
REDIS_URL="redis://localhost:6379"
```

#### 選用環境變數

```bash
# MinIO 檔案儲存（如不使用可省略）
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_BUCKET_NAME="exhibition-bucket"

# Email SMTP（功能未啟用可省略）
SMTP_HOST="localhost"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="noreply@exhibition.local"

# Public URLs
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_WS_URL="http://localhost:3000"
```

### 資料庫架構

#### Prisma ORM 配置

- **Provider**: PostgreSQL
- **Schema 檔案**: `prisma/schema.prisma`
- **總表數量**: 52 個資料表
- **主要模型**:
  - 用戶系統：User, Invitation
  - 展覽體系：Exhibition, Team, TeamMember, Artwork
  - 內容管理：Document, Sponsor, Venue
  - 預約系統：ReservationSetting, ReservationSlot, Reservation
  - 任務看板：Board, List, Card, CardAssignment, Subtask, CardComment
  - 通知系統：Notification（8種類型）
  - 前台模板：SiteTemplate
  - 審計日誌：AuditLog

#### 資料庫索引策略

- **User**: email, role
- **Exhibition**: year, status, isActive
- **Artwork**: teamId, status
- **Team**: exhibitionId, leaderId
- **Reservation**: userId, slotId, status

### 構建與部署配置

#### Next.js 配置

- **模式**: App Router（不是 Pages Router）
- **打包器**: Turbopack（Next.js 16 預設）
- **React 版本**: 19.2（正式版，啟用新功能如 Server Actions）
- **Proxy（原 Middleware）**: 使用 `src/proxy.ts` 處理請求攔截
- **輸出模式**: standalone（生產環境）
- **圖片優化**: 內建 Next.js Image Optimization

#### PNPM 特殊配置

```json
{
  "pnpm": {
    "ignoredBuiltDependencies": ["esbuild"]
  }
}
```

此配置忽略 esbuild 的原生建構步驟，避免 M1/M2 Mac 兼容性問題。

#### 構建指令

```bash
# 開發環境
pnpm dev              # 啟動 http://localhost:3000

# 生產構建
pnpm build            # 構建輸出到 .next 目錄
pnpm start            # 啟動生產服務器

# 類型檢查
pnpm lint             # ESLint 檢查
```

### 生產環境建議配置

#### 系統需求

- **CPU**: 2核心以上
- **記憶體**: 4GB 以上（推薦 8GB）
- **硬碟**: 20GB 以上

#### 服務清單

1. **應用服務器**: Node.js 20.9+ LTS（Next.js 16 要求）
2. **資料庫**: PostgreSQL 16（建議使用 Connection Pooling，如 PgBouncer）
3. **快取層**: Redis 7（建議開啟持久化）
4. **檔案儲存**: MinIO 或 AWS S3
5. **反向代理**: Nginx 或 Caddy（處理 SSL、壓縮、靜態檔案）

#### 效能優化配置

- **PostgreSQL**:
  - `max_connections`: 100
  - `shared_buffers`: 256MB
  - `effective_cache_size`: 1GB

- **Redis**:
  - `maxmemory`: 256MB
  - `maxmemory-policy`: allkeys-lru

- **Next.js**:
  - 啟用 Gzip/Brotli 壓縮
  - 配置 CDN（靜態資源）
  - 使用 ISR（Incremental Static Regeneration）

### 安全配置檢查清單

- ✅ **環境變數隔離**: 生產環境使用獨立的 .env 文件
- ✅ **NEXTAUTH_SECRET**: 使用強隨機密鑰（32+ 字元）
- ✅ **資料庫認證**: 使用強密碼，限制遠端連接
- ⏳ **CORS 配置**: 限制允許的來源網域
- ⏳ **Rate Limiting**: API 請求速率限制
- ⏳ **HTTPS**: 生產環境強制 HTTPS
- ⏳ **CSP Headers**: Content Security Policy 配置

## 專案進度追蹤

### Phase 1: 核心基礎建設 (5週) ✅ 已完成

| 任務 | 狀態 | 預計工時 | 實際進度 |
|------|------|----------|----------|
| ✅ 開發環境建置 | 完成 | 3天 | 100% |
| ✅ Prisma Schema 定義 | 完成 | - | 100% |
| ✅ TypeScript 嚴格模式 | 完成 | - | 100% |
| ✅ PostgreSQL 本地配置 | 完成 | - | 100% |
| ✅ 認證系統 (NextAuth) | 完成 | 7天 | 100% |
| ✅ API 基礎建設 | 完成 | 5天 | 100% |
| ✅ 管理後台基礎架構 | 完成 | - | 100% |
| ✅ 檔案儲存系統 (MinIO) | 完成 | 5天 | 100% |
| ✅ 審計日誌 | 完成 | 3天 | 100% |

### Phase 2: 展覽與內容管理 (6週) ✅ 已完成 (100%)

| 任務 | 狀態 | 預計工時 | 實際進度 |
|------|------|----------|----------|
| ✅ 展覽管理（後端 API + 完整前端） | 完成 | 7天 | 100% |
| ✅ 人員管理（User API + 完整前端） | 完成 | 5天 | 100% |
| ✅ 團隊管理（API + 完整前端） | 完成 | 6天 | 100% |
| ✅ 作品管理（API + 完整前端） | 完成 | 10天 | 100% |
| ✅ 文件管理（上傳 API 已完成） | API 完成 | 5天 | 100% (API) |
| ✅ 贊助商/場地（API 完成） | 完成 | 3天 | 100% |

### Phase 3: 前台模板系統 (10週) ✅ 已完成 (100%)

| 任務 | 狀態 | 預計工時 | 實際進度 |
|------|------|----------|----------|
| ✅ Craft.js 整合 | 完成 | 10天 | 100% |
| ✅ 元件屬性面板 | 完成 | 7天 | 100% |
| ✅ 模板儲存 API | 完成 | 4天 | 100% |
| ✅ 模板列表管理 | 完成 | 3天 | 100% |
| ✅ 前台渲染系統 | 完成 | 7天 | 100% |
| ✅ 預設模板開發 | 完成 | 14天 | 100% |
| ✅ 預覽與發布 | 完成 | 5天 | 100% |

### Phase 4: 任務管理系統 (7週) ✅ 已完成

| 任務 | 狀態 | 預計工時 | 實際進度 |
|------|------|----------|----------|
| ✅ 看板基礎 | 完成 | 7天 | 100% |
| ✅ 卡片詳細功能 | 完成 | 10天 | 100% |
| ✅ 子任務與評論 | 完成 | 7天 | 100% |
| ✅ 進階視圖（日曆視圖） | 完成 | 14天 | 100% |
| ✅ 通知整合 | 完成 | 5天 | 100% |

### Phase 5: 預約叫號系統 (6週) ✅ 已完成

| 任務 | 狀態 | 預計工時 | 實際進度 |
|------|------|----------|----------|
| ✅ 後台設定 | 完成 | 5天 | 100% |
| ✅ 觀眾預約流程 | 完成 | 10天 | 100% |
| ✅ 即時叫號系統 | 完成 | 12天 | 100% |
| ✅ 每日重置機制 | 完成 | 3天 | 100% |
| ✅ 數據統計 | 完成 | 5天 | 100% |

### Phase 6: 輔助功能 (4週) ✅ 已完成

| 任務 | 狀態 | 預計工時 |
|------|------|----------|
| ✅ 數據匯出 | 完成 | 7天 |
| ✅ 全站 RWD | 完成 | 10天 |
| ✅ 搜尋功能 | 完成 | 4天 |

### Phase 7: 測試與優化 (5週) ✅ 已完成 (2025-12-23)

| 任務 | 狀態 | 預計工時 |
|------|------|----------|
| ✅ 單元測試 | 完成 | 10天 |
| ✅ E2E 測試 | 完成 | 7天 |
| ✅ 效能優化 | 完成 | 10天 |
| ✅ 安全性檢查 | 完成 | 5天 |
| ✅ 文件撰寫 | 完成 | 3天 |

## 專案狀態

🎉 **基礎框架已完成！** 開發服務器運行中：http://localhost:3000

### 已實作功能

**Phase 1: 核心基礎建設** ✅
- ✅ 完整的資料庫 Schema (52個表)
- ✅ NextAuth 認證系統（已修正配置衝突）
- ✅ 用戶註冊/登入功能（使用 Toast 通知）
- ✅ 管理後台基礎架構
- ✅ 角色權限系統 (超級管理員/策展人/組長)
- ✅ 環境變數驗證（@t3-oss/env-nextjs）
- ✅ shadcn/ui 元件庫
- ✅ 展覽管理 API（CRUD + 分頁查詢）
- ✅ 作品管理 API（CRUD + 權限控制）
- ✅ 統一錯誤處理機制
- ✅ MinIO 檔案儲存系統（支援圖片/影片/文件上傳）
- ✅ 審計日誌系統（記錄所有重要操作）

**Phase 2: 展覽與內容管理** ✅ 已完成 (100%)

**後端 API（100% 完成）**
- ✅ 團隊管理 API（CRUD + 分頁查詢 + 權限控制）
- ✅ 團隊成員管理 API（CRUD + 權限控制）
- ✅ 贊助商管理 API（CRUD + 分頁查詢）
- ✅ 場地管理 API（CRUD + 分頁查詢）
- ✅ 用戶管理 API（CRUD + 分頁查詢 + 細粒度權限）

**前端頁面（100% 完成）**
- ✅ 展覽完整前端（列表、新建、編輯、詳情，含搜尋篩選）
- ✅ 用戶完整前端（列表、新建、編輯、詳情，僅超級管理員）
- ✅ 作品完整前端（列表、新建、編輯、詳情，網格佈局）
- ✅ 團隊完整前端（列表、新建、編輯、詳情，含成員與作品管理）
- ✅ 文件管理完整前端（列表、上傳、詳情，支援 PDF 預覽）
- ✅ 贊助商管理完整前端（列表、新建、編輯、詳情，含 Logo 展示）
- ✅ 場地管理完整前端（列表、新建、編輯、詳情，含平面圖展示）

**可重用組件**
- ✅ ExhibitionForm - 展覽表單（自動生成 slug，日期驗證）
- ✅ UserForm - 用戶表單（密碼加密，角色選擇器）
- ✅ ArtworkForm - 作品表單（多媒體 URL，縮圖預覽）
- ✅ TeamForm - 團隊表單（組長下拉選單，slug 生成）
- ✅ SponsorForm - 贊助商表單（Logo URL，聯絡資訊管理）
- ✅ VenueForm - 場地表單（容納人數，平面圖 URL）
- ✅ DocumentUploadForm - 文件上傳表單（兩步驟上傳流程）

**Phase 3: 前台模板系統** ✅ 已完成 (100%, 2025-10-27)

完整功能：

1. **Craft.js 編輯器整合** ✅
   - ✅ 安裝 @craftjs/core, @craftjs/utils, react-contenteditable
   - ✅ 建立編輯器基礎架構
   - ✅ 實作拖放功能
   - ✅ 復原/重做功能

2. **可拖拉元件** ✅
   - ✅ Container 容器（支援背景色、內距、嵌套）
   - ✅ Text 文字（可內聯編輯，支援字體大小、粗細、顏色、對齊）
   - ✅ Button 按鈕（支援文字、顏色、圓角、連結）
   - ✅ Image 圖片（支援 URL、填充方式、圓角）

3. **元件屬性面板** ✅
   - ✅ ContainerSettings - 容器設定（背景、內距）
   - ✅ TextSettings - 文字設定（字體、大小、顏色、對齊）
   - ✅ ButtonSettings - 按鈕設定（顏色、圓角、連結）
   - ✅ ImageSettings - 圖片設定（URL、填充、圓角）
   - ✅ 即時預覽更新

4. **編輯器 UI 組件** ✅
   - ✅ Toolbar - 工具列（復原/重做、儲存、預覽、發布）
   - ✅ Toolbox - 元件工具箱（可拖拉元件列表）
   - ✅ SettingsPanel - 屬性面板（動態顯示選中元件設定）
   - ✅ EditorClient - 編輯器主組件

5. **模板管理 API** ✅
   - ✅ SiteTemplate 驗證 schema
   - ✅ GET/POST /api/site-templates - 列表和創建
   - ✅ GET/PATCH/DELETE /api/site-templates/[id] - 單個模板操作
   - ✅ POST /api/site-templates/[id]/publish - 發布/取消發布
   - ✅ 權限控制（超級管理員或展覽創建者）
   - ✅ 審計日誌記錄

6. **模板管理頁面** ✅
   - ✅ /admin/templates - 模板列表頁面（網格佈局、篩選）
   - ✅ /admin/templates/new - 創建模板頁面（兩步驟：選模板→命名）
   - ✅ /admin/templates/[id]/editor - 模板編輯器頁面
   - ✅ TemplateCreateForm - 兩步驟創建表單
   - ✅ 權限控制（超級管理員或展覽創建者）
   - ✅ 預覽圖展示功能
   - ✅ 發布狀態管理

7. **前台渲染系統** ✅
   - ✅ /exhibitions/[slug] - 公開展覽頁面
   - ✅ TemplateRenderer - 只讀模式渲染器
   - ✅ 動態 SEO metadata 生成
   - ✅ 雙模式渲染（自訂模板/預設頁面）
   - ✅ 展覽狀態檢查（未發布顯示提示）
   - ✅ 預設頁面包含場地、作品、贊助商

8. **預設模板系統** ✅
   - ✅ 4 種專業預設模板（空白、極簡、現代、藝廊）
   - ✅ PresetTemplate 類型定義
   - ✅ 分類管理（minimalist, modern, artistic, gallery）
   - ✅ 模板選擇界面（兩步驟流程）
   - ✅ 一鍵套用預設模板

9. **預覽與發布流程** ✅
   - ✅ 編輯器內預覽按鈕（開啟新分頁）
   - ✅ 發布/取消發布按鈕（含狀態顯示）
   - ✅ 自動取消同展覽其他已發布模板
   - ✅ 發布狀態即時更新
   - ✅ Toast 通知（儲存、發布成功/失敗）

10. **Next.js 15 兼容性修復** ✅
   - ✅ 修復所有 searchParams/params Promise 類型
   - ✅ 修正 Prisma schema 欄位對齊
   - ✅ 移除不存在的欄位引用
   - ✅ 構建成功（無 TypeScript 錯誤）

**Phase 4: 任務管理系統（Trello-like 看板）** ✅ 已完成 (2025-12-22)

1. **看板管理 API** ✅
   - ✅ Board CRUD API（創建、讀取、更新、刪除）
   - ✅ List CRUD API（支援拖放排序）
   - ✅ Card CRUD API（支援跨列表移動、優先級、到期日）
   - ✅ Subtask API（子任務創建、完成狀態切換）
   - ✅ Comment API（評論創建、刪除、權限控制）
   - ✅ Zod 驗證 Schema（board.ts）
   - ✅ 審計日誌整合（BOARD_CREATE/UPDATE/DELETE, CARD_MOVE 等）

2. **看板前端頁面** ✅
   - ✅ /admin/boards - 看板列表頁（網格佈局、展覽篩選）
   - ✅ /admin/boards/new - 創建看板頁面
   - ✅ /admin/boards/[boardId] - Kanban 看板視圖
   - ✅ /admin/boards/[boardId]/calendar - 日曆視圖

3. **Kanban 元件** ✅
   - ✅ KanbanBoard - 主看板容器（dnd-kit DndContext）
   - ✅ KanbanList - 列表元件（可拖放排序、新增卡片）
   - ✅ KanbanCard - 卡片元件（優先級標籤、到期日、子任務進度、指派用戶頭像）
   - ✅ CardDetailModal - 卡片詳情彈窗（編輯、子任務、評論）
   - ✅ CalendarView - 日曆視圖（月曆網格、到期日分組）

4. **拖放功能 (dnd-kit)** ✅
   - ✅ @dnd-kit/core + @dnd-kit/sortable 整合
   - ✅ 列表水平拖放排序
   - ✅ 卡片垂直拖放排序
   - ✅ 卡片跨列表拖放移動
   - ✅ DragOverlay 拖動預覽
   - ✅ 自動同步後端 API

5. **卡片詳細功能** ✅
   - ✅ 標題內聯編輯
   - ✅ 描述編輯（Textarea）
   - ✅ 優先級選擇（低/中/高/緊急）
   - ✅ 到期日選擇（Calendar picker）
   - ✅ 子任務列表（Checkbox 完成狀態、進度條）
   - ✅ 評論系統（創建、顯示用戶頭像和時間）
   - ✅ 刪除卡片確認

6. **日曆視圖** ✅
   - ✅ 月曆網格顯示
   - ✅ 按到期日分組顯示卡片
   - ✅ 優先級顏色標識
   - ✅ 月份導航（上月/下月/今天）
   - ✅ 日期詳情彈窗
   - ✅ 卡片點擊查看詳情
   - ✅ 視圖切換按鈕（看板↔日曆）

7. **通知系統** ✅
   - ✅ Notification 資料庫模型（8種通知類型）
   - ✅ 通知 API（GET/PUT/DELETE）
   - ✅ 通知工具函數（notifyCardAssigned, notifyCardComment 等）
   - ✅ NotificationBell 頭部元件（未讀數量、輪詢更新）
   - ✅ 通知下拉面板（標記已讀、刪除、時間顯示）
   - ✅ 自動觸發通知：
     - 卡片指派時通知被指派者
     - 評論時通知相關用戶
     - 支援批量通知

**Phase 5: 預約叫號系統** ✅ 已完成 (2025-12-22)

1. **預約設定管理** ✅
   - ✅ ReservationConfig CRUD API（創建、讀取、更新、刪除）
   - ✅ 設定頁面（時段長度、休息時間、並發容量、營業時間）
   - ✅ 預約啟用/停用控制
   - ✅ Zod 驗證 Schema（reservation.ts）
   - ✅ 審計日誌整合

2. **觀眾預約流程** ✅
   - ✅ 可預約組別查詢 API
   - ✅ 隊列狀態查詢 API（當前號碼、等候人數）
   - ✅ 取號預約 API（自動生成序號）
   - ✅ 個人狀態查詢（手機號碼驗證）
   - ✅ 取消預約功能
   - ✅ Rate Limiting（每手機每日 3 次）
   - ✅ 預約入口頁面（選擇組別）
   - ✅ 取號頁面（輸入姓名、電話）
   - ✅ 成功頁面（顯示號碼牌、預估等候時間）
   - ✅ 狀態查詢頁面

3. **即時叫號系統 (SSE)** ✅
   - ✅ 當前服務狀態 API
   - ✅ 叫下一位 API
   - ✅ 指定叫號（跳號）API
   - ✅ 標記完成 API
   - ✅ 標記未到 API
   - ✅ 重新排隊 API
   - ✅ 隊列查詢 API（分頁）
   - ✅ SSE 串流 API（單組別、多組別）
   - ✅ Redis Pub/Sub 事件發布
   - ✅ 工作人員叫號介面（控制面板、等候名單）
   - ✅ 大螢幕顯示頁面（單組別）
   - ✅ 多組別大螢幕顯示頁面
   - ✅ 即時閃爍動畫效果

4. **每日重置機制** ✅
   - ✅ 手動重置序號 API
   - ✅ 批量處理未完成預約 API（標記 NO_SHOW）
   - ✅ 組別詳情頁面（含重置按鈕）
   - ✅ 確認對話框防止誤操作

5. **數據統計與匯出** ✅
   - ✅ 統計查詢 API（日期範圍、組別篩選）
   - ✅ 匯出 API（CSV、JSON 格式）
   - ✅ recharts 圖表整合
   - ✅ 每日趨勢折線圖
   - ✅ 狀態分布圓餅圖
   - ✅ 時段分布柱狀圖
   - ✅ 尖峰時段分析
   - ✅ 完成率、未到率統計

6. **新增元件** ✅
   - ✅ ReservationConfigForm - 預約設定表單
   - ✅ QueueControlPanel - 叫號控制面板
   - ✅ CurrentServingCard - 當前服務卡片
   - ✅ WaitingList - 等候名單
   - ✅ DisplayBoard - 單組別大螢幕
   - ✅ MultiTeamDisplay - 多組別大螢幕
   - ✅ ReservationStatsChart - 統計圖表元件

**Phase 2 完善功能（選項 B）** ✅ 已完成 (2025-10-26)

在 Phase 2 基礎上，額外完成了以下完善功能：

1. **文件管理系統**
   - ✅ 文件管理 API（CRUD + 分頁查詢 + 權限控制）
   - ✅ 文件列表頁面（支援展覽和類型篩選）
   - ✅ 文件上傳頁面（兩步驟流程：選展覽 → 上傳）
   - ✅ 文件詳情頁面（PDF 線上預覽，其他格式下載）
   - ✅ 支援文件類型：企劃書、設計稿、計劃書、其他

2. **贊助商管理系統**
   - ✅ 贊助商完整前端（列表、新建、編輯、詳情）
   - ✅ Logo 展示功能
   - ✅ 贊助等級管理（鑽石、金級等）
   - ✅ 聯絡資訊管理（可設定公開/不公開）
   - ✅ 網站連結與顯示順序

3. **場地管理系統**
   - ✅ 場地完整前端（列表、新建、編輯、詳情）
   - ✅ 平面圖展示功能
   - ✅ 容納人數追蹤
   - ✅ 地址與描述資訊
   - ✅ 顯示順序管理

4. **增強儀表板**
   - ✅ 7 個統計卡片（展覽、團隊、作品、用戶、贊助商、場地、文件）
   - ✅ 漸變色主要統計卡片設計
   - ✅ 展覽狀態分布圖表（已發布/草稿/已歸檔）
   - ✅ 最近展覽列表（5 筆）
   - ✅ 最近作品列表（5 筆，含縮圖）
   - ✅ 6 個快速操作按鈕（新增各類資源）
   - ✅ 根據角色顯示不同統計（策展人只看自己的展覽）

### 測試步驟
1. 訪問 http://localhost:3000/register 註冊第一個用戶（自動成為超級管理員）
2. 登入後會進入管理後台 http://localhost:3000/admin
3. 可查看增強版儀表板統計和快速操作選單

## 快速開始

### 系統需求
- Node.js 20.9+（Next.js 16 要求）
- PNPM 8+
- PostgreSQL 16
- Redis 7

### 安裝步驟

1. 克隆專案
```bash
git clone [repository-url]
cd exhibition-system
```

2. 安裝依賴
```bash
pnpm install
```

3. 設定環境變數
```bash
cp .env.example .env
# 編輯 .env 檔案，填入必要的配置（資料庫連接等）
```

4. 確保本地服務運行
- 啟動 PostgreSQL 資料庫（端口 5432）
- 啟動 Redis 服務（端口 6379）

5. 初始化資料庫
```bash
pnpm db:generate
pnpm db:push
```

6. 啟動開發服務器
```bash
pnpm dev
```

訪問 [http://localhost:3000](http://localhost:3000)

## 專案結構

```
exhibition-system/
├── prisma/                 # Prisma Schema 和遷移檔案
│   ├── schema.prisma      # 資料庫結構定義
│   └── migrations/        # 資料庫遷移歷史
├── public/                # 靜態資源
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API 路由
│   │   ├── (auth)/       # 認證相關頁面
│   │   ├── (admin)/      # 後台管理頁面
│   │   └── (public)/     # 前台展示頁面
│   ├── components/       # React 元件
│   │   ├── ui/          # 基礎 UI 元件
│   │   ├── forms/       # 表單元件
│   │   ├── layouts/     # 佈局元件
│   │   └── features/    # 功能元件
│   ├── lib/             # 工具函數和配置
│   │   ├── prisma.ts    # Prisma 客戶端
│   │   ├── redis.ts     # Redis 連接
│   │   └── utils.ts     # 工具函數
│   ├── hooks/           # Custom React Hooks
│   ├── services/        # 業務邏輯層
│   ├── types/           # TypeScript 型別定義
│   └── config/          # 應用配置
└── package.json         # 專案依賴配置
```

## 開發指南

### 命令列工具

```bash
# 開發
pnpm dev              # 啟動開發服務器
pnpm build            # 構建生產版本
pnpm start            # 啟動生產服務器

# 資料庫
pnpm db:generate      # 生成 Prisma Client
pnpm db:push          # 推送 Schema 到資料庫
pnpm db:migrate       # 執行資料庫遷移
pnpm db:studio        # 開啟 Prisma Studio
pnpm db:seed          # 填充測試資料

# 測試
pnpm test             # 執行單元測試
pnpm test:e2e         # 執行 E2E 測試

# 代碼品質
pnpm lint             # ESLint 檢查
pnpm format           # Prettier 格式化
```

### Git 分支策略

- `main` - 生產環境分支
- `develop` - 開發環境分支
- `feature/*` - 功能開發分支
- `hotfix/*` - 緊急修復分支

### 提交規範

使用語義化提交訊息：
- `feat:` 新功能
- `fix:` 修復錯誤
- `docs:` 文件更新
- `style:` 程式碼格式調整
- `refactor:` 重構代碼
- `test:` 測試相關
- `chore:` 建構工具或輔助工具變動

## API 文件

API 文件使用 Swagger UI，開發環境可訪問：
[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## 資料庫結構

### 核心表
- `users` - 使用者管理
- `exhibitions` - 展覽資訊
- `teams` - 組別管理
- `artworks` - 作品資料
- `reservations` - 預約記錄

### 詳細 Schema
請參考 `prisma/schema.prisma` 檔案

## 部署

### 生產環境需求
- Node.js 20.9+ LTS（Next.js 16 要求）
- PostgreSQL 16
- Redis 7
- MinIO 或 AWS S3
- 反向代理（Nginx/Caddy）

### 環境變數配置
確保生產環境設定以下變數：
- `DATABASE_URL` - PostgreSQL 連接字串
- `REDIS_URL` - Redis 連接字串
- `NEXTAUTH_SECRET` - 認證密鑰
- MinIO/S3 相關配置

## 效能優化

### 已實施
- ✅ Redis 快取層
- ✅ 圖片自動壓縮
- ✅ PostgreSQL 索引優化

### 計劃實施
- ⏳ CDN 整合
- ⏳ SSG/ISR 優化
- ⏳ WebSocket 負載平衡

## 安全措施

- ✅ NextAuth.js 認證
- ✅ Zod 輸入驗證
- ✅ SQL Injection 防護（Prisma）
- ✅ XSS 防護（React）
- ⏳ Rate Limiting
- ⏳ CSRF Token
- ✅ 審計日誌

---

## Phase 6: 輔助功能詳細說明 ✅ 已完成 (2025-12-23)

### 1. 數據匯出系統 ✅

支援多種實體的數據匯出，格式包含 CSV、JSON、Excel (XML Spreadsheet)。

**匯出 API 端點：**
| 端點 | 說明 | 權限 |
|------|------|------|
| `/api/exhibitions/export` | 展覽數據匯出 | 認證用戶（非超管只能匯出自己的） |
| `/api/artworks/export` | 作品數據匯出 | 認證用戶（權限過濾） |
| `/api/users/export` | 用戶數據匯出 | 僅超級管理員 |
| `/api/teams/export` | 團隊數據匯出 | 認證用戶（權限過濾） |
| `/api/sponsors/export` | 贊助商數據匯出 | 認證用戶（權限過濾） |
| `/api/venues/export` | 場地數據匯出 | 認證用戶（權限過濾） |
| `/api/reservations/stats/export` | 預約數據匯出 | 認證用戶（權限過濾） |

**共用匯出參數：**
- `format`: csv | json | xlsx（預設 csv）
- 各實體支援額外篩選參數

**匯出工具函數 (`lib/export.ts`)：**
- `createExportResponse` - 創建匯出響應
- `formatDate` / `formatDateTime` - 日期格式化
- `maskSensitive` - 敏感資料遮罩
- `formatStatus` / `formatBoolean` - 狀態格式化
- 支援 CSV BOM（中文 Excel 相容）

**前端元件 (`components/ui/export-button.tsx`)：**
```tsx
<ExportButton
  endpoint="/api/exhibitions/export"
  params={{ year: "2024", status: "PUBLISHED" }}
  label="匯出展覽"
/>
```

### 2. 全站 RWD 響應式設計 ✅

**移動端導航 (`components/layout/MobileNav.tsx`)：**
- 抽屜式側邊選單（<768px 觸發）
- 漢堡選單按鈕
- 背景遮罩與防滾動
- 路由切換自動關閉

**響應式側邊欄改造：**
- 桌面版：固定側邊欄（可摺疊）
- 移動端：抽屜式選單
- 統一使用 `hidden md:block` / `md:hidden` 切換

**響應式表格元件 (`components/ui/responsive-table.tsx`)：**
```tsx
<ResponsiveTable
  columns={columns}
  data={data}
  keyField="id"
  renderMobileCard={(row) => <MobileCard {...row} />}
/>
```
- 桌面版：標準表格
- 移動端：卡片列表

**響應式分頁元件：**
- 桌面版：完整頁碼
- 移動端：簡化導航（上一頁/下一頁 + 當前/總頁）

**頁面響應式優化：**
- 展覽管理頁面：表格 → 卡片切換
- 所有表單：`grid-cols-1 md:grid-cols-2` 自適應
- 頂部標題欄：響應式間距和排版

### 3. 全局搜尋功能 ✅

**全局搜尋 API (`/api/search`)：**
- 跨實體搜尋（展覽、作品、團隊、用戶、贊助商、場地、文件）
- 權限過濾（非超管只能搜尋自己有權限的數據）
- 並行查詢優化
- 支援篩選搜尋類型

**請求參數：**
```
GET /api/search?q=關鍵字&types=exhibitions,artworks&limit=10
```

**各實體搜尋功能補全：**
| API | 搜尋欄位 |
|-----|---------|
| `/api/teams` | 名稱、描述 |
| `/api/sponsors` | 名稱、聯絡人 |
| `/api/venues` | 名稱、地址 |
| `/api/documents` | 標題 |

**全局搜尋 UI (`components/layout/GlobalSearch.tsx`)：**
- Command+K / Ctrl+K 快捷鍵
- 即時搜尋（300ms 防抖）
- 鍵盤導航（上/下/Enter）
- 分類結果展示
- 整合到 AdminHeader

**搜尋結果頁面 (`/admin/search`)：**
- URL 參數搜尋
- 類型篩選下拉
- 結果卡片網格
- 支援深度連結

### 新增元件列表

| 元件 | 路徑 | 用途 |
|------|------|------|
| ExportButton | `components/ui/export-button.tsx` | 數據匯出下拉按鈕 |
| ResponsiveTable | `components/ui/responsive-table.tsx` | 響應式表格 |
| Pagination | `components/ui/responsive-table.tsx` | 響應式分頁 |
| MobileNav | `components/layout/MobileNav.tsx` | 移動端抽屜導航 |
| GlobalSearch | `components/layout/GlobalSearch.tsx` | 全局搜尋對話框 |

### 新增 API 列表

| 路徑 | 方法 | 用途 |
|------|------|------|
| `/api/search` | GET | 全局跨實體搜尋 |
| `/api/exhibitions/export` | GET | 展覽數據匯出 |
| `/api/artworks/export` | GET | 作品數據匯出 |
| `/api/users/export` | GET | 用戶數據匯出 |
| `/api/teams/export` | GET | 團隊數據匯出 |
| `/api/sponsors/export` | GET | 贊助商數據匯出 |
| `/api/venues/export` | GET | 場地數據匯出 |

### 工具函數更新

**lib/export.ts（新增）：**
- 通用匯出邏輯
- CSV/JSON/Excel 格式支援
- 格式化工具函數

**lib/validations/*.ts（更新）：**
- `teamQuerySchema` 新增 `search` 參數
- `sponsorQuerySchema` 新增 `search`, `tier` 參數
- `venueQuerySchema` 新增 `search` 參數

---

## Phase 7: 測試與優化詳細說明 ✅ 已完成 (2025-12-23)

### 1. 單元測試 (Vitest) ✅

使用 Vitest 作為測試框架，搭配 React Testing Library 進行元件測試。

**測試配置：**
- `vitest.config.ts` - Vitest 配置文件
- `vitest.setup.ts` - 測試環境設置（Mock Next.js 模組）

**測試覆蓋範圍：**

| 類別 | 測試檔案 | 測試數量 |
|------|---------|---------|
| 工具函數 | `utils.test.ts` | 23 個測試 |
| API 客戶端 | `api-client.test.ts` | 12 個測試 |
| API 響應 | `api-response.test.ts` | 12 個測試 |
| 安全性工具 | `security.test.ts` | 29 個測試 |
| 展覽驗證 | `exhibition.test.ts` | 25 個測試 |
| 用戶驗證 | `user.test.ts` | 22 個測試 |
| 作品驗證 | `artwork.test.ts` | 25 個測試 |
| Button 元件 | `button.test.tsx` | 20 個測試 |
| Input 元件 | `input.test.tsx` | 24 個測試 |
| **總計** | **9 個測試檔案** | **192 個測試** |

**測試指令：**
```bash
pnpm test           # 監聽模式
pnpm test:run       # 單次執行
pnpm test:coverage  # 含覆蓋率報告
pnpm test:ui        # Vitest UI 介面
```

### 2. E2E 測試 (Playwright) ✅

使用 Playwright 進行端對端測試，覆蓋主要用戶流程。

**測試配置 (`playwright.config.ts`)：**
- 支援多瀏覽器（Chromium, Firefox, WebKit）
- 支援行動裝置測試（iPhone, Pixel）
- 自動啟動開發伺服器
- 失敗時截圖和錄影

**E2E 測試案例：**

| 測試檔案 | 覆蓋功能 |
|---------|---------|
| `home.spec.ts` | 首頁載入、導航連結 |
| `auth.spec.ts` | 登入表單、註冊表單、錯誤處理 |
| `admin.spec.ts` | 未登入重定向、後台訪問 |
| `exhibitions.spec.ts` | 展覽列表頁、響應式設計 |
| `accessibility.spec.ts` | 語義結構、鍵盤導航、無障礙標籤 |

**測試指令：**
```bash
pnpm test:e2e         # 執行 E2E 測試
pnpm test:e2e:ui      # Playwright UI 模式
pnpm test:e2e:report  # 查看測試報告
```

### 3. 效能優化 ✅

**快取層 (`lib/cache.ts`)：**
- `getOrSet()` - Cache-aside 模式實現
- `invalidateCache()` - 單一快取刪除
- `invalidateCachePattern()` - 模式匹配批量刪除
- `getCacheStats()` - 快取統計資訊
- 預設 TTL：SHORT(60s), MEDIUM(300s), LONG(3600s), DAY(86400s)

**快取使用範例：**
```typescript
import { cacheExhibition, invalidateExhibitionCache } from '@/lib/cache'

// 讀取時自動快取
const exhibition = await cacheExhibition(id, async () => {
  return prisma.exhibition.findUnique({ where: { id } })
})

// 更新後刪除快取
await invalidateExhibitionCache(id)
```

### 4. 安全性工具 (`lib/security.ts`) ✅

**XSS 防護：**
- `sanitizeHtml()` - 清理 HTML 輸入，移除惡意腳本

**輸入驗證：**
- `isSafeIdentifier()` - SQL 注入防護
- `isValidUUID()` - UUID 格式驗證
- `isValidEmail()` - 電子郵件格式驗證

**密碼安全：**
- `checkPasswordStrength()` - 密碼強度評分和建議

**Rate Limiting：**
- `checkRateLimit()` - Redis 實現的請求速率限制

**其他工具：**
- `generateCsrfToken()` - CSRF Token 生成
- `safeJsonParse()` - 安全 JSON 解析
- `maskSensitiveData()` - 敏感資料遮罩
- `isAllowedFileType()` - 檔案類型驗證
- `FILE_SIZE_LIMITS` - 檔案大小限制常數

### 5. 新增開發依賴

| 套件名稱 | 版本 | 用途 |
|---------|------|------|
| `vitest` | 4.0.16 | 單元測試框架 |
| `@vitejs/plugin-react` | 5.1.2 | Vitest React 支援 |
| `@testing-library/react` | 16.3.1 | React 元件測試 |
| `@testing-library/jest-dom` | 6.9.1 | DOM 斷言擴展 |
| `@testing-library/user-event` | 14.6.1 | 用戶事件模擬 |
| `@vitest/coverage-v8` | 4.0.16 | 覆蓋率報告 |
| `jsdom` | 27.3.0 | 瀏覽器環境模擬 |
| `happy-dom` | 20.0.11 | 快速 DOM 實現 |
| `@playwright/test` | 1.57.0 | E2E 測試框架 |

### 6. 測試目錄結構

```
src/
├── __tests__/
│   ├── lib/
│   │   ├── utils.test.ts
│   │   ├── api-client.test.ts
│   │   ├── api-response.test.ts
│   │   ├── security.test.ts
│   │   └── validations/
│   │       ├── exhibition.test.ts
│   │       ├── user.test.ts
│   │       └── artwork.test.ts
│   └── components/
│       └── ui/
│           ├── button.test.tsx
│           └── input.test.tsx
e2e/
├── home.spec.ts
├── auth.spec.ts
├── admin.spec.ts
├── exhibitions.spec.ts
└── accessibility.spec.ts
```

---

  電子郵件：admin@example.com
  密碼：admin123