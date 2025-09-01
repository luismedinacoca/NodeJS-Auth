# Proyecto de Autenticación con Cookies

## Resumen del Proyecto
Este documento presenta la migración del sistema de autenticación de JWT tokens a un sistema basado en cookies HTTP seguras. El proyecto mantiene toda la funcionalidad existente pero mejora la seguridad mediante el uso de cookies HttpOnly.

## Plan de Migración

### Cambios Principales:
1. **Eliminar dependencia de JWT** para almacenamiento de sesiones
2. **Implementar cookie-parser** para manejo de cookies
3. **Modificar controlador de autenticación** para crear/limpiar cookies
4. **Actualizar middleware de autenticación** para leer cookies
5. **Agregar funcionalidad de logout** para limpiar cookies
6. **Configurar cookies seguras** con opciones HttpOnly y Secure

### Archivos a Modificar:

1. `package.json` - Agregar cookie-parser
2. `server.js` - Configurar cookie-parser middleware
3. `controllers/auth-controller.js` - Implementar autenticación con cookies
4. `middleware/auth-middleware.js` - Leer información de cookies
5. `routes/auth-routes.js` - Agregar ruta de logout

---

## Código Actualizado

### 1. package.json
```json
{
  "name": "07_nodejs-auth-cookies",
  "version": "1.0.0",
  "description": "Sistema de autenticación NodeJS con cookies",
  "main": "server.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": ["nodejs", "express", "authentication", "cookies"],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cookie-parser": "^1.4.6",
    "dotenv": "^17.2.1",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.17.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  }
}
```

### 2. server.js
```javascript
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const connectToDB = require('./database/db');
const authRoutes = require('./routes/auth-routes');
const homeRoutes = require('./routes/home-routes');
const adminRoutes = require('./routes/admin-routes');

connectToDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares:
app.use(express.json());
app.use(cookieParser()); // 🍪 Middleware para parsear cookies

// Configuración de cookies seguras
app.use((req, res, next) => {
  res.cookie.defaults = {
    httpOnly: true, // Previene acceso desde JavaScript del cliente
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    sameSite: 'strict', // Protección CSRF
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  };
  next();
});

// Rutas:
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server is NOW running on port ${PORT}`);
    console.log(`🍪 Cookie-based authentication enabled`);
});
```

### 3. controllers/auth-controller.js
```javascript
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/***********************************\
|******* Register controller *******|
\***********************************/
const registerUser = async(req, res) => {
  try {
    // Extraer información del usuario del body de la request
    const { username, email, password, role } = req.body;
    
    // Verificar si el usuario ya existe en la base de datos
    const checkExistingUser = await User.findOne({$or: [{username}, {email}]});
    if(checkExistingUser) {
      return res.status(400).json({
        success: false,
        message: `Usuario con este username o email ya existe!`,
      });
    } 

    // Encriptar password del usuario
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo usuario y guardarlo en la base de datos
    const newlyCreatedUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    await newlyCreatedUser.save();

    if(newlyCreatedUser) {
      res.status(201).json({
        success: true,
        message: `Usuario ${username} con email ${email} registrado exitosamente!`,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `No se pudo registrar el usuario. Intenta de nuevo!`,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `Error del servidor! Intenta de nuevo.`,
    });
  }
};

/*******************************\
|******* Login controller *******|
\*******************************/
const loginUser = async(req, res) => {
  try {
    const { username, password } = req.body;

    // Buscar si el usuario existe en la base de datos
    const user = await User.findOne({ username });

    // Validar que username y password han sido proporcionados
    if(!user || !password){
      return res.status(400).json({
        success: false,
        message: `Credenciales inválidas! Usuario no encontrado!`
      });
    }

    // Comparar si el password es correcto
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if(!isPasswordMatch){
      return res.status(400).json({
        success: false,
        message: `Credenciales inválidas! Password incorrecto!`
      });
    }

    // 🍪 Generar JWT para almacenar en cookie
    const accessToken = jwt.sign({
      userId: user._id,
      username: user.username,
      role: user.role,
    }, process.env.JWT_SECRET_KEY, {expiresIn: '24h'});

    // 🍪 Configurar cookie con el token
    res.cookie('authToken', accessToken, {
      httpOnly: true, // No accesible desde JavaScript del cliente
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict', // Protección CSRF
      maxAge: 24 * 60 * 60 * 1000 // 24 horas en milisegundos
    });

    res.status(200).json({
      success: true,
      message: `¡Sesión iniciada exitosamente!`,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `Error del servidor! Intenta de nuevo.`,
    });
  }
};

/*******************************\
|******* Logout controller ******|
\*******************************/
const logoutUser = (req, res) => {
  try {
    // 🍪 Limpiar la cookie de autenticación
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: `Sesión cerrada exitosamente!`
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `Error al cerrar sesión. Intenta de nuevo.`,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser
};
```

### 4. middleware/auth-middleware.js
```javascript
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('🗣️ Auth middleware es llamado');
  
  // 🍪 Obtener token de las cookies en lugar de headers
  const token = req.cookies.authToken;
  console.log("🍪 Token de cookie es: ", token);

  if(!token){
    return res.status(401).json({
      success: false,
      message: `Acceso denegado. No hay token proporcionado. ¡Por favor inicia sesión para continuar!`
    });
  }

  // Decodificar el token
  try {
    const decodedTokenInfo = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("🔓 Información del token decodificado: ", decodedTokenInfo);
    req.userInfo = decodedTokenInfo;
    next();
  } catch (error) {
    console.log("❌ Error al verificar token: ", error);
    
    // Limpiar cookie inválida
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return res.status(401).json({
      success: false,
      message: `Acceso denegado. Token inválido o expirado. ¡Por favor inicia sesión nuevamente!`
    });
  }
};

module.exports = authMiddleware;
```

### 5. middleware/admin-middleware.js
```javascript
const isAdminUser = (req, res, next) => {
  console.log('🔐 Admin middleware es llamado');
  console.log('👤 Usuario info: ', req.userInfo);
  
  if(req.userInfo.role !== 'admin'){
    return res.status(403).json({
      success: false,
      message: '¡Acceso denegado! Se requieren permisos de administrador.'
    });
  }
  next();
};

module.exports = isAdminUser;
```

### 6. routes/auth-routes.js
```javascript
const express = require('express');
const { registerUser, loginUser, logoutUser } = require('../controllers/auth-controller');

const router = express.Router();

// Todas las rutas relacionadas con autenticación y autorización:
router.post('/register', registerUser);     // /api/auth/register
router.post('/login', loginUser);           // /api/auth/login
router.post('/logout', logoutUser);         // /api/auth/logout 🍪 Nueva ruta

module.exports = router;
```

### 7. routes/home-routes.js
```javascript
const express = require('express');
const authMiddleware = require('../middleware/auth-middleware');
const router = express.Router();

router.get('/welcome', authMiddleware, (req, res) => {
  const {userId, username, role} = req.userInfo;
  res.json({
    message: `🎉 Bienvenido a la página de inicio ${username} 👍🏽`,
    user: {
      _id: userId,
      username,
      role,
    }
  });
});

// localhost:3000/api/home/welcome
module.exports = router;
```

### 8. routes/admin-routes.js
```javascript
const express = require('express');
const authMiddleware = require('../middleware/auth-middleware');
const adminMiddleware = require('../middleware/admin-middleware');
const router = express.Router();

router.get('/welcome', authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    message: `🔐 Bienvenido a la página de administrador`,
    adminUser: req.userInfo
  });
});

