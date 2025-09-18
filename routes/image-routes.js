const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const adminMiddleware = require("../middleware/admin-middleware");
const uploadMiddleware = require("../middleware/upload-middleware");
const { uploadImageController, fetchImagesController, deleteImageController } = require("../controllers/image-controller");

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
router.delete('/:id', authMiddleware, deleteImageController); // /api/image/delete/:id

module.exports = router;