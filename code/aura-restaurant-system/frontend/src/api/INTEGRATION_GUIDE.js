/**
 * ============================================================
 *  AURA Frontend — Backend API Integration Guide
 * ============================================================
 *
 *  This guide explains how to configure your React frontend
 *  to call your real Spring Boot backend APIs instead of mock data.
 *
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: ENVIRONMENT CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * File: frontend/.env.local (already created for you)
 *
 * Content:
 *   VITE_API_URL=http://localhost:8080/api
 *
 * This tells your frontend where to find the backend API.
 * The axiosInstance.js already uses this variable:
 *   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
 *
 * If backend is running on a different machine or port, update this URL.
 */

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: AVAILABLE BACKEND ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AUTHENTICATION
 * ──────────────
 * POST   /api/auth/login               → Login with username/password
 * POST   /api/auth/register            → Register new customer
 * POST   /api/auth/logout              → Logout (requires auth token)
 * POST   /api/auth/change-password     → Change password
 *
 * MENU
 * ────
 * GET    /api/menu                     → Get all menu items
 * GET    /api/menu/{id}                → Get menu item by ID
 * GET    /api/menu/category/{category} → Get items by category
 * GET    /api/menu/available           → Get only available items
 * GET    /api/menu/search?keyword=...  → Search items by name
 * POST   /api/menu                     → Create menu item (admin, multipart)
 * PUT    /api/menu/{id}                → Update menu item (admin)
 * DELETE /api/menu/{id}                → Delete menu item (admin)
 *
 * ORDERS
 * ──────
 * POST   /api/orders                   → Place new order
 * GET    /api/orders                   → Get all orders
 * GET    /api/orders/{id}              → Get order by ID
 * GET    /api/orders/table/{tableId}   → Get orders for a specific table
 * PATCH  /api/orders/{id}/status       → Update order status
 *
 * ADMIN
 * ─────
 * GET    /api/admin/stats              → Get admin dashboard statistics
 * GET    /api/admin/revenue?status=... → Get revenue data
 * POST   /api/admin/staff/register     → Create staff/kitchen/admin account
 *
 * IMAGES
 * ──────
 * POST   /api/images/upload            → Upload image (multipart)
 */

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: API SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Three new API service files have been created:
 *
 * 1. src/api/authAPI.js
 *    - authAPI.login(username, password)
 *    - authAPI.register(username, email, password)
 *    - authAPI.logout()
 *    - authAPI.changePassword(oldPassword, newPassword)
 *    - authAPI.restoreToken()
 *
 * 2. src/api/menuAPI.js
 *    - menuAPI.getAllMenuItems()
 *    - menuAPI.getMenuItemById(id)
 *    - menuAPI.getByCategory(category)
 *    - menuAPI.getAvailableItems()
 *    - menuAPI.searchByName(keyword)
 *    - menuAPI.createMenuItem(menuItem, file)
 *
 * 3. src/api/orderAPI.js
 *    - orderAPI.placeOrder(orderData)
 *    - orderAPI.getAllOrders()
 *    - orderAPI.getOrderById(id)
 *    - orderAPI.getOrdersByTable(tableId)
 *    - orderAPI.updateOrderStatus(id, status)
 */

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: HOW TO USE IN YOUR COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Example 1: Replace login mock with real API call
 * ──────────────────────────────────────────────────
 *
 * OLD (AppContext.jsx — Lines ~42):
 *   const handleLogin = (username, password) => {
 *     // Mock credentials check
 *     const user = MOCK_CREDENTIALS[username];
 *     if (!user || user.password !== password) {
 *       throw new Error('Invalid credentials');
 *     }
 *     // ... set user state
 *   };
 *
 * NEW:
 *   import authAPI from '../api/authAPI';
 *
 *   const handleLogin = async (username, password) => {
 *     try {
 *       const response = await authAPI.login(username, password);
 *       setCurrentUser(response.user);
 *       setIsAuthenticated(true);
 *     } catch (error) {
 *       throw new Error(error.response?.data?.message || 'Login failed');
 *     }
 *   };
 */

/**
 * Example 2: Replace mock menu with real API
 * ───────────────────────────────────────────
 *
 * OLD (AppContext.jsx — Lines ~22-80):
 *   function loadInitialMenuItems() {
 *     // Returns hardcoded INITIAL_MENU_ITEMS
 *     return INITIAL_MENU_ITEMS;
 *   }
 *
 * NEW:
 *   import menuAPI from '../api/menuAPI';
 *
 *   function loadInitialMenuItems() {
 *     try {
 *       const items = await menuAPI.getAllMenuItems();
 *       return items;
 *     } catch (error) {
 *       console.error('Failed to load menu:', error);
 *       return []; // Return empty or fallback menu
 *     }
 *   }
 *
 *   // Call this in useEffect when component mounts:
 *   useEffect(() => {
 *     loadInitialMenuItems().then(setMenuItems);
 *   }, []);
 */

