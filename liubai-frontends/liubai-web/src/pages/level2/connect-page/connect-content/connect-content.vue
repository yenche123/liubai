<script setup lang="ts">
import { useConnectContent } from "./tools/useConnectContent"
import ConnectItem from "./connect-item/connect-item.vue";
import ListBottom from "~/components/common/list-bottom/list-bottom.vue";

const {
  prefix,
  _env,
} = useConnectContent()

</script>
<template>

  <!-- wechat -->
  <ConnectItem v-if="_env.C_WECHAT" 
    :prefix="prefix" connector-id="wechat" title-key="connect.wechat"
    desc-key="connect.wechat_desc" icon-url="/images/third-party/wechat.png"
  ></ConnectItem>

  <!-- TODO: dingtalk -->
  <ConnectItem v-if="_env.C_DINGTALK" 
    :prefix="prefix" connector-id="dingtalk" title-key="connect.dingtalk"
    desc-key="connect.dingtalk_desc" icon-url="/images/third-party/dingtalk.svg"
  ></ConnectItem>

  <!-- TODO: feishu -->
  <ConnectItem v-if="_env.C_FEISHU" 
    :prefix="prefix" connector-id="feishu" title-key="connect.feishu"
    desc-key="connect.feishu_desc" icon-url="/images/third-party/feishu.png"
  ></ConnectItem>

  <!-- teams -->
  <ConnectItem v-if="_env.C_TEAMS" 
    :prefix="prefix" connector-id="teams" title-key="connect.teams"
    desc-key="connect.teams_desc" icon-url="/images/third-party/teams.svg"
  ></ConnectItem>

  <!-- TODO: slack -->
  <ConnectItem v-if="_env.C_SLACK" 
    :prefix="prefix" connector-id="slack" title-key="connect.slack"
    desc-key="connect.slack_desc" icon-url="/images/third-party/slack.svg"
  ></ConnectItem>

  <ListBottom has-data reached></ListBottom>

</template>
<style scoped></style>