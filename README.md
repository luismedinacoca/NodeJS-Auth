# 🔐 NodeJS Authentication Project

## 📖 Project Description

This is a complete authentication and authorization project developed with **Node.js**, **Express.js**, and **MongoDB**. It implements a robust user management system with **JWT (JSON Web Tokens)** based authentication, security middleware, role-based access control, and password encryption.

### 🎯 Project Goals

- **Secure Authentication**: Implement login and registration with credential validation
- **Role-based Authorization**: Access control based on user roles (user/admin)
- **Password Security**: Encryption with bcrypt and salt
- **Token Management**: JWT generation, validation, and expiration
- **Custom Middleware**: Route protection and permission validation
- **Scalable Architecture**: Separation of concerns and modular code

## Project Structure

```
07_NodeJS-Auth/
├── controllers/
│   └── auth-controller.js          # 🎮 Authentication controllers
├── database/
│   └── db.js                       # 🗄️ MongoDB database configuration
├── middleware/
│   ├── auth-middleware.js          # 🔒 JWT authentication middleware
│   └── admin-middleware.js         # 👑 Admin authorization middleware
├── models/
│   └── User.js                     # 👤 User model (Mongoose)
├── routes/
│   ├── admin-routes.js             # 🛡️ Protected admin routes
│   ├── auth-routes.js              # 🔐 Authentication routes (login/register)
│   └── home-routes.js              # 🏠 Protected main routes
├── img/                            # 📸 Documentation images
├── package.json                    # 📦 Project dependencies
├── server.js                       # 🚀 Main Express server
└── README.md                       # 📖 Project documentation
```

## 🧩 Component Description

### 📁 **Controllers (`/controllers`)**
- **`auth-controller.js`**: Contains business logic for:
  - 📝 **User registration** (`registerUser`)
  - 🔐 **User login** (`loginUser`)
  - 🔒 **Password encryption** with bcrypt
  - 🎫 **JWT token generation**
  - ✅ **Credential validation**

### 🗄️ **Database (`/database`)**
- **`db.js`**: MongoDB configuration and connection using Mongoose

### 🔒 **Middleware (`/middleware`)**
- **`auth-middleware.js`**: 
  - 🎫 Verifies JWT tokens in authorization headers
  - 🔍 Decodes user information
  - 🛡️ Protects routes that require authentication
- **`admin-middleware.js`**:
  - 👑 Verifies administrator role
  - 🚫 Blocks access to users without admin permissions

### 👤 **Models (`/models`)**
- **`User.js`**: Mongoose schema that defines:
  - `username`: Unique username
  - `email`: Unique email
  - `password`: Encrypted password
  - `role`: User role (`user` | `admin`)

### 🛣️ **Routes (`/routes`)**
- **`auth-routes.js`**: Authentication endpoints
- **`home-routes.js`**: Protected routes for authenticated users
- **`admin-routes.js`**: Exclusive routes for administrators

### 🚀 **Server (`server.js`)**
- Application entry point
- Express and middleware configuration
- Routes and database connection

# Diagrama de Clases del Proyecto

```mermaid
classDiagram
    class Server {
        +start()
        +useMiddleware()
        +setRoutes()
    }
    class AuthController {
        +login()
        +register()
        +logout()
    }
    class DB {
        +connect()
        +disconnect()
        +query()
    }
    class AuthMiddleware {
        +authenticate()
        +authorize()
    }
    class AuthRoutes {
        +loginRoute()
        +registerRoute()
    }
    class AdminRoutes {
        +adminPanelRoute()
    }
    class HomeRoutes {
        +homeRoute()
    }
    class User {
        +username
        +password
        +email
    }

    Server --> AuthController
    Server --> DB
    Server --> AuthMiddleware
    Server --> AuthRoutes
    Server --> AdminRoutes
    Server --> HomeRoutes
    AuthController --> User
    AuthRoutes --> AuthController
    AdminRoutes --> AuthController
```

