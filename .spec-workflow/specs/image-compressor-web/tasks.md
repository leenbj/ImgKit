# 图片压缩 Web 应用 — 任务清单（Tasks）

版本：v1.0  规范名：image-compressor-web
（已刷新任务清单以同步最新 Requirements/Design 改动：2025-09-15）
最后同步时间：2025-09-15 17:40
状态标记：待办 [ ] ｜ 进行中 [-] ｜ 已完成 [x]

请严格按顺序执行任务；开始某任务前先将该任务标记为 [-]，完成后标记为 [x]。

1.0 项目与基础设施（M0 部分）
  - [x] 1.1 项目脚手架与工具链（原 任务01）
    - 用时：5 分钟
    - 范围：Vite + React + TypeScript 初始化；Tailwind CSS；ESLint/Prettier；Makefile 与 scripts/；基础目录 src/ tests/ assets/。
    - 产出文件：`package.json`、`vite.config.ts`、`index.html`、`src/main.tsx`、`src/App.tsx`、`src/styles/tailwind.css`、`tailwind.config.ts`、`Makefile`、`scripts/dev.sh`、`scripts/build.sh`、`scripts/test.sh`。
    - 需求映射：NFR-01/04/15。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 初始化 Vite(React+TS) 项目，接入 Tailwind 与 ESLint/Prettier，创建 Makefile 与 scripts；搭建 src/ 与 tests/ 基础结构。Restrictions: 不引入体积过大的 UI 框架；遵循仓库 AGENTS.md。_Leverage: Vite 模板、Tailwind 文档。_Requirements: NFR-01/04。Success: `make dev` 可启动，`make build` 可产出静态文件，`make lint/test` 正常。

  - [x] 1.2 应用壳与主题/动效基建（原 任务02）
    - 用时：15 分钟
    - 范围：顶栏/主区/底栏布局；浅/深主题；Reduced Motion 兼容；Motion One 注册基础动效。
    - 产出文件：`src/app/AppShell.tsx`、`src/app/theme.ts`、`src/app/motion.ts`、`src/styles/theme.css`。
    - 需求映射：NFR-07、UI 原则。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现应用壳与主题切换、基础动效（进入/离开、按钮微动），遵循 Reduced Motion。Restrictions: 动效不过度；保持简约。_Leverage: Motion One、CSS 变量。_Requirements: NFR-07。Success: 主题可切换、动效流畅。

  - [x] 1.3 数据模型与全局状态（原 任务03）
    - 用时：12 分钟
    - 范围：按设计文档的 TS 接口定义数据模型；使用 Zustand 建立全局状态（GlobalSettings、队列、进度、错误）。
    - 产出文件：`src/state/types.ts`、`src/state/store.ts`。
    - 需求映射：FR-02/03/04/08、NFR-03。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 定义 TS 类型与 Zustand 全局状态，支持全局与单项覆盖。Restrictions: 不与 UI 强绑定；保持解耦。_Leverage: 设计文档“数据模型”。_Requirements: FR-02/03/04/08。Success: store 可被组件读写，含并发/设置字段。

  - [x] 1.4 上传与元数据解析（原 任务04）
    - 用时：14 分钟
    - 范围：拖拽/点击上传；格式校验（JPEG/PNG/WebP）；数量上限；解析文件名、大小、分辨率。
    - 产出文件：`src/features/upload/UploadZone.tsx`、`src/features/upload/useFilePicker.ts`、`src/utils/imageMeta.ts`。
    - 需求映射：FR-01/02。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现批量上传与元数据解析，超限与不支持格式给出提示。Restrictions: 不读取文件内容用于日志。_Leverage: createImageBitmap、URL.createObjectURL。_Requirements: FR-01/02。Success: 批量添加到队列并显示元数据。

