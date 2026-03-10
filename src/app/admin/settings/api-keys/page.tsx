'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ApiKey {
  id: string
  keyPrefix: string
  name: string
  description: string | null
  isActive: boolean
  rateLimit: number
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
  creator: { id: string; name: string } | null
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newRawKey, setNewRawKey] = useState<string | null>(null)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    rateLimit: '100',
    expiresAt: '',
  })

  const fetchKeys = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/api-keys')
      const json = await res.json()
      if (json.success) setApiKeys(json.data.apiKeys)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          rateLimit: parseInt(form.rateLimit) || 100,
          expiresAt: form.expiresAt || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setNewRawKey(json.data.rawKey)
        setCreateOpen(false)
        setForm({ name: '', description: '', rateLimit: '100', expiresAt: '' })
        await fetchKeys()
      } else {
        alert(json.error || '建立失敗')
      }
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeId) return
    setRevoking(true)
    try {
      const res = await fetch(`/api/admin/api-keys/${revokeId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setRevokeId(null)
        await fetchKeys()
      } else {
        alert(json.error || '撤銷失敗')
      }
    } finally {
      setRevoking(false)
    }
  }

  const handleCopy = async () => {
    if (!newRawKey) return
    await navigator.clipboard.writeText(newRawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('zh-TW')
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">API 金鑰管理</h1>
          <p className="text-muted-foreground mt-1">管理公開 API 的存取金鑰</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>建立新金鑰</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>建立 API 金鑰</DialogTitle>
              <DialogDescription>
                建立後將顯示完整金鑰一次，請妥善保存。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="key-name">
                  名稱 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="key-name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="例如：前台展覽網站"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-desc">說明</Label>
                <Textarea
                  id="key-desc"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="選填說明"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-rate">速率限制（每分鐘請求數）</Label>
                <Input
                  id="key-rate"
                  type="number"
                  min="1"
                  value={form.rateLimit}
                  onChange={(e) => setForm((p) => ({ ...p, rateLimit: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-expires">到期日（選填）</Label>
                <Input
                  id="key-expires"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
                {creating ? '建立中...' : '確認建立'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 顯示新建 raw key */}
      <AlertDialog open={!!newRawKey} onOpenChange={() => setNewRawKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>API 金鑰已建立</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-yellow-600 font-medium">
                  ⚠️ 此金鑰只顯示一次，關閉後無法再次查看，請立即複製並妥善保存。
                </p>
                <code className="block bg-muted rounded p-3 text-sm break-all font-mono select-all">
                  {newRawKey}
                </code>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleCopy}>
              {copied ? '已複製！' : '複製金鑰'}
            </Button>
            <AlertDialogAction onClick={() => setNewRawKey(null)}>
              我已保存，關閉
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 撤銷確認 */}
      <AlertDialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認撤銷 API 金鑰？</AlertDialogTitle>
            <AlertDialogDescription>
              撤銷後此金鑰將無法再使用，操作不可逆（但記錄仍保留）。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? '撤銷中...' : '確認撤銷'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 金鑰列表 */}
      {loading ? (
        <p className="text-muted-foreground">載入中...</p>
      ) : apiKeys.length === 0 ? (
        <p className="text-muted-foreground">尚無 API 金鑰</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名稱</TableHead>
              <TableHead>前綴</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>速率限制</TableHead>
              <TableHead>最後使用</TableHead>
              <TableHead>到期時間</TableHead>
              <TableHead>建立時間</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell>
                  <div className="font-medium">{key.name}</div>
                  {key.description && (
                    <div className="text-sm text-muted-foreground">{key.description}</div>
                  )}
                </TableCell>
                <TableCell>
                  <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{key.keyPrefix}...</code>
                </TableCell>
                <TableCell>
                  <Badge variant={key.isActive ? 'default' : 'secondary'}>
                    {key.isActive ? '啟用' : '停用'}
                  </Badge>
                </TableCell>
                <TableCell>{key.rateLimit} / 分鐘</TableCell>
                <TableCell className="text-sm">{formatDate(key.lastUsedAt)}</TableCell>
                <TableCell className="text-sm">
                  {key.expiresAt ? (
                    <span className={new Date(key.expiresAt) < new Date() ? 'text-red-500' : ''}>
                      {formatDate(key.expiresAt)}
                    </span>
                  ) : (
                    '永不過期'
                  )}
                </TableCell>
                <TableCell className="text-sm">{formatDate(key.createdAt)}</TableCell>
                <TableCell>
                  {key.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setRevokeId(key.id)}
                    >
                      撤銷
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
