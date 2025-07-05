# R-Mart Backend

## Authentication Endpoints (/api/auth)
POST /api/auth/signup - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
POST /api/auth/verify-email - Email verification
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password/:token - Reset password with token
GET /api/auth/check-auth - Check authentication status (protected)
## Product Endpoints (/api/products)
GET /api/products - Get all products (with optional auth)
GET /api/products/category/:category - Get products by category
GET /api/products/:id - Get specific product details (with optional auth)
GET /api/products/seller/:userId/other/:excludeProductId - Get other products by seller
POST /api/products - Create new product (protected, with image upload)
PUT /api/products/:id - Update product (protected, with image upload)
DELETE /api/products/:id - Delete product (protected)
DELETE /api/products/:id/image - Delete specific product image (protected)
## Message/Chat Endpoints (/api/message)
POST /api/message/create - Create new chat (protected)
GET /api/message/chats - Get user's chats (protected)
DELETE /api/message/chat/:id - Delete chat (protected)
GET /api/message/chat/:id - Get messages in chat (protected)
POST /api/message/chat/:id - Send message to chat (protected)
PUT /api/message/chat/:id/seen - Mark messages as seen (protected)
## Saved Products Endpoints (/api/saved-products)
GET /api/saved-products - Get user's saved products (protected)
GET /api/saved-products/:productId/check - Check if product is saved (protected)
POST /api/saved-products - Save a product (protected)
DELETE /api/saved-products/:productId - Remove saved product (protected)
Recently Seen Endpoints (/api/recently-seen)
GET /api/recently-seen - Get recently viewed products (protected)
DELETE /api/recently-seen/clear - Clear recently viewed products (protected)
## User Profile Endpoints (/api/users)
GET /api/users/profile - Get current user's profile (protected)
GET /api/users/by-username/:username - Get user by username (protected)
PUT /api/users/profile - Update user profile (protected)
POST /api/users/profile-pic - Upload profile picture (protected)
DELETE /api/users/profile-pic - Delete profile picture (protected)
PUT /api/users/onboarding/step1 - Update onboarding step 1 (protected)
PUT /api/users/onboarding/complete - Complete onboarding (protected)
PUT /api/users/onboarding - Complete all onboarding steps (protected)
Search Endpoints (/api/search)
GET /api/search/products - Search products (with Elasticsearch)
GET /api/search/suggestions - Get search suggestions/autocomplete

