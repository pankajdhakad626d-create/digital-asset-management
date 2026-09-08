const MAX_FILE_SIZE = 20 * 1024 * 1024

const ACCEPTED_FILE_TYPES = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'application/pdf': 'PDF',
  'video/mp4': 'MP4',
  'video/webm': 'WebM',
}

const validateFile = (file) => {
  if (!file) {
    return 'Choose a file to upload.'
  }

  if (!ACCEPTED_FILE_TYPES[file.type]) {
    return 'Unsupported file type. Use JPEG, PNG, WebP, PDF, MP4, or WebM.'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File exceeds the 20 MB size limit.'
  }

  return ''
}

const formatAcceptedTypes = () => Object.values(ACCEPTED_FILE_TYPES).join(', ')

export {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
  formatAcceptedTypes,
  validateFile,
}