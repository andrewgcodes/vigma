// Image compression utilities for multiplayer sync.
//
// WebRTC data channels have a ~256KB message size limit (Chrome SCTP buffer).
// When a large image (e.g., 3MB base64) is stored in Yjs Y.Map, the Yjs update
// exceeds this limit and Chrome closes the data channel, breaking the connection.
//
// This module provides utilities to compress images before syncing via Yjs,
// keeping the data under the WebRTC limit while preserving the full-resolution
// image locally.

/** Maximum base64 string length to sync via Yjs/WebRTC.
 *  WebRTC data channel limit is ~256KB raw bytes. Base64 encoding adds ~33% overhead,
 *  plus Yjs protocol framing. We use 150KB as a safe threshold for the base64 string,
 *  which translates to ~112KB of raw image data after decoding. */
const MAX_SYNC_BASE64_LENGTH = 150_000

/** Maximum dimension (width or height) for synced images.
 *  Images larger than this are downscaled before syncing. */
const MAX_SYNC_DIMENSION = 800

/** JPEG quality for compressed sync images (0-1). */
const SYNC_JPEG_QUALITY = 0.6

/** Tiny 1x1 gray pixel JPEG used as placeholder when compression fails.
 *  This prevents sending the original oversized data through WebRTC. */
const PLACEHOLDER_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsM' +
  'DhEQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQU' +
  'FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QA' +
  'FAABAAAAAAAAAAAAAAAAAAAAB//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAA' +
  'AAAAAAAAAP/aAAwDAQACEQMRAD8AJQAAAA//' +
  ''

/**
 * Check if a base64 data URL exceeds the safe sync size.
 */
export function isImageTooLargeForSync(dataUrl: string): boolean {
  return dataUrl.length > MAX_SYNC_BASE64_LENGTH
}

/** Result of compressing an image for sync. */
export interface CompressedImageResult {
  src: string
  /** Compressed image pixel width (differs from original if downscaled) */
  width: number
  /** Compressed image pixel height (differs from original if downscaled) */
  height: number
}

/**
 * Compress a base64 image data URL to fit within WebRTC data channel limits.
 * Returns a compressed JPEG data URL with its new pixel dimensions,
 * or the original if already small enough.
 *
 * This runs entirely in the browser using an offscreen canvas.
 */
export function compressImageForSync(dataUrl: string): Promise<CompressedImageResult> {
  return new Promise((resolve) => {
    // Already small enough — no compression needed
    if (!isImageTooLargeForSync(dataUrl)) {
      // Return original dimensions by loading the image
      const probe = new Image()
      probe.onload = () => resolve({ src: dataUrl, width: probe.naturalWidth, height: probe.naturalHeight })
      probe.onerror = () => resolve({ src: dataUrl, width: 0, height: 0 })
      probe.src = dataUrl
      return
    }

    const img = new Image()
    img.onload = () => {
      try {
        // Calculate target dimensions (downscale to MAX_SYNC_DIMENSION)
        let { width, height } = img
        const scale = Math.min(MAX_SYNC_DIMENSION / width, MAX_SYNC_DIMENSION / height, 1)
        width = Math.round(width * scale)
        height = Math.round(height * scale)

        // Draw to offscreen canvas at reduced size
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          // Canvas context unavailable — use placeholder to protect WebRTC connection
          console.warn('[imageSync] Canvas 2D context unavailable, using placeholder')
          resolve({ src: PLACEHOLDER_DATA_URL, width: 1, height: 1 })
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        // Export as JPEG with reduced quality
        let compressed = canvas.toDataURL('image/jpeg', SYNC_JPEG_QUALITY)

        // If still too large, progressively reduce quality
        let quality = SYNC_JPEG_QUALITY
        while (compressed.length > MAX_SYNC_BASE64_LENGTH && quality > 0.15) {
          quality -= 0.1
          compressed = canvas.toDataURL('image/jpeg', Math.max(quality, 0.1))
        }

        // Track final dimensions for scaleX/scaleY adjustment
        let finalWidth = width
        let finalHeight = height

        // If STILL too large, reduce dimensions further
        if (compressed.length > MAX_SYNC_BASE64_LENGTH) {
          const furtherScale = Math.sqrt(MAX_SYNC_BASE64_LENGTH / compressed.length)
          finalWidth = Math.max(Math.round(width * furtherScale), 32)
          finalHeight = Math.max(Math.round(height * furtherScale), 32)
          canvas.width = finalWidth
          canvas.height = finalHeight
          ctx.drawImage(img, 0, 0, finalWidth, finalHeight)
          compressed = canvas.toDataURL('image/jpeg', 0.5)
        }

        // Final safety net: if compression couldn't bring it under the limit,
        // use the placeholder to protect the WebRTC connection.
        if (compressed.length > MAX_SYNC_BASE64_LENGTH) {
          console.warn('[imageSync] Image still too large after all compression attempts, using placeholder')
          resolve({ src: PLACEHOLDER_DATA_URL, width: 1, height: 1 })
          return
        }

        resolve({ src: compressed, width: finalWidth, height: finalHeight })
      } catch {
        // Compression failed — strip src to avoid crashing WebRTC data channel.
        // Remote peers will see a placeholder instead of a broken connection.
        console.warn('[imageSync] Image compression failed, stripping src to protect WebRTC connection')
        resolve({ src: PLACEHOLDER_DATA_URL, width: 1, height: 1 })
      }
    }
    img.onerror = () => {
      // Can't load image — strip src to avoid sending oversized data
      console.warn('[imageSync] Image failed to load for compression, stripping src')
      resolve({ src: PLACEHOLDER_DATA_URL, width: 1, height: 1 })
    }
    img.src = dataUrl
  })
}

