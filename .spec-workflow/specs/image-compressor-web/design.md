# 图片压缩 Web 应用 — 设计规范（Design）

版本：v1.0（规范阶段：Design）
规范名：image-compressor-web
关联：requirements.md（已批准）
文档状态：待评审

## 1. 总体架构概览

- 架构目标：纯前端本地处理、极简部署、性能优先、隐私友好。
- 技术选型：
  - 前端框架：React + TypeScript + Vite（体积可控、生态成熟）。
  - 样式与主题：Tailwind CSS + CSS 变量（浅/深主题），Reduced Motion 兼容。
  - 动画：Motion One（基于 WAAPI，体积小，性能好）。
  - 压缩与图像处理：
    - 首选 WebCodecs（可用时）进行编码；
    - 回退到 Canvas.toBlob 或 WASM 编解码（mozjpeg、oxipng、libwebp/libavif）。
  - 并发与隔离：Web Worker 池 + OffscreenCanvas（可用时）。
  - 打包与下载：JSZip（打包 ZIP），`a[download]`/File System Access API（可用时）。
- 部署：构建产物为纯静态文件，可托管于 GitHub Pages/Netlify/Vercel/任意静态服务器。

组件分层：
- UI 层（App Shell + 视图 + 组件）
- 状态层（Zustand/轻量 Redux）：全局状态与持久化
- 处理层（Worker 池：解码/裁剪/缩放/水印/编码流水线）
- 服务层（估算器、打包器、下载器、日志与错误处理）

## 2. 关键用户流程与页面结构

页面结构
- 顶部栏：Logo、全局压缩强度滑杆、主题切换、开始压缩按钮。
- 主区域：
  - 空态：拖拽/点击上传区（插画 + 指引文案 + 高级动效）。
  - 列表：卡片式文件项（缩略图、原/估算/实际大小、节省%、单项强度滑杆、预览、删除）。
- 底部工具条：清空、下载所选、全部下载（ZIP）、进度概览。
- 侧栏/弹窗：
  - 尺寸与比例（全局/单项）：预设比例、目标尺寸、适配模式（Contain/Cover）、禁止放大。
  - 裁剪与取景：交互层（网格、缩放拖拽、锚点）。
  - 水印：开关、模式（图片/文字）、角度/间距/缩放/边距/透明度、预设模板、全局/单项应用。

关键流程（简要）
1) 批量上传 → 解析元数据 → 展示队列。
2) 设置全局强度/尺寸/水印（可单项覆盖）。
3) 开始压缩 → 进入队列 → Worker 池并发处理 → 实时进度与估算/实际大小更新。
4) 预览单项前后对比（可调强度/裁剪/水印）。
5) 单张下载或批量 ZIP 下载。

## 3. 数据模型（TypeScript）

```ts
export type ImageId = string;

export interface RatioPreset { label: string; w: number; h: number; }

export type FitMode = 'contain' | 'cover';

export interface SizeSettings {
  enabled: boolean;              // 是否启用尺寸/比例调整
  targetWidth?: number;          // 目标宽度（像素）
  targetHeight?: number;         // 目标高度（像素）
  ratio?: { w: number; h: number }; // 目标比例（可与尺寸联动）
  fit: FitMode;                  // contain/cover
  preventUpscale: boolean;       // 禁止放大
}

export interface CropSettings {
  anchor: 'center'|'top'|'bottom'|'left'|'right'|'tl'|'tr'|'bl'|'br';
  // 归一化取景框（0-1，cover 时生效），可与缩放配合
  x: number; y: number; scale: number; 
}

export interface WatermarkImage { src: string; width?: number; height?: number; }

export interface WatermarkText { text: string; fontFamily?: string; fontWeight?: number; fontSize?: number; color?: string; }

export type WatermarkMode = 'off' | 'image' | 'text';

export interface WatermarkSettings {
  mode: WatermarkMode;
  image?: WatermarkImage;
  text?: WatermarkText;
  angle: number;     // 斜向角度（°），默认 30/45
  spacing: number;   // 平铺间距（像素，图案坐标系）
  scale: number;     // 水印缩放系数
  margin: number;    // 四周边距
  opacity: number;   // 0-1 低透明（默认 ~0.12-0.18）
  applyScope: 'global' | 'override';
}

export interface EncodeSettings {
  format: 'jpeg' | 'png' | 'webp'; // v1 默认保持原格式，PNG 可选择性转 WEBP（可选）
  intensity: number; // 0-100（用户视角：越大压得越狠）
  quality: number;   // 10-95（由 intensity 映射）
}

export interface ImageItemMeta {
  id: ImageId; name: string; type: string; size: number; width: number; height: number;
}

export type ItemStatus = 'queued'|'processing'|'done'|'error'|'canceled';

export interface ImageItemState {
  meta: ImageItemMeta;
  status: ItemStatus;
  progress: number; // 0-100
  error?: string;
  estimate?: { outSize?: number; ratio?: number }; // 估算结果
  result?: { blob: Blob; size: number; url: string; name: string };
  // 个性化设置（不填则沿用全局）
  override?: {
    encode?: Partial<EncodeSettings>;
    size?: Partial<SizeSettings>;
    crop?: Partial<CropSettings>;
    watermark?: Partial<WatermarkSettings>;
  };
}

export interface GlobalSettings {
  encode: EncodeSettings;
  size: SizeSettings;
  crop: CropSettings; // 作为默认锚点/缩放
  watermark: WatermarkSettings;
  concurrency: number; // 2-4 自适应
}
```

