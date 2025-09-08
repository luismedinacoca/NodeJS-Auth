## 1. Create a new Project folder and name it as `07_NodeJS-Auth`
[//]: # ( 🗣️ This is comment)
## 2. Open terminal and execute:
```bash
npm init -y
```

## 3. Install `express`, `mongoose` and `dotenv`:
```bash
npm i express mongoose dotenv
```

## 4. Install nodemon for saving any change:
```bash
npm i nodemon --save-dev
```

or 

```bash
npm i nodemon -D
```

[`Atlas` or `Compass`]
## 5. Create a new MongoDB in Atlas or Compass, name it as `nodejs-auth-2024`

## 6. Create and update the `package.json` file:
```json
{
  "name": "07_nodejs-auth",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",  //👈🏽
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1", 
    "start": "node server.js",  //👈🏽
    "dev": "nodemon server.js"  //👈🏽
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "dotenv": "^17.2.1",
    "express": "^5.1.0",
    "mongoose": "^8.17.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  }
}
```

## 7. create `.env` file and add the MONGO_URI:
```text
MONGO_URI=mongodb+srv://<username>:<db_password>@cluster0.1234567.mongodb.net/
```

## 8. create `./server.js` file:
```js
require('dotenv').config();
const express = require('express');
const connectToDB = require('./database/db');

connectToDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is NOW running on port ${PORT}`);
});
```

## 9. Need to create database, `./database/db.js` file:
```js
const mongoose = require('mongoose');
const connectToDB = async() => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.log('MonogDB connection failed!');
    process.exit(1);
  }
}
module.exports = connectToDB;
```

## 10. Add `./models/User.js` file:
```js
const mongoose =  require('mongoose');
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
    enum: ['user', 'admin'], // only allows 'user' or 'admin' roles.
    default: 'user',
  }
}, {timestamps: true});
module.exports = mongoose.model('User', userSchema);
```

<img src="./img/login-register-account.png">

## 11. Add `./controllers/auth-controller.js` file:
```js
// Register controller
const registerUser = async(req, res) => {
  try {
    ...
  } catch (err) {
    console.log(err);
    res.statuss(500).json({
      success: false,
      message: `Some error occured! Please try again.`,
    })
  }
}

// Login  controller
const loginUser = async(req, res) => {
  try {
    ...
  } catch (err) {
    console.log(err);
    res.statuss(500).json({
      success: false,
      message: `Some error occured! Please try again.`,
    })
  }
}

module.exports = {
  registerUser,
  loginUser,
}
```

## 12. Add `./routes/auth-routes.js` file:
```js
const express = require('express');
const { registerUser, loginUser }  = require('../controllers/auth-controller');

const router = express.Router();

// All routes are related to authentication & authrization:
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;
```

### Go back to `server.js` file:
```js
require('dotenv').config();
const express = require('express');
const connectToDB = require('./database/db');
const authRoutes = require('./routes/auth-routes');
connectToDB();
const app = express();
const PORT = process.env.PORT || 3000;

// add the auth-routes:
app.use('/api/auth', authRoutes);  // 👈🏽
app.listen(PORT, () => {
    console.log(`Server is NOW running on port ${PORT}`);
});
```

## 13. Install `bcrypt.js` dependency:
```bash
npm i  bcryptjs
```

## 14. complete try section on `auth-controller.js` file:
```js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/******* Register controller *******/
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
    //TODO 👉🏽 ******* hash user password: run "npm i bcryptjs" *******
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


/******* Login controller *******/

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

    //TODO 👉🏽 Generate Token: run "npm i jsonwebtoken"
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

module.exports = {
  registerUser,
  loginUser,
}
```

#### Testing with Postman:
1. **Register request**:
   - Method: **POST**
   - URL: `http://localhost:3000/api/auth/register`
   - payload:
      ```json
      {
        "username": "suspiros_001",
        "email": "suspiros_001@example.com",
        "password": "Test!001",
        "role": "user"
      }
      ```
   - Expected Response:
      ```json
      {
        "status": true,
        "message": "User with username suspiros_001 and email suspiros_001@example.com registered successfully!"
      }
      ```
