# 说明

存放一些第三方库

从 `v0.0.148` 开始，弃用 iframe 来加载 pdf-js:

1. 打包体积: 8256.92 kB 下降到 4604.22 kB
2. 总文件（含文件夹）数从 876 下降到 381
3. 用 iframe 加载 pdf-js，由于使用了 service-worker 可能会触发一些线上才有的问题，本地开发环境无法复现，比如: PDF.js v3.9.179 (build: 1ef6fbc52)
Message: GetReader - expected an ArrayBuffer.