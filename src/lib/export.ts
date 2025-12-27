/**
 * 通用數據匯出工具
 * 支援 CSV、JSON、Excel (XLSX) 格式
 */

export type ExportFormat = 'csv' | 'json' | 'xlsx'

export interface ExportColumn<T> {
  key: keyof T | string
  header: string
  // 自訂格式化函數
  formatter?: (value: unknown, row: T) => string | number | null
}

export interface ExportOptions<T> {
  filename: string
  format: ExportFormat
  columns: ExportColumn<T>[]
  data: T[]
  // 用於 Excel 的工作表名稱
  sheetName?: string
}

/**
 * 從嵌套物件中獲取值
 * 支援 'team.exhibition.name' 這樣的路徑
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current === null || current === undefined) {
      return null
    }
    current = (current as Record<string, unknown>)[key]
  }

  return current
}

/**
 * 格式化日期為 ISO 字符串
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

/**
 * 格式化日期時間為台灣時區
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Taipei',
  })
}

/**
 * 遮罩敏感資料（如電話號碼）
 */
export function maskSensitive(value: string, keepStart = 4, keepEnd = 2): string {
  if (!value || value.length < keepStart + keepEnd) return value
  return value.slice(0, keepStart) + '****' + value.slice(-keepEnd)
}

/**
 * 將數據轉換為 CSV 字符串
 */
function toCSV<T>(data: T[], columns: ExportColumn<T>[]): string {
  // CSV 標題行
  const headers = columns.map((col) => col.header)

  // 數據行
  const rows = data.map((row) =>
    columns.map((col) => {
      let value: unknown

      if (col.formatter) {
        value = col.formatter(getNestedValue(row, col.key as string), row)
      } else {
        value = getNestedValue(row, col.key as string)
      }

      // 處理 null/undefined
      if (value === null || value === undefined) {
        return ''
      }

      // 轉換為字符串
      const str = String(value)

      // 如果包含逗號、引號或換行，需要用引號包裹
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }

      return str
    })
  )

  return [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')
}

/**
 * 將數據轉換為 JSON 字符串
 */
function toJSON<T>(data: T[], columns: ExportColumn<T>[]): string {
  const result = data.map((row) => {
    const obj: Record<string, unknown> = {}

    for (const col of columns) {
      let value: unknown

      if (col.formatter) {
        value = col.formatter(getNestedValue(row, col.key as string), row)
      } else {
        value = getNestedValue(row, col.key as string)
      }

      obj[col.header] = value
    }

    return obj
  })

  return JSON.stringify(result, null, 2)
}

/**
 * 將數據轉換為 Excel XML 格式
 * 使用 XML Spreadsheet 2003 格式，無需額外依賴
 */
function toExcelXML<T>(
  data: T[],
  columns: ExportColumn<T>[],
  sheetName = 'Sheet1'
): string {
  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const rows = data.map((row) =>
    columns.map((col) => {
      let value: unknown

      if (col.formatter) {
        value = col.formatter(getNestedValue(row, col.key as string), row)
      } else {
        value = getNestedValue(row, col.key as string)
      }

      return value
    })
  )

  const headerRow = columns
    .map(
      (col) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(col.header)}</Data></Cell>`
    )
    .join('')

  const dataRows = rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          if (cell === null || cell === undefined) {
            return '<Cell><Data ss:Type="String"></Data></Cell>'
          }

          const type = typeof cell === 'number' ? 'Number' : 'String'
          const value = escapeXML(String(cell))

          return `<Cell><Data ss:Type="${type}">${value}</Data></Cell>`
        })
        .join('')

      return `<Row>${cells}</Row>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXML(sheetName)}">
    <Table>
      <Row>${headerRow}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`
}

/**
 * 創建匯出響應
 */
export function createExportResponse<T>(options: ExportOptions<T>): Response {
  const { filename, format, columns, data, sheetName } = options

  let content: string
  let contentType: string
  let extension: string

  switch (format) {
    case 'csv':
      content = '\uFEFF' + toCSV(data, columns) // BOM for Excel Chinese support
      contentType = 'text/csv; charset=utf-8'
      extension = 'csv'
      break

    case 'json':
      content = toJSON(data, columns)
      contentType = 'application/json; charset=utf-8'
      extension = 'json'
      break

    case 'xlsx':
      content = toExcelXML(data, columns, sheetName || filename)
      contentType = 'application/vnd.ms-excel; charset=utf-8'
      extension = 'xls' // XML Spreadsheet uses .xls extension
      break

    default:
      throw new Error(`不支援的匯出格式: ${format}`)
  }

  return new Response(content, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}.${extension}"`,
    },
  })
}

/**
 * 驗證匯出格式
 */
export function validateExportFormat(format: string | null): ExportFormat {
  const validFormats: ExportFormat[] = ['csv', 'json', 'xlsx']

  if (!format || !validFormats.includes(format as ExportFormat)) {
    return 'csv' // 預設 CSV
  }

  return format as ExportFormat
}

/**
 * 狀態標籤映射
 */
export const STATUS_LABELS: Record<string, string> = {
  // Exhibition Status
  DRAFT: '草稿',
  PUBLISHED: '已發布',
  ARCHIVED: '已歸檔',
  // Reservation Status
  WAITING: '等待中',
  CALLED: '已叫號',
  IN_PROGRESS: '服務中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  NO_SHOW: '未到場',
  // User Role
  SUPER_ADMIN: '超級管理員',
  CURATOR: '策展人',
  TEAM_LEADER: '組長',
  // Sponsor Tier
  PLATINUM: '白金贊助',
  GOLD: '金級贊助',
  SILVER: '銀級贊助',
  BRONZE: '銅級贊助',
  PARTNER: '合作夥伴',
}

/**
 * 格式化狀態標籤
 */
export function formatStatus(status: string | null | undefined): string {
  if (!status) return ''
  return STATUS_LABELS[status] || status
}

/**
 * 格式化布林值
 */
export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  return value ? '是' : '否'
}
