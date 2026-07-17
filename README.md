# 🛒 E-commerce Backend API

A complete RESTful E-commerce Backend built using NestJS, Prisma ORM, PostgreSQL, Better Auth, and Swagger.

---

## 🚀 Features

- User Authentication
- Role-Based Authorization (Admin/User)
- Product Management
- Category Management
- Shopping Cart
- Order Management
- Product Reviews
- Admin Dashboard APIs
- Swagger API Documentation
- Prisma ORM
- PostgreSQL Database

---

## 🛠 Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Better Auth
- Swagger (OpenAPI)
- Git & GitHub

---

## 📁 Project Structure

```
src/
│── auth/
│── users/
│── categories/
│── products/
│── cart/
│── orders/
│── reviews/
│── dashboard/
│── prisma/
│── common/
```

---

## ⚙️ Installation

Clone the repository

```bash
git clone git@github.com:msafiullah0011-spec/ecommerce-backend.git
```

Move into the project

```bash
cd ecommerce-backend
```

Install dependencies

```bash
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root.

Example:

```env
DATABASE_URL=your_postgresql_database_url

BETTER_AUTH_SECRET=your_secret

BETTER_AUTH_URL=http://localhost:3000
```

---

## ▶️ Run the Project

Development

```bash
npm run start:dev
```

Production

```bash
npm run start:prod
```

---

## 🗄 Database

Generate Prisma Client

```bash
npx prisma generate
```

Run migrations

```bash
npx prisma migrate dev
```

Open Prisma Studio

```bash
npx prisma studio
```

---

## 📖 API Documentation

Swagger UI

```
http://localhost:3000/api/docs
```

---

## 📌 Main Modules

- Authentication
- Users
- Categories
- Products
- Cart
- Orders
- Reviews
- Dashboard

---

## 🔒 Authentication

Authentication is implemented using **Better Auth**.

Protected routes use:

- Authentication Guards
- Role Guards

Roles:

- Admin
- User

---

## 📷 Screenshots

Add screenshots later.

Example:

```
images/swagger-home.png
images/products-api.png
images/dashboard-api.png
```

---

## 📚 Future Improvements

- Payment Gateway Integration
- Email Verification
- Password Reset
- Product Images Upload
- Wishlist
- Search & Filtering
- Docker Support
- CI/CD Pipeline

---

## 👨‍💻 Author

**Safi Ullah**

GitHub:

https://github.com/msafiullah0011-spec

---

## 📄 License

This project is licensed under the MIT License.
