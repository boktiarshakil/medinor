import { useState, useRef } from 'react'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { formatCurrency, statusColor, filterProductByRole, getPriceForRole, canSeePrice } from '../lib/utils'
import { MdAdd, MdSearch, MdEdit, MdDelete, MdFilterList, MdInventory2, MdLock, MdClose, MdImage, MdCloudUpload } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { uploadToImgBB } from '../lib/upload'
import toast from 'react-hot-toast'
import BlurredValue from '../components/BlurredValue'

export default function Products() {
  const { user, role } = useAuth()
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialQuery)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)
  const editFileInputRef = useRef(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', category: '', mrp: '', trade_price: '', dealer_price: '', purchase_price: '', stock: '', status: 'active', image_url: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setUploadingImage(true)
    try {
      const url = await uploadToImgBB(file)
      setNewProduct(prev => ({ ...prev, image_url: url }))
      toast.success('Image uploaded')
    } catch (err) {
      toast.error('Image upload failed: ' + err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEditImageSelect = async (e) => {
    const file = e.target.files?.[0]
    const input = e.target
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setUploadingImage(true)
    try {
      const url = await uploadToImgBB(file)
      setEditingProduct(prev => prev ? ({ ...prev, image_url: url }) : prev)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error('Image upload failed: ' + err.message)
    } finally {
      setUploadingImage(false)
      input.value = ''
    }
  }

  const handleCreate = async () => {
    if (!newProduct.name.trim()) {
      toast.error('Product name is required')
      return
    }
    setCreating(true)
    try {
      const productPayload = {
        name: newProduct.name,
      }
      if (newProduct.sku) productPayload.sku = newProduct.sku
      if (newProduct.category) productPayload.category = newProduct.category
      if (newProduct.mrp) productPayload.mrp = Number(newProduct.mrp)
      if (newProduct.trade_price) productPayload.trade_price = Number(newProduct.trade_price)
      if (newProduct.dealer_price) productPayload.dealer_price = Number(newProduct.dealer_price)
      if (newProduct.purchase_price) productPayload.purchase_price = Number(newProduct.purchase_price)
      if (newProduct.image_url) productPayload.image_url = newProduct.image_url
      const created = await api.createProduct(productPayload)
      if (newProduct.stock && created) {
        await api.addStockMovement({ product_id: created.id, movement_type: 'in', quantity: Number(newProduct.stock), reference_type: 'opening_stock', notes: 'Initial stock' })
        const invCheck = await api.getInventory().then(inv => inv.find(i => i.product_id === created.id))
        if (invCheck) {
          await api.updateInventory(invCheck.id, { quantity: (invCheck.quantity || 0) + Number(newProduct.stock) })
        } else {
          await api.createInventory({ product_id: created.id, quantity: Number(newProduct.stock), low_stock_threshold: 50 })
        }
      }
      toast.success(`Product "${newProduct.name}" created`)
      setNewProduct({ name: '', sku: '', category: '', mrp: '', trade_price: '', dealer_price: '', purchase_price: '', stock: '', status: 'active', image_url: '' })
      setShowCreate(false)
      fetchProducts()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct({
      id: product.id,
      name: product.name || '',
      sku: product.sku || '',
      category: product.category || '',
      mrp: product.mrp || '',
      trade_price: product.trade_price || '',
      dealer_price: product.dealer_price || '',
      purchase_price: product.purchase_price || '',
      stock: product.stock || '',
      status: product.status || 'active',
      image_url: product.image_url || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingProduct.name.trim()) {
      toast.error('Product name is required')
      return
    }
    setSaving(true)
    try {
      const payload = { name: editingProduct.name }
      if (editingProduct.sku) payload.sku = editingProduct.sku
      if (editingProduct.category) payload.category = editingProduct.category
      if (editingProduct.mrp) payload.mrp = Number(editingProduct.mrp)
      if (editingProduct.trade_price) payload.trade_price = Number(editingProduct.trade_price)
      if (editingProduct.dealer_price) payload.dealer_price = Number(editingProduct.dealer_price)
      if (editingProduct.purchase_price) payload.purchase_price = Number(editingProduct.purchase_price)
      payload.image_url = editingProduct.image_url || ''
      payload.status = editingProduct.status || 'active'
      await api.updateProduct(editingProduct.id, payload)
      toast.success(`Product "${editingProduct.name}" updated`)
      setEditingProduct(null)
      fetchProducts()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setDeletingId(product.id)
    try {
      await api.deleteProduct(product.id)
      toast.success(`Product "${product.name}" deleted`)
      fetchProducts()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await api.getProductsWithStock()
      const normalized = data.map(p => ({
        ...p,
        purchase: p.purchase_price,
        trade: p.trade_price,
        dealer: p.dealer_price,
      }))
      setProducts(normalized)
    } catch (err) {
      console.error('Products fetch failed:', err.message, err.details || '', err.hint || '')
      toast.error('Products: ' + (err.message || 'Failed to load'))
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(products.map(p => p.category))]
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchSearch && matchCategory
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Product catalog ({products.length} items)</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <MdAdd size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-full sm:w-48"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading products...</p>
        </div>
      ) : (
      <>
      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(product => (
          <div key={product.id} className="card card-hover overflow-hidden">
            {/* Product image */}
            {product.image_url ? (
              <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <MdImage size={48} className="text-gray-300" />
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{product.name}</h3>
                <span className={statusColor(product.status)}>{product.status}</span>
              </div>

              <p className="text-[10px] font-mono text-gray-400 mb-3">{product.sku}</p>

              {/* Price display based on role — PRICE ISOLATION */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
                {/* MRP always visible */}
                <div>
                  <span className="text-gray-400">MRP</span>
                  <p className="font-semibold text-gray-800">{formatCurrency(product.mrp)}</p>
                </div>

                {/* Dealer price — only for dealer role and above */}
                {canSeePrice(role, 'dealer_price') && (
                  <div>
                    <span className="text-gray-400">Dealer Price</span>
                    <p className="font-semibold text-brand-600">{formatCurrency(product.dealer)}</p>
                  </div>
                )}

                {/* Trade price — for managers and SR */}
                {canSeePrice(role, 'trade_price') && (
                  <div>
                    <span className="text-gray-400">Trade Price</span>
                    <p className="font-medium text-gray-600">{formatCurrency(product.trade)}</p>
                  </div>
                )}

                {/* Purchase price — admin only */}
                {canSeePrice(role, 'purchase_price') && (
                  <div>
                    <span className="text-gray-400 flex items-center gap-0.5">Cost <MdLock size={9} /></span>
                    <p className="font-medium text-red-600">
                      <BlurredValue value={formatCurrency(product.purchase)} />
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-gray-400">Stock</span>
                  <p className={`font-semibold ${(product.stock ?? 0) < 50 ? 'text-amber-600' : 'text-gray-800'}`}>{(product.stock ?? 0)} pcs</p>
                </div>
              </div>

              {/* Role-based price access indicator */}
              {role === 'sales_executive' && (
                <div className="text-[9px] text-gray-400 bg-gray-50 rounded px-2 py-1 mb-2 flex items-center gap-1">
                  <MdLock size={9} /> You see trade price. Dealer price hidden.
                </div>
              )}
              {role === 'dealer' && (
                <div className="text-[9px] text-gray-400 bg-gray-50 rounded px-2 py-1 mb-2 flex items-center gap-1">
                  <MdLock size={9} /> You see your dealer price + MRP only.
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-50">
                <button className="btn-ghost flex-1 text-xs" onClick={() => handleEdit(product)}>
                  <MdEdit size={14} /> Edit
                </button>
                <button
                  className="btn-ghost text-xs text-red-500 hover:bg-red-50"
                  onClick={() => handleDelete(product)}
                  disabled={deletingId === product.id}
                >
                  {deletingId === product.id
                    ? <div className="w-3.5 h-3.5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto" />
                    : <MdDelete size={14} />
                  }
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <MdInventory2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No products found</p>
        </div>
      )}
      </>
      )}

      {/* Create Product Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Add New Product</h3>
                <p className="text-xs text-gray-500 mt-0.5">Create product in catalog</p>
              </div>
              <button onClick={() => { setShowCreate(false); setNewProduct({ name: '', sku: '', category: '', mrp: '', trade_price: '', dealer_price: '', purchase_price: '', stock: '', status: 'active', image_url: '' }); }} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="label">Product Image</label>
                <div className="flex items-center gap-3">
                  {newProduct.image_url ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewProduct(prev => ({ ...prev, image_url: '' }))}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5"
                      >
                        <MdClose size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                      ) : (
                        <MdCloudUpload size={20} />
                      )}
                    </button>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                      {uploadingImage ? 'Uploading...' : 'Click to upload (max 5MB)'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">ImgBB hosted</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Product Name *</label>
                  <input type="text" className="input" placeholder="e.g. Mediron Prime BP Monitor"
                    value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">SKU</label>
                  <input type="text" className="input" placeholder="MED-BP-001"
                    value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} />
                </div>
                <div>
                  <label className="label">Category</label>
                  <input type="text" className="input" placeholder="e.g. BP Monitor"
                    value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
                </div>
                <div>
                  <label className="label">MRP</label>
                  <input type="number" className="input" placeholder="0"
                    value={newProduct.mrp} onChange={(e) => setNewProduct({ ...newProduct, mrp: e.target.value })} />
                </div>
                <div>
                  <label className="label">Trade Price</label>
                  <input type="number" className="input" placeholder="0"
                    value={newProduct.trade_price} onChange={(e) => setNewProduct({ ...newProduct, trade_price: e.target.value })} />
                </div>
                <div>
                  <label className="label">Dealer Price</label>
                  <input type="number" className="input" placeholder="0"
                    value={newProduct.dealer_price} onChange={(e) => setNewProduct({ ...newProduct, dealer_price: e.target.value })} />
                </div>
                <div>
                  <label className="label">Purchase Price</label>
                  <input type="number" className="input" placeholder="0"
                    value={newProduct.purchase_price} onChange={(e) => setNewProduct({ ...newProduct, purchase_price: e.target.value })} />
                </div>
                <div>
                  <label className="label">Stock Qty</label>
                  <input type="number" className="input" placeholder="0"
                    value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowCreate(false); setNewProduct({ name: '', sku: '', category: '', mrp: '', trade_price: '', dealer_price: '', purchase_price: '', stock: '', status: 'active', image_url: '' }); }} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleCreate} disabled={!newProduct.name || creating} className="btn-primary flex-1 disabled:opacity-50">
                  {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <><MdAdd size={15} /> Create Product</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Edit Product</h3>
                <p className="text-xs text-gray-500 mt-0.5">Update product details</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="label">Product Image</label>
                <div className="flex items-center gap-3">
                  {editingProduct.image_url ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={editingProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, image_url: '' })}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5"
                      >
                        <MdClose size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                      ) : (
                        <MdCloudUpload size={20} />
                      )}
                    </button>
                  )}
                  <div className="flex-1">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageSelect}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                      {uploadingImage ? 'Uploading...' : 'Click to upload (max 5MB)'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">ImgBB hosted</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Product Name *</label>
                  <input type="text" className="input" placeholder="e.g. Mediron Prime BP Monitor"
                    value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">SKU</label>
                  <input type="text" className="input" placeholder="MED-BP-001"
                    value={editingProduct.sku} onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })} />
                </div>
                <div>
                  <label className="label">Category</label>
                  <input type="text" className="input" placeholder="e.g. BP Monitor"
                    value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} />
                </div>
                <div>
                  <label className="label">MRP</label>
                  <input type="number" className="input" placeholder="0"
                    value={editingProduct.mrp} onChange={(e) => setEditingProduct({ ...editingProduct, mrp: e.target.value })} />
                </div>
                <div>
                  <label className="label">Trade Price</label>
                  <input type="number" className="input" placeholder="0"
                    value={editingProduct.trade_price} onChange={(e) => setEditingProduct({ ...editingProduct, trade_price: e.target.value })} />
                </div>
                <div>
                  <label className="label">Dealer Price</label>
                  <input type="number" className="input" placeholder="0"
                    value={editingProduct.dealer_price} onChange={(e) => setEditingProduct({ ...editingProduct, dealer_price: e.target.value })} />
                </div>
                <div>
                  <label className="label">Purchase Price</label>
                  <input type="number" className="input" placeholder="0"
                    value={editingProduct.purchase_price} onChange={(e) => setEditingProduct({ ...editingProduct, purchase_price: e.target.value })} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={editingProduct.status}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditingProduct(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSaveEdit} disabled={!editingProduct.name || saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <>Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
