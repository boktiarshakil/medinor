// ============================================================
// Live Supabase API Service
// Replaces demo data with real database calls
// ============================================================

import { supabase } from './supabase'
import { demoApi, isDemo } from './demo'

// Check if we should use demo mode
const useDemo = () => isDemo()

// ============================================================
// USER MANAGEMENT (Admin only)
// ============================================================

export const api = {
  // ---- Users / Profiles ----

  async getUsers() {
    if (useDemo()) return demoApi.getUsers()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async createUser({ email, full_name, phone, role, area_id, password }) {
    if (useDemo()) throw new Error('Cannot create users in demo mode')

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password || 'TempPass123!',
      email_confirm: true,
      user_metadata: { full_name, role }
    })
    if (authError) throw authError

    // Profile is auto-created via trigger or we insert it
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name,
        phone,
        role,
        area_id,
        is_active: true
      })
    if (profileError) throw profileError

    return authData.user
  },

  async updateUser(id, updates) {
    if (useDemo()) return updates
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
    if (useDemo()) return
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error) throw error
  },

  async toggleUserActive(id, isActive) {
    if (useDemo()) return { id, is_active: isActive }
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
    if (useDemo()) return demoApi.getProducts()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  async createProduct(product) {
    if (useDemo()) throw new Error('Demo mode')
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateProduct(id, updates) {
    if (useDemo()) throw new Error('Demo mode')
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Dealers ----

  async getDealers() {
    if (useDemo()) return demoApi.getDealers()
    const { data, error } = await supabase
      .from('dealers')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  async createDealer(dealer) {
    if (useDemo()) throw new Error('Demo mode')
    const { data, error } = await supabase
      .from('dealers')
      .insert(dealer)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateDealer(id, updates) {
    if (useDemo()) throw new Error('Demo mode')
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
    if (useDemo()) return demoApi.getOrders()
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        dealer:dealers(name),
        sr:user_profiles(full_name),
        items:order_items(*, product:products(name, sku))
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async createOrder(order, items) {
    if (useDemo()) throw new Error('Demo mode')
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single()
    if (orderError) throw orderError

    const orderItems = items.map(item => ({ ...item, order_id: orderData.id }))
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
    if (itemsError) throw itemsError

    return orderData
  },

  async updateOrderStatus(id, status) {
    if (useDemo()) throw new Error('Demo mode')
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
    if (useDemo()) return demoApi.getInvoices()
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
    if (useDemo()) return demoApi.getInventory()
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
    if (useDemo()) return demoApi.getAreas()
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  // ---- Notifications ----

  async getNotifications(userId) {
    if (useDemo()) return []
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
    if (useDemo()) return
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) throw error
  },

  // ---- CRM ----

  async getCRMContacts() {
    if (useDemo()) return demoApi.getCRM()
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  // ---- Support Tickets ----

  async getSupportTickets() {
    if (useDemo()) return []
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

  // ---- GPS Tracking ----

  async getGPSHistory(userId) {
    if (useDemo()) return []
    const { data, error } = await supabase
      .from('gps_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data || []
  },
}

export default api
