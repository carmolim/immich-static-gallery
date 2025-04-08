import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"

export async function createCache(file) {
  const adapter = new JSONFile(file)
  const db = new Low(adapter, { albums: {} }) // default data
  await db.read()
  db.data ||= {}
  db.data.albums ||= {}
  return db
}

export function getSeenIds(db, albumId) {
  return db.data.albums[albumId] || []
}

export async function setSeenIds(db, albumId, ids) {
  db.data.albums[albumId] = ids
  await db.write()
}
