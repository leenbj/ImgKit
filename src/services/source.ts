const sourceMap = new Map<string, File>()

export function addSource(id: string, file: File) {
  sourceMap.set(id, file)
}

export function addSources(entries: Array<{ id: string; file: File }>) {
  for (const e of entries) sourceMap.set(e.id, e.file)
}

export function getSource(id: string): File | undefined {
  return sourceMap.get(id)
}

export function removeSource(id: string) {
  sourceMap.delete(id)
}

export function clearSources() {
  sourceMap.clear()
}

