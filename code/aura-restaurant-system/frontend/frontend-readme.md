# AURA Frontend Documentation

Frontend application for the AURA Robotic Restaurant System.

This document is the complete guide for:
- local setup and build
- architecture and state management
- role-based workflows (Table, Kitchen, Admin)
- backend integration roadmap (future enhancements)
- API contract guide for backend implementation

---

## 1. Project Overview

The frontend is a React + Vite single-page app used by three operational roles:

1. Table (Robot UI): place orders, add-ons, and complete payment.
2. Kitchen (KDS): process tickets through status stages.
3. Admin: monitor operations, revenue stats, and manage menu items.

### Core Goals

1. Real-time operational consistency across views.
2. Reliable order lifecycle transitions.
3. Clean future migration path from local mock/state to backend APIs.

---

## 2. Tech Stack

- React 18
- Vite
- React Router v6
- Tailwind CSS
- Axios (prepared for backend HTTP integration)

---

## 3. Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
cd code/aura-restaurant-system/frontend
npm install
```

### Run Development Server

```bash
npm run dev
```

Default URL is usually:

```text
http://localhost:5173
```

### Build

```bash
npm run build
```

Build output goes to:

```text
dist/
```

---

## 4. Scripts

- `npm run dev`: start local development server
- `npm run build`: production build
- `npm run preview`: preview production build locally

---

## 5. Frontend Architecture

### 5.1 High-Level Structure

```text
src/
   api/
      axiosInstance.js
   components/
      common/
      layout/
   context/
      AppContext.jsx
      RestaurantContext.jsx
   hooks/
      useOrders.js              (legacy compatibility)
   pages/
      LoginPage/
      RobotUI/
      KitchenDisplay/
      AdminDashboard/
   store/
      useOrderStore.js          (legacy compatibility)
   utils/
      helpers.js
