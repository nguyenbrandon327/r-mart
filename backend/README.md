# R-Mart Backend

## Environment Variables

The following environment variables are required for the backend to function properly:

### Required Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `CLIENT_URL` - Frontend URL for CORS and email links
- `JWT_SECRET` - Secret key for JWT token signing
- `ENCRYPTION_KEY` - 256-bit encryption key for securing user location data (see below)

### AWS S3 Configuration
- `AWS_REGION` - AWS region for S3 bucket
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_S3_BUCKET_NAME` - S3 bucket name for file uploads

### Optional Services
- `MAILTRAP_TOKEN` - Mailtrap token for email service
- `ARCJET_KEY` - Arcjet API key for security features
- `ELASTICSEARCH_URL` - Elasticsearch URL (default: http://localhost:9200)
- `ELASTICSEARCH_USERNAME` - Elasticsearch username (default: elastic)
- `ELASTICSEARCH_PASSWORD` - Elasticsearch password
- `SYNC_ELASTICSEARCH_ON_STARTUP` - Sync existing products on startup (default: false)

### Generating Encryption Key

To generate a secure 256-bit encryption key for the `ENCRYPTION_KEY` variable, you can use either:

**Option 1: Using the provided script (recommended)**
```bash
node scripts/generateEncryptionKey.js
```

**Option 2: Using Node.js directly**
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
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| POST | `/api/auth/reset-password/:token` | Reset password with token | Public |
| GET | `/api/auth/check-auth` | Check authentication status | Protected |

## Product Endpoints (`/api/products`)

| Method | Endpoint | Description | Protection |
|--------|----------|-------------|------------|
| GET | `/api/products` | Get all products | Optional Auth |
| GET | `/api/products/category/:category` | Get products by category | Public |
| GET | `/api/products/:id` | Get specific product details | Optional Auth |
| GET | `/api/products/seller/:userId/other/:excludeProductId` | Get other products by seller | Public |
| POST | `/api/products` | Create new product (with image upload) | Protected |
| PUT | `/api/products/:id` | Update product (with image upload) | Protected |
| DELETE | `/api/products/:id` | Delete product | Protected |
| DELETE | `/api/products/:id/image` | Delete specific product image | Protected |

## Message/Chat Endpoints (`/api/message`)

| Method | Endpoint | Description | Protection |
|--------|----------|-------------|------------|
| POST | `/api/message/create` | Create new chat | Protected |
| GET | `/api/message/chats` | Get user's chats | Protected |
| DELETE | `/api/message/chat/:id` | Delete chat | Protected |
| GET | `/api/message/chat/:id` | Get messages in chat | Protected |
| POST | `/api/message/chat/:id` | Send message to chat | Protected |
| PUT | `/api/message/chat/:id/seen` | Mark messages as seen | Protected |

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

## Search Endpoints (`/api/search`)

| Method | Endpoint | Description | Protection |
|--------|----------|-------------|------------|
| GET | `/api/search/products` | Search products (with Elasticsearch) | Public |
| GET | `/api/search/suggestions` | Get search suggestions/autocomplete | Public |

---

### Legend
- **Protected**: Requires authentication
- **Public**: No authentication required
- **Optional Auth**: Works with or without authentication, may provide additional features when authenticated
