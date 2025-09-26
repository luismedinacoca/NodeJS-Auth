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

## 8. Create and connect the database, `./database/db.js` file:
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

## 9. create `./server.js` file:
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
-  click on **Send**:

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
-  click on **Send**:

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
---
## 10. fetching Image
### 1. Add the `fetchImagesController` in `image-controller.js` file:
```js
// ./controllers/image-controller.js
const Image = require('../models/Image');
const {uploadToCloudinary} = require('../helpers/cloudinaryHelper'); 
const fs = require('fs');
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
    // delete the file from `uploads` folder: 
    fs.unlinkSync(req.file.path);

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
const fetchImagesController = async(req, res) => {  // 👈🏽 ✅
  try{
    const images = await Image.find({})

    if(images) {
      res.status(200).json({
        success: true,
        data: images,
      })
    }
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
  fetchImagesController,  // 👈🏽 ✅
}
```
### 2. Import `fetchImagesController` in `image-routes.js`  file:
```js
const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const adminMiddleware = require("../middleware/admin-middleware");
const uploadMiddleware = require("../middleware/upload-middleware");
const { uploadImageController, fetchImagesController } = require("../controllers/image-controller");  // 👈🏽 ✅

const router = express.Router();

// upload the image
// TODO: Install "npm i multer" dependency:
router.post(
  "/upload",
  authMiddleware,
  adminMiddleware,
  uploadMiddleware.single("image"),
  uploadImageController
); // many middlewares which share same data between them.

// to get all the images => authrization required "authMiddleware"
router.get('/get', authMiddleware, fetchImagesController);  // 👈🏽 ✅
module.exports = router;
```

### 3. Testing from Postman:
- No Login.
- Method: **GET**
- URL: `http://localhost:3000/api/image/get`
- Response:
    ```json
    {
      "success": "false",
      "message": "Access  denied. No Token provided. Please login to continue!"
    }
    ```
- <img src="./img/no_login_get_images.png">  
---
- Login using the `admin` credentials.
- Method: **GET**
- URL: `http://localhost:3000/api/image/get`
- Response:
  ```js
  {
    "success": true,
    "data": [
      {
        "_id": "68bb341928e55b7e36255748",
        "url": "https://res.cloudinary.com/darlwqmqo/image/upload/v1757099029/eyxlnikorqbrf8gmg1ty.svg",
        "publicId": "eyxlnikorqbrf8gmg1ty",
        "uploadedBy": "68bb33b128e55b7e36255745",
        "createdAt": "2025-09-05T19:03:53.379Z",
        "updatedAt": "2025-09-05T19:03:53.379Z",
        "__v": 0
      },
      {
        "_id": "68bf2d0382b3b42549e4bc8a",
        "url": "https://res.cloudinary.com/darlwqmqo/image/upload/v1757359363/u3hbr5g76pjz6r5u7jga.png",
        "publicId": "u3hbr5g76pjz6r5u7jga",
        "uploadedBy": "68bf2c5982b3b42549e4bc87",
        "createdAt": "2025-09-08T19:22:43.485Z",
        "updatedAt": "2025-09-08T19:22:43.485Z",
        "__v": 0
      }
    ]
  }
  ```
- <img src="./img/get_images_login-admin.png">

