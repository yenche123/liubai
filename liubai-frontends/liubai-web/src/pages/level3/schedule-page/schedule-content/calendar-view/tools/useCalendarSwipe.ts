export interface UseCalendarSwipeOptions {
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

export function useCalendarSwipe(options: UseCalendarSwipeOptions) {
  let touchStartX = 0
  let touchStartY = 0
  let touchEndX = 0
  let touchEndY = 0
  let startTime = 0

  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    touchEndX = touch.clientX
    touchEndY = touch.clientY
    startTime = Date.now()
  }

  const onTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    touchEndX = touch.clientX
    touchEndY = touch.clientY
  }

  const onTouchEnd = () => {
    const duration = Date.now() - startTime
    const diffX = touchEndX - touchStartX
    const diffY = touchEndY - touchStartY

    const thresholdX = 50
    const thresholdY = 80 // Limit vertical movement to ensure it is mostly a horizontal swipe
    const maxDuration = 500 // Max duration for a swipe gesture in ms

    if (
      duration < maxDuration &&
      Math.abs(diffX) > thresholdX &&
      Math.abs(diffY) < thresholdY
    ) {
      if (diffX > 0) {
        // Swipe Right (drag right): go to previous month
        options.onSwipeRight()
      } else {
        // Swipe Left (drag left): go to next month
        options.onSwipeLeft()
      }
    }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
