# Frontend API Integration - Quick Start

## What's Been Created

I've created three new API service files to connect your frontend to the real backend:

### 1. **authAPI.js** - Authentication
```javascript
import authAPI from '@/api/authAPI';

// Login
const result = await authAPI.login('username', 'password');
// Returns: { token, user: { role, tableNumber, displayName } }

// Register
await authAPI.register('username', 'email@example.com', 'password');

// Logout
await authAPI.logout();

// Change Password
await authAPI.changePassword('oldPassword', 'newPassword');

// Restore token on app startup (add to App.jsx)
authAPI.restoreToken();
```

### 2. **menuAPI.js** - Menu Management
```javascript
import menuAPI from '@/api/menuAPI';

// Get all menu items
const items = await menuAPI.getAllMenuItems();

// Get by ID
const item = await menuAPI.getMenuItemById(1);

// Get by category
const pizza = await menuAPI.getByCategory('pizza');

// Get available items
const available = await menuAPI.getAvailableItems();

// Search by name
const results = await menuAPI.searchByName('burger');

// Create new menu item (admin)
await menuAPI.createMenuItem(menuItem, imageFile);
```

### 3. **orderAPI.js** - Order Management
```javascript
import orderAPI from '@/api/orderAPI';

// Place order
const order = await orderAPI.placeOrder({
  tableId: 1,
  items: [{ menuItemId: 5, quantity: 2 }],
  notes: 'No onions'
});

// Get all orders
const orders = await orderAPI.getAllOrders();

// Get by ID
const order = await orderAPI.getOrderById(123);

// Get orders for table
const tableOrders = await orderAPI.getOrdersByTable(1);

// Update order status
await orderAPI.updateOrderStatus(123, 'READY');
```

## Configuration

**File:** `.env.local` (already created)
```
VITE_API_URL=http://localhost:8080/api
```

This tells your frontend where the backend is running.

## Quick Integration Steps

### Step 1: Update AppContext.jsx (Login)
Replace the mock credentials check with:
```javascript
import authAPI from '../api/authAPI';

const handleLogin = async (username, password) => {
  try {
    const response = await authAPI.login(username, password);
    setCurrentUser(response.user);
    setIsAuthenticated(true);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};
```

### Step 2: Update AppContext.jsx (Menu)
Replace the mock menu data with:
```javascript
import menuAPI from '../api/menuAPI';

useEffect(() => {
  const loadMenu = async () => {
    try {
      const items = await menuAPI.getAllMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu:', error);
    }
  };
  loadMenu();
}, []);
```

### Step 3: Update RestaurantContext.jsx (Orders)
Replace the localStorage order management with:
```javascript
import orderAPI from '../api/orderAPI';

// In PLACE_ORDER reducer:
const newOrder = await orderAPI.placeOrder({
  tableId: action.payload.tableNumber,
  items: action.payload.items.map(i => ({
    menuItemId: i.id,
    quantity: i.quantity
  }))
});

// Update state with response from backend
```

## Running Everything

### Terminal 1 - Start Backend + Database
```bash
cd code/aura-restaurant-system
docker-compose up -d
```
- Backend will be on `http://localhost:8080`
- Database on `localhost:5432`

### Terminal 2 - Start Frontend
```bash
cd code/aura-restaurant-system/frontend
npm install  # First time only
npm run dev
```
- Frontend will be on `http://localhost:5173`

### Verify Backend is Running
Visit `http://localhost:8080/api/menu` in your browser - you should see JSON data.

## Troubleshooting

### CORS Errors?
If you see "Access to XMLHttpRequest blocked by CORS policy" - the backend needs CORS configuration. Check with your backend team.

### 401 Unauthorized?
The JWT token has expired or isn't being sent. Make sure to:
1. Call `authAPI.restoreToken()` on app startup
2. Log in again if token is missing

### API returning 404?
Verify the backend is running: `http://localhost:8080/api/menu`

### Check Auth Token
In browser console:
```javascript
console.log(localStorage.getItem('authToken'));
console.log(localStorage.getItem('user'));
```

## API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/menu` | Get all menu items |
| POST | `/api/orders` | Place order |
| GET | `/api/orders/{id}` | Get order details |
| PATCH | `/api/orders/{id}/status` | Update order status |
| GET | `/api/admin/stats` | Admin stats |

See `INTEGRATION_GUIDE.js` for the complete list of endpoints.