---
- Upload a new Image
- Login using the `user` credentials.
- Method: **GET**
- URL: `http://localhost:3000/api/image/get`
- Response:
  ```js
  {
    "success": true,
    "data": [
      {
        "_id": "68bb341928e55b7e36255748",
        "url": "https://res.cloudinary.com/darlwqmqo/image/upload/v1757099029/eyxlnikorqbrf8gmg1ty.svg",
        "publicId": "eyxlnikorqbrf8gmg1ty",
        "uploadedBy": "68bb33b128e55b7e36255745",
        "createdAt": "2025-09-05T19:03:53.379Z",
        "updatedAt": "2025-09-05T19:03:53.379Z",
        "__v": 0
      },
      {
        "_id": "68bf2d0382b3b42549e4bc8a",
        "url": "https://res.cloudinary.com/darlwqmqo/image/upload/v1757359363/u3hbr5g76pjz6r5u7jga.png",
        "publicId": "u3hbr5g76pjz6r5u7jga",
        "uploadedBy": "68bf2c5982b3b42549e4bc87",
        "createdAt": "2025-09-08T19:22:43.485Z",
        "updatedAt": "2025-09-08T19:22:43.485Z",
        "__v": 0
      },
      {
        "_id": "68c1c2e3b0ba916d35907f5a",
        "url": "https://res.cloudinary.com/darlwqmqo/image/upload/v1757528803/hra8t4fr2ojgleqjp5vf.png",
        "publicId": "hra8t4fr2ojgleqjp5vf",
        "uploadedBy": "68bf2c5982b3b42549e4bc87",
        "createdAt": "2025-09-10T18:26:43.775Z",
        "updatedAt": "2025-09-10T18:26:43.775Z",
        "__v": 0
      }
    ]
  }
  ```

## 11. Change Password:

### 1. Add `changePassword` in `./controllers/auth-controller.js` file:

```js
// ./controllers/auth-controller.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    //TODO 👉🏽 Generate Token: run "npm i jsonwebtoken"
    const accessToken = jwt.sign({
      userId: user._id,
      username: user.username,
      role:  user.role,
    }, process.env.JWT_SECRET_KEY, {expiresIn: '5m'});

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

/******************************************\
|******* Change Password controller *******|
\******************************************/
const changePassword = async(req, res) => {
  try {
    // ✅ 1. Get userId:
    const userId = req.userInfo.userId;

    // ✅ 2. Get/extract old password: 
    const { oldPassword, newPassword } = req.body;
    /* 
      ➡️ There must be a frontend validation for old password and new password are different. ✨✨✨
    */
    if(oldPassword === newPassword){
      return res.status(400).json({
        success: false,
        message: "New password must be different! Please try again."
      })
    }

    // ✅ 3. find the current logged in user:
    const user = await User.findById(userId);
    if(!user){
      return res.status(400).json({
        success: false,
        message: "User not found!"
      })
    }

    // ✅ 4. check if entered old password is correct:
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if(!isPasswordMatch){
      res.status(400).json({
        success: false,
        message: "Old password is not correct! Please try again."
      })
    }

    // ✅ 5. hash the new password:
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    // ✅ 6. update the new password in the database:
    user.password = newHashedPassword;
    await user.save();

    // ✅ 7. send the response:
    res.status(200).json({
      success: true,
      message: "🔐 Password changed successfully! 🎉 "
    })

  }catch(e){
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured! Please try again."
    })
  }
}

module.exports = {
  registerUser,
  loginUser,
  changePassword  // 👈🏽
}
```

### 2. Import `changePassword` controller in `./routes/auth-routes.js` file:
```js
// ./routes/auth-routes.js
const express = require('express');
const { registerUser, loginUser, changePassword }  = require('../controllers/auth-controller');  // 👈🏽
const authMiddleware = require('../middleware/auth-middleware');

const router = express.Router();

// All routes are related to authentication & authorization:
router.post('/register', registerUser);                          // /api/auth/register
router.post('/login', loginUser);                                // /api/auth/login
router.post('/change-password', authMiddleware, changePassword); // 👈🏽 /api/auth/change-password

module.exports = router;
```

### 3. Testing in Postman/Insomia:

1. No Login or no Authorization token
    - Method: **POST**
    - URL: `http://localhost:3000/api/auth/change-password`
    - Body:
        ```json
        {
          "oldPassword": "Test!001",
          "newPassword": "Test!XX1"
        }
        ```
    - Response:
        ```json
        {
          "success": "false",
          "message": "Access  denied. No Token provided. Please login to continue!"
        }
        ```
    - <img src="./img/changePassword-001-ChangePassword-Denied.png">  
