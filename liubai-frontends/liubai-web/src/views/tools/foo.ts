import cfg from "~/config";

export function initSidebarWidth(windowWidth: number) {
  let res = Math.round(windowWidth / 5)
  if(res < cfg.default_sidebar_width) {
    res = cfg.default_sidebar_width
  }
  else if(res > 450) {
    res = 450
  }

  return res
}