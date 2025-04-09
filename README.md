# Server Application

This directory contains the back-end server application of our project.

## Overview

The server application provides the API endpoints, business logic, and data management functionality for our application.

## Technology Stack

- Node.js
- Express.js
- MongoDB (or your chosen database)
- JWT for authentication

## Structure

- `config/` - Configuration files
- `controllers/` - Request handlers for routes
- `middlewares/` - Custom middleware functions
- `models/` - Data models and schema definitions
- `routes/` - API route definitions
- `services/` - Business logic services
- `utils/` - Utility functions and helpers
- `tests/` - Test files

## Getting Started

### Prerequisites

- Node.js (version 14.x or higher recommended)
- npm or yarn
- MongoDB (or your chosen database) installed and running

### Installation

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install
# or
yarn install
```

### Development

```bash
# Start the development server with hot reload
npm run dev
# or
yarn dev
```

The server will be available at `http://localhost:5000` (or your configured port).

### Production

```bash
# Start the server in production mode
npm start
# or
yarn start
```

## Environment Variables

Create a `.env` file in the server directory with the following variables: 

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/your_database
JWT_SECRET=your_jwt_secret
NODE_ENV=development
# Add other environment variables as needed
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/refresh` - Refresh access token

### User Endpoints

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user


## Database

This application uses MongoDB as its database. Make sure you have MongoDB installed and running before starting the server.

To seed the database with initial data:

```bash
npm run seed
# or
yarn seed
```

## Testing

```bash
# Run tests
npm test
# or
yarn test

# Run tests with coverage
npm run test:coverage
# or
yarn test:coverage
```

## Error Handling

The server implements a centralized error handling mechanism. Custom errors can be found in the `utils/errors` directory.

## Logging

Logs are managed using Winston and are stored in the `logs/` directory.

## Contributing

Please follow the project's coding standards and commit message conventions. Write tests for new features and ensure all tests pass before submitting a pull request.

## License