---
2. Login and Change Password successfully:
    - Method: **POST**
    - URL: `http://localhost:3000/api/auth/login`
    - Response:
        ```json
        {
          "success": "true",
          "message": "Logged in successfully!",
          "accessToken": "eyJhbGci0iJIUzI1NiIsInR5cCI6Ikp..."
        }
        ```
    - <img src="./img/changePassword-002-Login.png">  

    - Method: **POST**
    - URL: `http://localhost:3000/api/auth/change-password`
    - Body:
        ```json
        {
          "oldPassword": "Test!001",
          "newPassword": "Test!XX1"
        }
        ```
    - Response:
        ```json
        {
          "success": "false",
          "message": "🔐 Password changed successfully! 🎉"
        }
        ```
    - <img src="./img/changePassword-003-PasswordChanged-successfully.png">  
    - <img src="./img/changePassword-004-PasswordChanged-successfully.png">  


## 12. Delete Image

### 1. Open `image-controller.js` file:
```js
// ./controllers/image-controller.js
const Image = require('../models/Image');
const {uploadToCloudinary} = require('../helpers/cloudinaryHelper'); 
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// ******* Upload IMAGE Controller *******
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
    fs.unlinkSync(req.file.path);

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

// ******* Fetch IMAGES Controller *******
const fetchImagesController = async(req, res) => {
  try{
    const images = await Image.find({})

    if(images) {
      res.status(200).json({
        success: true,
        data: images,
      })
    }
  } catch(error){
    console.log(error);
    res.status(500).json({
      success: false,
      message: `Something went wrong! Please try again.`,
    })
  }
}

// ******* Delete IMAGE Controller *******. // 👈🏽 ✅
const deleteImageController = async(req, res) => {
  try{
    // ✅ 1. Get imageId and UserId from authMiddleware.
    const getCurrentIdOfImageToBeDeleted = req.params.id;
    const userId = req.userInfo.userId;

    // ✅ 2. Find the image in the database.
    const image = await Image.findById(getCurrentIdOfImageToBeDeleted);

    // ✅ 3. Check if the image is found.
    if(!image){
      return res.status(400).json({
        success: false,
        message: "This images was not found!"
      })
    }
    
    // ✅  4. Verify if this image is uploaded by the current user who is trying to delete this image:
    if(image.uploadedBy.toString() !== userId){
      return res.status(403).json({
        success: false,
        message: "😥 You are not authorized to delete this image because you haven't upload it!"
      })
    }

    // ✅ 5. Delete this image first from your cloudinary storage:
    await cloudinary.uploader.destroy(image.publicId);

    // ✅ 6. Delete this image from MongoDB database:
    await Image.findByIdAndDelete(getCurrentIdOfImageToBeDeleted);

    // ✅ 7. Json response:
    res.status(200).json({
      success: true,
      message: `🎉 This ${image.url} image has been deleted successfully!`,
    })

  }catch(error){
    console.log(error);
    res.status(500).json({
      success: false,
      message: `Something went wrong! Please try again.`,
    })
  }
}

module.exports = {
  uploadImageController,
  fetchImagesController,
  deleteImageController, // 👈🏽 ✅
}
```

### 2. Open `image-routes.js` file and update it with `deleteImageController`:
```js
// ./routes/image-routes.js
const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const adminMiddleware = require("../middleware/admin-middleware");
const uploadMiddleware = require("../middleware/upload-middleware");
const { uploadImageController, fetchImagesController, deleteImageController } = require("../controllers/image-controller"); // 👈🏽 ✅

const router = express.Router();

// upload the image
// TODO: Install "npm i multer" dependency:
router.post(
  "/upload",
  authMiddleware,
  adminMiddleware,
  uploadMiddleware.single("image"),
  uploadImageController
); // many middlewares which share same data between them. /api/image/upload 

// to get all the images => authorization required "authMiddleware"
router.get('/get', authMiddleware, fetchImagesController);

// delete image route => authorization required "authMiddleware"
router.delete('/:id', authMiddleware, deleteImageController); // 👈🏽 ✅  // /api/image/delete/:id

module.exports = router;
```

### 3. Testing from Postman:

