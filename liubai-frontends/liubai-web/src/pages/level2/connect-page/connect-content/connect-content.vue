<script setup lang="ts">

</script>
<template>

  <div class="cc-box">
    <svg-icon 
      class="liu-no-user-select cc-img"
      :cover-fill-stroke="false"
      name="emojis-face_with_peeking_eye_color"
    ></svg-icon>
    <div class="cc-text">
      <span class="liu-selection">这可能需要一点时间。外部应用众多，通信格式也各异，我们会试图寻找优雅的方式让人们可以很轻松的连接各个应用，同时免除琐碎配置的烦恼。这需要我们花大量的时间去研究交互，希望能得到你的理解。</span>
    </div>
  </div>

</template>
<style scoped>

.cc-box {
  width: 60%;
  padding-inline: 20%;
  min-height: 85%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.cc-img {
  width: 100px;
  height: 100px;
  margin-block-end: min(20%, 100px);
}

.cc-text {
  text-align: center;
  line-height: 1.9;
  padding-block-end: min(15%, 75px);
  color: var(--main-text);
}

</style>