This diagram represents the relationship between the main components of the project:
- `server.js` initializes the server and connects controllers, middleware, and routes.
- Controllers manage authentication and user logic.
- The database handles connection and queries.
- Middleware controls authentication and authorization.
- Routes define endpoints for authentication, administration, and main page.

---

## 🔐 JWT Authentication System

### 🎫 **What are JWT Tokens?**

**JWT (JSON Web Token)** is an open standard (RFC 7519) that defines a compact and secure way to transmit information between parties as a JSON object. JWT tokens are used for authentication and authorization in web applications.

#### **JWT Structure:**
```
Header.Payload.Signature
```

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2M2Y5YjNlMiIsInVzZXJuYW1lIjoianVhbiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjc3NDU2NzAwLCJleHAiOjE2Nzc0NTcwMDB9.5mF_8H3jK9LpR2sE1nM6xT4wY7bN3qC8vA5zD9iO2uI
```

#### **JWT Components:**

1. **🔧 Header**:
```json
{
  "alg": "HS256",    // Encryption algorithm
  "typ": "JWT"       // Token type
}
```

2. **📦 Payload**:
```json
{
  "userId": "63f9b3e2",
  "username": "juan",
  "role": "user",
  "iat": 1677456700,    // Issued At (issue date)
  "exp": 1677457000     // Expiration (expiration date)
}
```

3. **🔒 Signature**:
```javascript
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### 🔄 **JWT Authentication Flow**

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database
    participant M as Middleware

    C->>S: POST /api/auth/login {username, password}
    S->>DB: Find user by username
    DB->>S: Return user data
    S->>S: Verify password with bcrypt
    S->>S: Generate JWT token
    S->>C: Return JWT token
    C->>S: GET /api/home/welcome (Authorization: Bearer token)
    S->>M: Verify token in middleware
    M->>M: Decode and validate JWT
    M->>S: Valid token, continue
    S->>C: Return protected data
