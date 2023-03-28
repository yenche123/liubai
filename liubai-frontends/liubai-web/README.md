# LB


## 开发备注

1. `mobile-kanban` 分支，对于移动设备，看板里的卡片是整个可以拖动的，而不像原来只能触摸右小角 6 点点来拖动；但由于没有 ipad 在身边，未经测试，故没有合并到 `main` 分支中。


## 图标库

https://fonts.google.com/icons

https://www.svgrepo.com/

https://icons.radix-ui.com/

## 注意事项

1. `vc-` 开头的 css 类名，会跟 `vconsole` 库的样式冲突，请避免使用。

2. 开源前，记得移除 `.vscode.settings.json` 里的 `typescript.tsdk`

3. 升级 tiptap 下的依赖至最新，使用 `pnpm up @tiptap/* --latest`