```

### 5.2 State Ownership

1. `AppContext`
    - session/auth role
    - theme
    - menu catalog
    - menu cross-tab persistence (localStorage + storage listener)

2. `RestaurantContext`
    - order history
    - status transitions (`PENDING -> PREPARING -> READY -> DELIVERED`)
    - payment flags and paid timestamp
    - kitchen/admin/table shared selectors
    - cross-tab synchronization via localStorage storage events

3. Legacy compatibility
    - `useOrders.js` and `useOrderStore.js` are retained only for backward compatibility.
    - New flows should use contexts.

---

## 6. Routing and Role Access

### Route Rules

1. Unauthenticated users are shown Login.
2. `table` role is locked to fullscreen Robot UI.
3. `admin` role can access Admin and Kitchen routes.
4. `kitchen` role is redirected away from Admin routes to Kitchen route.

This prevents kitchen users from accidentally landing in admin screens.

---

## 7. Functional Flows

### 7.1 Table Flow (Robot UI)

1. Browse menu by category.
2. Add items to draft cart.
3. Send order/add-on to kitchen.
4. Observe status progression from kitchen actions.
5. Pay and close session.

### 7.2 Kitchen Flow (KDS)

1. New tickets appear in `PENDING`.
2. Kitchen advances to `PREPARING`.
3. Then to `READY`.
4. Finally to `DELIVERED`.

### 7.3 Admin Flow

1. See active operations and financial metrics.
2. Add/delete menu items.
3. View recent orders and fleet panel.

---

## 8. Current Data Behavior (Important)

### 8.1 Multi-Tab Sync

State is persisted locally and synced between tabs using browser storage events.

### 8.2 Paid-Before-Send Safety

If a user pays before explicitly pressing Send Order, draft items are auto-dispatched to kitchen before payment closure.

### 8.3 Kitchen Visibility Rule

Kitchen live tickets are status-driven (all not `DELIVERED`), not payment-driven. This avoids losing paid-but-not-delivered meals from KDS.

---

## 9. Future Enhancements (Backend Fetching Roadmap)

This section defines what to replace when backend is fully connected.

### 9.1 Authentication

Replace mock credential map with backend auth:

1. Login API with token issuance.
2. Token refresh and expiry handling.
3. Role retrieval via server profile endpoint.
4. Server-side logout verification for staff-only exit actions.

### 9.2 Menu Management

Replace local menu state with backend source of truth:

1. Fetch menu on app boot.
2. Add/delete/update menu through API.
3. Optional availability toggles and soft delete.
4. Ratings field can be backend-driven.

### 9.3 Orders and Status Sync

Replace localStorage sync with backend sync:

1. POST orders to backend.
2. PATCH status from kitchen actions.
3. Live updates via WebSocket/SSE.
4. Reliable retries and optimistic rollback handling.

### 9.4 Payments

Move payment simulation to backend:

1. Generate QR from backend payment provider.
2. Subscribe to payment status stream.
3. Confirm payment with server transaction.
4. Keep order dispatch + payment confirmation atomic server-side.

### 9.5 Admin Analytics

Replace computed dashboard metrics with backend analytics endpoints:

1. confirmed revenue
2. pending totals
3. order throughput
4. robot operational stats

### 9.6 Users and Roles

Introduce user management APIs:

1. staff list
2. role assignment
3. access audit events

### 9.7 Ratings

Add post-delivery feedback flow:

1. rating submission API
2. menu average rating retrieval
3. admin rating insights

---

## 10. API Guide (Backend Contract)

This is the expected API guide for full frontend integration.

Base URL (example):

```text
/api/v1
```

Auth header format (example):

```text
Authorization: Bearer <jwt>
```

### 10.1 Authentication APIs

#### POST `/auth/login`

Request:

```json
{
   "username": "table1",
   "password": "table_pwd_1"
}
```

Response:

```json
{
   "token": "jwt-token",
   "user": {
      "id": "u_123",
      "username": "table1",
      "role": "table",
      "displayName": "Table 1",
      "tableNumber": "T1"
   }
}
```

#### GET `/auth/me`

Response:

```json
{
   "id": "u_123",
   "username": "table1",
   "role": "table",
   "displayName": "Table 1",
   "tableNumber": "T1"
}
```

#### POST `/auth/logout`

Response:

```json
{ "success": true }
```

#### POST `/auth/verify-logout`

Used by staff verification modal before exiting table screen.

Request:

```json
{
   "username": "table1",
   "password": "table_pwd_1"
}
```

Response:

```json
{ "valid": true }
```

---

### 10.2 Menu APIs

#### GET `/menu`

Response:

```json
[
   {
      "id": 1,
      "name": "Truffle Wagyu Burger",
      "price": 28.99,
      "category": "popular",
      "emoji": "🍔",
      "time": "15 min",
      "rating": 4.9,
      "available": true
   }
]
```

#### POST `/menu`

Request:

```json
{
   "name": "Grilled Sea Bass",
   "price": 24.5,
   "category": "mains",
   "emoji": "🐟",
   "time": "18 min"
}
```

Response:

```json
{
   "id": 201,
   "name": "Grilled Sea Bass",
   "price": 24.5,
   "category": "mains",
   "emoji": "🐟",
   "time": "18 min",
   "rating": 0,
   "available": true
}
```

#### DELETE `/menu/:id`

Response:

```json
{ "success": true }
```

---

### 10.3 Orders APIs

#### POST `/orders`

Create initial or add-on order ticket.

Request:

```json
{
   "tableNumber": "T1",
   "isAddon": false,
   "items": [
      { "id": 1, "name": "Truffle Wagyu Burger", "price": 28.99, "quantity": 2 }
   ]
}
```

Response:

```json
{
   "id": "ORD-1001",
   "ticketNum": 101,
   "tableNumber": "T1",
   "status": "PENDING",
   "isPaid": false,
   "isAddon": false,
   "total": 57.98,
   "createdAt": "2026-04-18T10:00:00Z"
}
```

#### PATCH `/orders/:orderId/status`

Request:

```json
{
   "status": "PREPARING"
}
```

Allowed values:

```text
PENDING, PREPARING, READY, DELIVERED
```

Response:

```json
{
   "id": "ORD-1001",
   "status": "PREPARING",
   "updatedAt": "2026-04-18T10:03:00Z"
}
```

#### GET `/orders`

Example query for KDS live board:

```text
/orders?statuses=PENDING,PREPARING,READY
```

#### GET `/orders/history?range=24h`

Used by kitchen history tab and admin historical sections.

---

### 10.4 Payment APIs

#### POST `/payments/generate-qr`

Request:

```json
{
   "tableNumber": "T1",
   "amount": 89.5,
   "currency": "USD"
}
```

Response:

```json
{
   "paymentId": "PAY-777",
   "qrUrl": "https://.../qr/PAY-777"
}
```

#### POST `/payments/confirm`

Recommended atomic behavior on backend:

1. ensure unsent draft payload is converted to pending order ticket(s)
2. mark table unpaid tickets as paid
3. publish status/payment updates to subscribers

Request:

```json
{
   "tableNumber": "T1",
   "paymentId": "PAY-777"
}
```

Response:

```json
{ "success": true }
```

---

### 10.5 Admin Analytics APIs

#### GET `/admin/stats`

Response:

```json
{
   "confirmedRevenue": 12450.25,
   "pendingOrderTotal": 320.75,
   "activeOrders": 9,
   "avgDeliveryMins": 4.2
}
```

#### GET `/admin/revenue?status=PAID`

Response:

```json
{
   "total": 12450.25,
   "currency": "USD"
}
```

---

### 10.6 Users APIs (Future)

#### GET `/users`

#### POST `/users`

#### PATCH `/users/:id`

Use for staff and permission management in future admin modules.

---

### 10.7 Ratings APIs (Future)

#### POST `/ratings`

```json
{
   "orderId": "ORD-1001",
   "menuItemId": 1,
   "score": 5,
   "comment": "Excellent"
}
```

#### GET `/ratings/menu/:menuItemId`

```json
{
   "menuItemId": 1,
   "average": 4.7,
   "count": 240
}
```

---

## 11. Recommended Real-Time Events (WebSocket/SSE)

### Event Names

1. `order.created`
2. `order.status.changed`
3. `payment.confirmed`
4. `menu.updated`

### Example Payload

```json
{
   "type": "order.status.changed",
   "orderId": "ORD-1001",
   "status": "READY",
   "timestamp": "2026-04-18T10:08:00Z"
}
```

---

## 12. Error Handling Expectations

Backend should return consistent error format:

```json
{
   "code": "VALIDATION_ERROR",
   "message": "Price must be greater than 0",
   "details": {}
}
```

Frontend should map:

1. 400: validation UI hints
2. 401: force login
3. 403: role access denied screen
4. 404: graceful empty/fallback state
5. 500: retry + generic error toast

---

## 13. Environment Variables (Suggested)

Create `.env` values like:

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=ws://localhost:8080/ws
```

Use in axios/websocket clients for environment-specific deployment.

---

## 14. Backend Integration Checklist

1. Replace mock login with `/auth/login`.
2. Replace menu local state boot with `GET /menu`.
3. Replace order reducer writes with backend write APIs.
4. Replace local storage sync with websocket event subscription.
5. Replace mock payment steps with provider-backed QR flow.
6. Replace computed admin stats with `/admin/stats`.
7. Add ratings submission and retrieval APIs.

---

## 15. Notes for Maintainers

1. Keep role behavior strict and explicit in routes.
2. Keep status transitions centralized to avoid drift.
3. Prefer status-driven kitchen logic over payment-driven filtering.
4. Preserve atomic payment + order dispatch semantics.

This README should be updated whenever API contracts or role workflows change.