2. **Login request**:
   - Method: **POST**
   - URL: `http://localhost:3000/api/auth/login`
   - payload:
      ```json
      {
        "username": "suspiros_001",
        "password": "Test!001",
      }
      ```
   - Expected Response:
      ```json
      {
        "success": true,
        "message": "Logged in successfully!",
        "accessToken": "eNiIsInR5cCI6IkpXVyJhbGciOiJIUz..."
      }
      ```

## 15. Create `routes/home-routes.js` file then update the `server.js` file:

### 1. Create `home-routes.js` file:
```js
// /routes/home-routes.js
const express = require("express");
const router = express.Router();
router.get("/welcome", (req, res) => {
  res.json({
    message: "Welcome to the home page!";
  });
})
module.exports = router;
```

### 2. create `admin-routes.js` file:
```js
// /routes/admin-routes.js
...
```

### 3. update `server.js` file:
```js
require("dotenv").config();
const express = require("express");
const connectToDB = require("./database/db");
const authRoutes = require("./routes/auth-routes");
const homeRoutes = require("./routes/home-routes");     // 👈🏽
connectToDB();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);     // 👈🏽
app.listen(PORT, () => {
  console.log(`Server is NOW running on port ${PORT}`);
})
```

### Testing with Postman:
1. **Home page**:
  - Method: **GET**
  - URL: `http://localhost:3000/api/home/welcome`
  - Expected Response:
      ```json
      {
        "message": "Welcome to the home page!"
      }
      ```

> **Issue**: ⚠️ Need to verify when user is logged in, then this user has access to the home page.

> 👍🏽 👍🏽 Create a _**middleware**_ to check if the user is logged in, then redirect to the home page.

<img src="./img/middleware - GET request.png">

## 16. Create a new `middleware/auth-middleware.js` file

### No token provided
in auth-middleware.js:
```js
// /middleware/auth-middleware.js
const authMiddleware = (req, res, next) => {
  console.log('🗣️ Auth middleware is called');
  next();
}
module.exports = authMiddleware;      
```
in home-routes.js
```js
// /routes/home-routes.js
const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");    // 👈🏽
const router = express.Router();
router.get("/welcome", authMiddleware, (req, res) => {    // 👈🏽
  res.json({
    message: "Welcome to the home page!";
  });
})
module.exports = homeRoutes;
```
> 🔐 Nothing has changed. Need to verify token from header request

<img src="./img/middleware-called-notoken.png">

### Token provided
in auth-middleware.js:
```js
// /middleware/auth-middleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('🗣️ Auth middleware is called');
  const authHeader = req.headers["authorization"];
  console.log("🔑 Auth header is: ", authHeader);
  const token = authHeader && authHeader.split(" ")[1];
  console.log("🔐 Token is: ", token);
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
module.exports = authMiddleware;    
```
### Wrong token provided:
<img src="./img/middleware-with-token-backend.png">
<img src="./img/middleware-with-token-postman-invalid-token.png">


in home-routes.js
```js
// /routes/home-routes.js
const express = require('express');
const authMiddleware = require('../middleware/auth-middleware');
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
module.exports = router;
```
### Testing from Postman:
1. **Home page**:
  - Method: **GET**
   - URL: `http://localhost:3000/api/home/welcome`
   - Request headers:
      ```json
      {
        "Authorization": "Bearer eyJhbGciOiJIUzI1Ni..."
      }
      ```
   - Expected Response:
      ```json
      {
        "message": "🎉 Welcome to the home page suspiros_001 👍🏽",
        "user": {
          "_id": "6901f764c33c58b0928ee519",
          "username": "suspiros_001",
          "role": "user"
        }
      }  
      ```
