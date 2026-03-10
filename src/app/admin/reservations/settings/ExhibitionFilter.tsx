'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Exhibition {
  id: string
  name: string
  year: number
}

interface ExhibitionFilterProps {
  exhibitions: Exhibition[]
  currentExhibitionId?: string
}

export default function ExhibitionFilter({
  exhibitions,
  currentExhibitionId,
}: ExhibitionFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('exhibitionId', e.target.value)
    } else {
      params.delete('exhibitionId')
    }
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center space-x-4">
        <label className="text-sm text-gray-600">展覽篩選：</label>
        <select
          name="exhibitionId"
          defaultValue={currentExhibitionId || ''}
          className="border rounded-lg px-3 py-2 text-sm"
          onChange={handleChange}
        >
          <option value="">全部展覽</option>
          {exhibitions.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} ({ex.year})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
