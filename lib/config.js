import fs from "fs"
import yaml from "js-yaml"

export function loadConfig(path) {
  const raw = fs.readFileSync(path, "utf8")
  const cfg = yaml.load(raw)
  
  // TODO: validate file
  return cfg
}
