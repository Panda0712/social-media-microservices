const Media = require("../models/Media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const handlePostDeleted = async (event) => {
  console.log(event, "event ");
  const { postId, mediaIds } = event;
  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);

      logger.info(
        `Media ${media._id} deleted successfully, associated with deleted post ${postId}`
      );
    }

    logger.info(`Completely media deletion of post ${postId}`);
  } catch (error) {
    logger.error("Error occurred while deleting media!", error);
  }
};

module.exports = {
  handlePostDeleted,
};
