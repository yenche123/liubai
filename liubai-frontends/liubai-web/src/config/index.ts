

export default {

  // 最小 sidebar 宽度；若空间不足，就会被收起
  min_sidebar_width: 200,

  // 默认 sidebar 宽度
  default_sidebar_width: 250,

  // 最小 vice-view 所需的宽度 
  min_viceview_width: 350,

  // 默认 vice-view 所需的宽度
  default_viceview_width: 370,

  // 最小的 main-view 所需宽度
  min_mainview_width: 300,

  // 导航栏高度
  navi_height: 70,

  // kanban header 的高度
  kanban_header_height: 56,

  // vice-view 的导航栏高度
  vice_navi_height: 50,

  // 文本编辑器最低尺寸
  min_editor_height: 100,

  // 打开 特定 iframe 的参数
  iframe_keys: ["outq", "gpt3", "xhs", "bing", "github"],

  // 用侧边栏还是详情页打开的分野界限
  vice_detail_breakpoint: 932,   // 值得注意的是，当侧边栏被收起来时，会 -150 
                                 // 变成 782，这个尺寸会大于 iPad Mini 的短边 768，使得其
                                 // 短边为宽时，能点击跳转到 detail-page 而非打开 vice-view
                                 // 见 open-util.ts toWhatDetail()

  max_kanban_thread: 16,   // 最多 max_kanban_thread 个动态展示在列表里
                           // 则有 max_kanban_thread+1 个 id 存到 workspace.stateList[].contentIds 中
  max_kanban_column: 8,    // 看板里，最多有几个列表

  sidebar_spacing: 10,      // sidebar 到 main-view 的间距，用于拖动区域变大

  viceview_spacing: 1,      // vice-view 到 main-view 的间距
                            // 由于 vice-view 不是 overflow: hidden，所以其不需要留太多间距
                            // drag-handle 可以超出 container 也没关系

  sidebar_close_point: 600,   // 窗口宽度小于该尺寸，就会关闭 sidebar
  sidebar_open_point: 700,    // 窗口尺寸大于等于该尺寸，并且为 closed_by_auto 状态，就会自动展开 sidebar
  
  max_export_num: 200,        // 一次性导出时的最大条数，当加载的条数大于等于该值时，停止导出

  max_mobile_breakpoint: 600,   // 有些时候，屏幕宽度小于 600，简略认为它是移动端
}