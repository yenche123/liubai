import liuEnv from "~/utils/liu-env"

const env = liuEnv.getEnv()
const d = env.API_DOMAIN ?? ""

export default {
  LOGIN: d + `user-login`,
  USER_ENTER: d + `user-setting`,
}