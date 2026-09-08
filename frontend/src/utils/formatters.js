const formatBytes = (bytes) => {
  if (!bytes) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / (1024 ** unitIndex)

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

const formatDate = (value) => {
  if (!value) return 'Unknown date'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value))
}

const formatFileType = (asset) => {
  if (asset.mimeType === 'application/pdf') return 'PDF'
  if (asset.mimeType?.startsWith('video/')) return 'Video'
  if (asset.mimeType?.startsWith('image/')) return 'Image'
  return asset.format?.toUpperCase() || 'File'
}

const isImage = (asset) => asset.mimeType?.startsWith('image/')
const isVideo = (asset) => asset.mimeType?.startsWith('video/')
const isPdf = (asset) => asset.mimeType === 'application/pdf'

export {
  formatBytes,
  formatDate,
  formatFileType,
  isImage,
  isPdf,
  isVideo,
}