// 预留：按需懒加载 WASM 编码器（mozjpeg/oxipng/libwebp 等）
export async function loadMozJpeg() {
  // return (await import('mozjpeg-wasm')).default
  throw new Error('未集成 WASM 编码器（占位）')
}