### Expected provided token:
<img src="./img/middleware-request-from-postman-status-200.png">

### Expired provided token:
<img src="">


## 17. Create `routes/admin-routes.js` file then update the `server.js` file:

> 👍🏽 Need to add new middleware to check if the user is admin or not:

> 🗣️ Remember: `auth-middleware` is using `req.userInfo` to get the user info.

### 1. create `middleware/admin-middleware.js` file:
```js
// /middleware/admin-middleware.js
const isAdminUser = (req, res, next) => {
  if(req.userInfo.role !== 'admin'){
    return res.status(403).json({
      success: false,
      message: 'Access denied! Admin rights required.'
    })
  }
  next();
}
module.exports = isAdminUser;
```
### 2. create `admin-routes.js` file:
```js
// /routes/admin-routes.js
const  express = require('express');
const authMiddleware = require('../middleware/auth-middleware');
const adminMiddleware = require('../middleware/admin-middleware');
const router =  express.Router();
router.get('/welcome', authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    message: `Welcome to the admin page`
  })
})
module.exports = router;
```

### 3. update `server.js` file:
```js
// /server.js
require("dotenv").config();
const express = require("express");
const connectToDB = require("./database/db");
const authRoutes = require("./routes/auth-routes");
const homeRoutes = require("./routes/home-routes"); 
const adminRoutes = require("./routes/admin-routes");   // 👈🏽
connectToDB();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes); 
app.use("/api/admin", adminRoutes);   // 👈🏽
app.listen(PORT, () => {
  console.log(`Server is NOW running on port ${PORT}`);
})
```

#### Testing from Postman:

##### 1st Testing using a `user` role:
1. **Home page**:
  - Method: **GET**
  - URL: `http://localhost:3000/api/home/welcome`
    - Request headers:
        ```json
        {
          "Authorization": "Bearer eyJhbGciOiJIUzI1Ni..."
        }
        ```
    - Expected Response:
        ```json
        {
          "message": "🎉 Welcome to the home page suspiros_001 👍🏽",
          "user": {
            "_id": "6901f764c33c58b0928ee519",
            "username": "suspiros_001",
            "role": "user"
          }
        }  
        ```
2. **Admin Page**:
  - Method: **GET**        
  - URL: `http://localhost:3000/api/admin/welcome`
    - Request headers:
      ```json
      {
        "Authorization": "Bearer eyJhbGciOiJIUzI1Ni..."
      }
      ```
    - Expected Response: `403 Forbidden`
      ```json
        {
          "success": false,
          "message": "Access denied! Admin rights required."
        }
      ```  

##### 2nd Testing using an `admin` role:
1. **Home page**:
  - Method: **GET**
  - URL: `http://localhost:3000/api/home/welcome`
    - Request headers:
        ```json
        {
          "Authorization": "Bearer eyJ1c2VySWQiOiI2OGIwNzY4MTMzY..."
        }
        ```
    - Expected Response:
        ```json
        {
          "message": "🎉 Welcome to the home page suspiros_002 👍🏽",
          "user": {
            "_id": "68b0768133c928901f5ee51d",
            "username": "suspiros_002",
            "role": "admin"
          }
        }  
        ```
2. **Admin Page**:
  - Method: **GET**        
  - URL: `http://localhost:3000/api/admin/welcome`
    - Request headers:
      ```json
      {
        "Authorization": "Bearer eyJ1c2VySWQiOiI2OGIwNzY4MTMzY..."
      }
      ```
    - Expected Response: `200 OK`
      ```json
        {
          "message": "Welcome to the admin page"
        }
      ```  

---

# Feature: File Upload

## 1. Create `Image.js` in models folder:
```js
// ./models/Image.js
const mongoose = require('mongoose');
const ImagesSchema = new mongoose.Schema({
  url: {
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {timestamps: true});

module.exports = mongoose.model('Image', ImagesSchema);
```

