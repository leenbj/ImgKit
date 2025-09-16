import { useCallback } from 'react'
import { useAppStore } from '../../state/store'
import type { ImageItemMeta } from '../../state/types'
import { getImageDimensions, isSupportedType } from '../../utils/imageMeta'
import { addSources } from '@/services/source'
import { processAllQueued } from '@/services/process'

export interface PickerOptions {
  maxFiles?: number
}

export function useFilePicker(opts: PickerOptions = {}) {
  const addFiles = useAppStore((s) => s.addFiles)
  const maxFiles = opts.maxFiles ?? 200

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files)
    const limited = list.slice(0, maxFiles)

    const metas: ImageItemMeta[] = []
    const sources: Array<{ id: string; file: File }> = []
    for (let i = 0; i < limited.length; i++) {
      const f = limited[i]
      if (!isSupportedType(f.type)) continue
      try {
        const { width, height } = await getImageDimensions(f)
        const id = `${Date.now()}_${i}_${f.name}`
        metas.push({ id, name: f.name, type: f.type, size: f.size, width, height })
        sources.push({ id, file: f })
      } catch {
        // ignore decode errors; could add a toast in UI
      }
    }
    if (metas.length) {
      addFiles(metas)
      addSources(sources)
      try { processAllQueued() } catch {}
    }
  }, [addFiles, maxFiles])

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length) void handleFiles(files)
    // reset value to allow re-selecting same files
    e.currentTarget.value = ''
  }, [handleFiles])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  return { onInputChange, onDrop, onDragOver, handleFiles }
}
