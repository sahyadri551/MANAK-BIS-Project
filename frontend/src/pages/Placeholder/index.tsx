import { useParams } from 'react-router-dom'
import { Construction } from 'lucide-react'
import { EmptyState } from '../../components/common/EmptyState'

const TITLES: Record<string, string> = {
  browse: 'Browse by Domain',
  comparison: 'Standard Comparison',
  compliance: 'Compliance Check',
  analytics: 'Analytics',
  data: 'Data & Catalog Status',
  settings: 'Settings',
  help: 'Help & Support',
}

export default function Placeholder() {
  const { key } = useParams()
  const title = TITLES[key ?? ''] ?? 'Coming soon'
  return (
    <div data-testid={`placeholder-${key}`}>
      <EmptyState
        icon={Construction}
        title={title}
        description="This module is part of a later phase. The core recommendation engine is fully functional today."
      />
    </div>
  )
}