#### _**Test 01: Delete an image with an invalid token**_
1. Login with an existent user:
    - Method: **POST**
    - URL: `http://localhost:3000/api/auth/login`
    - Body:
        ```json
        {
          "username": "suspiros_001",
          "password": "Test!001"
        }
        ```
    - Response:
        ```json
        {
          "success": true,
          "message": "Logged in successfully!",
          "accessToken": "eyJhbGciOiJIUzI1NiI..."
        }
        ```
---

2. Upload an image:
    - Method: **POST**
    - URL: `http://localhost:3000/api/image/upload`
    - Authorization: Bearer `{{accessToken}}`
    - Body:
      - Form-data
      - image: `image_file_path`
    - Response:
        ```json
        {
          "success": true,
          "message": "🎉 Image uploaded successfully!",
          "image": {
            "url": "https://res.cloudinary.com/darlwqmqo/image/upload/v1758223399/soz9iockemvb6wkmjo7p.png",
            "publicId": "soz9iockemvb6wkmjo7p",
            "uploadedBy": "68cc59aa838aedd4c6172283",
            "_id": "68cc5c28838aedd4c6172287",
            "createdAt": "2025-09-18T19:23:20.181Z",
            "updatedAt": "2025-09-18T19:23:20.181Z",
            "__v": 0
          }
        }
        ```
---
3. Wait until accessToken is not valid anymore:
    - Method: **DELETE**
    - URL: `http://localhost:3000/api/image/68cc5c28838aedd4c6172287`
    - Response:
        ```json
        {
          "success": false,
          "message": "Access  denied. No Token provided. Please login to continue!"
        }
        ```

#### _**Test 02: Delete an image with another user:**_
1. Login with an existent user:
  - Method: **POST**
  - URL: `http://localhost:3000/api/auth/login`
  - Body:
      ```json
      {
        "username": "suspiros_001",
        "password": "Test!001"
      }
      ```
  - Response:
      ```json
      {
        "success": true,
        "message": "Logged in successfully!",
        "accessToken": "eyJhbGciOiJIUzI1NiI..."
      }
      ```
---

2. Upload an image:
  - Method: **POST**
  - URL: `http://localhost:3000/api/image/upload`
  - Authorization: Bearer `{{accessToken}}`
  - Body:
    - Form-data
    - image: `image_file_path`
  - Response:
      ```json
      {
        "success": true,
        "message": "🎉 Image uploaded successfully!",
        "image": {
          "url": "https://res.cloudinary.com/darlwqmqo/image/upload/v1723293589/sozockemvjob69iwkm7p.png",
          "publicId": "sozockemvjob69iwkm7p",
          "uploadedBy": "68cc59aa838aedd4c6172283",
          "_id": "68d18b28838aedd422c5c687",
          "createdAt": "2025-09-18T19:23:20.181Z",
          "updatedAt": "2025-09-18T19:23:20.181Z",
          "__v": 0
        }
      }
      ```
---

3. Login with another existent user:
  - Method: **POST**
  - URL: `http://localhost:3000/api/auth/login`
  - Body:
      ```json
      {
        "username": "suspiros_002",
        "password": "Test!002"
      }
      ```
  - Response:
      ```json
      {
        "success": true,
        "message": "Logged in successfully!",
        "accessToken": "eyJiJIGcUzI1NiI..."
      }
      ```
---

4. Delete the image with another user:
  - Method: **DELETE**
  - URL: `http://localhost:3000/api/image/68d18b28838aedd422c5c687`
  - Response:
      ```json
      {
        "success": false,
        "message": "😥 You are not authorized to delete this image because you haven't upload it!"
      }
      ```

#### _**Test 03: Delete an image with correct user:**_

1. Login with an existent user:
  - Method: **POST**
  - URL: `http://localhost:3000/api/auth/login`
  - Body:
      ```json
      {
        "username": "suspiros_001",
        "password": "Test!001"
      }
      ```
  - Response:
      ```json
      {
        "success": true,
        "message": "Logged in successfully!",
        "accessToken": "eyJhbGciOiJIUzI1NiIs.."
      }
      ```