## 4. 压缩强度映射与估算

强度→质量映射（默认 JPEG/WebP）：
- intensity 0% → quality ≈ 95
- intensity 50% → quality ≈ 70
- intensity 100% → quality ≈ 30
- 采用分段线性曲线，低强度保真度更高，高强度压缩更明显：
  - q = round(95 - 0.65 * intensity)（可调；限制在 30-95）

体积估算：
- 基于格式与质量的经验系数 + 分辨率面积缩放：
  - estSize = baseCoeff(format, q) × (targetPixels / srcPixels) × srcSize
  - baseCoeff 可由少量样本（首次会话 3 张）快速试压得到缓存，后续复用。
- UI 在滑杆移动时展示“压缩前/预计压缩后/预计节省%”，完成后以实际结果覆盖并显示偏差。

## 5. 处理流水线与并发

流水线顺序（每项）：
1) 解码：File → ArrayBuffer → createImageBitmap（或 HTMLImageElement）
2) 尺寸/比例：根据 SizeSettings 计算目标尺寸与 fit；
3) 裁剪（Cover 时）：按 CropSettings 生成目标内容区域；
4) 重采样：OffscreenCanvas/Canvas 高质量缩放（prefer WebCodecs Resize，回退 canvas drawImage + 高质量插值）；
5) 水印：将离屏 pattern（图片/文字）按 angle/spacing/scale/opacity 平铺叠加；
6) 编码：WebCodecs Encoder（优先）或 Canvas.toBlob/ WASM 编码；
7) 结果：生成 Blob、URL、更新大小与节省比；释放中间资源；

并发策略：
- workerPoolSize = clamp(2, navigator.hardwareConcurrency - 2, 4)
- 任务队列：并发执行 N 个，完成即取下一个；
- 背压与内存：对超大图（>24MP）降级并发至 1-2；过程性对象及时释放（`revokeObjectURL`、bitmap.close、canvas = null）。

取消/重试：
- 每个任务可 AbortController 取消；失败项可降低强度/调整参数后重试。

## 6. Worker 架构与消息协议

- 主线程：队列调度、UI/状态、预估计算、下载与打包。
- Worker：处理单张的图像流水线（解码→尺寸/裁剪→水印→编码）。
- 消息协议（简化）：
```ts
// 主线程 → worker
{ type: 'process', id, meta, settings: { encode, size, crop, watermark } }
// worker → 主线程（进度）
{ type: 'progress', id, progress }
// worker → 主线程（完成）
{ type: 'done', id, result: { blobSize, url, name } }
// worker → 主线程（错误）
{ type: 'error', id, message }
```

- 资源传递：使用 Transferable（ArrayBuffer、ImageBitmap）减少拷贝。

## 7. 尺寸/比例与裁剪实现细节（不变形）

尺寸与比例：
- contain：以目标盒的短边为基准等比缩放，可能留边；
- cover：以目标盒的长边为基准等比缩放，填满区域，按裁剪框输出；
- preventUpscale：若开启且原图小于目标，则以原图尺寸为上限。

裁剪与取景：
- 交互预览使用缩略画布（工作画布），取景框支持拖拽/滚轮缩放；
- 取景数据归一化（x/y/scale 0-1），导出时在离屏画布上按目标尺寸精确计算；
- 对齐锚点提供便捷定位；键盘微调提升可访问性。

## 8. 水印实现细节（图片/文字，斜向平铺）

- 模式：off/image/text；
- 离屏画布生成 tile：
  - 图片水印：载入透明 PNG，按缩放绘制到 tile；
  - 文字水印：`fillText`/`Path2D` 渲染文本，抗锯齿，基线/对齐居中；
