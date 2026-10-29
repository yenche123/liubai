<template>
  <div class="code-highlight">
    <pre class="hljs"><code v-html="highlightedCode"></code></pre>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ensureLowlightLanguages, initLowlight, lowlightReady } from '~/utils/other/lowlight-related'

interface Props {
  code: string
  language?: string | null
}

const props = defineProps<Props>()

// HTML 转义函数
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 简单的 AST 转 HTML 函数
function astToHtml(node: any): string {
  if (typeof node === 'string') {
    return escapeHtml(node)
  }
  
  if (node.type === 'text') {
    return escapeHtml(node.value || '')
  }
  
  if (node.type === 'element') {
    const tagName = node.tagName || 'span'
    const className = node.properties?.className ? ` class="${node.properties.className.join(' ')}"` : ''
    const children = node.children ? node.children.map(astToHtml).join('') : ''
    return `<${tagName}${className}>${children}</${tagName}>`
  }
  
  if (node.children) {
    return node.children.map(astToHtml).join('')
  }
  
  return ''
}

const highlightedCode = computed(() => {
  if (!props.code) return ''

  void ensureLowlightLanguages()
  if (!lowlightReady.value) {
    return escapeHtml(props.code)
  }

  const { lowlight } = initLowlight()
  
  try {
    if (props.language && lowlight.registered(props.language)) {
      const result = lowlight.highlight(props.language, props.code)
      return astToHtml(result)
    } else {
      // 自动检测语言
      const result = lowlight.highlightAuto(props.code)
      return astToHtml(result)
    }
  } catch (error) {
    console.warn('Code highlighting failed:', error)
    // 如果高亮失败，返回转义后的原始代码
    return escapeHtml(props.code)
  }
})
</script>

<style lang="scss" scoped>
.code-highlight {
  width: 100%;
  height: 100%;
  overflow: auto;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--mini-font);
  line-height: 1.4;
  background: #1e1e1e;
  border-radius: 12px;

  pre {
    margin: 0;
    padding: 12px 16px;
    background: transparent;
    overflow: visible;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  code {
    background: transparent;
    color: inherit;
    padding: 0;
    font-size: inherit;
    font-family: inherit;
  }
}
</style>

<style lang="scss">
// 使用 highlight.js 的深色主题样式
// 这里使用全局样式，因为 v-html 渲染的内容不会受到 scoped 样式影响
.code-highlight {
  // 基础样式
  .hljs {
    color: #ddd;
    background: transparent;
  }

  // 注释
  .hljs-comment,
  .hljs-quote {
    color: #999;
    font-style: italic;
  }

  // 关键字
  .hljs-keyword,
  .hljs-selector-tag,
  .hljs-subst {
    color: #cc7832;
    font-weight: bold;
  }

  // 字符串
  .hljs-string,
  .hljs-literal,
  .hljs-regexp {
    color: #6a8759;
  }

  // 数字
  .hljs-number {
    color: #6897bb;
  }

  // 函数名和方法
  .hljs-function,
  .hljs-title {
    color: #ffc66d;
  }

  // 变量
  .hljs-variable,
  .hljs-name {
    color: #a9b7c6;
  }

  // 类名
  .hljs-class,
  .hljs-type {
    color: #a9b7c6;
  }

  // 属性
  .hljs-attr,
  .hljs-property {
    color: #9876aa;
  }

  // 标签
  .hljs-tag {
    color: #e8bf6a;
  }

  // 运算符
  .hljs-operator,
  .hljs-punctuation {
    color: #a9b7c6;
  }

  // HTML/XML 标签
  .hljs-tag .hljs-name {
    color: #e8bf6a;
  }

  // HTML/XML 属性
  .hljs-tag .hljs-attr {
    color: #bababa;
  }

  // 内置函数
  .hljs-built_in {
    color: #8888c6;
  }

  // 符号
  .hljs-symbol {
    color: #6897bb;
  }

  // 模板变量
  .hljs-template-variable {
    color: #cc7832;
  }

  // 强调
  .hljs-emphasis {
    font-style: italic;
  }

  .hljs-strong {
    font-weight: bold;
  }

  // 删除线
  .hljs-deletion {
    background: #484a4a;
    color: #c5c8c6;
  }

  // 插入
  .hljs-addition {
    background: #718c00;
    color: #c5c8c6;
  }

  // 元数据
  .hljs-meta {
    color: #7f8c8d;
  }

  // 注解
  .hljs-doctag {
    color: #808080;
  }

  // 段落
  .hljs-section {
    color: #cc7832;
  }
}
</style>
