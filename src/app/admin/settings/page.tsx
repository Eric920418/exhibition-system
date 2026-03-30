'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export default function SettingsPage() {
  const { toast } = useToast()
  const [frontendEnabled, setFrontendEnabled] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState('')
  const [redirectEnabled, setRedirectEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingRedirect, setSavingRedirect] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const [feData, redirectData] = await Promise.allSettled([
        apiClient.get('/system-settings/frontend_enabled'),
        apiClient.get('/system-settings/homepage_redirect_url'),
      ])

      if (feData.status === 'fulfilled') {
        const val = feData.value as { enabled?: boolean }
        setFrontendEnabled(val?.enabled || false)
      }

      if (redirectData.status === 'fulfilled') {
        const val = redirectData.value as { url?: string; enabled?: boolean }
        setRedirectUrl(val?.url || '')
        setRedirectEnabled(val?.enabled || false)
      }
    } catch {
      // defaults already set
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async () => {
    setSaving(true)
    try {
      await apiClient.put('/system-settings/frontend_enabled', {
        enabled: !frontendEnabled,
      })
      setFrontendEnabled(!frontendEnabled)
      toast({
        title: '設置已更新',
        description: !frontendEnabled ? '前台已開放' : '前台已關閉',
      })
    } catch (error: any) {
      toast({
        title: '更新失敗',
        description: error.message || '操作失敗，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">載入中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">系統設置</h1>
        <p className="text-gray-600 mt-2">管理系統全局設定</p>
      </div>

      <div className="max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>前台開關</CardTitle>
            <CardDescription>
              控制網站前台是否對公眾開放。關閉時，首頁將顯示「展覽籌備中」頁面。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  前台狀態
                </h3>
                <p className="text-sm text-gray-600">
                  {frontendEnabled
                    ? '前台已開放，訪客可以瀏覽展覽內容'
                    : '前台已關閉，訪客將看到籌備中頁面'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div
                  className={`px-4 py-2 rounded-full font-semibold ${
                    frontendEnabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {frontendEnabled ? '已開放' : '已關閉'}
                </div>
                <Button
                  onClick={handleToggle}
                  disabled={saving}
                  variant={frontendEnabled ? 'destructive' : 'default'}
                  size="lg"
                >
                  {saving
                    ? '處理中...'
                    : frontendEnabled
                    ? '關閉前台'
                    : '開放前台'}
                </Button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    使用說明
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 開放前台：訪客可以瀏覽首頁的展覽列表和展覽詳情</li>
                    <li>• 關閉前台：首頁將顯示「展覽籌備中」的提示頁面</li>
                    <li>• 後台管理不受此設置影響，始終可通過 /admin 訪問</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 首頁重導向設定 */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>首頁重導向</CardTitle>
              <CardDescription>
                設定首頁自動跳轉到外部展覽官網。啟用後，訪客進入首頁將直接被重導向到指定的 URL。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="redirect-switch" className="text-base font-semibold cursor-pointer">
                      啟用重導向
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {redirectEnabled
                        ? '首頁將自動跳轉到下方設定的網址'
                        : '首頁顯示正常展覽內容'}
                    </p>
                  </div>
                  <Switch
                    id="redirect-switch"
                    checked={redirectEnabled}
                    onCheckedChange={setRedirectEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redirect-url">目標網址</Label>
                  <Input
                    id="redirect-url"
                    type="url"
                    placeholder="https://2025.example.com"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    每年展覽的官方網站網址，例如：https://2025.gradexhibit.tech
                  </p>
                </div>

                <Button
                  onClick={async () => {
                    if (redirectEnabled && redirectUrl) {
                      try {
                        new URL(redirectUrl)
                      } catch {
                        toast({
                          title: '網址格式錯誤',
                          description: '請輸入有效的網址（包含 https://）',
                          variant: 'destructive',
                        })
                        return
                      }
                    }

                    setSavingRedirect(true)
                    try {
                      await apiClient.put('/system-settings/homepage_redirect_url', {
                        url: redirectUrl,
                        enabled: redirectEnabled,
                      })
                      toast({
                        title: '設置已更新',
                        description: redirectEnabled
                          ? `首頁將重導向到 ${redirectUrl}`
                          : '首頁重導向已停用',
                      })
                    } catch (error: any) {
                      toast({
                        title: '更新失敗',
                        description: error.message || '操作失敗，請稍後再試',
                        variant: 'destructive',
                      })
                    } finally {
                      setSavingRedirect(false)
                    }
                  }}
                  disabled={savingRedirect}
                >
                  {savingRedirect ? '儲存中...' : '儲存設定'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
