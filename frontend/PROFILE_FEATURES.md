# Profile Features Documentation

## Overview
The profile system allows users to view detailed profiles of other users, including their profile picture, description, and all their product listings.

## Features Implemented

### 1. User Profile Pages
- **Route**: `/profile/[username]` - Access profiles by username (part before @ in email)
- **Route**: `/profile/user/[id]` - Access profiles by user ID
- **Authentication Required**: Users must be logged in to view any profile pages

### 2. Profile Display
- **Profile Picture**: Displays user's uploaded profile picture or default avatar
- **User Information**: Shows name, username (@username), and description
- **Join Date**: Shows when the user joined the platform
- **Listing Count**: Shows total number of products posted by the user
- **Product Grid**: Displays all products posted by the user in a responsive grid

### 3. Clickable User Links
- **UserLink Component**: Makes user names clickable throughout the app
- **Product Pages**: Seller names are now clickable and link to their profiles
- **Saved Products**: User names in saved product cards are clickable

### 4. Backend API Endpoints
- `GET /api/users/profile` - Get current user's profile (authenticated)
- `GET /api/users/by-username/:username` - Get user by username with products
- `GET /api/users/:id` - Get user by ID with products
- `PUT /api/users/profile` - Update user profile (name, description)
- `POST /api/users/profile-pic` - Upload profile picture
- `DELETE /api/users/profile-pic` - Delete profile picture

### 5. Database Schema Updates
- Added `profile_pic` (TEXT) column to users table
- Added `description` (TEXT) column to users table

## Usage Examples

### Accessing Profiles
```
# By username (if user email is john@example.com)
http://localhost:3001/profile/john

# By user ID
http://localhost:3001/profile/user/123
```

### Profile Features
- View user's profile picture and description
- See all products they've posted
- Click on product cards to view individual products
- Responsive design works on mobile and desktop

### User Links
- Click on seller names in product pages to view their profile
- Click on user names in saved product cards
- Hover effects show the link is clickable

## Security
- All profile routes require authentication
- Users cannot access profiles without being logged in
- Profile pictures are stored securely in AWS S3
- User data is properly sanitized and validated

## Technical Implementation
- **Frontend**: Next.js with Redux for state management
- **Backend**: Express.js with PostgreSQL database
- **File Storage**: AWS S3 for profile pictures
- **Authentication**: JWT-based authentication with cookies
- **Styling**: Tailwind CSS for responsive design

## Future Enhancements
- Add user ratings/reviews
- Implement user messaging system
- Add user verification badges
- Include user activity statistics
- Add social media links to profiles 