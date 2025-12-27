import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError, apiClient } from '@/lib/api-client'

describe('ApiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('ApiError', () => {
    it('should create an ApiError with correct properties', () => {
      const error = new ApiError('Test error', 400, { field: 'test' })

      expect(error.message).toBe('Test error')
      expect(error.status).toBe(400)
      expect(error.details).toEqual({ field: 'test' })
      expect(error.name).toBe('ApiError')
    })

    it('should be an instance of Error', () => {
      const error = new ApiError('Test error', 500)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('GET requests', () => {
    it('should make a successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' }
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: mockData }),
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response)

      const result = await apiClient.get('/test')

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockData)
    })

    it('should throw ApiError on failed response', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ success: false, error: 'Not found' }),
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response)

      await expect(apiClient.get('/notfound')).rejects.toThrow(ApiError)
      await expect(apiClient.get('/notfound')).rejects.toMatchObject({
        message: 'Not found',
        status: 404,
      })
    })
  })

  describe('POST requests', () => {
    it('should make a successful POST request with body', async () => {
      const mockData = { id: 1, name: 'Created' }
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: mockData }),
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response)

      const result = await apiClient.post('/create', { name: 'New Item' })

      expect(global.fetch).toHaveBeenCalledWith('/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'New Item' }),
      })
      expect(result).toEqual(mockData)
    })

    it('should handle POST without body', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: {} }),
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response)

      await apiClient.post('/empty')

      expect(global.fetch).toHaveBeenCalledWith('/api/empty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      })
    })
  })

  describe('PUT requests', () => {
    it('should make a successful PUT request', async () => {
      const mockData = { id: 1, name: 'Updated' }
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: mockData }),
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response)

      const result = await apiClient.put('/update/1', { name: 'Updated' })

      expect(global.fetch).toHaveBeenCalledWith('/api/update/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated' }),
      })
      expect(result).toEqual(mockData)
    })
  })

  describe('PATCH requests', () => {
    it('should make a successful PATCH request', async () => {
      const mockData = { id: 1, name: 'Patched' }
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: mockData }),
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response)

      const result = await apiClient.patch('/patch/1', { name: 'Patched' })

      expect(global.fetch).toHaveBeenCalledWith('/api/patch/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Patched' }),
      })
      expect(result).toEqual(mockData)
    })
  })

  describe('DELETE requests', () => {
    it('should make a successful DELETE request', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: { deleted: true } }),
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response)

      const result = await apiClient.delete('/delete/1')

      expect(global.fetch).toHaveBeenCalledWith('/api/delete/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual({ deleted: true })
    })
  })

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new TypeError('Failed to fetch')
      vi.mocked(global.fetch).mockRejectedValue(networkError)

      await expect(apiClient.get('/test')).rejects.toThrow(ApiError)
      await expect(apiClient.get('/test')).rejects.toMatchObject({
        message: '網絡連接失敗，請檢查您的網絡',
        status: 0,
      })
    })

    it('should handle unknown errors', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Unknown error'))

      await expect(apiClient.get('/test')).rejects.toThrow(ApiError)
      await expect(apiClient.get('/test')).rejects.toMatchObject({
        message: 'Unknown error',
        status: 500,
      })
    })

    it('should include error details when available', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: 'Validation failed',
          details: [{ field: 'email', message: 'Invalid email' }],
        }),
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response)

      try {
        await apiClient.post('/validate', { email: 'invalid' })
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).details).toEqual([
          { field: 'email', message: 'Invalid email' },
        ])
      }
    })
  })
})
