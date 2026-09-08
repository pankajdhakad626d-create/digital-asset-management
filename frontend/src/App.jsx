import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Check, Download, FileText, Grid2X2, Image as ImageIcon, List, LoaderCircle, Play, Plus, Search, UploadCloud, Video, X } from 'lucide-react'
import { getApiErrorMessage, getAssetDownloadUrl, getAssetViewUrl, getStats, uploadAsset } from './api/assetsApi'
import useAssets from './hooks/useAssets'
import useDebounce from './hooks/useDebounce'
import { MAX_FILE_SIZE, formatAcceptedTypes, validateFile } from './utils/fileValidation'
import { formatBytes, formatDate, formatFileType, isImage, isPdf, isVideo } from './utils/formatters'
import './App.css'

const initialFilters = { search: '', type: '', tag: '', fromDate: '', toDate: '', sort: 'newest' }

function Preview({ asset, large = false }) {
    const [broken, setBroken] = useState(false)
    const className = large ? 'asset-preview asset-preview-large' : 'asset-preview'
    if (broken) return <div className={`${className} preview-fallback`}><FileText size={28} /><span>Preview unavailable</span></div>
    if (isImage(asset)) return <img className={className} src={asset.secureUrl} alt={asset.originalName} onError={() => setBroken(true)} />
    if (isVideo(asset)) return <div className={`${className} video-preview`}><Video size={36} /><span>Video</span></div>
    if (isPdf(asset)) return <div className={`${className} pdf-preview`}><FileText size={36} /><span>PDF</span></div>
    return <div className={`${className} preview-fallback`}><FileText size={28} /><span>File preview</span></div>
}

