import { useAppStore } from '@/state/store'
import ItemCard from './ItemCard'
import Toolbar from './Toolbar'

export default function FileList() {
  const queue = useAppStore((s) => s.queue)
  if (!queue.length) return null

  return (
    <div className="space-y-3">
      <Toolbar />
      {queue.map((it) => (
        <ItemCard key={it.meta.id} item={it} />
      ))}
    </div>
  )
}
