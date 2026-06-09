# 泼墨坊

泼墨坊是一款面向普通用户、小商家、博主、课程老师、电商运营和自媒体用户的 AI 作图桌面工具。

它的重点不是让用户学习复杂提示词，而是把专业提示词能力藏在后台：用户只需要选择场景、填写少量内容，就能生成适合 GPT Image 2 / image2 使用的高质量海报提示词，并预留后续直接生成海报的能力。

## 主要功能

- 智能海报生成器
- 小红书封面、产品卖货、课程招生、活动宣传、餐饮新品 5 类海报
- 普通语言选择画面感觉和突出重点
- 支持尺寸选择：1:1、9:16、16:9、3:4、4:3
- 支持大小选择：1K、2K、4K
- 自动生成结构化专业提示词
- 中文文字稳定规则：避免乱码、错别字、假中文和随机英文
- 桌面端本地演示生成
- 可配置真实图像模型接口
- 历史生成记录和提示词复制

## 下载

Windows 用户可以到 GitHub Releases 下载最新版：

https://github.com/1wanganshi/pomo-fang/releases/latest

推荐下载：

- `泼墨坊 Setup 0.1.0.exe`：安装版
- `泼墨坊 0.1.0.exe`：便携版

## 本地运行

先安装依赖：

```bash
npm install
```

启动桌面应用：

```bash
npm start
```

## 打包

生成 Windows 安装包和便携版：

```bash
npm run package:win
```

仅生成解压运行版：

```bash
npm run package:dir
```

## 项目结构

- `desktop.html` / `desktop.js`：桌面工作台
- `module.html` / `module.js`：模块作图页面
- `shared.js`：状态管理、默认模块、智能海报提示词规则
- `electron/`：Electron 主进程和预加载脚本
- `styles.css`：界面样式

## 开源协议

本项目使用 MIT 协议开源。