module.exports = router;
```

---

## Instrucciones de Instalación

### 1. Instalar Nueva Dependencia
```bash
npm install cookie-parser
```

### 2. Variables de Entorno (.env)
```env
PORT=3000
JWT_SECRET_KEY=tu_clave_secreta_super_segura
MONGODB_URI=mongodb://localhost:27017/tu_base_de_datos
NODE_ENV=development
```

---

## Endpoints de la API

### Autenticación

#### 📝 Registro de Usuario
- **POST** `/api/auth/register`
- **Body**:
```json
{
  "username": "usuario123",
  "email": "usuario@email.com",
  "password": "password123",
  "role": "user"
}
```

#### 🔐 Inicio de Sesión
- **POST** `/api/auth/login`
- **Body**:
```json
{
  "username": "usuario123",
  "password": "password123"
}
```
- **Respuesta**: Establece cookie `authToken` automáticamente

#### 🚪 Cerrar Sesión
- **POST** `/api/auth/logout`
- **Respuesta**: Limpia la cookie `authToken`

### Rutas Protegidas

#### 🏠 Página de Inicio (Autenticado)
- **GET** `/api/home/welcome`
- **Cookies**: Requiere `authToken`

#### ⚡ Página de Administrador (Admin)
- **GET** `/api/admin/welcome`
- **Cookies**: Requiere `authToken` con rol `admin`

---

## Ventajas del Sistema de Cookies

### 🔒 Seguridad Mejorada
- **HttpOnly**: Previene ataques XSS
- **Secure**: Solo transmite por HTTPS en producción
- **SameSite**: Protección contra CSRF
- **Limpieza automática**: Cookies inválidas se eliminan

### 🚀 Experiencia de Usuario
- **Automático**: No requiere manejo manual de tokens
- **Persistencia**: Sesión persiste entre recargas de página
- **Logout seguro**: Limpia completamente la sesión

### 🛠️ Facilidad de Desarrollo
- **Sin headers manuales**: El navegador maneja las cookies automáticamente
- **Menos código cliente**: No necesita almacenar tokens en localStorage
- **Debugging simple**: Cookies visibles en DevTools

---

## Diferencias Clave vs JWT Headers

| Aspecto | JWT en Headers | Cookies |
|---------|----------------|---------|
| **Almacenamiento** | localStorage/sessionStorage | Cookie del navegador |
| **Envío** | Header Authorization manual | Automático con cada request |
| **Seguridad** | Vulnerable a XSS | HttpOnly previene XSS |
| **CSRF** | No vulnerable | Requiere SameSite protection |
| **Expiración** | Manual | Automática por el navegador |
| **Logout** | Eliminar del storage | clearCookie() |

---

## Pruebas con Postman

### 1. Login
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### 2. Acceso a Rutas Protegidas
- ✅ Las cookies se envían automáticamente
- ✅ No necesitas agregar headers manualmente
- ✅ La cookie `authToken` se incluye en cada request

### 3. Logout
```
POST http://localhost:3000/api/auth/logout
```

---

## Conclusión

La migración de JWT tokens a cookies proporciona:

1. **Mayor seguridad** con HttpOnly y Secure flags
2. **Mejor experiencia de usuario** con manejo automático
3. **Código más limpio** sin manejo manual de tokens
4. **Funcionalidad completa** manteniendo todas las características originales

Este sistema es ideal para aplicaciones web tradicionales donde la seguridad y simplicidad son prioritarias.
