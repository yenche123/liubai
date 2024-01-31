# liubai-laf

这里是 `liubai` 基于 `laf` 的后端根目录

## 开发日记


### 2024-01-31

有更改的文件：
common-types / common-ids / webhook-stripe

待测试 billing_cycle_anchor

### 2024-01-30

有更改的文件：
common-types / subscribe-plan / webhook-stripe


## 碎片记录


### cloud.mongo.db vs cloud.database()

由于直接在 Laf 的网站后台的 `集合` 面板里新建数据时，新建出来的数据并非 ObjectId 的，为确保统一，在云函数里新建数据依然使用旧版而非 mongodb 原生的 api


### Laf

1. 在 `__interceptor__` 云函数中，使用 `ctx.request?.path` 能获取到目标云函数的名称，比如其结果为 `/hello-world` 代表拦截的是 `hello-world` 云函数的请求；但使用 `ctx.__function_name` 则是会获取到 `__interceptor__` 这个结果。