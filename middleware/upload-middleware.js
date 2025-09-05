const multer = require("multer");
const path = require("path");

// set out multer storage:
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

// file filter function
const checkFileFilter = (req, file, cb) => {
  if(file.mimetype.startsWith('image')){
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
}

// multer middleware:
module.exports = multer({
  storage,
  fileFilter: checkFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  }
})


/**

The `multer` dependency in Node.js is used to handle files uploaded by a user to your server, for example:

- Uploading a profile picture.
- Uploading a PDF or document.
- Uploading images in a form.

In simple words:
👉 multer is a middleware (a helper in Express) that takes care of receiving files sent in HTTP requests (usually with multipart/form-data), processing them, and making them available in your code, either in memory or saved in a folder on your server.

 */