2.0 核心处理与编码（M0/M1/M2 交叉）
  - [x] 2.1 压缩强度映射与体积估算（原 任务05）
    - 用时：10 分钟
    - 范围：实现 intensity→quality 曲线与体积估算器（会话采样 baseCoeff）。
    - 产出文件：`src/core/qualityMap.ts`、`src/core/estimator.ts`、单元测试。
    - 需求映射：FR-03、AC-03。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 根据设计实现强度映射与体积估算，在滑杆交互时返回预计值。Restrictions: 估算不阻塞 UI。_Leverage: 设计“压缩强度映射与估算”。_Requirements: FR-03。Success: 单测覆盖主要分支，UI 可显示预计大小与节省%。

  - [ ] 2.2 Worker 池与并发（原 任务06）
    - 范围：搭建 Worker 池、队列调度、进度上报、错误通道、取消/重试；消息协议。
    - 产出文件：`src/worker/pool.ts`、`src/worker/types.ts`、`src/worker/processor.worker.ts`（占位）。
    - 需求映射：FR-04/07、NFR-02/03。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 建立可扩展的 Worker 池与消息协议，支持并发与背压。Restrictions: 避免内存泄漏，及时释放。_Leverage: Transferable。_Requirements: FR-04/07、NFR-02/03。Success: 多任务并发跑通，支持取消与错误上报。

  - [ ] 2.3 尺寸/比例与裁剪（原 任务07）
    - 范围：contain/cover、禁止放大、归一化裁剪参数计算；离屏高质量重采样。
    - 产出文件：`src/core/resize.ts`、`src/core/crop.ts`、单元测试；Worker 中调用。
    - 需求映射：FR-11/12/13、AC-11/12、NFR-08。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现等比缩放与裁剪计算，并在离屏画布进行高质量重采样。Restrictions: 禁止非等比拉伸。_Leverage: OffscreenCanvas/Canvas。_Requirements: FR-11/12/13。Success: 单测验证尺寸/裁剪计算正确。

  - [ ] 2.4 水印引擎（图片/文字，斜向平铺）（原 任务08）
    - 范围：图片/文字 tile 生成、角度/间距/缩放/边距/透明度参数、pattern 平铺、合成顺序。
    - 产出文件：`src/core/watermark.ts`、单元测试；Worker 中调用。
    - 需求映射：FR-14、AC-13、NFR-09。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现水印 pattern 生成与平铺合成，默认低透明且“若隐约现”。Restrictions: 不引入大型图像库。_Leverage: Canvas 2D、globalAlpha、合成模式回退。_Requirements: FR-14。Success: 单测覆盖角度/间距等参数逻辑。

  - [ ] 2.5 编码器与回退（WebCodecs/Canvas/WASM）（原 任务09）
    - 范围：优先 WebCodecs，回退 Canvas.toBlob；可插拔接入 mozjpeg/oxipng/libwebp（懒加载）。
    - 产出文件：`src/core/encode.ts`、`src/core/encoders/*`。
    - 需求映射：FR-04、NFR-04/05。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 封装统一编码接口与检测，按可用性回退。Restrictions: 仅在必要时引入 WASM，懒加载。_Leverage: WebCodecs、toBlob。_Requirements: NFR-04/05。Success: 同一调用在不同浏览器可用。

3.0 前端功能与交互（M0/M1）
  - [ ] 3.1 文件项卡片与列表 UI（原 任务10）
    - 范围：缩略图、原/预计/实际大小与节省%、单项强度滑杆、预览按钮、删除；状态与进度。
    - 产出文件：`src/features/list/ItemCard.tsx`、`src/features/list/FileList.tsx`。
    - 需求映射：FR-02/03/04/05/06、AC-02/03/04/05/06。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现卡片与列表交互，含进度与状态展示。Restrictions: 保持简约现代风格。_Leverage: Motion One 动效。_Requirements: FR-02/03/04/05/06。Success: 列表交互顺畅。

  - [ ] 3.2 前后对比预览组件（原 任务11）
    - 范围：滑杆分割或并排模式；显示强度/质量、尺寸信息；与单项设置联动。
    - 产出文件：`src/features/preview/ComparePreview.tsx`。
    - 需求映射：FR-05、AC-05/11/12/13。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现前后对比预览并与裁剪/水印参数联动刷新。Restrictions: 保持 60FPS。_Leverage: 缩略工作画布。_Requirements: FR-05。Success: 预览流畅清晰。

  - [ ] 3.3 下载服务与 ZIP 打包（原 任务12）
    - 范围：单张下载命名规则；选择项/全部 ZIP；进度展示；File System Access API 增强（可用时）。
    - 产出文件：`src/services/download.ts`、`src/services/zip.ts`。
    - 需求映射：FR-06、AC-06。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现单张/批量下载与进度提示。Restrictions: 命名规则符合规范。_Leverage: JSZip。_Requirements: FR-06。Success: 可选择性下载与 ZIP 命名正确。

  - [ ] 3.4 错误处理、取消与重试（原 任务13）
    - 范围：分类错误提示、失败项可重试、全局/单项取消；不中断已完成项。
    - 产出文件：`src/services/errors.ts`、UI 提示整合。
    - 需求映射：FR-07、AC-07。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 完成错误与取消/重试机制。Restrictions: 提示简洁明确。_Leverage: AbortController。_Requirements: FR-07。Success: 失败不影响其他项，重试可行。

  - [ ] 3.5 可访问性（A11y）与键盘操作（原 任务14）
    - 范围：焦点管理、aria 属性、滑杆键控、对话框 focus-trap、颜色对比 AA。
    - 产出文件：`src/a11y/a11y.ts`、针对组件的 aria 支持。
    - 需求映射：FR-10、AC-10。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 增强 A11y 与键盘导航。Restrictions: 不破坏视觉层级。_Leverage: WAI-ARIA 指南。_Requirements: FR-10。Success: 无鼠标亦可完成主要操作。

