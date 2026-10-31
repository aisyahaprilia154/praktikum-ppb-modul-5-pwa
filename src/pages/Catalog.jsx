import { useMemo, useState } from 'react'
import { Plus, Loader, RefreshCw } from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import LOCAL_GUNS from '../data/guns'
import GunCard from '../components/gun/GunCard'
import AdvancedFilter from '../components/common/AdvancedFilter'
import { matchesSearch, matchesCategory, sortItems, extractCategories } from '../utils/helpers'

export default function Catalog({ onNavigate }) {
  const { guns, loading, error, refetch, fetching } = useGuns({ limit: 100 })
  const [useLocal, setUseLocal] = useState(false), [search, setSearch] = useState(''), [category, setCategory] = useState('All')
  const [sort, setSort] = useState({ key: 'name', order: 'asc' })
  const local = useLocal || (error && !guns.length)
  const source = useMemo(() => local ? LOCAL_GUNS.map((gun, index) => ({ ...gun, id: `local-${index}` })) : guns, [local, guns])
  const filtered = useMemo(() => sortItems(source.filter((gun) => matchesSearch(gun, search) && matchesCategory(gun, category)), sort.key, sort.order), [source, search, category, sort])
  return <>
    <section className="masthead"><h1 className="display">Hardware, by the spec sheet.</h1><p className="lede">Explore the practice catalog. Save a favorite, share a product, or leave a review.</p></section>
    <section><div className="list-head"><h2>Current stock</h2><div className="list-head-right"><span className="count">{filtered.length} pieces</span>
      <button type="button" className="icon-btn" aria-label="Refresh catalog" disabled={fetching} onClick={() => { setUseLocal(false); refetch() }}><RefreshCw size={16} /></button>
      <button className="btn btn--primary btn--sm" onClick={() => onNavigate('Create')}><Plus size={16} /> Add</button></div></div>
      <AdvancedFilter search={search} onSearch={setSearch} categories={extractCategories(source)} activeCategory={category} onCategory={setCategory} sortKey={sort.key} sortOrder={sort.order} onSort={setSort} />
      {loading && <div className="state-box"><Loader className="spin" /> Loading products…</div>}
      {error && <p className="form-error" role="alert">{error} <button type="button" className="link-btn" onClick={() => setUseLocal(true)}>Use local catalog</button></p>}
      {local && <p className="local-notice">Showing the offline sample catalog.</p>}
      {!loading && !filtered.length && <div className="state-box">No products match your search.</div>}
      <ul className="stock">{filtered.map((gun) => <GunCard key={gun.id} gun={gun} onSelect={(item) => onNavigate('Detail', item)}
        onEdit={!local ? (item) => onNavigate('Edit', item) : undefined} onDelete={!local ? (item) => onNavigate('Archive', item) : undefined} />)}</ul>
    </section>
  </>
}
