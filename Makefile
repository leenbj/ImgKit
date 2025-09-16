SHELL := /bin/bash

.PHONY: setup dev build test lint clean

setup:
	@echo "[setup] 安装依赖与工具链（本地环境需 Node 18+、pnpm 或 npm）"
	@echo "提示：当前环境可能无网络，稍后在本机执行 npm/pnpm 安装。"

dev:
	@echo "[dev] 启动开发服务器：npm run dev"

build:
	@echo "[build] 生成生产构建：npm run build"

test:
	@echo "[test] 运行测试：npm test"

lint:
	@echo "[lint] 运行 Lint/Format：npm run lint"

clean:
	@rm -rf dist node_modules .turbo .vite
	@echo "[clean] 已清理构建产物"
