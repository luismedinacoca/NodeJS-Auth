const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const adminMiddleware = require("../middleware/admin-middleware");
const uploadMiddleware = require("../middleware/upload-middleware");
const { uploadImageController, fetchImagesController } = require("../controllers/image-controller");

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
router.get('/get', authMiddleware, fetchImagesController);

module.exports = router;