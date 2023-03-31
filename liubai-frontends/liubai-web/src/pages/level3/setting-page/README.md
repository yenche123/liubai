# 设置

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
