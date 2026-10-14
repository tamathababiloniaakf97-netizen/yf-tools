# 研究快照查看实施计划

目标：让用户能够查看已保存的历史研究版本。

1. 为 SnapshotList 添加行为测试：列表摘要与数量、打开历史正文/假设/证据、加载失败重试、保存后打开、切换公司隔离。
2. 运行测试确认缺少查看入口导致失败。
3. 新建 SnapshotDetail.tsx，使用只读 Descriptions 和 Card 展示冻结数据，保留换行和长文本换行；仅允许 HTTP(S) 来源链接。
4. 更新 SnapshotList.tsx：摘要、数量、查看按钮、Drawer、保存说明和请求错误状态。按公司 key 隔离组件生命周期。
5. 运行组件测试、已有 snapshot 测试、TypeScript 与定向 ESLint，检查 diff。
