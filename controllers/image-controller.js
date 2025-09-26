const Image = require('../models/Image');
const {uploadToCloudinary} = require('../helpers/cloudinaryHelper'); 
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

/***************************************\
|******* Upload IMAGE Controller *******|
\***************************************/
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

/***************************************\
|******* fetch IMAGES Controller *******|
\***************************************/
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
    /*
    For instance:
        sortObj["createdAt"] = -1; 
        sortObj = {createdAt: -1}

    Image.find({}).sort(sortObj)
    That means:
    ➡️ "Bring me the documents "Image" collection sorted by the createdAt field in descending order (-1)."

    const images = await Image.find()
                              .sort(sortObj)   // order the results (e.g. newest first, oldest first, or by name, or either createdAt or updatedAt)
                              .skip(skipNum)   // skip some items (useful to jump to page 2, 3, etc.)
                              .limit(limitNum) // limit how many items to return (e.g. 5 per page)
    👉 “Find images from the database, order them, skip some, and only return a fixed number — perfect for pagination.”
     */

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

/***************************************\
|******* delete IMAGE Controller *******|
\***************************************/
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
  deleteImageController,
}