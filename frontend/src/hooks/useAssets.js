import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage, getAssets as requestAssets } from '../api/assetsApi'

const normalizeResponse = (response) => {
  const data = response.data?.data || response.data

  if (Array.isArray(data)) {
    return {
      assets: data,
      pagination: {
        page: 1,
        totalPages: 1,
        total: data.length,
      },
    }
  }

  return {
    assets: data.assets || data.results || [],
    pagination: {
      page: data.page || data.pagination?.page || 1,
      totalPages: data.totalPages || data.pagination?.totalPages || 1,
      total: data.total || data.pagination?.total || data.assets?.length || 0,
    },
  }
}

const useAssets = (params) => {
  const serializedParams = JSON.stringify(params)
  const [state, setState] = useState({
    assets: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
    isLoading: true,
    error: '',
  })

  const fetchAssets = useCallback(async (signal) => {
    setState((current) => ({ ...current, isLoading: true, error: '' }))

    try {
      const response = await requestAssets(JSON.parse(serializedParams), signal)
      setState({ ...normalizeResponse(response), isLoading: false, error: '' })
    } catch (requestError) {
      if (requestError.name === 'CanceledError' || requestError.code === 'ERR_CANCELED') return

      setState((current) => ({ ...current, isLoading: false, error: getApiErrorMessage(requestError) }))
    }
  }, [serializedParams])

  useEffect(() => {
    const controller = new AbortController()
    fetchAssets(controller.signal)

    return () => controller.abort()
  }, [fetchAssets])

  return { ...state, refetch: () => fetchAssets() }
}

export default useAssets