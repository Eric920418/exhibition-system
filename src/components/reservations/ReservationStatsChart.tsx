'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DailyData {
  date: string
  count: number
}

interface StatusData {
  status: string
  count: number
}

interface HourlyData {
  hour: number
  count: number
}

interface DailyChartProps {
  data: DailyData[]
}

interface StatusChartProps {
  data: StatusData[]
}

interface HourlyChartProps {
  data: HourlyData[]
}

const STATUS_COLORS: Record<string, string> = {
  WAITING: '#3b82f6',
  CALLED: '#f59e0b',
  IN_PROGRESS: '#8b5cf6',
  COMPLETED: '#22c55e',
  CANCELLED: '#6b7280',
  NO_SHOW: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  WAITING: '等待中',
  CALLED: '已叫號',
  IN_PROGRESS: '服務中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  NO_SHOW: '未到場',
}

export function DailyReservationsChart({ data }: DailyChartProps) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD format
    預約數: d.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>每日預約趨勢</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="預約數"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function StatusDistributionChart({ data }: StatusChartProps) {
  const chartData = data.map((d) => ({
    name: STATUS_LABELS[d.status] || d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] || '#6b7280',
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>狀態分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                (percent ?? 0) > 0.05 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ''
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [value ?? 0, '數量']}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function HourlyDistributionChart({ data }: HourlyChartProps) {
  const chartData = data.map((d) => ({
    hour: `${d.hour.toString().padStart(2, '0')}時`,
    預約數: d.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>時段分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="預約數" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface TeamStatsChartProps {
  data: {
    teamId: string
    teamName: string
    total: number
    completed: number
  }[]
}

export function TeamComparisonChart({ data }: TeamStatsChartProps) {
  const chartData = data.map((d) => ({
    name: d.teamName.length > 8 ? d.teamName.slice(0, 8) + '...' : d.teamName,
    總數: d.total,
    完成: d.completed,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>組別比較</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="總數" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="完成" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
