


export interface ScData {
  loading: boolean
  status: 0 | 1 | 2 | 3 | 4   // 0: nothing
                              // 1: no backend
                              // 2: never subscribed ever
                              // 3: subscribed at least one time
                              // 4: network error
  initStamp: number
  stripe_portal_url?: string
}