import valTool from "../basic/val-tool"

// 权限查询 api

// 注：
// [Android Webview] 皆不支持
// camera: [Firefox] 不支持
// microphone： [Firefox] 不支持
// notifications: [Safari] 不支持
// push: [Safari] 不支持
interface LiuPermissionQuery {
  name: "geolocation" | "camera" | "microphone" | "notifications" | "push" | "screen-wake-lock"
}

const permissionsQuery = async (option: LiuPermissionQuery) => {
  if(!navigator.permissions || !navigator.permissions.query) {
    return valTool.getPromise(undefined)
  }
  try {
    const res = await navigator.permissions.query(option as PermissionDescriptor)
    return res
  }
  catch(err) {
    console.log("浏览器不支持该 api ..........")
    console.log(err)
  }
}

export default {
  permissionsQuery,
}