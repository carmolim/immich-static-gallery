import fs from "fs"
import yaml from "js-yaml"

import path from "path"
import dotenv from "dotenv"

// Load .env file variables into process.env
dotenv.config()

// --- Internal Paths Configuration ---
// Base directory mapped from the host's ./output directory
const OUTPUT_BASE_DIR = "./data"

const config = {
  // --- Essential Paths ---
  paths: {
    outputBase: OUTPUT_BASE_DIR,
    // Directory for temporary asset downloads
    contentDir: path.join(OUTPUT_BASE_DIR, "temp"),
    // Directory for the final static gallery output
    publicDir: path.join(OUTPUT_BASE_DIR, "public"),
    // Path for the internal cache file
    cacheFile: path.join("cache", "cache.json"),
    // Path to the user-provided configuration file
    configFile: "config.yaml", // Default, can be overridden by command line
  },

  // --- Immich Connection (from environment variables) ---
  immich: {
    serverUrl: process.env.IMMICH_SERVER,
    apiKey: process.env.IMMICH_API_KEY,
  },

  // --- Cloudflare Deployment (from environment variables) ---
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
  },
}

function validate(config) {
  const requiredEnv = ["IMMICH_SERVER", "IMMICH_API_KEY"]

  if (config.deploy?.method === "cloudflare") {
    requiredEnv.push("CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID")
  }

  const missing = requiredEnv.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.warn(
      `Warning: Missing required environment variables: ${missing.join(
        ", "
      )}. Check your .env file or environment setup.`
    )

    process.exit(1) // Exit if critical info is missing
  }
}

export function loadConfig(path = config.paths.configFile) {
  const raw = fs.readFileSync(path, "utf8")
  const yml = yaml.load(raw)
  const cfg = { ...yml, ...config }
  validate(cfg)
  return cfg
}
