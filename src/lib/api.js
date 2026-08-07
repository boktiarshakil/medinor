// ============================================================
// Live Supabase API Service — no demo mode
// ============================================================

import { supabase } from './supabase'

export const api = {
  // ---- Users / Profiles ----

  async getUsers() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async createUser({ email, full_name, phone, role, area_id, password }) {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email,
        password: password || 'Mediron@2025',
        full_name,
        phone,
        role,
        area_id,
      }
    })
    if (error) {
      const message = error.context?.error || error.message || 'Failed to create user'
      throw new Error(message)
    }
    if (data?.error) throw new Error(data.error)
    return data
  },

  async updateUser(id, updates) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteUser(id) {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId: id }
    })
    if (error) {
      const message = error.context?.error || error.message || 'Failed to delete user'
      throw new Error(message)
    }
    if (data?.error) throw new Error(data.error)
    return data
  },

  async toggleUserActive(id, isActive) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Products ----

  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  async createProduct(product) {
    const payload = { ...product }
    if (!payload.sku) payload.sku = `MDN-${Date.now().toString(36).toUpperCase()}`
    if (!payload.category) payload.category = 'General'
    delete payload.stock
    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateProduct(id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // ---- Dealers ----

  async getDealers() {
    const { data, error } = await supabase
      .from('dealers')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  async createDealer(dealer) {
    const { data, error } = await supabase
      .from('dealers')
      .insert(dealer)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateDealer(id, updates) {
    const { data, error } = await supabase
      .from('dealers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Orders ----

  async getOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        dealer:dealers(name),
        items:order_items(*, product:products(name, sku))
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async createOrder(order, items) {
    const payload = { ...order }
    if (!payload.order_number) {
      payload.order_number = `ORD-${Date.now().toString(36).toUpperCase()}`
    }
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(payload)
      .select()
      .single()
    if (orderError) throw orderError

    const orderItems = items.map(item => ({
      order_id: orderData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price ?? item.total ?? item.quantity * item.unit_price,
      discount_percent: item.discount_percent ?? 0,
    }))
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
    if (itemsError) throw itemsError

    return orderData
  },

  async updateOrderStatus(id, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Invoices ----

  async getInvoices() {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        dealer:dealers(name),
        order:orders(order_number)
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // ---- Inventory ----

  async getInventory() {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(name, sku, mrp)
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // ---- Areas ----

  async getAreas() {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  async createArea(area) {
    const { data, error } = await supabase
      .from('areas')
      .insert(area)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateArea(id, updates) {
    const { data, error } = await supabase
      .from('areas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteArea(id) {
    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // ---- Notifications ----

  async getNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return data || []
  },

  async markNotificationRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) throw error
  },

  // ---- CRM ----

  async getCRMContacts() {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  async createCRMContact(contact) {
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(contact)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Support Tickets ----

  async getSupportTickets() {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        dealer:dealers(name),
        assignee:user_profiles(full_name)
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // ---- Personal IDs ----

  async getPersonalIds() {
    // Try dedicated personal_ids table first
    const { data, error } = await supabase
      .from('personal_ids')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      // Table may not exist yet — return empty to trigger fallback
      return { data: null, error }
    }
    return { data: data || [], error: null }
  },

  async createPersonalId(record) {
    const { data, error } = await supabase
      .from('personal_ids')
      .insert(record)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- GPS Tracking ----

  async getGPSHistory(userId) {
    const { data, error } = await supabase
      .from('gps_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data || []
  },

  // ---- Campaigns ----

  async getCampaigns() {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // ---- Returns ----

  async getReturns() {
    const { data, error } = await supabase
      .from('returns')
      .select(`
        *,
        dealer:dealers(name),
        items:return_items(*, product:products(name))
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // ---- Messages ----

  async getMessages({ channel, userId = null, otherUserId = null, areaId = null } = {}) {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: false })
    if (channel === 'direct' && userId) {
      query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    }
    if (channel === 'group' && areaId) {
      query = query.eq('area_id', areaId)
    }
    const { data, error } = await query
    if (error) throw error
    let result = data || []
    if (channel === 'direct' && userId && otherUserId) {
      result = result.filter(m =>
        (m.sender_id === userId && m.recipient_id === otherUserId) ||
        (m.sender_id === otherUserId && m.recipient_id === userId)
      )
    }
    return result
  },

  async sendMessage({ channel, sender_id, recipient_id = null, area_id = null, message }) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ channel, sender_id, recipient_id, area_id, message })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Expose supabase for direct queries
  supabase,
}

export default api
