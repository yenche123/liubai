# cloud 目录说明

`CloudFiler.ts`: 处理文件下载，并缓存到本地 db 中

`CloudEventBus.ts`: 后端调度工具，其中 `syncNum` 被加 1 时，代表用户已登录并且应该完成了一次获取最新用户态。

`CloudMerger.ts`: 将后端数据加载下来，并融合进本地 db 中

`LocalToCloud.ts`: 前端向后端推送最新用户修改的数据

`workers/`: 存放 web-worker 的文件，目前主要给 `CloudFiler` 调用，让文件下载任务在其他进程中执行

`cm-tools/`: 供 `CloudMerger` 使用，用于融合数据。其中 `cm` 即为 CloudMerger 的首字母缩写。

`upload-tasks/`: 该文件夹只暴露 `handleUploadTasks` 函数供 `LocalToCloud` 调用，用于读取本地 UploadTaskLocalTable 表里的任务、加载出对应表的数据，最后再上传至后端。

## Cloud Directory Structure Explanation

**CloudFiler.ts:** Handles file downloads and caches them in the local database.

**CloudEventBus.ts:** A backend scheduling tool. When `syncNum` is incremented by 1, it indicates that the user has logged in and should have completed one round of retrieving the latest user state.

**CloudMerger.ts:** Loads data from the backend and merges it into the local database.

**LocalToCloud.ts:** Pushes the latest user-modified data to the backend from the frontend.

**workers/:** Contains web-worker files, currently mainly called by `CloudFiler` to execute file download tasks in the other process rather than the main one.

**cm-tools/:** Used by `CloudMerger` for data merging. The `cm` stands for CloudMerger.

**upload-tasks/:** This folder only exposes the `handleUploadTasks` function for `LocalToCloud` to call, which reads the tasks in the local UploadTaskLocalTable table, loads the data from the corresponding table, and finally uploads it to the backend.