### Create an account in [Cloudinary](https://cloudinary.com/)
1. Create cloud_name, api_key, api_secret at cloudinary
2. Save them in `.env` file
3. install: 
    ```bash
    npm i cloudinary
    ```


## 2. Create `cloudinary.js` file:
```js
// ./config/cloudinary.js
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
module.exports = cloudinary;
```

## 3. Create `cloudinaryHelpe.js`  file:
```js
// ./helpers/cloudinaryHelper.js
const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = async(filePath) => {
  try{
    const result = await cloudinary.uploader.upload(filePath);
    return {
      url: result.secure_url,
      publicId: result.public_id,
    }
  } catch( error){
    console.error('Error while uploading to cloudinary', error);
    throw new Error('Error while uploading to cloudinary');
  }
}
module.exports = {uploadToCloudinary;}// can have multiple helpers in this file
```

## 4. Create `image-controller.js` file:
```js
// ./controlers/image-controller.js
const Image = require('../models/Image');
const {uploadToCloudinary} = require('../helpers/cloudinaryHelper'); 
const uploadImageController = async(req, res) => {
  try {
    // check i file is missing in REQ object:
    if(!req.file){
      return res.status(400).json({
        success: false,
        message: `File is required! Please upload any image file.`,
      })
    }
    // upload to cloudinary:
    const { url, publicId } = await uploadToCloudinary(req.file.path);
    // store the image url and public id along with the uploaded user id in database:
    const newlyUploadedImage = new Image({
      url,
      publicId,
      uploadedBy: req.userInfo .userId
    })
    await newlyUploadedImage.save();

    res.status(201).json({
      success: true,
      message: `🎉 Image uploaded successfully!`,
      image: newlyUploadedImage,
    })
  } catch(error){
    console.log(error);
    res.status(500).json({
      success: false,
      message: `Something went wrong! Please try again.`,
    })
  }
}
module.exports = {
  uploadImageController,
}
```

## 5. Create `image-routes.js` file:

### 5.1 Install `multer` :
```
npm i multer
```
### 5.2 Create `image-routes.js` file:
```js
// ./routes/image-routes.js
const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const adminMiddleware = require("../middleware/admin-middleware");

const router = express.Router();

// upload the image
// TODO: Install "npm i multer" dependency:
router.post(
  "/upload",
  authMiddleware,
  adminMiddleware,
  /******* 🤔 upload-middleware 🤔 *******/
); // many middlewares which share same data between them.

// to get all the images
module.exports = router;
```

### 5.3 Create `upload-middleware.js` file:
```js
const multer = require("multer");
const path = require("path");
// 1️⃣ set out multer storage:
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  }, // destination folder
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
// 2️⃣ file filter function
const checkFileFilter = (req, file, cb) => {
  if(file.mimetype.startsWith('image')){
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
}
// 3️⃣ multer middleware:
module.exports = multer({
  storage,
  fileFilter: checkFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  }
})
```

### 5.4 Complete `image-routes.js` file:
```js
// ./routes/image-routes.js
const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const adminMiddleware = require("../middleware/admin-middleware");
const uploadMiddleware = require("../middleware/upload-middleware");  // 👈🏽
const { uploadImageController } = require("../controllers/image-controller");

const router = express.Router();

// upload the image
// TODO: Install "npm i multer" dependency:
router.post(
  "/upload",
  authMiddleware,
  adminMiddleware,
  uploadMiddleware.single("image"),  // 👈🏽
  uploadImageController
); // many middlewares which share same data between them.

// to get all the images
module.exports = router;
```

## 6. Update `server.js` file:
```js
require('dotenv').config();
const express = require('express');
const connectToDB = require('./database/db');
const authRoutes = require('./routes/auth-routes');
const homeRoutes = require('./routes/home-routes');
const adminRoutes = require('./routes/admin-routes');
const uploadImageRoutes = require('./routes/image-routes');  // 👈
connectToDB();
const app = express();
const PORT = process.env.PORT || 3000;
//middlewares:
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/image', uploadImageRoutes);  // 👈
app.listen(PORT, () => {
    console.log(`Server is NOW running on port ${PORT}`);
});
```

