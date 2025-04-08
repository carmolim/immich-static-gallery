// lib/downloader.js
import fs from "fs"
import path from "path"
import { pipeline } from "stream/promises"

/**
 * Download assets, saving each as <id><ext>
 */
export async function downloadAssets(assets, slug, contentDir, client) {
  const destDir = path.join(contentDir, slug)
  await fs.promises.mkdir(destDir, { recursive: true })

  const tasks = assets.map((asset) => async () => {
    // derive extension from originalPath
    const ext = path.extname(asset.originalPath) || ""
    const filename = `${asset.id}${ext}`
    const outPath = path.join(destDir, filename)

    // skip if already exists
    try {
      await fs.promises.access(outPath)
      return
    } catch {}

    // download stream
    const response = await client.downloadAsset(asset.id)
    await pipeline(response.data, fs.createWriteStream(outPath))
    console.log(`Downloaded ${filename}`)
  })

  // simple concurrency of 5
  for (let i = 0; i < tasks.length; i += 5) {
    await Promise.all(tasks.slice(i, i + 5).map((fn) => fn()))
  }
}
