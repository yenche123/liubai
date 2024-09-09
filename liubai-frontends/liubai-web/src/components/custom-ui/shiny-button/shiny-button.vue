<script setup lang="ts">
// thanks: https://ryanmulligan.dev/blog/css-property-new-style/

defineEmits(["click"])

</script>
<template>

  <div class="shiny-container">
    <button class="liu-no-user-select shiny-cta" @click="$emit('click', $event)">
      <slot />
    </button>
  </div>
  
</template>
<style lang="scss">

.shiny-container {
  width: 100%;
  position: relative;

  @keyframes shiny-gradient-angle {
    to {
      --gradient-angle: 360deg;
    }
  }

  @keyframes shiny-shimmer {
    to {
      rotate: 360deg;
    }
  }

  @keyframes shiny-breathe {
    from,
    to {
      scale: 1;
    }
    50% {
      scale: 1.2;
    }
  }
}

@property --gradient-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@property --gradient-angle-offset {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@property --gradient-percent {
  syntax: "<percentage>";
  initial-value: 5%;
  inherits: false;
}

@property --gradient-shine {
  syntax: "<color>";
  initial-value: white;
  inherits: false;
}

.shiny-cta {
  --animation: shiny-gradient-angle linear infinite;
  --duration: 3s;
  --shadow-size: 2px;
  isolation: isolate;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  outline-offset: 4px;
  width: 100%;
  padding: 1rem 2rem;
  font-family: inherit;
  font-size: var(--btn-font);
  line-height: 1.2;
  border: 1px solid transparent;
  border-radius: 16px;
  color: var(--shiny-cta-fg);
  background: linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg))
      padding-box,
    conic-gradient(
        from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
        transparent,
        var(--shiny-cta-highlight) var(--gradient-percent),
        var(--gradient-shine) calc(var(--gradient-percent) * 2),
        var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
        transparent calc(var(--gradient-percent) * 4)
      )
      border-box;
  box-shadow: inset 0 0 0 1px var(--shiny-cta-bg-subtle);

  &::before,
  &::after,
  span::before {
    content: "";
    pointer-events: none;
    position: absolute;
    inset-inline-start: 50%;
    inset-block-start: 50%;
    translate: -50% -50%;
    z-index: -1;
  }

  &:active {
    translate: 0 1px;
  }
}

/* Dots pattern */
.shiny-cta::before {
  --size: calc(100% - var(--shadow-size) * 3);
  --position: 2px;
  --space: calc(var(--position) * 2);
  width: var(--size);
  height: var(--size);
  background: radial-gradient(
      circle at var(--position) var(--position),
      white calc(var(--position) / 4),
      transparent 0
    )
    padding-box;
  background-size: var(--space) var(--space);
  background-repeat: space;
  mask-image: conic-gradient(
    from calc(var(--gradient-angle) + 45deg),
    black,
    transparent 10% 90%,
    black
  );
  border-radius: inherit;
  opacity: 0.4;
  z-index: -1;
}

/* Inner shimmer */
.shiny-cta::after {
  --animation: shiny-shimmer linear infinite;
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(
    -50deg,
    transparent,
    var(--shiny-cta-highlight),
    transparent
  );
  mask-image: radial-gradient(circle at bottom, transparent 40%, black);
  opacity: 0.6;
}

.shiny-cta span {
  z-index: 1;

  &::before {
    --size: calc(100% + 1rem);
    width: var(--size);
    height: var(--size);
    box-shadow: inset 0 -1ex 2rem 4px var(--shiny-cta-highlight);
    opacity: 0;
  }
}

/* Animate */
.shiny-cta {
  --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);
  transition: var(--transition);
  transition-property: --gradient-angle-offset, --gradient-percent,
    --gradient-shine;

  &,
  &::before,
  &::after {
    animation: var(--animation) var(--duration),
      var(--animation) calc(var(--duration) / 0.4) reverse paused;
    animation-composition: add;
  }

  span::before {
    transition: opacity var(--transition);
    animation: calc(var(--duration) * 1.5) shiny-breathe linear infinite;
  }
}

@media(hover: hover) {
  .shiny-cta:is(:hover) {
    --gradient-percent: 20%;
    --gradient-angle-offset: 95deg;
    --gradient-shine: var(--shiny-cta-highlight-subtle);

    &,
    &::before,
    &::after {
      animation-play-state: running;
    }

    span::before {
      opacity: 1;
    }
  }
}

.shiny-cta:is(:focus-visible, :active) {
  --gradient-percent: 20%;
  --gradient-angle-offset: 95deg;
  --gradient-shine: var(--shiny-cta-highlight-subtle);

  &,
  &::before,
  &::after {
    animation-play-state: running;
  }

  span::before {
    opacity: 1;
  }
}


</style>