<script setup lang="ts">


const color = `var(--main-normal)`

</script>
<template>

  <div class="fab-container">
    <div class="fab-icon-box">
      <svg-icon 
        class="fab-svg-icon"
        name="double_arrow_up" 
        :color="color"
      ></svg-icon>
    </div>
  </div>

</template>
<style scoped lang="scss">

.fab-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  height: 56px;
  min-width: 56px;
  bottom: 16px;
  right: 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  background-color: var(--secondary-color);
  cursor: pointer;
}

.fab-icon-box {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;

  .fab-svg-icon {
    width: 24px;
    height: 24px;
  }
}

.fab-title {
  color: v-bind("color");
  font-size: var(--btn-font);
  font-weight: 500;

  .fab-span {
    padding-inline-end: 20px;
  }
}



</style>