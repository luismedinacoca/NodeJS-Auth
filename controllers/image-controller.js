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
      uploadedBy: req.userInfo .userId // TODO: check "userInfo" comes from authMiddleware
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