# 设置

1. 导入，应该过滤掉别人的动态，否则可能面临权限问题: 伪造他人发布。而导出则没有限制。

## 讨论: 一个 `a` 动态被导入时，查找本地发现无该 `_id`，是否应该新建新的 `_id` 为 `b`？ 

1. 应该: 因为用户可能连网后，可能浏览到 `a`，若本地已有 `a`，就会造成冲突
2. 不应该: 用户需要同步不同工作区的同一个动态，需要用 `_id` 字段同值的 `a` 来进行关联

如何解决呢？

当 `a` 动态没有 `cloud_id` 字段时，表示它是一个纯本地动态，那么允许导入后的动态使用同一 `_id`，即 `a`
当 `a` 动态已有 `cloud_id` 字段时，就新建一个 `b` 值到被导入的动态上，以避免冲突。 


## 关于导出

### `liubai-markdown.zip` 文件结构:

```
--- liubai-markdown.zip
 |
 |--- metadata.json
 |
 |--- /contents
   |
   |--- /YYYY-MM-DD hh:mm:ss 1
   |--- /YYYY-MM-DD hh:mm:ss 2
   |--- /YYYY-MM-DD hh:mm:ss 3
     |
     |--- README.md
     |--- /assets
       |
       |--- 1.jpg
       |--- 2.jpg
       |--- name.文件名后缀
```

### `liubai-json.zip` 文件结构:

```
--- liubai-json.zip
 |
 |--- metadata.json
 |
 |--- /contents
   |
   |--- /YYYY-MM-DD hh:mm:ss 1
   |--- /YYYY-MM-DD hh:mm:ss 2
   |--- /YYYY-MM-DD hh:mm:ss 3
     |
     |--- card.json
     |--- /assets
       |
       |--- ${id1}.jpg
       |--- ${id2}.jpg
       |--- ${id3}.文件名后缀
```

### metadata.json

```json
{
  "appName": "应用名",
  "version": "0.0.1",
  "client": "web",
  "export_num": 19,
  "export_stamp": 1680246583009,
  "operator": "ccc"
}
```

## Markdown 的特性

注意到 ChatGPT 返回的文本是一种 `markdown` 格式，不禁想问为什么 OpenAI 不用自定义 `json` 来返回数据呢？
仔细一思考，会发现说 `md` 已经是一种人类裸眼可读的格式，可以直接拿来阅读和书写，符合我们对自然语言的理解，作为一个大语言模型直觉上就应该返回人类可读的语言，而 `markdown` 不仅是只有文字的纯文本，它还能增加些许样式、标注一些在渲染时可让文本更加美观的符号，其 **通用** 但 **不严格** 的性质正好对应着自然语言 **能沟通** 和 **随意** 的特性。

ChatGPT 出来之后，把 `markdown` 这样的格式推上了新的高度。这是 `markdown` 的胜利。