```

### 🛡️ **JWT System Advantages**

- **🔓 Stateless**: No server-side storage required
- **🚀 Scalable**: Works in distributed applications
- **📱 Cross-platform**: Compatible with web, mobile, and APIs
- **🔒 Secure**: Cryptographically signed
- **⚡ Fast**: Local verification without DB queries

---

## 🔒 Authentication Middleware

### 🛠️ **auth-middleware.js**

The authentication middleware is the **guardian** of protected routes. Its main function is:

#### **🎯 Objectives:**
1. **Extract the token** from the `Authorization` header
2. **Verify the validity** of the JWT token
3. **Decode user information**
4. **Allow or deny** access to the route

#### **🔍 Detailed Process:**

```javascript
const authMiddleware = (req, res, next) => {
  // 1. 📥 Extract authorization header
  const authHeader = req.headers["authorization"];
  
  // 2. 🎫 Get token (format: "Bearer token123...")
  const token = authHeader && authHeader.split(" ")[1];
  
  // 3. ❌ Validate token existence
  if(!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  // 4. 🔓 Verify and decode token
  try {
    const decodedTokenInfo = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userInfo = decodedTokenInfo; // 📝 Add user info to request
    next(); // ✅ Continue to next function
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
}
```

#### **📋 Middleware States:**

| State | Code | Description |
|-------|------|-------------|
| ✅ **Success** | 200 | Valid token, user authenticated |
| ❌ **No Token** | 401 | No token provided |
| 🚫 **Invalid Token** | 401 | Expired or manipulated token |
| ⏰ **Expired Token** | 401 | Valid but expired token |

### 👑 **admin-middleware.js**

The admin middleware verifies that the user has **administrator permissions**.

#### **🎯 Objective:**
- Verify that `req.userInfo.role === 'admin'`
- Block access to regular users

#### **📊 Authorization Flow:**

```mermaid
flowchart TD
    A[Request with Token] --> B{auth-middleware}
    B -->|Valid Token| C[req.userInfo available]
    B -->|Invalid Token| D[❌ 401 Unauthorized]
    C --> E{admin-middleware}
    E -->|role === 'admin'| F[✅ Access Granted]
    E -->|role !== 'admin'| G[🚫 403 Forbidden]
```

---

## 🔒 Security and Encryption

### 🛡️ **Password Encryption with bcrypt**

#### **Why bcrypt?**
- **🧂 Automatic salt**: Prevents rainbow table attacks
- **⚡ Adaptive speed**: Configurable based on server power
- **🔒 One-way hash**: Impossible to reverse
- **🛡️ Resistant**: To brute force attacks

#### **📝 Registration Process:**

```javascript
// 1. 🧂 Generate salt (cost factor: 10)
const salt = await bcrypt.genSalt(10);

// 2. 🔒 Encrypt password with salt
const hashedPassword = await bcrypt.hash(password, salt);

// 3. 💾 Save encrypted password in DB
const newUser = new User({
  username,
  email,
  password: hashedPassword, // ✅ Original password never stored
  role
});
```

#### **🔍 Login Process:**

```javascript
// 1. 🔍 Find user in DB
const user = await User.findOne({ username });

// 2. ✅ Compare password with stored hash
const isPasswordMatch = await bcrypt.compare(password, user.password);

// 3. 🎫 If match, generate JWT
if(isPasswordMatch) {
  const token = jwt.sign({...}, secretKey, {expiresIn: '5m'});
}
```

---

## 🛣️ API Endpoints

### 🔐 **Authentication (`/api/auth`)**

#### **📝 User Registration**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "juan123",
  "email": "juan@email.com",
  "password": "myPassword123",
  "role": "user"  // Optional, defaults to "user"
}
```

**Successful response (201):**
```json
{
  "success": true,
  "message": "User juan123 with email juan@email.com registered successfully!"
}
```

#### **🔐 User Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "juan123",
  "password": "myPassword123"
}
```

**Successful response (200):**
```json
{
  "success": true,
  "message": "Logged in successfully!",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 🏠 **Protected Routes (`/api/home`)**

#### **🎉 Welcome Page**
```http
GET /api/home/welcome
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "message": "🎉 Welcome to the home page juan123 👍🏽",
  "user": {
    "_id": "63f9b3e2",
    "username": "juan123",
    "role": "user"
  }
}
```

### 👑 **Admin Routes (`/api/admin`)**

#### **🛡️ Admin Panel**
```http
GET /api/admin/welcome
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Requires `admin` role**

**Response (200):**
```json
{
  "message": "Welcome to the admin page"
}
```

**Permission error (403):**
```json
{
  "success": false,
  "message": "Access denied! Admin rights required."
}
```

---

## ⚙️ Configuration and Installation

### 📦 **Main Dependencies**

```json
{
  "bcryptjs": "^3.0.2",        // 🔒 Password encryption
  "dotenv": "^17.2.1",         // 🌍 Environment variables
  "express": "^5.1.0",         // 🚀 Web framework
  "jsonwebtoken": "^9.0.2",    // 🎫 JWT handling
  "mongoose": "^8.17.0"        // 🗄️ ODM for MongoDB
}
```

### 🌍 **Environment Variables (.env)**

```env
# 🗄️ Database
MONGODB_URI=mongodb://localhost:27017/auth_db

# 🔐 JWT Security
JWT_SECRET_KEY=your_super_secret_key_here_256_bits

# 🚀 Server
PORT=3000
NODE_ENV=development
```

### 🚀 **Installation Commands**

```bash
# 📦 Install dependencies
npm install

# 🔧 Development mode (with nodemon)
npm run dev

# 🚀 Production mode
npm start
```

---

## 🧪 Testing with Postman

### 🔄 **Complete Testing Flow**

#### **1. 📝 Register User**
```http
POST http://localhost:3000/api/auth/register
{
  "username": "testuser",
  "email": "test@email.com", 
  "password": "test123",
  "role": "user"
}
```

#### **2. 🔐 Login**
```http
POST http://localhost:3000/api/auth/login
{
  "username": "testuser",
  "password": "test123"
}
```
**📋 Copy the `accessToken` from the response**

#### **3. 🏠 Access Protected Route**
```http
GET http://localhost:3000/api/home/welcome
Authorization: Bearer [PASTE_TOKEN_HERE]
```

#### **4. 👑 Test Admin Route (will fail without admin role)**
```http
GET http://localhost:3000/api/admin/welcome
Authorization: Bearer [PASTE_TOKEN_HERE]
```

### 📊 **HTTP Status Codes**

| Code | Description | Scenario |
|------|-------------|----------|
| **200** | ✅ OK | Successful login, route access |
| **201** | ✅ Created | User registered successfully |
| **400** | ❌ Bad Request | Invalid data, duplicate user |
| **401** | 🔒 Unauthorized | No token, invalid token |
| **403** | 🚫 Forbidden | No admin permissions |
| **500** | 💥 Server Error | Server error |

---

## 🏗️ Architecture and Patterns

### 📐 **MVC Pattern (Model-View-Controller)**

```mermaid
graph TD
    A[🌐 Request] --> B[🛣️ Routes]
    B --> C[🎮 Controllers]
    C --> D[👤 Models]
    D --> E[🗄️ Database]
    E --> D
    D --> C
    C --> F[📤 Response]
    
    G[🔒 Middleware] --> C
```

### 🔄 **Request/Response Flow**

1. **🌐 Client** sends HTTP request
2. **🛣️ Express Router** routes to the correct path
3. **🔒 Middleware** verifies authentication/authorization
4. **🎮 Controller** processes business logic
5. **👤 Model** interacts with the database
6. **📤 Response** is sent back to the client

### 🧩 **Separation of Concerns**

| Component | Responsibility |
|-----------|----------------|
| **🛣️ Routes** | Define endpoints and apply middleware |
| **🎮 Controllers** | Business logic and validations |
| **👤 Models** | Data structure and DB validations |
| **🔒 Middleware** | Authentication, authorization, logging |
| **🗄️ Database** | Data persistence and queries |

---

## 🔍 Debugging and Logs

### 📝 **Logging System**

The project includes detailed logs for debugging:

```javascript
// 🔒 In auth-middleware.js
console.log('🗣️ Auth middleware is called');
console.log("🔑 Auth header is: ", authHeader);
console.log("🔐 Token is: ", token);
console.log("Decoded token info is: ", decodedTokenInfo);
```

### 🐛 **Common Errors and Solutions**

| Error | Cause | Solution |
|-------|-------|----------|
| **401 Unauthorized** | Missing or invalid token | Check Authorization header |
| **403 Forbidden** | No admin permissions | Verify user role |
| **400 Bad Request** | Invalid data | Check JSON format |
| **500 Server Error** | DB or server error | Review logs and DB connection |

---

## 📚 Additional Resources

### 🔗 **Useful Links**

- [📖 JWT.io](https://jwt.io/) - JWT token decoder
- [🔒 bcrypt](https://www.npmjs.com/package/bcryptjs) - bcryptjs documentation
- [🚀 Express.js](https://expressjs.com/) - Official documentation
- [🗄️ Mongoose](https://mongoosejs.com/) - ODM for MongoDB
- [🌍 Postman](https://www.postman.com/) - API testing client

### 📖 **Additional Documentation**

- `express_json_middleware_es.md` - JSON middleware documentation
- `STEPS.md` - Detailed development steps
- `img/` - Project screenshots

---

## 🤝 Contributing

This project is part of the **NodeJS Full Course 2024** and is designed for educational purposes. Contributions and improvements are welcome.

### 🛠️ **Future Improvements**

- [ ] 🍪 Implementation with cookies instead of JWT headers
- [ ] 📧 Email verification system
- [ ] 🔄 Refresh tokens for long sessions
- [ ] 📱 Rate limiting to prevent attacks
- [ ] 🔍 Advanced logging with Winston
- [ ] 🧪 Unit testing with Jest

---

## 📄 License

This project is under the ISC license. It is free to use for educational and learning purposes.

