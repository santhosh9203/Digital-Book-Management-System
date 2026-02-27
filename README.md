# Digital Bookshop Management System

Production-style full-stack app for selling digital books with secure PDF delivery.

## Tech Stack

- Frontend: React + Vite + Axios + Tailwind CSS
- Backend: Node.js + Express + MongoDB (Mongoose) + JWT + bcrypt + Multer + Razorpay
- Database: MongoDB
- Storage: Local server storage (`server/uploads/books`)

## Project Structure

```txt
.
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── .env.example
│   ├── tailwind.config.js
│   └── package.json
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── sql/schema.sql
│   ├── uploads/books/
│   ├── utils/
│   ├── .env.example
│   ├── app.js
│   ├── server.js
│   └── package.json
└── README.md
```

## Backend Setup

1. Install dependencies:

```bash
cd server
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Update `server/.env` values:

- `MONGODB_URI` – MongoDB connection string (local or cloud)
  - Local: `mongodb://localhost:27017/digital_bookshop`
  - MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/digital_bookshop`
- `JWT_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `CLIENT_URL`

4. Run database initialization (creates collections if needed):

```bash
npm run db:migrate
```

5. Optional: create an admin user:

```bash
# Add ADMIN_EMAIL and ADMIN_PASSWORD to server/.env first
npm run create:admin
```

6. Start backend:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

## Frontend Setup

1. Install dependencies:

```bash
cd client
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Set API URL in `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

4. Start frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Default API Overview

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Books: `GET /api/books`, `GET /api/books/:id`, `GET /api/books/:id/cover`
- Secure download: `GET /api/books/:id/download` (JWT + paid order required)
- Orders: `POST /api/orders/create-order`, `POST /api/orders/verify`, `GET /api/orders/my-orders`
- Admin: `GET /api/admin/users`, `GET /api/admin/orders`, `GET /api/admin/books`, `POST /api/admin/books`, `PUT /api/admin/books/:id`, `DELETE /api/admin/books/:id`

## Razorpay Test Mode

- Use Razorpay test keys in `server/.env`
- Payment flow:
  1. Backend creates Razorpay order
  2. Frontend opens Razorpay checkout popup
  3. Backend verifies signature using HMAC SHA256
  4. Order marked as `paid` only on valid signature

## Security Implemented

- Helmet
- CORS with configured origin
- Rate limiting
- Input validation (`express-validator`)
- Password hashing (`bcryptjs`)
- JWT auth + role checks
- Parameterized SQL queries
- Centralized error handling with reduced production leakage
- Secure PDF delivery restricted to paid users

## PostgreSQL Schema

Schema was previously in [`server/sql/schema.sql`](/Users/santhosh/Document/Digital%20Book%20Management%20System/server/sql/schema.sql).

Collections (auto-created by Mongoose on first use):

- `users`
- `books`
- `orders`

## Deployment Notes

- Frontend: deploy `client` to Vercel
- Backend: deploy `server` to Render, Railway, Heroku, or AWS Lambda
- Database: MongoDB Atlas (free tier available)

Important: current PDF storage uses local disk. For production platforms with ephemeral storage, move to durable object storage (for example S3-compatible buckets).
