import axios from "axios"

export function createClient({ immichServer, immichApiToken }) {
  const client = axios.create({
    baseURL: immichServer,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "static-gallery",
      "x-api-key": `${immichApiToken}`,
    },
    responseType: "json",
    timeout: 30_000,
  })

  /**
   * List all assets in an album by paging through its time‐buckets
   */
  async function listAssets(albumId) {
    // 1) fetch buckets
    const { data: buckets } = await client.get(`/timeline/buckets`, {
      params: { albumId, size: "MONTH" },
    })

    // 2) for each bucket, fetch its assets
    const all = []
    for (const { timeBucket } of buckets) {
      const { data: assets } = await client.get(`/timeline/bucket`, {
        params: {
          albumId,
          size: "MONTH",
          timeBucket, // axios will URL‑encode
        },
      })
      all.push(...assets)
    }

    return all // array of asset objects
  }

  /**
   * Download the original bytes for a single asset
   * Returns the Axios response (with a stream in data)
   */
  function downloadAsset(assetId) {
    return client.get(`/assets/${assetId}/original`, {
      responseType: "stream",
    })
  }

  return { listAssets, downloadAsset }
}
