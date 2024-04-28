
export async function getJSZip() {
  const JSZip = await import("jszip")
  return JSZip
}

