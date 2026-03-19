# 🎯 WHT Fashion — Staff Admin Dashboard Guide

## Quick Start

**Dashboard URL:** `http://localhost:3004/admin`

**Login Credentials:** 
- Email: `admin@wht.store`
- Password: `admin123`

---

## 📋 Dashboard Overview

The admin dashboard provides staff with a complete order management system to:
- View all customer orders
- Update order status
- Manage delivery partners
- Copy order details for manual booking
- Track order history

### Key Design Principles
✅ **Clean & Minimal** — No distracting elements, focus on data  
✅ **Premium** — Dark theme with gold accents, professional typography  
✅ **Mobile Responsive** — Works on tablets and phones  
✅ **Fast** — Real-time updates every 10 seconds  

---

## 🔐 Authentication

### Login Flow
1. Navigate to `/admin`
2. If not logged in → redirected to `/admin/login`
3. Enter email: `admin@wht.store`
4. Enter password: `admin123`
5. Click **"Login"** button
6. Session stored in browser (token valid until logout)

### Security
- ✅ JWT token-based authentication
- ✅ Server-side authorization for all API calls
- ✅ Session persists in localStorage
- ✅ All sensitive data protected by authMiddleware

---

## 📊 Main Order Management View

### Order List Features

**Search & Filter Toolbar:**
- 🔍 **Search Box** — Find orders by ID, customer name, or phone number
- 📅 **Status Filter** — View only specific order statuses
- 🗓️ **Date Filter** — Filter by order creation date
- 🚚 **Delivery Partner** — Filter by Porter, Rapido Parcel, Self Delivery
- 👤 **Staff Filter** — Show orders assigned to specific team member
- 📍 **City Filter** — Filter by delivery city

