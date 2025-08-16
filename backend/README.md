# R-Mart Backend

## Environment Variables

The following environment variables are required for the backend to function properly:

### Required Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `CLIENT_URL` - Frontend URL for CORS and email links
- `JWT_SECRET` - Secret key for JWT token signing
- `ENCRYPTION_KEY` - 256-bit encryption key for securing user location data (see below)
- `PGHOST` - PostgreSQL host
- `PGDATABASE` - PostgreSQL database name
- `PGUSER` - PostgreSQL user
- `PGPASSWORD` - PostgreSQL password

### AWS S3 Configuration
- `AWS_REGION` - AWS region for S3 bucket
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_S3_BUCKET_NAME` - S3 bucket name for file uploads

### Optional Services
- `MAILTRAP_TOKEN` - Mailtrap token for email service
- `ARCJET_KEY` - Arcjet API key for security features
- `MEILISEARCH_URL` - MeiliSearch URL 
- `MEILISEARCH_API_KEY` - MeiliSearch API key
- `SYNC_MEILISEARCH_ON_STARTUP` - Sync existing products to MeiliSearch on startup (`true`/`false`)
- `OPENAI_API_KEY` - Enables AI embeddings for hybrid search 

### Generating Encryption Key

To generate a secure 256-bit encryption key for the `ENCRYPTION_KEY` variable, you can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This key is used to encrypt sensitive user location data (custom addresses and coordinates) before storing them in the database.

⚠️ **Important Security Notes:**
- Keep this key secure and never expose it publicly
- If you change this key, all existing encrypted location data will become unreadable
- Back up this key securely in your production environment
- Use a different key for each environment (development, staging, production)

## Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Protection |
|--------|----------|-------------|------------|
| POST | `/api/auth/signup` | User registration | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/logout` | User logout | Public |
| POST | `/api/auth/verify-email` | Email verification | Public |
| POST | `/api/auth/resend-verification-code` | Resend verification code | Protected |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| POST | `/api/auth/reset-password/:token` | Reset password with token | Public |
| GET | `/api/auth/check-auth` | Check authentication status | Protected |

## Product Endpoints (`/api/products`)

| Method | Endpoint | Description | Protection |
|--------|----------|-------------|------------|
| GET | `/api/products` | Get all products | Optional Auth |
| GET | `/api/products/category/:category` | Get products by category | Public |
| GET | `/api/products/hot` | Get hot/trending products | Public |
| GET | `/api/products/recent` | Get recent products | Public |
| GET | `/api/products/by-location` | Get products near current user | Protected |
| GET | `/api/products/:slug` | Get specific product details by slug | Optional Auth |
| GET | `/api/products/seller/:userId/other/:excludeProductId` | Get other products by seller | Public |
| POST | `/api/products` | Create new product (with image upload) | Protected |
| PUT | `/api/products/:id` | Update product (with image upload) | Protected |
| DELETE | `/api/products/:id` | Delete product | Protected |
| DELETE | `/api/products/:id/image` | Delete specific product image | Protected |
| POST | `/api/products/:slug/view` | Record a product view | Optional Auth |
| PATCH | `/api/products/:id/sold` | Mark product as sold | Protected |
| PATCH | `/api/products/:id/available` | Mark product as available | Protected |

## Message/Chat Endpoints (`/api/message`)

| Method | Endpoint | Description | Protection |
|--------|----------|-------------|------------|
| POST | `/api/message/create` | Create new chat | Protected |
| GET | `/api/message/chats` | Get user's chats | Protected |
| GET | `/api/message/unread-count` | Get unread message count | Protected |
| DELETE | `/api/message/chat/:ulid` | Delete chat | Protected |
| GET | `/api/message/chat/:ulid` | Get messages in chat | Protected |
| POST | `/api/message/chat/:ulid` | Send message to chat | Protected |
| PUT | `/api/message/chat/:ulid/seen` | Mark messages as seen | Protected |

## Saved Products Endpoints (`/api/saved-products`)

| Method | Endpoint | Description | Protection |
|--------|----------|-------------|------------|
| GET | `/api/saved-products` | Get user's saved products | Protected |
| GET | `/api/saved-products/:productId/check` | Check if product is saved | Protected |
| POST | `/api/saved-products` | Save a product | Protected |
| DELETE | `/api/saved-products/:productId` | Remove saved product | Protected |

## Recently Seen Endpoints (`/api/recently-seen`)

| Method | Endpoint | Description | Protection |
|--------|----------|-------------|------------|
| GET | `/api/recently-seen` | Get recently viewed products | Protected |
| DELETE | `/api/recently-seen/clear` | Clear recently viewed products | Protected |

## User Profile Endpoints (`/api/users`)

| Method | Endpoint | Description | Protection |
|--------|----------|-------------|------------|
| GET | `/api/users/profile` | Get current user's profile | Protected |
| GET | `/api/users/by-username/:username` | Get user by username | Protected |
| PUT | `/api/users/profile` | Update user profile | Protected |
| POST | `/api/users/profile-pic` | Upload profile picture | Protected |
| DELETE | `/api/users/profile-pic` | Delete profile picture | Protected |
| PUT | `/api/users/onboarding/step1` | Update onboarding step 1 | Protected |
| PUT | `/api/users/onboarding/complete` | Complete onboarding | Protected |
| PUT | `/api/users/onboarding` | Complete all onboarding steps | Protected |
| PUT | `/api/users/location` | Update user location (on/off campus) | Protected |
| POST | `/api/users/geocode` | Geocode an address to coordinates | Protected |
| POST | `/api/users/check-username` | Check username availability | Protected |
| PUT | `/api/users/username` | Update username | Protected |

## Search Endpoints (`/api/search`)

| Method | Endpoint | Description | Protection |
|--------|----------|-------------|------------|
| GET | `/api/search/products` | AI-powered hybrid search (MeiliSearch) | Optional Auth |
| GET | `/api/search/suggestions` | Get search suggestions/autocomplete | Public |

Notes:
- `GET /api/search/products` supports advanced filters (`category`, `minPrice`, `maxPrice`) and sorting (`best_match`, `recent_first`, `price_low_high`, `price_high_low`).
- Distance-based sorting requires authentication and a saved user location.
- If `OPENAI_API_KEY` is set, hybrid search (keyword + semantic) is enabled via MeiliSearch embedders.

---

### Legend
- **Protected**: Requires authentication
- **Public**: No authentication required
- **Optional Auth**: Works with or without authentication, may provide additional features when authenticated

### Misc
- Health check: `GET /health` returns basic service status
