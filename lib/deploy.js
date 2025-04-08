import { execSync } from "child_process"
import simpleGit from "simple-git"
import dotenv from "dotenv"

dotenv.config()

export async function deploy(config, publicDir) {
  const { method } = config.deploy || {}

  if (!method) {
    console.log("Deploy skipped: no method configured.")
    return
  }

  if (method === "cloudflare") {
    const { projectName, wranglerPath = "wrangler" } =
      config.deploy.cloudflare || {}

      
    const apiToken = process.env.CLOUDFLARE_API_TOKEN

    if (!projectName)
      throw new Error("Cloudflare deploy selected but no projectName provided")
    if (!apiToken)
      throw new Error("CLOUDFLARE_API_TOKEN is missing from your .env file")

    console.log(`Deploying to Cloudflare Pages (project: ${projectName})...`)
    execSync(
      `${wranglerPath} pages deploy ${publicDir} --project-name=${projectName}`,
      {
        stdio: "inherit",
        env: {
          ...process.env,
          CLOUDFLARE_API_TOKEN: apiToken,
        },
      }
    )
    return
  }

  if (method === "github") {
    const { repo, branch, commitMessage } = config.deploy.github || {}
    if (!repo || !branch) throw new Error("GitHub deploy needs repo and branch")

    console.log(`Deploying to GitHub Pages (${branch})...`)
    const git = simpleGit(publicDir)
    await git.init()
    await git.addRemote("origin", repo).catch(() => {}) // ignore if already exists
    await git.add(".")
    await git.commit(commitMessage || "update site")
    await git.push("origin", branch, { "--force": null })
    return
  }

  console.warn(`Unknown deploy method "${method}", skipping deploy.`)
}
