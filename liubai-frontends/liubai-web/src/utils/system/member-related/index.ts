import type { MemberConfig } from "~/types/other/types-custom";

/** 获取默认的 MemberConfig 结构 */
function getDefaultMemberCfg(): MemberConfig {
  return {
    searchKeywords: []
  }
}

export default {
  getDefaultMemberCfg
}