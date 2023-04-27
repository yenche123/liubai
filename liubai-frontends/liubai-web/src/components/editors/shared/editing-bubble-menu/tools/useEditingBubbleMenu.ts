import type { Instance, Props } from 'tippy.js'

export function useEditingBubbleMenu() {

  let tippy: Instance | undefined = undefined

  const tippyOptions: Partial<Props> = {
    hideOnClick: true,
    placement: 'bottom',
    onMount(instance) {
      tippy = instance
    }
  }

  return { tippyOptions }
}