**Results Display:**
| Column | Details |
|--------|---------|
| **ID** | Order number (e.g., #1001) |
| **Customer Name** | Full name of buyer |
| **Phone** | Contact number for delivery |
| **Address** | Delivery location |
| **Products** | Item name and quantity |
| **Value** | Order total (₹) |
| **Payment** | Payment method status |
| **Status** | Current order status |
| **Assigned To** | Staff member handling order |
| **Partner** | Delivery provider |
| **Created** | Order date/time |
| **Actions** | Quick action buttons |

### Order Statuses Workflow

```
New Order
   ↓
Accepted (staff claims)
   ↓
Packing (staff starts packing)
   ↓
Packed (item ready)
   ↓
Out for Delivery (with courier)
   ↓
Delivered (completed)
```

**At any stage:** Can mark as `Cancelled`

---

## 🎬 Order Management Workflow

### Step 1: View & Claim Order
1. Orders appear in list with status **"New Order"**
2. Click on order row to open **Order Detail Panel**
3. See complete customer info, address, product details
4. Click **"🙋 Claim This Order"** button if unassigned
5. Order now shows your name in "Assigned to" field

### Step 2: Copy Order Details
1. Order detail panel opens on right side
2. All order information displayed clearly
3. **Click "📋 Copy Order Details" button**
4. Formatted text copied to clipboard including:
   - Order ID
   - Customer name & phone
   - Full delivery address
   - Product details & price
   - Current status

**Format Example:**
```
ORDER #1025
═══════════════════════════════

CUSTOMER DETAILS
Name: Raj Kumar
Phone: 9876543210
Email: raj@example.com

DELIVERY ADDRESS
MG Road, Bangalore, Karnataka - 560001

PRODUCT DETAILS
Item: Black Jacket
Quantity: 1
Price: ₹699

ORDER STATUS
Current: Packed

PAYMENT
Method: Prepaid
Status: paid

DELIVERY PARTNER
Porter
Rider Phone: 9888888888
Tracking Ref: PORT123456

═══════════════════════════════
Prepared for: Porter
Time: 3/19/2026, 4:30:45 PM
```

### Step 3: Update Delivery Partner
1. In Order Detail Panel, find **"Delivery Management"** section
2. Select delivery partner from dropdown:
   - **Porter** — Premium courier service
   - **Rapido Parcel** — Budget-friendly option
   - **Self Delivery** — Internal/manual handling
3. Enter **Rider Phone Number** (optional)
4. Add any **Delivery Notes**
5. Enter **Tracking Reference** if available
6. Click **"Save Delivery Info"** button
7. Info stored in database automatically

### Step 4: Update Order Status
1. In Order Detail Panel, see "Status" section
2. Click **"➡ Move to: [Next Status]"** button
3. Status updates instantly
4. Timeline entry created automatically with timestamp
5. Updates visible in order list

**Quick Actions Available:**
- ✅ Move to next status (Accepted → Packing → Packed, etc.)
- ❌ Cancel Order (if not yet delivered)

### Step 5: Monitor Order Timeline
1. Scroll to **"Order Timeline"** section in detail panel
2. See all status changes with:
   - Old status → New status transition
   - Timestamp of change
   - Staff member who made change
   - Notes about the change
3. Complete history maintained for reference

---

## 🔄 Porter Integration (Manual Booking)

### How to Book with Porter

1. **Copy Order Details** (see Step 2 above)
2. Open **Porter app or website**
3. Create new shipment
4. **Paste copied details** into Porter form:
   - Recipient name & phone
   - Full delivery address
   - Item description (product name)
5. Set pickup location (WHT Fashion warehouse)
6. Set delivery location from copied address
7. Confirm weight & dimensions
8. Pay via Porter
9. Get **tracking reference** from Porter
10. Return to admin panel
11. Update delivery info with **Rider Phone** & **Tracking Ref**
12. Update status to **"Out for Delivery"**

**Benefits of Copy Button:**
- ✅ No manual typing errors
- ✅ Fast data transfer (1 click)
- ✅ Ensures consistency
- ✅ Works offline (paste into Porter later)

---

## 📱 Mobile & Responsive Design

### Features on Mobile
- ✅ Responsive order table (horizontal scroll on small screens)
- ✅ Touch-friendly buttons
- ✅ Clean legend and filters
- ✅ Readable text at all sizes
- ✅ Side panel adapts to screen size

### Recommended Usage
- **Desktop/Laptop:** Full dashboard with all columns
- **Tablet:** Portrait or landscape, filters work smoothly
- **Phone:** Use search to filter, open detail panel for full info

---

## 🎨 UI Theme & Styling

### Color Scheme
| Color | Use |
|-------|-----|
| 🟣 **Purple (#6c5ce7)** | Primary accent, buttons, links |
| 🟢 **Green (#00c853)** | Success status, delivered orders |
| 🔴 **Red (#ff5252)** | Danger, cancel action |
| 🟡 **Gold (#ffab00)** | Warning, processing status |
| 🔵 **Cyan (#40c4ff)** | Info, informational elements |

### Button Types
- **Primary** (Purple) — Main actions (move status, save delivery)
- **Success** (Green) — Positive confirmations
- **Danger** (Red) — Destructive actions (cancel)
- **Secondary** — Less important actions

---

## 🔧 Backend API Endpoints

### All endpoints require authentication (JWT token)

**GET /api/orders**
- List all orders with filters
- Query params: `status`, `search`, `delivery_partner`, `assigned_to`, `city`, `date`
- Returns: Array of order objects

**GET /api/orders/:id**
- Fetch single order with full details
- Returns: Order object + timeline array

**PATCH /api/orders/:id/status**
- Update order status
- Body: `{ "status": "Packed" }`
- Returns: Success message

**PATCH /api/orders/:id/assign**
- Claim/assign order to current user
- Body: empty (auto-assigns to request user)
- Returns: Success message

**PATCH /api/orders/:id/delivery**
- Set delivery partner & tracking info
- Body: `{ "delivery_partner": "Porter", "rider_phone": "9999999999", "tracking_ref": "ABC123", "delivery_notes": "..." }`
- Returns: Success message

---

## 💡 Pro Tips for Staff

### Best Practices
1. **Batch Processing** — Update multiple orders status at once for efficiency
2. **Claim Early** — Claim orders you'll handle to avoid duplicate work
3. **Copy Before Booking** — Always copy order details before opening Porter
4. **Track Updates** — Check timeline for dispute resolution
5. **Note Issues** — Use delivery notes for special handling instructions

### Common Workflows

**Morning Routine:**
1. Filter by status: "New Order"
2. Quickly claim 10-15 orders at once
3. Start packing claimed items

**Booking Deliveries:**
1. Filter by status: "Packed"
2. Open each order
3. Copy details → Paste into Porter
4. Get tracking reference
5. Update tracking ref in admin
6. Change status to "Out for Delivery"

**End of Day:**
1. Filter by status: "Out for Delivery"
2. Check Porter for delivery updates
3. Manually update status to "Delivered" when confirmed
4. Review any "Pending" or "Cancelled" orders

---

## 🆘 Troubleshooting

### Issue: Can't login
- ✅ Check email spelling: `admin@wht.store`
- ✅ Check password: `admin123`
- ✅ Clear browser cache/cookies (Ctrl+Shift+Del)
- ✅ Ensure backend server is running on port 4000

### Issue: Session expires
- ✅ Normal behavior — relogin needed
- ✅ Token stored for 24 hours
- ✅ Click logout then login again

### Issue: Copy button doesn't work
- ✅ Check browser console for errors (F12)
- ✅ Ensure HTTPS is used (or localhost for testing)
- ✅ Some browsers block clipboard access — allow if prompted

### Issue: Orders not updating
- ✅ Refresh page (F5)
- ✅ Dashboard auto-refreshes every 10 seconds
- ✅ Check network connection
- ✅ Ensure backend is running

### Issue: Delivery partner dropdown empty
- ✅ Dropdown should show: Porter, Rapido Parcel, Self Delivery
- ✅ If empty, refresh page and try again

---

## 📈 Dashboard Statistics (Available on Analytics Page)

- Total orders (all time)
- Orders by status (breakdown)
- Revenue by delivery partner
- Top performing staff members
- Order fulfillment time metrics

---

## 🔑 Key Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Focus search box (if implemented) |
| `Esc` | Close detail panel |
| `F5` | Refresh dashboard |
| `F12` | Open browser console (for debugging) |

---

## 📞 Support & Issues

For technical issues:
1. Check console (F12) for error messages
2. Verify backend server is running
3. Try clearing cache and relogging in
4. Check network tab in DevTools for failed requests

---

## 🎓 Training Checklist

### New Staff Should Know:
- [ ] How to login/logout
- [ ] How to claim orders
- [ ] How to update order status
- [ ] How to copy order details
- [ ] How to update delivery partner
- [ ] How to use filters/search
- [ ] How to read order timeline
- [ ] How to handle cancelled orders

---

## 🎯 Summary

The WHT Fashion Admin Dashboard provides a **clean, premium, staff-friendly interface** for order management. With features like copy order details, real-time status updates, and delivery partner tracking, staff can efficiently fulfill orders and manage deliveries manually without any external API integration.

**Remember:** The copy button is your best friend for Porter bookings — use it! 📋✨

---

*Last Updated: March 19, 2026*  
*Admin Dashboard v1.0*
