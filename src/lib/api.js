// ============================================================
// Live Supabase API Service — no demo mode
// ============================================================

import { supabase } from './supabase'
import { generateInvoiceNo, generateTicketNo } from './utils'

export const api = {
  // ---- Users / Profiles ----

  async getUsers({ includeInactive = false } = {}) {
    let query = supabase
      .from('user_profiles')
      .select(`*, area:areas!fk_user_area(name)`)
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
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
    // Prevent deletion if product has transaction history
    const { count: orderCount } = await supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', id)
    const { count: invCount } = await supabase
      .from('inventory')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', id)
    if ((orderCount || 0) > 0) {
      throw new Error(`Cannot delete: product has ${orderCount} order history records. Deactivate instead.`)
    }
    if ((invCount || 0) > 0) {
      throw new Error(`Cannot delete: product has inventory records. Clear stock first.`)
    }
    const { error } = await supabase.from('products').delete().eq('id', id)
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
        sr:user_profiles!orders_sr_id_fkey(full_name),
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
    // Credit limit check: dealer cannot exceed credit_limit
    if (payload.dealer_id && (payload.total_amount || payload.net_amount)) {
      const orderAmount = payload.total_amount || payload.net_amount || 0
      const { data: dealer } = await supabase
        .from('dealers')
        .select('credit_limit, current_due')
        .eq('id', payload.dealer_id)
        .single()
      if (dealer) {
        const due = Number(dealer.current_due) || 0
        // A credit_limit that is null/undefined means "no limit configured".
        // An explicit value (including 0 = cash-only, no credit) is enforced.
        if (dealer.credit_limit != null) {
          const limit = Number(dealer.credit_limit) || 0
          const available = limit - due
          if (orderAmount > available) {
            throw new Error(`Order exceeds available credit (${available} BDT available, ${limit} limit, ${due} due)`)
          }
        }
      }
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

  async updateOrderStatus(id, status, createdBy = null) {
    // Only allow legitimate forward (or cancel) transitions so we never
    // double-reserve stock on re-approval or jump draft→delivered.
    const ORDER_FLOW = {
      draft: ['submitted', 'cancelled'],
      submitted: ['approved', 'cancelled'],
      approved: ['packed', 'cancelled'],
      packed: ['dispatched', 'cancelled'],
      dispatched: ['delivered', 'cancelled'],
      delivered: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    }

    const { data: current } = await supabase
      .from('orders')
      .select('id, status, order_number, stock_reservations')
      .eq('id', id)
      .single()
    if (!current) throw new Error('Order not found')
    if (current.status === status) throw new Error(`Order is already ${status}`)
    const allowed = ORDER_FLOW[current.status] || []
    if (!allowed.includes(status)) {
      throw new Error(`Cannot move order from ${current.status} to ${status}`)
    }

    // Validate stock sufficiency BEFORE changing status, so we never mark
    // an order approved when stock cannot cover it.
    if (status === 'approved') {
      await this.checkStockForOrder(id)
    }

    // An order cannot be completed until the invoice is fully paid.
    if (status === 'completed') {
      const { data: inv } = await supabase
        .from('invoices')
        .select('status, due_amount')
        .eq('order_id', id)
        .maybeSingle()
      const fullyPaid = inv
        ? inv.status === 'paid' || Number(inv.due_amount || 0) <= 0
        : false
      if (!fullyPaid) {
        throw new Error('Cannot complete: payment not fully received')
      }
    }

    // Run the stock side-effects BEFORE committing the new status so a
    // failure never leaves the order marked as if the stock already moved
    // (approved with no reservation, delivered with no deduction).
    if (status === 'approved') {
      await this.reserveStockForOrder(current)
    } else if (status === 'delivered' || status === 'completed') {
      await this.deductReservedStockForOrder(current)
    } else if (status === 'cancelled') {
      await this.releaseReservedStockForOrder(current)
      // Cancel any linked unpaid invoice and reverse the ledger debit so the
      // dealer's current_due is no longer inflated by a dead order.
      await this.cancelOrderInvoice(id)
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    let invoice = null
    // Reserve stock and generate invoice at approval, deduct stock at delivery
    if (status === 'approved' || status === 'dispatched') {
      // Invoice already generated at approval; fall back for legacy orders
      invoice = await this.createInvoiceForOrder(id, createdBy)
    }
    return { order: data, invoice }
  },

  async createInvoiceForOrder(orderId, createdBy = null) {
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

    const subtotal = (order.items || []).reduce(
      (sum, item) => sum + (item.total_price ?? item.quantity * item.unit_price),
      0
    )
    // Respect the order's discount + VAT (the DB trigger keeps net_amount =
    // subtotal − discount_amount + vat_amount in sync). Fall back to subtotal
    // for legacy rows that predate the trigger.
    const discount = Number(order.discount_amount) || 0
    const vat = Number(order.vat_amount) || 0
    const netAmount =
      order.net_amount != null && Number(order.net_amount) > 0
        ? Number(order.net_amount)
        : Math.max(subtotal - discount + vat, 0)
    const totalAmount = netAmount

    const invoicePayload = {
      invoice_number: generateInvoiceNo(),
      order_id: order.id,
      dealer_id: order.dealer_id,
      created_by: createdBy || null,
      amount: subtotal,
      vat_amount: vat,
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

    // Record dealer ledger debit for the invoice
    try {
      await this.recordDealerLedger({
        dealer_id: order.dealer_id,
        transaction_type: 'invoice',
        reference_id: invData.id,
        debit: totalAmount,
        credit: 0,
        description: `Invoice ${invData.invoice_number}`,
        transaction_date: invoicePayload.invoice_date,
      })
    } catch (ledgerErr) {
      console.warn('Dealer ledger write failed:', ledgerErr)
    }

    return invData
  },

  // When an order is cancelled, cancel its linked invoice (if not already
  // paid/cancelled) and reverse the ledger debit recorded at invoice time so
  // the dealer's current_due no longer includes the dead order.
  async cancelOrderInvoice(orderId) {
    const { data: inv } = await supabase
      .from('invoices')
      .select('id, invoice_number, dealer_id, total_amount, status, due_amount')
      .eq('order_id', orderId)
      .maybeSingle()
    if (!inv || inv.status === 'paid' || inv.status === 'cancelled') return

    await supabase
      .from('invoices')
      .update({ status: 'cancelled', due_amount: 0 })
      .eq('id', inv.id)

    try {
      await this.recordDealerLedger({
        dealer_id: inv.dealer_id,
        transaction_type: 'adjustment',
        reference_id: inv.id,
        debit: 0,
        credit: Number(inv.total_amount || inv.amount || 0),
        description: `Invoice ${inv.invoice_number} cancelled (order cancelled)`,
        transaction_date: new Date().toISOString().split('T')[0],
      })
    } catch (ledgerErr) {
      console.warn('Dealer ledger reversal failed:', ledgerErr)
    }
  },

  async checkStockForOrder(orderId) {
    const { data: orderData } = await supabase
      .from('orders')
      .select('items:order_items(product_id, quantity)')
      .eq('id', orderId)
      .single()
    const items = orderData?.items || []

    const missing = []
    for (const item of items) {
      const { data: invRecords } = await supabase
        .from('inventory')
        .select('quantity, quantity_reserved')
        .eq('product_id', item.product_id)
      const available = (invRecords || []).reduce(
        (s, r) => s + (Number(r.quantity) || 0) - (Number(r.quantity_reserved) || 0),
        0
      )
      if (available < item.quantity) {
        const { data: product } = await supabase
          .from('products')
          .select('name, sku')
          .eq('id', item.product_id)
          .single()
        missing.push(`${product?.name || product?.sku || item.product_id} (need ${item.quantity}, have ${available})`)
      }
    }
    if (missing.length > 0) {
      throw new Error(`Cannot approve: insufficient stock for ${missing.join(', ')}`)
    }
  },

  async reserveStockForOrder(order) {
    const { data: orderData } = await supabase
      .from('orders')
      .select('items:order_items(product_id, quantity)')
      .eq('id', order.id)
      .single()
    const items = orderData?.items || []
    if (items.length === 0) return

    const reservations = []
    for (const item of items) {
      const { data: invRecords } = await supabase
        .from('inventory')
        .select('id, quantity, quantity_reserved')
        .eq('product_id', item.product_id)
        .order('created_at', { ascending: true })

      const available = (invRecords || []).reduce(
        (s, r) => s + (Number(r.quantity) || 0) - (Number(r.quantity_reserved) || 0),
        0
      )
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}: need ${item.quantity}, have ${available} available`)
      }

      let remaining = item.quantity
      for (const rec of invRecords || []) {
        if (remaining <= 0) break
        const free = (Number(rec.quantity) || 0) - (Number(rec.quantity_reserved) || 0)
        const reserve = Math.min(free, remaining)
        if (reserve > 0) {
          await supabase
            .from('inventory')
            .update({ quantity_reserved: (Number(rec.quantity_reserved) || 0) + reserve })
            .eq('id', rec.id)
          reservations.push({ inventory_id: rec.id, product_id: item.product_id, quantity: reserve })
          remaining -= reserve
        }
      }
    }

    // Persist reservation references on the order
    await supabase
      .from('orders')
      .update({ stock_reservations: reservations })
      .eq('id', order.id)
  },

  async deductReservedStockForOrder(order) {
    const { data: orderData } = await supabase
      .from('orders')
      .select('items:order_items(product_id, quantity), stock_reservations')
      .eq('id', order.id)
      .single()

    const reservations = orderData?.stock_reservations || []
    // Deduct from both quantity and quantity_reserved
    for (const r of reservations) {
      const { data: inv } = await supabase
        .from('inventory')
        .select('id, quantity, quantity_reserved')
        .eq('id', r.inventory_id)
        .single()
      if (inv) {
        await supabase
          .from('inventory')
          .update({
            quantity: Math.max((Number(inv.quantity) || 0) - (Number(r.quantity) || 0), 0),
            quantity_reserved: Math.max((Number(inv.quantity_reserved) || 0) - (Number(r.quantity) || 0), 0),
          })
          .eq('id', r.inventory_id)
      }
      await supabase.from('stock_movements').insert({
        product_id: r.product_id,
        movement_type: 'out',
        quantity: r.quantity,
        reference_type: 'order',
        reference_id: order.id,
        notes: `Order ${order.order_number || order.order_no || order.id}`,
      })
    }

    // Clear reservations after deduction
    await supabase
      .from('orders')
      .update({ stock_reservations: [] })
      .eq('id', order.id)
  },

  async releaseReservedStockForOrder(order) {
    const { data: orderData } = await supabase
      .from('orders')
      .select('stock_reservations')
      .eq('id', order.id)
      .single()
    const reservations = orderData?.stock_reservations || order.stock_reservations || []
    for (const r of reservations) {
      if (!r.inventory_id) continue
      const { data: inv } = await supabase
        .from('inventory')
        .select('id, quantity_reserved')
        .eq('id', r.inventory_id)
        .single()
      if (inv) {
        await supabase
          .from('inventory')
          .update({
            quantity_reserved: Math.max((Number(inv.quantity_reserved) || 0) - (Number(r.quantity) || 0), 0),
          })
          .eq('id', r.inventory_id)
      }
    }
    await supabase
      .from('orders')
      .update({ stock_reservations: [] })
      .eq('id', order.id)
  },

  // ---- Invoices ----

  async getInvoices() {
    const baseSelect = `
      *,
      dealer:dealers(name, area:areas(name), area_id, assigned_sr_id),
      order:orders(order_number)
    `
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`${baseSelect}, creator:user_profiles!invoices_created_by_fkey(full_name), processedBy:user_profiles!invoices_processed_by_fkey(full_name)`)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (err) {
      // Migration 004 (invoices.created_by) may not be applied yet — retry without the creator join
      const { data, error } = await supabase
        .from('invoices')
        .select(baseSelect)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
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

  async createInventory(inv) {
    const { data, error } = await supabase
      .from('inventory')
      .insert(inv)
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

  async getUnreadNotificationCount(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    if (error) throw error
    return count || 0
  },

  // Active announcements for the scrolling news marquee — the current
  // user's own last 5 active announcements/offers (dealer rows are
  // dealer-targeted, SR rows are SR-targeted, etc.)
  async getActiveAnnouncements(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, type, created_at')
        .eq('user_id', userId)
        .eq('reference_type', 'announcement')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data || []
    } catch (err) {
      // Migration 009 (is_active) may not be applied yet — fall back
      // to the last 5 announcements without the active filter.
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, type, created_at')
        .eq('user_id', userId)
        .eq('reference_type', 'announcement')
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data || []
    }
  },

  async setNotificationActive(id, isActive) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Web push subscriptions ----

  async savePushSubscription({ user_id, endpoint, p256dh, auth }) {
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .eq('endpoint', endpoint)
      .maybeSingle()
    if (existing?.id) {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .update({ p256dh, auth, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({ user_id, endpoint, p256dh, auth })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deletePushSubscription(userId, endpoint) {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
    if (error) throw error
  },

  // Send a real browser push to one or more users via the send-push edge function.
  async sendPush({ userIds, title, body, url = '/' }) {
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: { userIds, title, body, url },
    })
    if (error) {
      const message = error.context?.error || error.message || 'Failed to send push'
      throw new Error(message)
    }
    if (data?.error) throw new Error(data.error)
    return data
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

  // ---- Targets ----

  async getTargets({ userId = null, areaId = null, period = 'monthly', year = null, month = null } = {}) {
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month || now.getMonth() + 1
    let query = supabase
      .from('targets')
      .select('*')
      .eq('period', period)
      .eq('year', targetYear)
      .eq('month', targetMonth)
    if (userId) query = query.eq('user_id', userId)
    if (areaId) query = query.eq('area_id', areaId)
    const { data, error } = await query
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

  async updatePersonalId(id, updates) {
    const { data, error } = await supabase
      .from('personal_ids')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Record a dealer ledger entry and update the dealer's running balance
  async recordDealerLedger({ dealer_id, transaction_type, reference_id, debit = 0, credit = 0, description = '', transaction_date }) {
    // Compute running balance from the latest entry for this dealer
    const { data: last } = await supabase
      .from('dealer_ledger')
      .select('balance')
      .eq('dealer_id', dealer_id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const prevBalance = last?.balance ?? 0
    const balance = prevBalance + debit - credit

    const { data, error } = await supabase
      .from('dealer_ledger')
      .insert({
        dealer_id,
        transaction_type,
        reference_id,
        debit,
        credit,
        balance,
        description,
        transaction_date: transaction_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single()
    if (error) throw error

    // Keep dealers.current_due in sync
    await supabase
      .from('dealers')
      .update({ current_due: Math.max(balance, 0) })
      .eq('id', dealer_id)

    return data
  },

  // ---- Order Comments ----

  async getOrderComments(orderId) {
    const { data, error } = await supabase
      .from('order_comments')
      .select('*, author:user_profiles(full_name, role)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  },

  // Persist a comment and notify the people involved with the order
  // (the SR who owns it, management, and the dealer), excluding the author.
  async addOrderComment(orderId, { userId, step = null, message }) {
    const { data, error } = await supabase
      .from('order_comments')
      .insert({ order_id: orderId, user_id: userId, step, message })
      .select()
      .single()
    if (error) throw error

    try {
      const { data: order } = await supabase
        .from('orders')
        .select('order_number, sr_id, dealer_id, area_id')
        .eq('id', orderId)
        .maybeSingle()
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, role, email, area_id')
        .eq('is_active', true)

      const targets = []
      if (order?.sr_id) targets.push(order.sr_id)
      ;(profiles || [])
        .filter(p => {
          if (p.role === 'area_manager') {
            // Area managers only see updates for orders inside their area.
            return p.area_id === order?.area_id
          }
          return ['super_admin', 'admin', 'sales_manager'].includes(p.role)
        })
        .forEach(p => targets.push(p.id))
      if (order?.dealer_id) {
        const { data: dealer } = await supabase
          .from('dealers')
          .select('email')
          .eq('id', order.dealer_id)
          .maybeSingle()
        const dealerUser = (profiles || []).find(p =>
          p.email && dealer?.email && p.email.toLowerCase() === String(dealer.email).toLowerCase()
        )
        if (dealerUser) targets.push(dealerUser.id)
      }
      const dedup = [...new Set(targets.filter(id => id && id !== userId))]
      await this.notifyUsers(dedup, {
        title: `Order update: ${order?.order_number || '—'}`,
        message,
        type: 'info',
        referenceType: 'order_comment',
        url: '/order-tracker',
      })
    } catch (notifyErr) {
      console.warn('Order comment notification failed:', notifyErr)
    }
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

  async saveLocation(userId, { lat, lng, accuracy = null }) {
    const { data, error } = await supabase
      .from('gps_tracking')
      .insert({ user_id: userId, latitude: lat, longitude: lng, accuracy })
      .select()
      .single()
    if (error) throw error
    return data
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
      payload.invoice_number = generateInvoiceNo()
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

  // Update an invoice and, if it is (now) fully paid, run all side effects
  // in one place:
  //   - set processed_by to the user who made it paid
  //   - auto-complete the linked order (paid → completed)
  // paid/due/status are recomputed from the sum of APPROVED payments in the
  // DB (single source of truth), so stale client state or a double-approval
  // can never corrupt the invoice balance.
  // Returns { invoice, orderCompleted }.
  async updateInvoiceAndHandlePaid(id, updates = {}, paidByUserId = null) {
    const { data: sums, error: sumsErr } = await supabase
      .from('payments')
      .select('amount')
      .eq('invoice_id', id)
      .eq('status', 'approved')
    if (sumsErr) throw sumsErr
    const paid = (sums || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)

    const { data: invRow } = await supabase
      .from('invoices')
      .select('id, total_amount, amount, order_id')
      .eq('id', id)
      .single()
    const total = invRow
      ? Number(invRow.total_amount ?? invRow.amount ?? 0)
      : 0
    const due = Math.max(total - paid, 0)
    const status = due <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'

    const payload = { ...updates }
    delete payload.paid_amount
    delete payload.due_amount
    delete payload.status
    payload.paid_amount = paid
    payload.due_amount = due
    payload.status = status
    if (paidByUserId && status === 'paid') {
      payload.processed_by = paidByUserId
    }
    const invoice = await this.updateInvoice(id, payload)

    let orderCompleted = false
    if (invoice.status === 'paid' && invoice.order_id) {
      // Auto-complete the linked order now that payment is fully received.
      // Only orders that have already progressed through the pipeline
      // (approved → … → delivered) may be auto-completed. An order that was
      // never approved (draft/submitted) must NOT jump to "completed" — doing
      // so would skip stock reservation/deduction and mark a never-shipped
      // order as fulfilled. Such orders stay in the normal workflow and are
      // completed through updateOrderStatus once they actually ship.
      const COMPLETEABLE = ['approved', 'packed', 'dispatched', 'delivered']
      const { data: order } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', invoice.order_id)
        .single()
      if (order && COMPLETEABLE.includes(order.status)) {
        const { data: updatedOrder } = await supabase
          .from('orders')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', order.id)
          .select()
          .single()
        // Deduct reserved stock for the order (same as delivered/completed flow)
        await this.deductReservedStockForOrder(updatedOrder).catch(() => {})
        orderCompleted = true
      }
    }

    // Once the invoice is fully paid, settle it automatically (company share
    // vs dealer margin). Idempotent — the paid invoice is settled exactly once.
    if (invoice.status === 'paid' && invoice.order_id) {
      await this.autoSettleInvoice(id).catch(err => {
        console.warn('Auto-settlement failed:', err)
      })
    }
    return { invoice, orderCompleted }
  },

  // ---- Payments ----

  async getPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        dealer:dealers(name),
        invoice:invoices(invoice_number),
        collector:user_profiles!payments_collected_by_fkey(full_name),
        confirmedBy:user_profiles!payments_confirmed_by_fkey(full_name)
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

  async confirmPayment(id, status, confirmedBy = null) {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status,
        confirmed_by: confirmedBy || null,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Approve a pending payment and reconcile the linked invoice against all
  // approved payments (DB-authoritative, race-safe). Credits the dealer
  // ledger so current_due drops. Returns { invoice, orderCompleted }.
  async approvePayment({ paymentId, confirmedBy = null }) {
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()
    if (payErr) throw payErr

    await this.confirmPayment(payment.id, 'approved', confirmedBy)

    // Credit the dealer ledger so current_due drops when a payment is approved.
    if (payment.invoice_id) {
      try {
        await this.recordDealerLedger({
          dealer_id: payment.dealer_id,
          transaction_type: 'payment',
          reference_id: payment.invoice_id,
          debit: 0,
          credit: Number(payment.amount) || 0,
          description: `Payment approved via ${payment.payment_method || 'unknown method'}`,
          transaction_date: payment.payment_date || new Date().toISOString().split('T')[0],
        })
      } catch (ledgerErr) {
        console.warn('Dealer ledger write failed:', ledgerErr)
      }
    }

    return this.updateInvoiceAndHandlePaid(payment.invoice_id, {}, confirmedBy)
  },

  // ---- Notifications / Announcements ----

  // Insert one notification row per recipient (bell + marquee) and fire real
  // browser push to each of them. Used by announcements, messages, order
  // comments, etc.
  async notifyUsers(userIds, { title, message, type = 'info', referenceType = null, url = null }) {
    const ids = [...new Set((userIds || []).filter(Boolean))]
    if (ids.length === 0) return { notified: 0 }
    const rows = ids.map(uid => ({
      user_id: uid,
      title,
      message,
      type,
      reference_type: referenceType,
    }))
    const { error } = await supabase.from('notifications').insert(rows)
    if (error) throw error
    supabase.functions.invoke('send-push', {
      body: { userIds: ids, title, body: message, url },
    }).catch(err => console.warn('Push send failed:', err))
    return { notified: ids.length }
  },

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
    const typeMap = { high: 'warning', medium: 'info', low: 'success' }
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
      await this.notifyUsers(rows.map(r => r.user_id), {
        title,
        message,
        type: typeMap[priority] || 'info',
        referenceType: 'announcement',
        url: '/announcements',
      })
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

    // On approval, restock returned items into inventory
    if (status === 'approved') {
      try {
        const { data: returnData } = await supabase
          .from('returns')
          .select('*, items:return_items(*)')
          .eq('id', id)
          .single()

        if (returnData?.items) {
          for (const item of returnData.items) {
            await this.addStockMovement({
              product_id: item.product_id,
              movement_type: 'in',
              quantity: item.quantity,
              reference_type: 'return',
              reference_id: id,
              notes: `Return ${returnData.return_number || id}`,
            })
            // Find or create inventory row
            const { data: invRows } = await supabase
              .from('inventory')
              .select('id, quantity')
              .eq('product_id', item.product_id)
              .order('created_at', { ascending: true })
              .limit(1)
            if (invRows && invRows.length > 0) {
              await this.updateInventory(invRows[0].id, {
                quantity: Number(invRows[0].quantity || 0) + Number(item.quantity),
              })
            } else {
              await this.createInventory({
                product_id: item.product_id,
                quantity: item.quantity,
                low_stock_threshold: 50,
              })
            }
          }
        }
      } catch (stockErr) {
        console.warn('Return restock failed:', stockErr)
      }
    }

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

  async checkOut(userId, { lat = null, lng = null } = {}) {
    const today = new Date().toISOString().split('T')[0]
    const existing = await this.getTodayAttendance(userId)
    if (!existing) {
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          user_id: userId,
          date: today,
          check_in: new Date().toISOString(),
          check_out: new Date().toISOString(),
          check_out_lat: lat,
          check_out_lng: lng,
          status: 'present',
          work_type: 'field',
        })
        .select()
        .single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out: new Date().toISOString(),
        check_out_lat: lat,
        check_out_lng: lng,
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ---- Settlements ----

  async createSettlement(settlement) {
    const { data, error } = await supabase
      .from('settlements')
      .insert(settlement)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getSettlements() {
    const { data, error } = await supabase
      .from('settlements')
      .select(`
        *,
        invoice:invoices(invoice_number, status, paid_amount, due_amount),
        order:orders(order_number)
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // Create the settlement record for a fully-paid invoice. The company share
  // comes from the order's snapshotted trade price; the remaining collected
  // amount is the dealer margin. Idempotent: a paid invoice is settled exactly
  // once (enforced by the unique index on settlements.invoice_id).
  async autoSettleInvoice(invoiceId) {
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('id, order_id, dealer_id, total_amount, status')
      .eq('id', invoiceId)
      .maybeSingle()
    if (invErr) throw invErr
    if (!invoice || invoice.status !== 'paid' || !invoice.order_id) return null

    // Already settled — never record twice.
    const { data: existing } = await supabase
      .from('settlements')
      .select('id')
      .eq('invoice_id', invoiceId)
      .maybeSingle()
    if (existing) return existing

    const { data: order } = await supabase
      .from('orders')
      .select('sr_id')
      .eq('id', invoice.order_id)
      .maybeSingle()

    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('product_id, quantity, unit_price, trade_price')
      .eq('order_id', invoice.order_id)
    if (itemsErr) throw itemsErr

    let companyTotal = 0
    const itemBreakdown = (items || []).map((it) => {
      const qty = Number(it.quantity) || 0
      const trade = Number(it.trade_price) || 0
      companyTotal += trade * qty
      return {
        product_id: it.product_id,
        quantity: qty,
        unit_price: Number(it.unit_price) || 0,
        trade_price: trade,
        trade_subtotal: trade * qty,
      }
    })

    const totalCollected = Number(invoice.total_amount) || 0
    const companyAmount = Math.min(companyTotal, totalCollected)
    const dealerMargin = Math.max(totalCollected - companyTotal, 0)

    const { data, error } = await supabase
      .from('settlements')
      .insert({
        order_id: invoice.order_id,
        invoice_id: invoice.id,
        dealer_id: invoice.dealer_id,
        sr_id: order?.sr_id || null,
        company_amount: companyAmount,
        dealer_margin_amount: dealerMargin,
        total_collected: totalCollected,
        item_breakdown: itemBreakdown,
        status: 'auto_settled',
        settled_at: new Date().toISOString(),
      })
      .select()
      .single()

    // A unique-index race (invoice settled by a concurrent approval in between)
    // is harmless — return the record that is already on file.
    if (error) {
      if (error.code === '23505') {
        const { data: raced } = await supabase
          .from('settlements')
          .select('*')
          .eq('invoice_id', invoiceId)
          .maybeSingle()
        return raced
      }
      throw error
    }
    return data
  },

  // Self-heal: ensure every fully-paid invoice with a linked order has a
  // settlement record. Safe to call on page load — it is a no-op for orders
  // that are already settled.
  async reconcileSettlements() {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id')
      .eq('status', 'paid')
      .not('order_id', 'is', null)
    if (error) throw error
    let created = 0
    for (const inv of invoices || []) {
      const rec = await this.autoSettleInvoice(inv.id)
      if (rec?.id) created += 1
    }
    return created
  },

  // ---- COD Orders (public cash-on-delivery requests) ----

  // Record a public COD request. Stored separately from the dealer order
  // pipeline so the main books are never polluted by retail requests.
  async createCodOrder(order) {
    const items = (order.items || []).map(it => ({
      product_id: it.product_id,
      name: it.name || it.product_name || null,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price ?? it.unit_price * it.quantity,
    }))
    const total = order.total_amount ?? items.reduce((s, i) => s + (Number(i.total_price) || 0), 0)

    const { data, error } = await supabase
      .from('cod_orders')
      .insert({
        customer_name: order.customer_name,
        phone: order.phone,
        address: order.address || null,
        notes: order.notes || null,
        items,
        total_amount: total,
        status: 'new',
      })
      .select()
      .single()
    if (error) throw error

    // Notify management so a new COD request never sits unnoticed.
    try {
      const { data: admins } = await supabase
        .from('user_profiles')
        .select('id')
        .in('role', ['super_admin', 'admin'])
        .eq('is_active', true)
      const adminIds = (admins || []).map(a => a.id)
      if (adminIds.length > 0) {
        await this.notifyUsers(adminIds, {
          title: 'New COD Request',
          message: `${order.customer_name} (${order.phone}) placed a COD order — ${items.length} item(s), BDT ${total}`,
          type: 'info',
          referenceType: 'cod_order',
          url: '/cod-requests',
        })
      }
    } catch (notifyErr) {
      console.warn('COD notification failed:', notifyErr)
    }
    return data
  },

  async getCodOrders() {
    const { data, error } = await supabase
      .from('cod_orders')
      .select('*, processedBy:user_profiles!cod_orders_processed_by_fkey(full_name)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async updateCodOrderStatus(id, status, processedBy = null) {
    const { data: current, error: fetchErr } = await supabase
      .from('cod_orders')
      .select('*, items, stock_reservations')
      .eq('id', id)
      .single()
    if (fetchErr) throw fetchErr
    if (!current) throw new Error('COD request not found')

    const items = current.items || []
    const customer = `${current.customer_name} (${current.phone})`
    const patch = {
      status,
      processed_by: processedBy || null,
      processed_at: status === 'new' ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // new → processing: customer confirmed on phone → hold the stock
    if (status === 'processing' && current.status === 'new') {
      const reservations = await this._reserveStockForCod(items)
      patch.stock_reservations = reservations
    }

    // processing → completed: goods shipped + cash collected → final deduction
    if (status === 'completed' && current.status === 'processing') {
      await this._deductReservedStockForCod(current.stock_reservations || [], `COD ${customer}`, id)
      patch.stock_reservations = []
    } else if (status === 'completed' && current.status !== 'processing') {
      throw new Error('COD request must be processing before it can be completed')
    }

    // new/processing → cancelled: give any held stock back
    if (status === 'cancelled' && current.status !== 'cancelled') {
      await this._releaseReservedStockForCod(current.stock_reservations || [])
      patch.stock_reservations = []
    }
    if (status === 'cancelled' && current.status === 'completed') {
      throw new Error('Completed COD orders cannot be cancelled')
    }

    const { data, error } = await supabase
      .from('cod_orders')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Reserve stock for COD items. Throws if any product is short, so nothing is
  // partially reserved on failure.
  async _reserveStockForCod(items) {
    const itemsMeta = items.map(it => ({ product_id: it.product_id, quantity: Number(it.quantity) || 0 }))
    const short = []
    for (const item of itemsMeta) {
      const { data: invRecords, error } = await supabase
        .from('inventory')
        .select('id, quantity, quantity_reserved')
        .eq('product_id', item.product_id)
      if (error) throw error
      const available = (invRecords || []).reduce(
        (s, r) => s + (Number(r.quantity) || 0) - (Number(r.quantity_reserved) || 0),
        0
      )
      if (available < item.quantity) {
        const { data: product } = await supabase
          .from('products')
          .select('name, sku')
          .eq('id', item.product_id)
          .single()
        short.push(`${product?.name || product?.sku || item.product_id} (need ${item.quantity}, have ${available} available)`)
      }
    }
    if (short.length > 0) {
      throw new Error(`Insufficient stock: ${short.join(', ')}`)
    }

    const reservations = []
    for (const item of itemsMeta) {
      if (item.quantity <= 0) continue
      const { data: invRecords } = await supabase
        .from('inventory')
        .select('id, quantity, quantity_reserved')
        .eq('product_id', item.product_id)
        .order('created_at', { ascending: true })
      let remaining = item.quantity
      for (const rec of invRecords || []) {
        if (remaining <= 0) break
        const free = (Number(rec.quantity) || 0) - (Number(rec.quantity_reserved) || 0)
        const reserve = Math.min(free, remaining)
        if (reserve > 0) {
          await supabase
            .from('inventory')
            .update({ quantity_reserved: (Number(rec.quantity_reserved) || 0) + reserve })
            .eq('id', rec.id)
          reservations.push({ inventory_id: rec.id, product_id: item.product_id, quantity: reserve })
          remaining -= reserve
        }
      }
    }
    return reservations
  },

  // Completed: deduct from quantity + reservation and record the outflow.
  async _deductReservedStockForCod(reservations, notes, referenceId) {
    for (const r of reservations || []) {
      const { data: inv } = await supabase
        .from('inventory')
        .select('id, quantity, quantity_reserved')
        .eq('id', r.inventory_id)
        .single()
      if (inv) {
        await supabase
          .from('inventory')
          .update({
            quantity: Math.max((Number(inv.quantity) || 0) - (Number(r.quantity) || 0), 0),
            quantity_reserved: Math.max((Number(inv.quantity_reserved) || 0) - (Number(r.quantity) || 0), 0),
          })
          .eq('id', r.inventory_id)
      }
      await supabase.from('stock_movements').insert({
        product_id: r.product_id,
        movement_type: 'out',
        quantity: r.quantity,
        reference_type: 'cod',
        reference_id: referenceId,
        notes,
      })
    }
  },

  // Cancelled: put held stock back.
  async _releaseReservedStockForCod(reservations) {
    for (const r of reservations || []) {
      if (!r.inventory_id) continue
      const { data: inv } = await supabase
        .from('inventory')
        .select('id, quantity_reserved')
        .eq('id', r.inventory_id)
        .single()
      if (inv) {
        await supabase
          .from('inventory')
          .update({
            quantity_reserved: Math.max((Number(inv.quantity_reserved) || 0) - (Number(r.quantity) || 0), 0),
          })
          .eq('id', r.inventory_id)
      }
    }
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
      const qty = Number(i.quantity) || 0
      const reserved = Number(i.quantity_reserved) || 0
      stockMap[i.product_id] = (stockMap[i.product_id] || 0) + (qty - reserved)
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
    const payload = { ...ticket }
    if (!payload.ticket_number) {
      payload.ticket_number = generateTicketNo()
    }
    const { data, error } = await supabase
      .from('support_tickets')
      .insert(payload)
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

    // Fire notifications (+ web push) for the new message.
    try {
      let targetIds = []
      if (channel === 'direct' && recipient_id) {
        targetIds = [recipient_id]
      } else {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, role, area_id')
          .eq('is_active', true)
        if (channel === 'common') {
          // Dealers can't open /messages, so don't push them common-box posts.
          targetIds = (profiles || [])
            .filter(p => p.role !== 'dealer')
            .map(p => p.id)
        } else if (channel === 'group' && area_id) {
          targetIds = (profiles || [])
            .filter(p => p.area_id === area_id && p.role !== 'dealer')
            .map(p => p.id)
        }
      }
      targetIds = targetIds.filter(id => id !== sender_id)
      await this.notifyUsers(targetIds, {
        title: channel === 'direct' ? 'Direct message' : channel === 'common' ? 'Common box' : 'Territory group',
        message,
        type: 'info',
        referenceType: channel === 'direct' ? 'direct_message' : 'message',
        url: '/messages',
      })
    } catch (notifyErr) {
      console.warn('Message notification failed:', notifyErr)
    }
    return data
  },

  // Expose supabase for direct queries
  supabase,
}

export default api