---

2. Upload an image:
  - Method: **POST**
  - URL: `http://localhost:3000/api/image/upload`
  - Authorization: Bearer `{{accessToken}}`
  - Body:
    - Form-data
    - image: `image_file_path`
  - Response:
      ```json
      {
        "success": true,
        "message": "🎉 Image uploaded successfully!",
        "image": {
          "url": "https://res.cloudinary.com/darlwqmqo/image/upload/v1758311533/tpzucxhvoye4dibj0iis.png",
          "publicId": "tpzucxhvoye4dibj0iis",
          "uploadedBy": "68cdb43450edaad2e433447f",
          "_id": "68cdb46e50edaad2e4334482",
          "createdAt": "2025-09-19T19:52:14.176Z",
          "updatedAt": "2025-09-19T19:52:14.176Z",
          "__v": 0
        }
      }
      ```
---

4. Delete the image with valid user:
  - Method: **DELETE**
  - URL: `http://localhost:3000/api/image/68cdb46e50edaad2e4334482`
  - Response:
      ```json
      {
        "success": true,
        "message": "🎉 This https://res.cloudinary.com/darlwqmqo/image/upload/v1758311533/tpzucxhvoye4dibj0iis.png image has been deleted successfully!"
      }
      ```

## 13. Sorting Images by any criteria an amount(limit):
```js
const Image = require('../models/Image');
const {uploadToCloudinary} = require('../helpers/cloudinaryHelper'); 
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

/******* Upload IMAGE Controller *******/
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

    // delete the file from `uploads` folder:
    fs.unlinkSync(req.file.path);

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

/******* fetch IMAGES Controller *******/
const fetchImagesController = async(req, res) => {
  try{
    // ✅ 1. get all page/limit/skip from query:
    const page = parseInt(req.query.page) || 1; //[1, 2, 3, 4,...] for clicking on next/prev button
    const limit = parseInt(req.query.limit) || 5; // it shows how many images(json data) will be shown in each page
    const skip = (page - 1) * limit; // it shows the number of images to skip in order to show the next/prev page

    // ✅ 2. Sorting images by createdAt in asc/desc order:
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc'? 1 : -1;
    const totalImages = await Image.countDocuments(); // it shows the total number of images in the database
    const totalPages = Math.ceil(totalImages / limit); // it shows the total number of pages in the database

    // ✅ 3. Sorting images by "createdAt" or eithher another criteria in asc/desc order:
    const sortObj = {};
    sortObj[sortBy] = sortOrder;

    // ✅ 4. Fetching images from the database according to the criteria:
    const images = await Image.find({}).sort(sortObj).skip(skip).limit(limit);

    if(images) {
      res.status(200).json({
        success: true,
        currentPage: page,          // 👈🏽 ✅
        totalPages: totalPages,     // 👈🏽 ✅
        totalImages: totalImages,   // 👈🏽 ✅
        data: images,
      })
    }
  } catch(error){
    console.log(error);
    res.status(500).json({
      success: false,
      message: `Something went wrong! Please try again.`,
    })
  }
}

/******* delete IMAGE Controller *******/
const deleteImageController = async(req, res) => {
  try{
    const getCurrentIdOfImageToBeDeleted = req.params.id;
    const userId = req.userInfo.userId;
    const image = await Image.findById(getCurrentIdOfImageToBeDeleted);
    if(!image){
      return res.status(400).json({
        success: false,
        message: "This images was not found!"
      })
    }
    if(image.uploadedBy.toString() !== userId){
      return res.status(403).json({
        success: false,
        message: "😥 You are not authorized to delete this image because you haven't upload it!"
      })
    }
    await cloudinary.uploader.destroy(image.publicId);
    await Image.findByIdAndDelete(getCurrentIdOfImageToBeDeleted);
    res.status(200).json({
      success: true,
      message: `🎉 This ${image.url} image has been deleted successfully!`,
    })
  }catch(error){
    console.log(error);
    res.status(500).json({
      success: false,
      message: `Something went wrong! Please try again.`,
    })
  }
}
module.exports = {
  uploadImageController,
  fetchImagesController,
  deleteImageController,
}
```

