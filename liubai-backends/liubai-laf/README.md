# liubai-laf

这里是 `liubai` 基于 `laf` 的后端根目录


## 补全

在 `cloud-functions/` 下新增文件 `secret-config.ts`，然后复制黏贴一下内容:

```ts
export const wxpay_apiclient_serial_no = ""
export const wxpay_apiclient_cert = ""
export const wxpay_apiclient_key = ""

export const alipay_cfg = {
  privateKey: "",
  alipayPublicKey: "",
}
```

`wxpay_` 开头的变量仅在启用微信支付时需要，否则填空字符串即可。

`alipay_cfg` 仅在启用支付宝支付时需要，否则其对应的字段，维持空字符串即可。


## 后端部署手续

1. 检查 npm 依赖、版本号
2. 检查 `secret-config.ts` 文件是否存在
3. 检查环境变量（确定字段是否存在，确定数值是否正确）
4. 部署 common- 开头的云函数
5. 部署剩余的云函数
6. 检查数据表，比如 Config 表
7. 检查定时器（若有变化，要重启）
8. 重启
9. 检查 IP 变化，修改各平台的 IP 许可名单

## 开发日记


### 2024-11-20

`01-ai/Yi-1.5-9B-Chat-16K` 无法传递工具调用，会报错

### 2024-11-19

实测，`moonshot` 的模型，`tools` 工具调用的声明里，`function.parameters.properties.key1.type` 不允许是一个数组，必须是一个字符串，举例：

```ts
const tools_1 = [
  {
    type: "function",
    function: {
      name: "add_todo",
      description: "添加: 待办 / 提醒事项 / 日程 / 事件 / 任务",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: ["string", "null"],    // 报错
            description: "标题"
          }
        }
      }
    }
  }
]

const tools_2 = [
  {
    type: "function",
    function: {
      name: "add_todo",
      description: "添加: 待办 / 提醒事项 / 日程 / 事件 / 任务",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",         // 正确
            description: "标题"
          }
        }
      }
    }
  }
]
```


### 2024-09-20

腾讯云 SES（Simple Email Service） node.js SDK，安装 `pnpm add tencentcloud-sdk-nodejs-ses`

仓库地址: https://github.com/TencentCloud/tencentcloud-sdk-nodejs/tree/master/tencentcloud/services/ses


### 2024-09-04

部署指南里，记得提醒要添加 `secret-config.ts` 文件，否则会报错！

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