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
    });

    // 2) for each bucket, fetch its assets
    const assetIds = [];
    for (const { timeBucket } of buckets) {
      const { data: assets } = await client.get(`/timeline/bucket`, {
        params: {
          albumId,
          size: "MONTH",
          timeBucket,
        },
      });

      // assets.id is an array of IDs
      if (Array.isArray(assets.id)) {
        assetIds.push(...assets.id);
      } else if (assets.id) {
        assetIds.push(assets.id);
      }
    }

    // 3) fetch full asset details for each ID
    const all = [];
    for (const id of assetIds) {
      try {
        const { data: asset } = await client.get(`/assets/${id}`);
        if (asset && asset.id && asset.originalPath) {
          all.push(asset);
        } else {
          console.warn(`Asset ${id} missing originalPath or id, skipping.`);
        }
      } catch (err) {
        console.warn(`Failed to fetch asset ${id}:`, err.message);
      }
    }
    return all; // array of asset objects with originalPath
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
