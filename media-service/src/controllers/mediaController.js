const Media = require("../models/Media");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const uploadMedia = async (req, res, next) => {
  logger.info("Starting media upload!");
  try {
    if (!req.file) {
      logger.error("No file found. Please try adding a file and try!");
      return res.status(400).json({
        success: false,
        message: "No file found. Please try adding a file and try!",
      });
    }

    const { originalname: originalName, mimetype: mimeType, buffer } = req.file;
    const userId = req.user.userId;

    logger.info(`File details: name=${originalName}, type=${mimeType}`);
    logger.info(`Uploading to cloudinary starting...`);

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      `Cloudinary upload successfully. Public Id: - ${cloudinaryUploadResult.public_id}`
    );

    const newMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName,
      mimeType,
      userId,
      url: cloudinaryUploadResult.secure_url,
    });
    await newMedia.save();

    res.status(201).json({
      success: true,
      message: "New media uploaded successfully!",
      data: newMedia,
    });
  } catch (error) {
    logger.error("Internal server error!");
    res.status(500).json({
      success: false,
      message: "Internal server error!",
      error,
    });
  }
};

const getAllMedias = async (req, res) => {
  try {
    const result = await Media.find({});
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching medias", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medias",
    });
  }
};

module.exports = {
  uploadMedia,
  getAllMedias,
};