/**
 * Example 3: Replace order mock with real API
 * ────────────────────────────────────────────
 *
 * OLD (RestaurantContext.jsx — Lines ~113):
 *   case 'PLACE_ORDER': {
 *     // Creates local order in state
 *     const newOrder = { ... };
 *     // ... save to localStorage
 *   }
 *
 * NEW:
 *   import orderAPI from '../api/orderAPI';
 *
 *   case 'PLACE_ORDER': {
 *     try {
 *       const response = await orderAPI.placeOrder({
 *         tableId: action.payload.tableNumber,
 *         items: action.payload.items.map(i => ({
 *           menuItemId: i.id,
 *           quantity: i.quantity
 *         }))
 *       });
 *       // Server returns order ID and full order object
 *       const newOrder = response;
 *       // ... save to state and localStorage
 *     } catch (error) {
 *       console.error('Failed to place order:', error);
 *     }
 *   }
 */

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: RUNNING YOUR SETUP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Start Backend + Database:
 *    $ cd code/aura-restaurant-system
 *    $ docker-compose up -d
 *
 *    This starts:
 *    - PostgreSQL on port 5432
 *    - Spring Boot backend on port 8080
 *    - (Optional: frontend container, MQTT broker)
 *
 * 2. Build backend (first time only):
 *    $ cd backend
 *    $ mvn clean install
 *
 * 3. Start frontend (in separate terminal):
 *    $ cd frontend
 *    $ npm install              # First time only
 *    $ npm run dev
 *
 *    Frontend will run on http://localhost:5173
 *
 * 4. Verify backend is accessible:
 *    Visit http://localhost:8080/api/menu
 *    You should see a JSON array of menu items
 */

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: AUTHENTICATION & JWT TOKENS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * When user logs in:
 * 1. authAPI.login() sends credentials to /api/auth/login
 * 2. Backend returns JWT token + user object
 * 3. Token stored in localStorage as 'authToken'
 * 4. Token automatically added to all future requests:
 *    Authorization: Bearer <token>
 *
 * To restore login on app startup (add to App.jsx or AppContext):
 *   useEffect(() => {
 *     authAPI.restoreToken(); // Reads token from localStorage
 *   }, []);
 *
 * All API calls will now include the JWT token automatically.
 */

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: ERROR HANDLING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each API function includes error handling:
 *
 * try {
 *   const result = await menuAPI.getAllMenuItems();
 *   // Handle success
 * } catch (error) {
 *   // Error object contains:
 *   //   error.response.status    → HTTP status code
 *   //   error.response.data      → Backend error message
 *   //   error.message            → Network error description
 *
 *   if (error.response?.status === 401) {
 *     // Unauthorized - user needs to login
 *   } else if (error.response?.status === 403) {
 *     // Forbidden - user lacks permission
 *   } else if (error.response?.status === 404) {
 *     // Not found
 *   } else {
 *     // Other error
 *   }
 * }
 */

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8: CORS (Cross-Origin Resource Sharing)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * If you see CORS errors in the browser console:
 *   "Access to XMLHttpRequest blocked by CORS policy"
 *
 * This means the backend needs CORS configuration.
 *
 * Ask your backend team to add @CrossOrigin annotation or
 * configure CORS in Spring Security config:
 *
 *   @Configuration
 *   public class CorsConfig {
 *     @Bean
 *     public WebMvcConfigurer corsConfigurer() {
 *       return new WebMvcConfigurer() {
 *         @Override
 *         public void addCorsMappings(CorsRegistry registry) {
 *           registry.addMapping("/api/**")
 *             .allowedOrigins("http://localhost:5173")
 *             .allowedMethods("*");
 *         }
 *       };
 *     }
 *   }
 */

// ─────────────────────────────────────────────────────────────────────────────
// STEP 9: TESTING API CALLS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * You can test API calls directly in browser console:
 *
 * import menuAPI from '@/api/menuAPI';
 * await menuAPI.getAllMenuItems()
 *   .then(items => console.log(items))
 *   .catch(err => console.error(err))
 *
 * import authAPI from '@/api/authAPI';
 * await authAPI.login('username', 'password')
 *   .then(result => console.log(result))
 *   .catch(err => console.error(err))
 *
 * Or use Postman to test the backend directly:
 * - Base URL: http://localhost:8080
 * - Set Authorization header: Bearer <token>
 */

// ─────────────────────────────────────────────────────────────────────────────
// NEXT STEPS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Update AppContext.jsx
 *    - Replace MOCK_CREDENTIALS with authAPI.login()
 *    - Replace INITIAL_MENU_ITEMS fetch with menuAPI.getAllMenuItems()
 *
 * 2. Update RestaurantContext.jsx
 *    - Replace localStorage state with API calls via orderAPI
 *    - Update PLACE_ORDER reducer to call orderAPI.placeOrder()
 *    - Update status changes to call orderAPI.updateOrderStatus()
 *
 * 3. Test each page:
 *    - LoginPage → test login with real backend
 *    - RobotUI → test order placement
 *    - KitchenDisplay → test order status updates
 *    - AdminDashboard → test admin endpoints
 *
 * 4. (Optional) Set up cross-tab communication:
 *    Instead of localStorage, use WebSocket for real-time sync
 *    between KitchenDisplay and RobotUI tabs
 */

export const INTEGRATION_GUIDE = true;
