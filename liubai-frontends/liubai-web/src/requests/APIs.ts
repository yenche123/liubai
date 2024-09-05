import liuEnv from "~/utils/liu-env"

const env = liuEnv.getEnv()
const d = env.API_DOMAIN ?? ""

export default {
  TIME: d + `hello-world`,
  LOGIN: d + `user-login`,
  LOGOUT: d + `user-settings`,
  USER_ENTER: d + `user-settings`,
  USER_LATEST: d + `user-settings`,
  USER_SET: d + `user-settings`,
  USER_MEMBERSHIP: d + `user-settings`,
  SUBSCRIBE_PLAN: d + `subscribe-plan`,
  REQUEST_REFUND: d + `subscribe-plan`,
  UPLOAD_FILE: d + `file-set`,
  SYNC_SET: d + `sync-set`,
  SYNC_GET: d + `sync-get`,
  OPEN_CONNECT: d + `open-connect`,
  PAYMENT_ORDER: d + `payment-order`,
}