// Function Name: common-config
// put some configs here

/********************* empty functions ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing")
  return true
}

/********************* wechat tag id ****************/

export const wechat_tag_cfg = {
  "zh-Hans": 100,
  "zh-Hant": 101,
  "en": 102,
}

/********************* wechat template messages ****************/
export const wx_reminder_tmpl = {
  touser: "",
  // template_id: "2PtKG06TkCunDmMkktZLeGpEzb4xtVaZmEMN3qDALy4",
  template_id: "7C_Wfb_WybU8x60KRYtNxcBDesmDNIjRT-qZtzknuVo",
  url: "",
  data: {
    thing18: {
      value: "",
    },
    time4: {
      value: "",
    },
  }
}