- 平铺：将 tile 旋转 angle 后生成 pattern（或先绘制到更大的中间画布再旋转），沿 x/y 间距平铺覆盖；
- 透明度：`globalAlpha = opacity`；
- 合成模式：优先 overlay/multiply（浏览器支持时），否则 source-over；
- 顺序：先裁剪/缩放得到目标尺寸，再叠加水印，最后编码；
- 全局/单张：全局设置默认应用，单张 override 可覆盖或关闭。

## 9. UI/交互与动画

- 现代简约：卡片、柔和阴影、合理留白、系统色彩变量。
- 动画：
  - 列表项进入/离开：spring 弹性；
  - 进度条：平滑缓动与颜色过渡；
  - 按钮：悬停微动、按压缩放、完成勾选；
  - Reduced Motion：禁用大位移动画，仅保留渐隐/渐现。
- 对比预览：分割滑块（range）或并排切换（toggle）。
- 可访问性：键盘遍历卡片、滑杆 aria-valuetext、对话框 focus-trap、颜色对比达 AA。

## 10. 下载与打包

- 单张：直接生成 `{原名}-compressed.{ext}` 并触发下载；
- 批量：JSZip 添加完成项，名称 `compressed-{YYYYMMDD-HHmm}.zip`；
- 选择性下载：仅将选中项加入 ZIP；
- 进度：显示 ZIP 打包进度（估算基于 Blob.size 与写入量）。

## 11. 错误处理与日志

- 分类：格式不支持、解码失败、内存不足、编码失败、取消操作；
- 提示：提供解决建议（降低强度/尺寸、分批处理）；
- 日志：仅记录错误类型与堆栈，不包含文件内容或元数据；
- 失败不阻塞：已完成项可正常下载，失败项可单独重试。

## 12. 性能与内存策略

- 包体预算：首屏 ≤ 250KB gzip（不含 WASM），编解码器按需懒加载；
- 并发限制：2-4 自适应；超大图自动降低并发；
- 资源释放：用后即焚（revokeObjectURL、bitmap.close、释放 canvas 与 buffer）；
- 预览缩略：交互使用缩略画布，导出使用高精离屏渲染；
- 估算缓存：首次会话采样 3 张生成 baseCoeff，写入 sessionStorage。

## 13. 兼容性与回退

- 目标：Chrome/Edge/Firefox/Safari 最近两个大版本；
- WebCodecs/OffscreenCanvas 不可用时：回退至 Canvas + toBlob；
- iOS 低内存设备：提示“降低并发/限制尺寸”，必要时分批处理。

## 14. 安全与隐私

- 仅本地处理，不上传任何图片数据；
- CSP 建议：`default-src 'self'; img-src 'self' blob: data:; worker-src 'self' blob:;`；
- 错误日志不包含图片内容与元数据。

## 15. 主题与样式

- CSS 变量：颜色、阴影、圆角、动效时序；
- 浅/深主题切换：存储在 localStorage；
- 焦点可见：自定义 focus ring，保证对比度。

## 16. 配置与持久化

- localStorage：全局强度、主题、最近水印参数、尺寸/裁剪偏好；
- sessionStorage：估算缓存。

## 17. 开发与构建

- Vite + React + TS；
- Lint/Format：ESLint + Prettier；
- 命令：`make dev`、`make build`、`make test`、`make lint`（与项目规范对齐）。

## 18. 可测试性与指标

- 单元：估算函数、强度映射、尺寸计算、裁剪坐标、worker 消息协议；
- 端到端（可选）：上传→压缩→下载流程；
- 指标：完成率、平均节省%、失败率、处理时长（不采集文件内容）。

## 19. 里程碑拆分（实现建议）

- M0：上传/列表/强度滑杆/并发压缩/单张+ZIP 下载/基础进度与错误处理/简约样式。
- M1：尺寸与比例（contain/cover、禁止放大）、裁剪取景、对比预览、A11y、主题/偏好、自适应并发。
- M2：水印（图片/文字、斜向平铺与参数化）、动画细节优化、PWA（可选）、格式转换（可选）。

## 20. 开放问题与权衡

- PNG 压缩：toBlob 的 PNG 可能不小，需接入 oxipng/UPNG（WASM 体积与性能权衡）。
- WebCodecs 可用性：Safari 覆盖有限，需稳健回退策略。
- 估算准确度：不同图片内容差异较大，需迭代经验系数与采样策略。

—— 本文档为设计规范（Design），通过审批后将进入任务（Tasks）阶段。
