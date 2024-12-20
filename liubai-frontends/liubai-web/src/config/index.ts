

export default {

  // 最小 sidebar 宽度；若空间不足，就会被收起
  min_sidebar_width: 200,

  // 默认 sidebar 宽度
  default_sidebar_width: 250,

  // 最小 vice-view 所需的宽度 
  min_viceview_width: 350,

  // 默认 vice-view 所需的宽度
  default_viceview_width: 400,

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
  vice_detail_breakpoint: 982,   // 值得注意的是，当侧边栏被收起来时，会 -200 (也就是 min_sidebar_width)
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

  sidebar_open_point: 651,    // 窗口尺寸大于等于该尺寸，并且为 closed_by_auto 状态，就会自动展开 sidebar
  
  max_export_num: 300,        // 一次性导出时的最大条数，当加载的条数大于等于该值时，停止导出

  default_limit_num: 16,        // 默认一次加载多少个动态

  frame_duration: 12,           // 一个经验值，表示每一帧数（刷新周期）毫秒数
                                // setTimeout 的延时比指定值更长的原因见:
                                // https://developer.mozilla.org/zh-CN/docs/Web/API/Window/setTimeout#%E5%BB%B6%E6%97%B6%E6%AF%94%E6%8C%87%E5%AE%9A%E5%80%BC%E6%9B%B4%E9%95%BF%E7%9A%84%E5%8E%9F%E5%9B%A0
  frame_duration_2: 56,         // 一个经验值，等待 css 响应的毫秒数
                                // 通常用于某个组件刚启动时

  fail_to_upload_max: 5,       // 上传失败的最大次数，若大于等于该次数
                               // 确定是否为新增动态，若是，把该动态改为本地存储
                               // 否则直接删除该任务
  
  title_bar_colors: {
    light: "#435964",         // same as --avatar-bg   
    dark: "#3d5259",          // same as --drag-bg
  },

  newVersion: {
    install_min_duration: 3,      // 安装新版本的最小间隔，单位：天
        // 举例，若过去 install_min_duration 天内曾安装过新版本，就拒绝弹窗
    cancel_min_duration: 5,       // 取消新版本的最短间隔，单位：天 
        // 举例: 若过去 cancel_min_duration 天内有点击取消弹窗，就拒绝弹窗         
    confirm_min_duration: 7,      // 确认新版本的最短间隔，单位：天
        // 举例: 若过去 confirm_min_duration 天内已点击接受，就拒绝弹窗
  },

  breakpoint_max_size: {
    mobile: 650,
    tablet: 1150,
  },

}