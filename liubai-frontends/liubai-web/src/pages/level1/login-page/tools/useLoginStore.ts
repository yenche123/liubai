import { defineStore } from "pinia";
import { ref } from "vue";
import { type MemberShow } from "~/types/types-content";
import { type LpView } from "./types"
import { type Res_ULN_User } from "~/requests/data-types"
import transferUtil from "~/utils/transfer-util";
import valTool from "~/utils/basic/val-tool";

// 控制 login 页怎么显示
export const useLoginStore = defineStore("login", () => {

  const view = ref<LpView | "">("")

  const email = ref("")
  const accounts = ref<MemberShow[]>([])

  const multi_credential = ref("")
  const multi_credential_id = ref("")

  const goToCodeView = (email_val: string) => {
    email.value = email_val
    view.value = "code"
  }

  const goToAccountsView = (
    multi_users: Res_ULN_User[],
    multiCredential: string,
    multiCredentialId: string,
  ) => {
    // 将 multi_users 转换魏 accounts
    const memberShows = multi_users.map(v => {
      const v2: MemberShow = {
        _id: v.memberId,
        user_id: v.userId,
        name: v.member_name,
        avatar: transferUtil.imageFromCloudToShow(v.member_avatar),
        spaceId: v.spaceId,
        oState: v.member_oState,
      }
      return v2
    })

    accounts.value = memberShows
    multi_credential.value = multiCredential
    multi_credential_id.value = multiCredentialId
    view.value = "accounts"
  }

  const getData = () => {
    const accs = valTool.copyObject(accounts.value)
    return {
      view: view.value,
      email: email.value,
      accounts: accs,
      multi_credential: multi_credential.value,
      multi_credential_id: multi_credential_id.value,
    }
  }

  const reset = () => {
    view.value = ""
    email.value = ""
    accounts.value = []
    multi_credential.value = ""
    multi_credential_id.value = ""
  }


  return {
    view,
    goToCodeView,
    goToAccountsView,
    getData,
    reset,
  }


})