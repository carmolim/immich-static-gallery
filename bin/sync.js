#!/usr/bin/env node
import { Command } from "commander"
import cron from "node-cron"
import fs from "fs/promises"
import path from "path"
import { loadConfig } from "../lib/config.js"
import { createCache, getSeenIds, setSeenIds } from "../lib/cache.js"
import { createClient } from "../lib/api.js"
import { downloadAssets } from "../lib/downloader.js"
import { buildGallery } from "../lib/gallery.js"
import { deploy } from "../lib/deploy.js"
import dotenv from "dotenv"

dotenv.config()

const immichApiToken = process.env.IMMICH_API_KEY
const immichServer = process.env.IMMICH_SERVER

const program = new Command()

program
  .name("immich-static-gallery")
  .description("Sync Immich albums → static gallery")
  .argument("<mode>", '"once" to run once, "watch" to run & schedule')
  .option("--config <path>", "Path to config file", "config.yaml")

program.parse(process.argv)

const [mode] = program.args
const { config: configPath } = program.opts()

async function build(cfg, db) {
  const contentRoot = cfg.output.contentDir
  let changed = false

  // ── 0) Remove any album folder no longer in config ──────────────
  const validSlugs = cfg.albums.map((a) => a.slug)
  try {
    const entries = await fs.readdir(contentRoot, { withFileTypes: true })
    for (const ent of entries) {
      if (ent.isDirectory() && !validSlugs.includes(ent.name)) {
        const stalePath = path.join(contentRoot, ent.name)
        console.log(`🗑 Removing stale album folder: ${ent.name}`)
        await fs.rm(stalePath, { recursive: true, force: true })
        changed = true
      }
    }
  } catch (e) {
    // contentRoot may not exist yet
    await fs.mkdir(contentRoot, { recursive: true })
  }

  // ── 1) Per‑album sync (additions & deletions) ────────────────────
  const client = createClient({ immichServer, immichApiToken })

  for (const album of cfg.albums) {
    const albumDir = path.join(contentRoot, album.slug)

    // ensure album folder exists
    await fs.mkdir(albumDir, { recursive: true })

    // fetch current assets
    const allAssets = await client.listAssets(album.id)
    const currentIds = allAssets.map((a) => a.id)

    // load previously seen IDs
    const seenIds = getSeenIds(db, album.id)

    // deletions: IDs in seenIds but not in currentIds
    const deletedIds = seenIds.filter((id) => !currentIds.includes(id))
    if (deletedIds.length) {
      console.log(
        `– ${deletedIds.length} items removed from "${album.slug}", deleting files`
      )
      const files = await fs.readdir(albumDir)
      for (const id of deletedIds) {
        for (const file of files.filter((f) => f.startsWith(id))) {
          await fs.rm(path.join(albumDir, file))
          console.log(`  • Deleted ${file}`)
        }
      }
      changed = true
    }

    // additions: assets not in seenIds
    const newAssets = allAssets.filter((a) => !seenIds.includes(a.id))
    if (newAssets.length) {
      console.log(
        `+ ${newAssets.length} new items in "${album.slug}", downloading`
      )
      await downloadAssets(newAssets, album.slug, contentRoot, client)
      changed = true
    }

    // update cache if anything changed for this album
    if (deletedIds.length || newAssets.length) {
      await setSeenIds(db, album.id, currentIds)
    }
  }

  // ── 2) Rebuild & deploy if needed ────────────────────────────────
  if (changed) {
    await buildGallery({
      contentDir: contentRoot,
      publicDir: cfg.output.publicDir,
      flags: cfg.gallery.flags,
    })
    await deploy(cfg, cfg.output.publicDir)
  } else {
    console.log("No changes detected; skipping build/deploy.")
  }
}

async function main() {
  const cfg = loadConfig(configPath)
  const db = await createCache(cfg.cacheFile)

  if (mode === "once") {
    await build(cfg, db)
    process.exit(0)
  }

  if (mode === "watch") {
    await build(cfg, db)
    const expr = `*/${cfg.scan.intervalMinutes} * * * *`
    console.log(`Scheduling every ${cfg.scan.intervalMinutes} minutes.`)
    cron.schedule(expr, () => build(cfg, db).catch(console.error))
    return
  }

  console.error(`Unknown mode "${mode}". Use "once" or "watch".`)
  process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
