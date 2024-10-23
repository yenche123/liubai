<script lang="ts" setup>
import NaviLink from "~/components/common/navi-link/navi-link.vue";
import AppLink from "~/components/common/app-link/app-link.vue";
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';
import { useMineContent } from "./tools/useMineContent"
import { useI18n } from 'vue-i18n';

const {
  myProfile,
  isPremium,
  prefix,
  CONNECTORS,
} = useMineContent()

const { t } = useI18n()

const iconColor = `var(--main-normal)`

</script>
<template>

  <!-- me -->
  <div class="mc-me">

    <!-- avatar -->
    <LiuAvatar v-if="myProfile" :member-show="myProfile"
      class="mc-me-avatar"
    ></LiuAvatar>

    <!-- name -->
    <div v-if="myProfile?.name" class="liu-no-user-select mc-me-name">
      <span>{{ myProfile.name }}</span>
    </div>

    <!-- premium -->
    <AppLink to="/subscription" v-if="isPremium">
      <LiuTooltip
        placement="bottom"
        :distance="4"
        :aria-label="t('premium.badge_tip')"
      >
        <div class="liu-no-user-select liu-premium">
          <span>🥂</span>
          <span class="liu-premium-text">Premium</span>
        </div>
      </LiuTooltip>
    </AppLink>

  </div>

  <div class="mc-virtual"></div>

  <!-- favorite + tags + kanban -->
  <div class="mc-box">

    <!-- favorite -->
    <NaviLink :to="prefix + 'favorite'">
      <div class="iu-no-user-select liu-hover mc-item">
        <div class="mci-icon-box">
          <SvgIcon :color="iconColor" name="star" class="mci-icon"
            style="padding-block-end: 3px;"
          ></SvgIcon>
        </div>
        <div class="mci-text">
          <span>{{ t('common.favorite') }}</span>
        </div>
        <div class="mci-footer">
          <div class="mcif-arrow">
            <SvgIcon :color="iconColor" name="arrow-right2" class="mcif-arrow-icon"></SvgIcon>
          </div>
        </div>
      </div>
    </NaviLink>

    <!-- tags -->
    <NaviLink :to="prefix + 'tags'">
      <div class="iu-no-user-select liu-hover mc-item">
        <div class="mci-icon-box">
          <SvgIcon :color="iconColor" name="tag" class="mci-icon"
            style="padding-block-end: 3px;"
          ></SvgIcon>
        </div>
        <div class="mci-text">
          <span>{{ t('common.tags') }}</span>
        </div>
        <div class="mci-footer">
          <div class="mcif-arrow">
            <SvgIcon :color="iconColor" name="arrow-right2" class="mcif-arrow-icon"></SvgIcon>
          </div>
        </div>
      </div>
    </NaviLink>

    <!-- kanban -->
    <NaviLink :to="prefix + 'state'">
      <div class="iu-no-user-select liu-hover mc-item">
        <div class="mci-icon-box">
          <SvgIcon :color="iconColor" name="priority" class="mci-icon"></SvgIcon>
        </div>
        <div class="mci-text">
          <span>{{ t('common.kanban') }}</span>
        </div>
        <div class="mci-footer">
          <div class="mcif-arrow">
            <SvgIcon :color="iconColor" name="arrow-right2" class="mcif-arrow-icon"></SvgIcon>
          </div>
        </div>
      </div>
    </NaviLink>

  </div>

  <!-- connections + settings + trash -->
  <div class="mc-box">

    <!-- connections -->
    <NaviLink v-if="CONNECTORS" :to="prefix + 'connectors'">
      <div class="iu-no-user-select liu-hover mc-item">
        <div class="mci-icon-box">
          <SvgIcon :color="iconColor" name="hub" class="mci-icon"></SvgIcon>
        </div>
        <div class="mci-text">
          <span>{{ t('common.connects') }}</span>
        </div>
        <div class="mci-footer">
          <div class="mcif-arrow">
            <SvgIcon :color="iconColor" name="arrow-right2" class="mcif-arrow-icon"></SvgIcon>
          </div>
        </div>
      </div>
    </NaviLink>

    <!-- settings -->
    <NaviLink :to="prefix + 'settings'">
      <div class="iu-no-user-select liu-hover mc-item">
        <div class="mci-icon-box">
          <SvgIcon :color="iconColor" name="setting" class="mci-icon"></SvgIcon>
        </div>
        <div class="mci-text">
          <span>{{ t('common.setting') }}</span>
        </div>
        <div class="mci-footer">
          <div class="mcif-arrow">
            <SvgIcon :color="iconColor" name="arrow-right2" class="mcif-arrow-icon"></SvgIcon>
          </div>
        </div>
      </div>
    </NaviLink>

    <!-- trash -->
    <NaviLink :to="prefix + 'trash'">
      <div class="iu-no-user-select liu-hover mc-item">
        <div class="mci-icon-box">
          <SvgIcon :color="iconColor" name="delete_400" class="mci-icon"></SvgIcon>
        </div>
        <div class="mci-text">
          <span>{{ t('common.trash') }}</span>
        </div>
        <div class="mci-footer">
          <div class="mcif-arrow">
            <SvgIcon :color="iconColor" name="arrow-right2" class="mcif-arrow-icon"></SvgIcon>
          </div>
        </div>
      </div>
    </NaviLink>
    
  </div>

  <div class="mc-virtual"></div>

</template>
<style scoped lang="scss">

.mc-me {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-block-start: 30px;
}

.mc-me-avatar {
  width: 72px;
  height: 72px;
  margin-block-end: 20px;
}

.mc-me-name {
  text-align: center;
  color: var(--main-normal);
  font-size: var(--desc-font);
  font-weight: 700;
  width: 75%;
  text-wrap: balance;
  margin-block-end: 10px;
}

.liu-premium {
  cursor: pointer;
}

.mc-virtual {
  width: 100%;
  height: 32px;
}

.mc-box {
  background-color: var(--card-bg);
  border-radius: 24px;
  position: relative;
  padding: 14px 10px 10px 10px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: var(--card-shadow-2);
  margin-block-end: 16px;
}

.mc-item {
  width: 100%;
  border-radius: 8px;
  position: relative;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  margin-block-end: 4px;
  overflow: hidden;
  padding: 8px 10px;

  &::before {
    border-radius: 8px;
  }
}

.mci-icon-box {
  width: 32px;
  height: 32px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline-end: 10px;
}

.mci-icon {
  width: 24px;
  height: 24px;
}

.mci-text {
  flex: 3;
  font-size: var(--btn-font);
  color: var(--main-normal);
  font-weight: 600;
}

.mci-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.mcif-arrow {
  width: 16px;
  height: 16px;
  position: relative;
  
  .mcif-arrow-icon {
    width: 100%;
    height: 100%;
  }
}



</style>