4.0 持久化、性能与测试（M1/M2）
  - [ ] 4.1 持久化与偏好（原 任务15）
    - 范围：localStorage（主题、全局强度、水印参数、尺寸/裁剪偏好）、sessionStorage（估算缓存）。
    - 产出文件：`src/services/persist.ts`。
    - 需求映射：FR-08、AC-08。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现偏好持久化与估算缓存。Restrictions: 不持久化文件内容。_Leverage: Storage API。_Requirements: FR-08。Success: 刷新后偏好仍在。

  - [ ] 4.2 性能优化与回退策略（原 任务16）
    - 范围：WASM 懒加载、编码器选择与回退、并发自适应、内存释放策略、自检测。
    - 产出文件：`src/perf/lazy.ts`、`src/perf/detect.ts`、`src/perf/release.ts`。
    - 需求映射：NFR-02/03/04/05/08/09。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 完成性能与回退策略。Restrictions: 控制首屏包体≤250KB gzip（不含 WASM）。_Leverage: navigator.api、Codecs 检测。_Requirements: NFR-02/03/04/05/08/09。Success: 各环境均可用且流畅。

  - [ ] 4.3 测试与验证（原 任务17）
    - 范围：单元测试（质量映射、估算、尺寸/裁剪、水印参数）；轻量 E2E/脚本验证上传→压缩→下载主流程。
    - 产出文件：`tests/unit/*.spec.ts`、`tests/e2e/smoke.spec.ts`。
    - 需求映射：AC-01~AC-13、NFR-02/07/09。
    - _Prompt:
      Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 编写关键单测与冒烟流测试。Restrictions: 不上传真实图片到网络。_Leverage: Vitest/Playwright(可选)。_Requirements: 全部 AC。Success: ≥80% 覆盖，冒烟流程通过。

- [ ] 任务05：压缩强度映射与体积估算
  - 范围：实现 intensity→quality 曲线与体积估算器（会话采样 baseCoeff）。
  - 产出文件：`src/core/qualityMap.ts`、`src/core/estimator.ts`、单元测试。
  - 需求映射：FR-03、AC-03。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 根据设计实现强度映射与体积估算，在滑杆交互时返回预计值。Restrictions: 估算不阻塞 UI。_Leverage: 设计“压缩强度映射与估算”。_Requirements: FR-03。Success: 单测覆盖主要分支，UI 可显示预计大小与节省%。

- [ ] 任务06：Worker 池基础设施与消息协议
  - 范围：搭建 Worker 池、队列调度、进度上报、错误通道、取消/重试；消息协议。
  - 产出文件：`src/worker/pool.ts`、`src/worker/types.ts`、`src/worker/processor.worker.ts`（占位）。
  - 需求映射：FR-04/07、NFR-02/03。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 建立可扩展的 Worker 池与消息协议，支持并发与背压。Restrictions: 避免内存泄漏，及时释放。_Leverage: Transferable。_Requirements: FR-04/07、NFR-02/03。Success: 多任务并发跑通，支持取消与错误上报。

- [ ] 任务07：尺寸/比例与裁剪（不变形）
  - 范围：contain/cover、禁止放大、归一化裁剪参数计算；离屏高质量重采样。
  - 产出文件：`src/core/resize.ts`、`src/core/crop.ts`、单元测试；Worker 中调用。
  - 需求映射：FR-11/12/13、AC-11/12、NFR-08。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现等比缩放与裁剪计算，并在离屏画布进行高质量重采样。Restrictions: 禁止非等比拉伸。_Leverage: OffscreenCanvas/Canvas。_Requirements: FR-11/12/13。Success: 单测验证尺寸/裁剪计算正确。

- [ ] 任务08：水印引擎（图片/文字，斜向平铺）
  - 范围：图片/文字 tile 生成、角度/间距/缩放/边距/透明度参数、pattern 平铺、合成顺序。
  - 产出文件：`src/core/watermark.ts`、单元测试；Worker 中调用。
  - 需求映射：FR-14、AC-13、NFR-09。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现水印 pattern 生成与平铺合成，默认低透明且“若隐约现”。Restrictions: 不引入大型图像库。_Leverage: Canvas 2D、globalAlpha、合成模式回退。_Requirements: FR-14。Success: 单测覆盖角度/间距等参数逻辑。

- [ ] 任务09：编码器与回退（WebCodecs/Canvas/WASM）
  - 范围：优先 WebCodecs，回退 Canvas.toBlob；可插拔接入 mozjpeg/oxipng/libwebp（懒加载）。
  - 产出文件：`src/core/encode.ts`、`src/core/encoders/*`。
  - 需求映射：FR-04、NFR-04/05。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 封装统一编码接口与检测，按可用性回退。Restrictions: 仅在必要时引入 WASM，懒加载。_Leverage: WebCodecs、toBlob。_Requirements: NFR-04/05。Success: 同一调用在不同浏览器可用。

