import { spawn } from "child_process"

export function buildGallery({ contentDir, publicDir, flags,title }) {
  return new Promise((res, rej) => {
    const args = ["--input", contentDir, "--output", publicDir, ...flags]
    const p = spawn("thumbsup", args, { stdio: "inherit" })
    p.on("close", (code) =>
      code === 0 ? res() : rej(new Error(`exit ${code}`))
    )
  })
}
