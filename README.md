# R-Mart

In development!

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Git

## Project Structure

```
r-mart/
├── frontend/     # Next.js application with React
├── backend/      # Express.js server
```

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/nguyenbrandon327/r-mart.git
cd r-mart
```

### Setup Backend

```bash
cd backend
npm install
# Create a .env file with necessary variables based on .env.example
npm run dev
```

The backend server will start on http://localhost:3000.

### Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend development server will start on http://localhost:3001.

## Available Scripts

### Backend

- `npm run dev` - Start the development server with nodemon
- `npm run seed` - Seed the database with initial data

### Frontend

- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

## Technologies Used

- **Frontend**: Next.js, React, Redux Toolkit, TailwindCSS, DaisyUI
- **Backend**: Express.js, PostgreSQL (via Neon), Node.js

## Deployment

Instructions for deploying the application will be added in the future.