function App() {
    const [filters, setFilters] = useState(initialFilters)
    const [page, setPage] = useState(1)
    const [view, setView] = useState('grid')
    const [uploadOpen, setUploadOpen] = useState(false)
    const [selectedAsset, setSelectedAsset] = useState(null)
    const [file, setFile] = useState(null)
    const [tags, setTags] = useState('')
    const [dragging, setDragging] = useState(false)
    const [uploadState, setUploadState] = useState({ loading: false, progress: 0, error: '', success: '' })
    const [stats, setStats] = useState({ totalAssets: 0, totalStorage: 0, imageCount: 0, videoCount: 0, pdfCount: 0 })
    const [statsError, setStatsError] = useState('')
    const fileInputRef = useRef(null)
    const debouncedSearch = useDebounce(filters.search)
    const queryParams = useMemo(() => ({ ...filters, search: debouncedSearch, page, limit: 12 }), [filters, debouncedSearch, page])
    const { assets, pagination, isLoading, error, refetch } = useAssets(queryParams)

    const refreshStats = async () => {
        try { const response = await getStats(); setStats(response.data?.data || response.data); setStatsError('') } catch (requestError) { setStatsError(getApiErrorMessage(requestError)) }
    }
    useEffect(() => { refreshStats() }, [])
    useEffect(() => { setPage(1) }, [filters.search, filters.type, filters.tag, filters.fromDate, filters.toDate, filters.sort])
    useEffect(() => {
        if (!selectedAsset) return undefined
        const onKeyDown = (event) => { if (event.key === 'Escape') setSelectedAsset(null) }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [selectedAsset])

    const chooseFile = (nextFile) => { const validationError = validateFile(nextFile); setUploadState({ loading: false, progress: 0, error: validationError, success: '' }); setFile(validationError ? null : nextFile) }
    const resetUpload = () => { setFile(null); setTags(''); setUploadState({ loading: false, progress: 0, error: '', success: '' }); if (fileInputRef.current) fileInputRef.current.value = '' }
    const submitUpload = async (event) => {
        event.preventDefault()
        const validationError = validateFile(file)
        if (validationError) { setUploadState((current) => ({ ...current, error: validationError })); return }
        setUploadState({ loading: true, progress: 0, error: '', success: '' })
        try {
            await uploadAsset(file, tags, (progressEvent) => { const progress = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0; setUploadState((current) => ({ ...current, progress })) })
            resetUpload(); setUploadState({ loading: false, progress: 100, error: '', success: 'Asset uploaded successfully.' }); setUploadOpen(false); await Promise.all([refetch(), refreshStats()])
        } catch (requestError) { setUploadState({ loading: false, progress: 0, error: getApiErrorMessage(requestError), success: '' }) }
    }
    const closeUpload = () => { if (!uploadState.loading) { resetUpload(); setUploadOpen(false) } }
    const clearFilters = () => { setFilters(initialFilters); setPage(1) }
    const hasFilters = Object.entries(filters).some(([key, value]) => key !== 'sort' && value)
    const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

    return <main className="app-shell">
        <header className="topbar"><div><p className="eyebrow">Digital Asset Management</p><h1>Library</h1><p className="subtitle">A focused home for the files your team relies on.</p></div><div className="header-actions"><span className="asset-count">{stats.totalAssets} assets</span><button className="button button-dark" type="button" onClick={() => setUploadOpen(true)}><Plus size={17} /> Upload Asset</button></div></header>
        <section className="stats-row" aria-label="Asset statistics"><Stat label="Total assets" value={stats.totalAssets} /><Stat label="Images" value={stats.imageCount} icon={<ImageIcon size={16} />} /><Stat label="Videos" value={stats.videoCount} icon={<Play size={16} />} /><Stat label="Storage used" value={formatBytes(stats.totalStorage)} icon={<UploadCloud size={16} />} />{statsError && <span className="inline-error">{statsError}</span>}</section>
        <section className="toolbar" aria-label="Search and filters"><label className="search-field"><Search size={17} /><span className="sr-only">Search assets</span><input value={filters.search} placeholder="Search by filename" onChange={(event) => updateFilter('search', event.target.value)} /></label><select value={filters.type} aria-label="File type" onChange={(event) => updateFilter('type', event.target.value)}><option value="">All types</option><option value="image">Images</option><option value="video">Videos</option><option value="pdf">PDFs</option></select><input aria-label="Filter by tag" value={filters.tag} placeholder="Tag" onChange={(event) => updateFilter('tag', event.target.value)} /><label className="date-field"><CalendarDays size={16} /><input aria-label="From date" type="date" value={filters.fromDate} onChange={(event) => updateFilter('fromDate', event.target.value)} /></label><label className="date-field"><CalendarDays size={16} /><input aria-label="To date" type="date" value={filters.toDate} onChange={(event) => updateFilter('toDate', event.target.value)} /></label><select value={filters.sort} aria-label="Sort order" onChange={(event) => updateFilter('sort', event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>{hasFilters && <button className="button button-quiet" type="button" onClick={clearFilters}>Clear filters</button>}<div className="view-toggle" role="group" aria-label="View mode"><button className={view === 'grid' ? 'active' : ''} type="button" aria-label="Grid view" onClick={() => setView('grid')}><Grid2X2 size={17} /></button><button className={view === 'list' ? 'active' : ''} type="button" aria-label="List view" onClick={() => setView('list')}><List size={17} /></button></div></section>
        {error ? <section className="state-panel"><h2>Could not load your library</h2><p>{error}</p><button className="button button-dark" type="button" onClick={refetch}>Try again</button></section> : isLoading ? <LoadingState /> : assets.length === 0 ? <section className="state-panel"><UploadCloud size={28} /><h2>{hasFilters ? 'No matching assets' : 'Your library is empty'}</h2><p>{hasFilters ? 'Try adjusting your filters.' : 'Upload your first image, PDF, or video to get started.'}</p>{hasFilters ? <button className="button button-quiet" type="button" onClick={clearFilters}>Clear filters</button> : <button className="button button-dark" type="button" onClick={() => setUploadOpen(true)}><Plus size={17} /> Upload asset</button>}</section> : <section className={view === 'grid' ? 'asset-grid' : 'asset-list'}>{assets.map((asset) => <AssetCard key={asset._id} asset={asset} view={view} onView={setSelectedAsset} />)}</section>}
        {pagination.totalPages > 1 && <nav className="pagination" aria-label="Pagination"><button className="button button-quiet" disabled={page <= 1} type="button" onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pagination.totalPages}</span><button className="button button-quiet" disabled={page >= pagination.totalPages} type="button" onClick={() => setPage((current) => current + 1)}>Next</button></nav>}
        {uploadOpen && <UploadDialog dragging={dragging} setDragging={setDragging} file={file} tags={tags} setTags={setTags} uploadState={uploadState} chooseFile={chooseFile} submitUpload={submitUpload} closeUpload={closeUpload} fileInputRef={fileInputRef} />}{selectedAsset && <DetailsDialog asset={selectedAsset} close={() => setSelectedAsset(null)} />}{uploadState.success && !uploadOpen && <div className="toast toast-success" role="status"><Check size={17} /> {uploadState.success}</div>}
    </main>
}

function Stat({ label, value, icon }) { return <div className="stat"><span>{icon}</span><strong>{value}</strong><small>{label}</small></div> }
function LoadingState() { return <section className="asset-grid">{[1, 2, 3, 4].map((item) => <div className="skeleton-card" key={item}><div className="skeleton-block" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</section> }
function AssetCard({ asset, view, onView }) { return <article className={`asset-card ${view === 'list' ? 'asset-card-list' : ''}`}><button className="preview-button" type="button" onClick={() => onView(asset)}><Preview asset={asset} /></button><div className="asset-content"><div className="asset-heading"><div><h2 title={asset.originalName}>{asset.originalName}</h2><p>{formatFileType(asset)} · {formatBytes(asset.size)}</p></div><span className="asset-format">{asset.format?.toUpperCase()}</span></div><p className="asset-date">{formatDate(asset.uploadedAt)}</p><div className="tag-row">{(asset.tags || []).slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}</div><div className="card-actions"><button type="button" className="button button-quiet" onClick={() => onView(asset)}>View</button><a className="button button-quiet" href={getAssetDownloadUrl(asset._id)}><Download size={15} /> Download</a></div></div></article> }
function UploadDialog({ dragging, setDragging, file, tags, setTags, uploadState, chooseFile, submitUpload, closeUpload, fileInputRef }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeUpload() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="upload-title"><div className="modal-header"><div><p className="eyebrow">New library item</p><h2 id="upload-title">Upload an asset</h2></div><button className="icon-button" type="button" aria-label="Close upload dialog" onClick={closeUpload}><X size={19} /></button></div><form onSubmit={submitUpload}><label className={`drop-zone ${dragging ? 'is-dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]) }}><UploadCloud size={27} /><strong>{file ? file.name : 'Drop a file here'}</strong><span>{file ? `${file.type} · ${formatBytes(file.size)}` : 'or choose from your device'}</span><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm" onChange={(event) => chooseFile(event.target.files[0])} /></label><p className="form-hint">{formatAcceptedTypes()} · Maximum {formatBytes(MAX_FILE_SIZE)}</p><label className="form-label">Tags<input value={tags} placeholder="brand, campaign, 2026" onChange={(event) => setTags(event.target.value)} /></label>{uploadState.error && <p className="form-error" role="alert">{uploadState.error}</p>}{uploadState.loading && <div className="progress-wrap"><div className="progress-label"><span>Uploading</span><strong>{uploadState.progress}%</strong></div><progress value={uploadState.progress} max="100" /></div>}<div className="modal-actions"><button className="button button-quiet" type="button" onClick={closeUpload} disabled={uploadState.loading}>Cancel</button><button className="button button-dark" type="submit" disabled={uploadState.loading || !file}>{uploadState.loading ? <><LoaderCircle className="spin" size={16} /> Uploading</> : <><UploadCloud size={16} /> Upload</>}</button></div></form></section></div> }
function DetailsDialog({ asset, close }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}><section className="modal details-modal" role="dialog" aria-modal="true" aria-labelledby="details-title"><div className="modal-header"><div><p className="eyebrow">Asset details</p><h2 id="details-title">{asset.originalName}</h2></div><button className="icon-button" type="button" aria-label="Close details" onClick={close}><X size={19} /></button></div><Preview asset={asset} large /><dl className="details-grid"><div><dt>Type</dt><dd>{asset.mimeType}</dd></div><div><dt>Resource</dt><dd>{asset.resourceType}</dd></div><div><dt>Format</dt><dd>{asset.format}</dd></div><div><dt>Size</dt><dd>{formatBytes(asset.size)}</dd></div><div><dt>Uploaded</dt><dd>{formatDate(asset.uploadedAt)}</dd></div><div><dt>Tags</dt><dd>{asset.tags?.join(', ') || 'None'}</dd></div></dl><div className="modal-actions"><a className="button button-quiet" href={getAssetViewUrl(asset._id)} target="_blank" rel="noreferrer">View original</a><a className="button button-dark" href={getAssetDownloadUrl(asset._id)}><Download size={16} /> Download</a></div></section></div> }
export default App