- [ ] 任务10：文件项卡片与列表 UI
  - 范围：缩略图、原/预计/实际大小与节省%、单项强度滑杆、预览按钮、删除；状态与进度。
  - 产出文件：`src/features/list/ItemCard.tsx`、`src/features/list/FileList.tsx`。
  - 需求映射：FR-02/03/04/05/06、AC-02/03/04/05/06。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现卡片与列表交互，含进度与状态展示。Restrictions: 保持简约现代风格。_Leverage: Motion One 动效。_Requirements: FR-02/03/04/05/06。Success: 列表交互顺畅。

- [ ] 任务11：前后对比预览组件
  - 范围：滑杆分割或并排模式；显示强度/质量、尺寸信息；与单项设置联动。
  - 产出文件：`src/features/preview/ComparePreview.tsx`。
  - 需求映射：FR-05、AC-05/11/12/13。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现前后对比预览并与裁剪/水印参数联动刷新。Restrictions: 保持 60FPS。_Leverage: 缩略工作画布。_Requirements: FR-05。Success: 预览流畅清晰。

- [ ] 任务12：下载服务与 ZIP 打包
  - 范围：单张下载命名规则；选择项/全部 ZIP；进度展示；File System Access API 增强（可用时）。
  - 产出文件：`src/services/download.ts`、`src/services/zip.ts`。
  - 需求映射：FR-06、AC-06。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现单张/批量下载与进度提示。Restrictions: 命名规则符合规范。_Leverage: JSZip。_Requirements: FR-06。Success: 可选择性下载与 ZIP 命名正确。

- [ ] 任务13：错误处理、取消与重试
  - 范围：分类错误提示、失败项可重试、全局/单项取消；不中断已完成项。
  - 产出文件：`src/services/errors.ts`、UI 提示整合。
  - 需求映射：FR-07、AC-07。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 完成错误与取消/重试机制。Restrictions: 提示简洁明确。_Leverage: AbortController。_Requirements: FR-07。Success: 失败不影响其他项，重试可行。

- [ ] 任务14：可访问性（A11y）与键盘操作
  - 范围：焦点管理、aria 属性、滑杆键控、对话框 focus-trap、颜色对比 AA。
  - 产出文件：`src/a11y/a11y.ts`、针对组件的 aria 支持。
  - 需求映射：FR-10、AC-10。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 增强 A11y 与键盘导航。Restrictions: 不破坏视觉层级。_Leverage: WAI-ARIA 指南。_Requirements: FR-10。Success: 无鼠标亦可完成主要操作。

- [ ] 任务15：持久化与偏好
  - 范围：localStorage（主题、全局强度、水印参数、尺寸/裁剪偏好）、sessionStorage（估算缓存）。
  - 产出文件：`src/services/persist.ts`。
  - 需求映射：FR-08、AC-08。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 实现偏好持久化与估算缓存。Restrictions: 不持久化文件内容。_Leverage: Storage API。_Requirements: FR-08。Success: 刷新后偏好仍在。

- [ ] 任务16：性能优化与回退策略
  - 范围：WASM 懒加载、编码器选择与回退、并发自适应、内存释放策略、自检测。
  - 产出文件：`src/perf/lazy.ts`、`src/perf/detect.ts`、`src/perf/release.ts`。
  - 需求映射：NFR-02/03/04/05/08/09。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 完成性能与回退策略。Restrictions: 控制首屏包体≤250KB gzip（不含 WASM）。_Leverage: navigator.api、Codecs 检测。_Requirements: NFR-02/03/04/05/08/09。Success: 各环境均可用且流畅。

- [ ] 任务17：测试与验证
  - 范围：单元测试（质量映射、估算、尺寸/裁剪、水印参数）；轻量 E2E/脚本验证上传→压缩→下载主流程。
  - 产出文件：`tests/unit/*.spec.ts`、`tests/e2e/smoke.spec.ts`。
  - 需求映射：AC-01~AC-13、NFR-02/07/09。
  - _Prompt:
    Implement the task for spec image-compressor-web, first run spec-workflow-guide to get the workflow guide then implement the task: 编写关键单测与冒烟流测试。Restrictions: 不上传真实图片到网络。_Leverage: Vitest/Playwright(可选)。_Requirements: 全部 AC。Success: ≥80% 覆盖，冒烟流程通过。

---

说明：
- 执行任一任务前，请先在本文件将该任务的 `- [ ]` 改为 `- [-]`；完成后改为 `- [x]`。
- 开发中如需新增任务，请在本表后续追加，并关联需求条目（FR/NFR/AC）。
