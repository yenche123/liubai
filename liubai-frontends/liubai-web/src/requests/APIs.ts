import liuEnv from "~/utils/liu-env"

const env = liuEnv.getEnv()
const d = env.API_DOMAIN ?? ""

export default {
  TIME: d + `hello-world`,
  LOGIN: d + `user-login`,
  USER_ENTER: d + `user-settings`,
  USER_LATEST: d + `user-settings`,
  USER_MEMBERSHIP: d + `user-settings`,
  SUBSCRIBE_PLAN: d + `subscribe-plan`,
  REQUEST_REFUND: d + `subscribe-plan`,
}