/**
 * Prepare a Fabric.js object's JSON for syncing via Yjs.
 * For image objects with large base64 src, compresses the image data.
 * For non-image objects, returns the JSON string as-is.
 *
 * @param objJson - The serialized Fabric.js object (parsed JSON object, not string)
 * @returns Promise resolving to a JSON string safe for WebRTC sync
 */
export async function prepareObjectJsonForSync(objJson: Record<string, unknown>): Promise<string> {
  const objType = typeof objJson.type === 'string' ? objJson.type.toLowerCase() : ''
  if (objType === 'image' && typeof objJson.src === 'string' && objJson.src.startsWith('data:')) {
    if (isImageTooLargeForSync(objJson.src)) {
      const result = await compressImageForSync(objJson.src)
      // Adjust scaleX/scaleY to compensate for the dimension change so
      // the image renders at the same visual size on the remote peer.
      // Original visual size = width * scaleX, so new scaleX = (origWidth * origScaleX) / newWidth
      const adjusted: Record<string, unknown> = { ...objJson, src: result.src }
      const origWidth = typeof objJson.width === 'number' ? objJson.width : 0
      const origHeight = typeof objJson.height === 'number' ? objJson.height : 0
      const origScaleX = typeof objJson.scaleX === 'number' ? objJson.scaleX : 1
      const origScaleY = typeof objJson.scaleY === 'number' ? objJson.scaleY : 1
      if (result.width > 0 && result.height > 0 && origWidth > 0 && origHeight > 0) {
        adjusted.width = result.width
        adjusted.height = result.height
        adjusted.scaleX = (origWidth * origScaleX) / result.width
        adjusted.scaleY = (origHeight * origScaleY) / result.height
      }
      return JSON.stringify(adjusted)
    }
  }
  return JSON.stringify(objJson)
}

/**
 * Synchronously check if an object's serialized JSON would be too large for WebRTC.
 * Used to decide whether to use async compression path.
 */
export function needsCompressionForSync(obj: any): boolean {
  if (!obj || (typeof obj.type === 'string' ? obj.type.toLowerCase() : '') !== 'image') return false
  // Fabric.js v6 FabricImage does NOT expose .src as a property — the image
  // source is only accessible via the getSrc() method (which reads the
  // underlying HTMLImageElement.src or canvas.toDataURL()).
  const src = typeof obj.getSrc === 'function' ? obj.getSrc() : obj.src
  return typeof src === 'string' && src.startsWith('data:') && src.length > MAX_SYNC_BASE64_LENGTH
}