### 1. Explanation:
```js
/*
const sortObj = {} // an empty objet

For instance:
    sortObj["createdAt"] = -1; 
    sortObj = {createdAt: -1} // object created with a dynamic criteeria.

Image.find({}).sort(sortObj)
That means:
➡️ "Bring me the documents "Image" collection sorted by the 'createdAt' field in descending order (-1)."

const images = await Image.find()
                          .sort(sortObj)   // 1️⃣
                          .skip(skipNum)   // 2️⃣
                          .limit(limitNum) // 3️⃣

1️⃣: order the results (e.g. newest first, oldest first, or by name, or either createdAt or updatedAt). The "sort() method" in mongodb/mongoose needs an object for the sorting criteria.

2️⃣: skip some items (useful to jump to page 2, 3, etc.)

3️⃣: limit how many items to return (e.g. 5 per page)

👉 “Find images from the database, order them, skip some, and only return a fixed number — perfect for pagination.”
*/
```
### 2. Testing from Postman:
1. Login with an existent user
  - Method: **POST**
  - URL: `http://localhost:3000/api/auth/login`
  - Body:
      ```json
      {
        "username": "suspiros_001",
        "password": "Test!001"
      }
      ```
  - Response:
      ```json
      {
        "success": true,
        "message": "Logged in successfully!",
        "accessToken": "eyJhbGciOiJIUzI1NiIs.."
      }
      ```
---

2. List all images:
  - Method: **GET**
  - URL: `http://localhost:3000/api/image/get`
  - Authorization: Bearer `{{accessToken}}`
  - Query Params:
    ```json
    {
      "page": 2,
      "sortBy": "createdAt",
      "sortOrder": "asc",
      "limit": 2
    }
    ```
  - Complete Query Params:
    ```
    http://localhost:3000/api/image/get?page=2&sortBy=createdAt&sortOrder=asc&limit=2
    ```
  - Response:
      ```json
      {
        "success": true,
        "currentPage": 2,
        "totalPages": 6,
        "totalImages": 11,
        "data": [
          {
            "_id": "68d6d9bada6d0fe0c290725c",
            "url": "https://res.cloudinary.com/darlwqmqo/image/upload/v1758910906/jfvauixa67sselxjenby.png",
            "publicId": "jfvauixa67sselxjenby",
            "uploadedBy": "68d6d7fcda6d0fe0c2907250",
            "createdAt": "2025-09-26T18:21:46.461Z",
            "updatedAt": "2025-09-26T18:21:46.461Z",
            "__v": 0
          },
          {
            "_id": "68d6d9d2da6d0fe0c290725e",
            "url": "https://res.cloudinary.com/darlwqmqo/image/upload/v1758910930/eihbiy77hpculveeje1l.png",
            "publicId": "eihbiy77hpculveeje1l",
            "uploadedBy": "68d6d7fcda6d0fe0c2907250",
            "createdAt": "2025-09-26T18:22:10.973Z",
            "updatedAt": "2025-09-26T18:22:10.973Z",
            "__v": 0
          }
        ]
      }
      ```

### 3. Proofs:
1. URL: "http://localhost:3000/api/image/get?page=1&sortBy=createdAt&sortOrder=asc&limit=12"
2. Total images: 11
3. Total Pages: 1
4. Curent Page: 1
<img src="./img/Pagination_Request-QueryParams.png">
---
1. URL: 
    * "http://localhost:3000/api/image/get?page=1&sortBy=createdAt&sortOrder=asc&limit=6"
    * "http://localhost:3000/api/image/get?page=2&sortBy=createdAt&sortOrder=asc&limit=6"
2. Total images: 11
3. Total Pages: 2
4. Curent Page: 1 & 2

<img src="./img/pagination_Request-QuesryParams-completed.png">
---



[here](https://youtu.be/MIJt9H69QVc?t=24444)






