# liubai-laf

这里是 `liubai` 基于 `laf` 的后端根目录



## 碎片记录

### Laf

1. 在 `__interceptor__` 云函数中，使用 `ctx.request?.path` 能获取到目标云函数的名称，比如其结果为 `/hello-world` 代表拦截的是 `hello-world` 云函数的请求；但使用 `ctx.__function_name` 则是会获取到 `__interceptor__` 这个结果。