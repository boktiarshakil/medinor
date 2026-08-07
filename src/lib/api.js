// ============================================================
// Live Supabase API Service — no demo mode
// ============================================================

import { supabase } from './supabase'

export const api = {
  // ---- Users / Profiles ----

  async getUsers() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`*, area:areas!fk_user_area(name)`)
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

    let invoice = null
    if (status === 'delivered' || status === 'completed') {
      invoice = await this.createInvoiceForOrder(id)
    }
    return { order: data, invoice }
  },

  async createInvoiceForOrder(orderId) {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(product_id, quantity, unit_price, total_price, discount_percent)
      `)
      .eq('id', orderId)
      .single()
    if (error) throw error
    if (!order) return null

    const { data: existing, error: existingError } = await supabase
      .from('invoices')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle()
    if (existingError) throw existingError
    if (existing) return existing

    const totalAmount = (order.items || []).reduce(
      (sum, item) => sum + (item.total_price ?? item.quantity * item.unit_price),
      0
    )

    const invoicePayload = {
      invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
      order_id: order.id,
      dealer_id: order.dealer_id,
      amount: totalAmount,
      vat_amount: 0,
      total_amount: totalAmount,
      paid_amount: 0,
      due_amount: totalAmount,
      status: 'unpaid',
      invoice_date: new Date().toISOString().split('T')[0],
      notes: `Auto-generated from order ${order.order_number || order.order_no || order.id}`,
    }

    const { data: invData, error: invError } = await supabase
      .from('invoices')
      .insert(invoicePayload)
      .select()
      .single()
    if (invError) throw invError

    await this.deductStockForOrder(order)
    return invData
  },

  async deductStockForOrder(order) {
    const items = order.items || []
    if (items.length === 0) return

    for (const item of items) {
      const { data: invRecords, error: invErr } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_id', item.product_id)
        .order('created_at', { ascending: true })
      if (invErr) throw invErr

      let remaining = item.quantity
      const updates = []
      for (const rec of invRecords || []) {
        if (remaining <= 0) break
        const deduct = Math.min(rec.quantity, remaining)
        updates.push({ id: rec.id, newQty: rec.quantity - deduct })
        remaining -= deduct
      }

      for (const u of updates) {
        await supabase
          .from('inventory')
          .update({ quantity: u.newQty })
          .eq('id', u.id)
      }

      await supabase.from('stock_movements').insert({
        product_id: item.product_id,
        type: 'out',
        quantity: item.quantity,
        reference_type: 'order',
        reference_id: order.id,
        notes: `Order ${order.order_number || order.order_no || order.id}`,
      })
    }
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

  async updateInventory(id, updates) {
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
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

  async getCRMVisits() {
    const { data, error } = await supabase
      .from('crm_visits')
      .select('*, contact:crm_contacts(id, name)')
      .order('visit_date', { ascending: false })
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

  // ---- Invoices ----

  async createInvoice(invoice) {
    const payload = { ...invoice }
    if (!payload.invoice_number) {
      payload.invoice_number = `INV-${Date.now().toString(36).toUpperCase()}`
    }
    const { data, error } = await supabase
      .from('invoices')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateInvoice(id, updates) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Payments ----

  async getPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        dealer:dealers(name),
        invoice:invoices(invoice_number),
        collector:user_profiles(full_name)
      `)
      .order('payment_date', { ascending: false })
    if (error) throw error
    return data || []
  },

  async createPayment(payment) {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Notifications / Announcements ----

  async createNotification(notification) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async broadcastAnnouncement({ title, message, priority = 'medium', audience = 'all', senderId }) {
    const typeMap = { high: 'warning', medium: 'info', low: 'info' }
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('is_active', true)
    if (usersError) throw usersError

    const roleAudience = {
      all: ['super_admin', 'admin', 'sales_manager', 'area_manager', 'sales_executive', 'warehouse', 'dealer'],
      management: ['super_admin', 'admin', 'sales_manager', 'area_manager'],
      rsm_dm: ['sales_manager', 'area_manager'],
      asm: ['area_manager'],
      tso: ['sales_executive'],
      dealers: ['dealer'],
    }
    const targetRoles = roleAudience[audience] || roleAudience.all
    const targets = (users || []).filter(u => targetRoles.includes(u.role))

    const rows = targets.map(u => ({
      user_id: u.id,
      title,
      message,
      type: typeMap[priority] || 'info',
      reference_type: 'announcement',
    }))
    if (rows.length > 0) {
      const { error } = await supabase.from('notifications').insert(rows)
      if (error) throw error
    }
    return { broadcastTo: rows.length }
  },

  // ---- Campaigns ----

  async createCampaign(campaign) {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateCampaign(id, updates) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Returns ----

  async createReturn(returnData, items = []) {
    const { data, error } = await supabase
      .from('returns')
      .insert(returnData)
      .select()
      .single()
    if (error) throw error
    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(items.map(i => ({ ...i, return_id: data.id })))
      if (itemsError) throw itemsError
    }
    return data
  },

  async updateReturnStatus(id, status) {
    const { data, error } = await supabase
      .from('returns')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- CRM ----

  async createCRMVisit(visit) {
    const { data, error } = await supabase
      .from('crm_visits')
      .insert(visit)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Attendance ----

  async getTodayAttendance(userId) {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throw error
    return data?.[0] || null
  },

  async getTodayAttendanceList() {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('attendance')
      .select('user_id, check_in, date')
      .eq('date', today)
    if (error) throw error
    return data || []
  },

  async checkIn(userId, { lat = null, lng = null } = {}) {
    const today = new Date().toISOString().split('T')[0]
    const existing = await this.getTodayAttendance(userId)
    const payload = {
      check_in: new Date().toISOString(),
      check_in_lat: lat,
      check_in_lng: lng,
      status: 'present',
      work_type: 'field',
    }
    if (existing) {
      const { data, error } = await supabase
        .from('attendance')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase
      .from('attendance')
      .insert({ ...payload, user_id: userId, date: today })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Stock movements ----

  async getStockMovements(productId) {
    let query = supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
    if (productId) query = query.eq('product_id', productId)
    const { data, error } = await query.limit(100)
    if (error) throw error
    return data || []
  },

  async addStockMovement(movement) {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(movement)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Products with stock merged from inventory ----

  async getProductsWithStock() {
    const [products, inventory] = await Promise.all([
      this.getProducts(),
      this.getInventory(),
    ])
    const stockMap = {}
    inventory.forEach(i => {
      stockMap[i.product_id] = (stockMap[i.product_id] || 0) + (i.quantity || 0)
    })
    return products.map(p => ({ ...p, stock: stockMap[p.id] ?? null }))
  },

  // ---- Warranty ----

  async getWarrantyRegistrations() {
    const { data, error } = await supabase
      .from('warranties')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async createWarrantyRegistration(reg) {
    const { data, error } = await supabase
      .from('warranties')
      .insert(reg)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getMissedCalls() {
    const { data, error } = await supabase
      .from('missed_calls')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async createMissedCall(mc) {
    const { data, error } = await supabase
      .from('missed_calls')
      .insert(mc)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateMissedCall(id, updates) {
    const { data, error } = await supabase
      .from('missed_calls')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Support tickets ----

  async createSupportTicket(ticket) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert(ticket)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateSupportTicket(id, updates) {
    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
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
