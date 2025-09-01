# Conversión de CommonJS a ES Modules

Este documento contiene todos los cambios necesarios para convertir el proyecto de CommonJS a ES modules después de cambiar `"type": "commonjs"` a `"type": "module"` en el `package.json`.

## Cambios Requeridos

### package.json
Cambiar el tipo de módulo:
```json
{
  "type": "module"
}
```

---

## Archivos JavaScript Actualizados

### server.js
```javascript
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import connectToDB from './database/db.js';
import authRoutes from './routes/auth-routes.js';
import homeRoutes from './routes/home-routes.js';
import adminRoutes from './routes/admin-routes.js';

connectToDB();

const app = express();
const PORT = process.env.PORT || 3000;

//middlewares:
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`Server is NOW running on port ${PORT}`);
});
```

### controllers/auth-controller.js
```javascript
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/***********************************\
|******* Register controller *******|
\***********************************/
const registerUser = async(req, res) => {
  try {
    // extract user information from our request body;
    const { username, email, password, role } = req.body;
    
    // Check if user is already exists in our database:
    const checkExistingUser = await User.findOne({$or: [{username}, {email}]});
    if(checkExistingUser) {
      return res.status(400).json({
        success: false,
        message: `User with this username or email already exists!`,
      })
    } 
    // ******* hash user password: run "npm i bcryptjs" *******
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create a new user and save in your database:
    const newlyCreatedUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
    }) 

    await newlyCreatedUser.save();

    if(newlyCreatedUser) {
      res.status(201).json({
        status: true,
        message: `User with username ${username} and email ${email} registered successfully!`,
        //user: newlyCreatedUser,
      })
    } else {
      res.status(400).json({
        status: false,
        message: `Unable to register user. Please try again!`,
      })
    }
  } catch (err) {
    console.log(err);
    res.statuss(500).json({
      success: false,
      message: `Some error occured! Please try again.`,
    })
  }
}


/*******************************\
|******* Login controller *******|
\*******************************/

const loginUser = async(req, res) => {
  try {
    const { username, password } = req.body;

    // Find if current user exists in our database
    const user = await User.findOne({ username });

    //Validate both username and password have been provided:
    if(!user || !password){
      return res.status(400).json({
        success: false,
        message: `Invalid credentials! User not found!`
      })
    }

    // Compare whether the password is correct:
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if(!isPasswordMatch){
      return res.status(400).json({
        success: false,
        message: `Invalid credentials! Password is incorrect!`
      })
    }

    // Generate Token: run "npm i jsonwebtoken"
    const accessToken = jwt.sign({
      userId: user._id,
      username: user.username,
      role:  user.role,
    }, process.env.JWT_SECRET_KEY, {expiresIn: '30m'});

    res.status(200).json({
      success: true,
      message: `Logged in successfully!`,
      accessToken,
    })
  } catch (err) {
    console.log(err);
    res.statuss(500).json({
      success: false,
      message: `Some error occured! Please try again.`,
    })
  }
}

export { registerUser, loginUser };
```

### middleware/auth-middleware.js
```javascript
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  console.log('Auth middleware is called');
  const authHeader = req.headers["authorization"];
  console.log("Auth header is: ", authHeader);

  const token = authHeader && authHeader.split(" ")[1];

  if(!token){
    res.status(401).json({
      success: false,
      message: `Access  denied. No Token provided. Please login to continue!`
    })
  }

  // decode this token
  try {
    const decodedTokenInfo = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("Decoded token info is: ", decodedTokenInfo);
    req.userInfo = decodedTokenInfo;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: `Access  denied. No Token provided. Please login to continue!`
    })
  }
}

export default authMiddleware;
```

### routes/auth-routes.js
```javascript
import express from 'express';
import { registerUser, loginUser } from '../controllers/auth-controller.js';

const router = express.Router();

// All routes are related to authentication & authorization:
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;
```

### routes/home-routes.js
```javascript
import express from 'express';
import authMiddleware from '../middleware/auth-middleware.js';
const router = express.Router();

//router.get('/welcome', handler01, handler02, handler03,(req, res) => { // 👉🏽 next section
router.get('/welcome', authMiddleware,(req, res) => {
  const {userId, username, role} = req.userInfo;
  res.json({
    message: `🎉 Welcome to the home page ${username} 👍🏽`,
    user: {
      _id: userId,
      username,
      role,
    }
  })
})
// localhost:3000/api/home/welcome
export default router;
```

### routes/admin-routes.js
```javascript
import express from 'express';
const router = express.Router();

router.get('/welcome', (req, res) => {
  res.json({
    message: `Welcome to the admin page`
  })
})
// localhost:3000/api/admin/welcome
export default router;
```

### database/db.js
```javascript
import mongoose from 'mongoose';

const connectToDB = async() => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('MonogDB connection failed!');
    process.exit(1);
  }
}

export default connectToDB;
```

### models/User.js
```javascript
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // it allows either 'user' or 'admin' roles only.
    default: 'user',
  }
}, {timestamps: true});

export default mongoose.model('User', userSchema);
```

## Resumen de Cambios

### Principales Modificaciones:
1. **Importaciones**: Todas las declaraciones `require()` se convirtieron a `import`
2. **Exportaciones**: 
   - `module.exports = ...` se convirtió a `export default ...`
   - `module.exports = { ... }` se convirtió a `export { ... }`
3. **Extensiones de archivos**: Se agregaron extensiones `.js` a todas las importaciones relativas/locales
4. **dotenv**: Se cambió de `require('dotenv').config()` a `import dotenv from 'dotenv'; dotenv.config();`

### Archivos no modificados:
- `package-lock.json`
- Archivos `.md` (documentación)
- Otros archivos que no sean JavaScript

**Nota**: Estos cambios mantienen exactamente la misma funcionalidad del código original, solo cambian la sintaxis de módulos de CommonJS a ES modules.

