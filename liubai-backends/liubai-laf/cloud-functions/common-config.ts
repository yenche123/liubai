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
  "me": 103,
}

/********************* wechat template messages ****************/
export const wx_reminder_tmpl = {
  touser: "",
  template_id: "",
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

/********************* tencent SES template config ****************/
export const tencent_ses_tmpl_cfg = {
  "confirmation": {
    "zh-Hans": 128068,
    "zh-Hant": 128070,
    "en": 128071,
  }
}