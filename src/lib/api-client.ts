import type { ApiResponse } from './api-response'

/**
 * API 客戶端配置
 */
export interface ApiClientConfig extends RequestInit {
  baseUrl?: string
}

/**
 * API 錯誤類
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 統一的 API 客戶端
 */
class ApiClient {
  private baseUrl: string

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl
  }

  /**
   * 發送請求
   */
  private async request<T>(
    endpoint: string,
    config: ApiClientConfig = {}
  ): Promise<T> {
    const { baseUrl = this.baseUrl, ...init } = config

    const url = `${baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      })

      const data: ApiResponse<T> = await response.json()

      // 檢查響應是否成功
      if (!response.ok || !data.success) {
        throw new ApiError(
          data.success === false ? data.error : '請求失敗',
          response.status,
          'details' in data ? data.details : undefined
        )
      }

      return data.data
    } catch (error) {
      // 處理網絡錯誤
      if (error instanceof ApiError) {
        throw error
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError('網絡連接失敗，請檢查您的網絡', 0)
      }

      throw new ApiError(
        error instanceof Error ? error.message : '未知錯誤',
        500
      )
    }
  }

  /**
   * GET 請求
   */
  async get<T>(endpoint: string, config?: ApiClientConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
    })
  }

  /**
   * POST 請求
   */
  async post<T>(
    endpoint: string,
    body?: any,
    config?: ApiClientConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PUT 請求
   */
  async put<T>(
    endpoint: string,
    body?: any,
    config?: ApiClientConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PATCH 請求
   */
  async patch<T>(
    endpoint: string,
    body?: any,
    config?: ApiClientConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * DELETE 請求
   */
  async delete<T>(endpoint: string, config?: ApiClientConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    })
  }
}

// 導出單例
export const apiClient = new ApiClient()
