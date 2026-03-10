import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'

export default function ApiDocsPage() {
  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">公開 API 文件</h1>
        <p className="text-muted-foreground mt-1">
          使用 API Key 存取已發布作品資料
        </p>
      </div>

      {/* 概覽 */}
      <Card>
        <CardHeader>
          <CardTitle>概覽</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Base URL</p>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{BASE_URL}/api/public</code>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">認證方式</p>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">X-API-Key: exhb_...</code>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            所有公開 API 端點均需在 Request Header 帶入有效的 <code className="bg-muted px-1 rounded">X-API-Key</code>。
            API 金鑰由 SUPER_ADMIN 在「API 金鑰管理」頁面建立。
          </p>
        </CardContent>
      </Card>

      {/* 端點列表 */}
      <div className="space-y-6">
        {/* GET /artworks */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">GET</Badge>
              <CardTitle className="font-mono text-base">/api/public/artworks</CardTitle>
            </div>
            <CardDescription>查詢已發布作品列表，支援分頁與篩選</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Query 參數</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>參數</TableHead>
                    <TableHead>類型</TableHead>
                    <TableHead>必填</TableHead>
                    <TableHead>說明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell><code>page</code></TableCell>
                    <TableCell>integer</TableCell>
                    <TableCell>否</TableCell>
                    <TableCell>頁碼，預設 1</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><code>limit</code></TableCell>
                    <TableCell>integer</TableCell>
                    <TableCell>否</TableCell>
                    <TableCell>每頁筆數，預設 20，最大 50</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><code>exhibitionId</code></TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>否</TableCell>
                    <TableCell>依展覽 ID 篩選</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><code>teamId</code></TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>否</TableCell>
                    <TableCell>依團隊 ID 篩選</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><code>search</code></TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>否</TableCell>
                    <TableCell>搜尋標題或理念（不分大小寫）</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-medium mb-2">請求範例</h4>
              <pre className="bg-muted rounded p-4 text-sm overflow-x-auto">{`curl "${BASE_URL}/api/public/artworks?page=1&limit=10" \\
  -H "X-API-Key: exhb_your_api_key_here"`}</pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">回傳欄位</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>欄位</TableHead>
                    <TableHead>類型</TableHead>
                    <TableHead>說明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ['id', 'string', '作品 UUID'],
                    ['title', 'string', '作品標題'],
                    ['concept', 'string | null', '作品理念說明'],
                    ['thumbnailUrl', 'string | null', '縮圖 URL'],
                    ['mediaUrls', 'string[]', '媒體檔案 URL 列表'],
                    ['displayOrder', 'integer', '排列順序'],
                    ['creatorName', 'string | null', '創作者姓名'],
                    ['team.id', 'string', '所屬團隊 ID'],
                    ['team.name', 'string', '所屬團隊名稱'],
                    ['team.exhibition.id', 'string', '所屬展覽 ID'],
                    ['team.exhibition.name', 'string', '所屬展覽名稱'],
                    ['team.exhibition.year', 'integer', '展覽年份'],
                    ['createdAt', 'string (ISO 8601)', '建立時間'],
                    ['updatedAt', 'string (ISO 8601)', '更新時間'],
                  ].map(([field, type, desc]) => (
                    <TableRow key={field}>
                      <TableCell><code>{field}</code></TableCell>
                      <TableCell className="text-muted-foreground">{type}</TableCell>
                      <TableCell>{desc}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* GET /artworks/:id */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">GET</Badge>
              <CardTitle className="font-mono text-base">/api/public/artworks/:id</CardTitle>
            </div>
            <CardDescription>查詢單一已發布作品詳情</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">路徑參數</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>參數</TableHead>
                    <TableHead>類型</TableHead>
                    <TableHead>說明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell><code>id</code></TableCell>
                    <TableCell>string (UUID)</TableCell>
                    <TableCell>作品 ID</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-medium mb-2">請求範例</h4>
              <pre className="bg-muted rounded p-4 text-sm overflow-x-auto">{`curl "${BASE_URL}/api/public/artworks/artwork-uuid-here" \\
  -H "X-API-Key: exhb_your_api_key_here"`}</pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 錯誤碼 */}
      <Card>
        <CardHeader>
          <CardTitle>錯誤碼說明</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HTTP 狀態碼</TableHead>
                <TableHead>說明</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Badge variant="destructive">401</Badge>
                </TableCell>
                <TableCell>缺少、無效或已停用/過期的 API Key</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">429</Badge>
                </TableCell>
                <TableCell>
                  請求頻率超過金鑰的速率限制。
                  回應 Header 中 <code>X-RateLimit-Reset</code> 為可再次請求的時間戳（ms）
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="secondary">404</Badge>
                </TableCell>
                <TableCell>找不到指定作品，或作品未發布</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="secondary">500</Badge>
                </TableCell>
                <TableCell>伺服器內部錯誤</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 回傳格式 */}
      <Card>
        <CardHeader>
          <CardTitle>回傳格式</CardTitle>
          <CardDescription>所有端點統一使用以下結構</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">成功</p>
            <pre className="bg-muted rounded p-4 text-sm overflow-x-auto">{`{
  "success": true,
  "data": { ... }
}`}</pre>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">失敗</p>
            <pre className="bg-muted rounded p-4 text-sm overflow-x-auto">{`{
  "success": false,
  "error": "錯誤說明"
}`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