## 7. Testing from Postman with an `admin` role:
- Create an admin user with **POST**.
- Login using the admin credentials.
- Method: **POST**
- URL: `http://localhost:3000/api/auth/login`
- Request headers:
    ```json
    {
      "Authorization": "Bearer eyJ1c2VySWQiOiI2OGIwNzY4MTMzY..."
    }
    ```
- Response:
    ```json
    {
      "message": "🎉 Welcome to the home page suspiros_002 👍🏽",
      "user": {
        "_id": "68b0768133c928901f5ee51d",
        "username": "suspiros_002",
        "role": "admin"
      }
    }  
-  click on **form-dat** 
-  Key: image. & Value:  + New file from local machine
  <img src="./img/upload-file-body-params.png">
-  click on **Send**
- Expected Response:
    ```json
    {
      "success": true,
      "message": "🎉 Image uploaded successfully!",
      "image": {
        "url": "https://res.cloudinary.com/darlwqmqo/image/upload/v1757359363/u3hbr5g76pjz6r5u7jga.png",
        "publicId": "u3hbr5g76pjz6r5u7jga",
        "uploadedBy": "68bf2c5982b3b42549e4bc87",
        "_id": "68bf2d0382b3b42549e4bc8a",
        "createdAt": "2025-09-08T19:22:43.485Z",
        "updatedAt": "2025-09-08T19:22:43.485Z",
        "__v": 0
      }
    } 
    ```

## 8. Testing from Postman with an `user` role:
- Create an admin user with **POST**.
- Login using the admin credentials.
- Method: **POST**
- URL: `http://localhost:3000/api/auth/login`
- Request headers:
    ```json
    {
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsI..."
    }
    ```
- Response:
    ```json
    {
      "message": "🎉 Welcome to the home page suspiros_001 👍🏽",
      "user": {
        "_id": "68b88fa696ef4c81723f9f01",
        "username": "suspiros_001",
        "role": "user". // 👈🏽 ✨
      }
    } 
-  click on **form-dat** 
-  Key: image. & Value:  + New file from local machine
  <img src="./img/upload-file-body-params.png">
-  click on **Send**
- Status code: `403 Forbidden`
- Expected Response:
    ```json
    {
      "success": false,
      "message": "Access denied! Admin rights required."
    }
    ```


## 9. Delete the uploaded image from `/uploads` folder:
```js
// ./controllers/image-controller.js
const Image = require('../models/Image');
const {uploadToCloudinary} = require('../helpers/cloudinaryHelper'); 
const fs = require('fs');  // 👈🏽
const uploadImageController = async(req, res) => {
  try {
    // check i file is missing in REQ object:
    if(!req.file){
      return res.status(400).json({
        success: false,
        message: `File is required! Please upload any image file.`,
      })
    }
    // upload to cloudinary:
    const { url, publicId } = await uploadToCloudinary(req.file.path);
    // store the image url and public id along with the uploaded user id in database:
    const newlyUploadedImage = new Image({
      url,
      publicId,
      uploadedBy: req.userInfo .userId // TODO: check "userInfo" comes from authMiddleware
    })
    await newlyUploadedImage.save();

    // delete the file from `uploads` folder:  ✅
    fs.unlinkSync(req.file.path);  // 👈🏽

    res.status(201).json({
      success: true,
      message: `🎉 Image uploaded successfully!`,
      image: newlyUploadedImage,
    })
  } catch(error){
    console.log(error);
    res.status(500).json({
      success: false,
      message: `Something went wrong! Please try again.`,
    })
  }
}
module.exports = {
  uploadImageController,
}
```
[here](https://youtu.be/MIJt9H69QVc?t=24191)






