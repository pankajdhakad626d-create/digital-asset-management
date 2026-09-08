import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    Accept: 'application/json',
  },
})

const getApiErrorMessage = (error) => {
  if (axios.isCancel(error)) {
    return 'Request cancelled'
  }

  return error.response?.data?.error?.message
    || error.response?.data?.error
    || error.response?.data?.message
    || error.message
    || 'Something went wrong'
}

const getAssets = (params, signal) => api.get('/assets', { params, signal })

const getAsset = (id, signal) => api.get(`/assets/${id}`, { signal })

const getStats = (signal) => api.get('/assets/stats', { signal })

const uploadAsset = (file, tags, onUploadProgress, signal) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('tags', tags)

  return api.post('/assets', formData, {
    signal,
    onUploadProgress,
  })
}

const getAssetDownloadUrl = (id) => `${api.defaults.baseURL}/assets/${id}/download`
const getAssetViewUrl = (id) => `${api.defaults.baseURL}/assets/${id}/view`

export {
  getApiErrorMessage,
  getAsset,
  getAssetDownloadUrl,
  getAssetViewUrl,
  getAssets,
  getStats,
  uploadAsset,
}
