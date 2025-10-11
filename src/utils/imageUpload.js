import axios from 'axios';

/**
 * Upload image to Cloudinary via backend API
 * @param {File|Blob} imageFile - The image file to upload
 * @returns {Promise<Object>} Image data with URL and metadata
 */
export const uploadImageToCloudinary = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/images/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (response.data.success) {
      return response.data.image;
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary via backend API
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
export const deleteImageFromCloudinary = async (publicId) => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(
      `${process.env.REACT_APP_API_URL}/api/images/delete`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: { publicId }
      }
    );
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * Generate a unique ID for inline images
 * @returns {string}
 */
export const generateImageId = () => {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Extract image metadata from HTML content
 * @param {string} htmlContent - HTML content with inline images
 * @returns {Array} Array of image metadata objects
 */
export const extractImageMetadata = (htmlContent) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img[data-image-id]');

  return Array.from(images).map(img => ({
    id: img.getAttribute('data-image-id'),
    url: img.src,
    publicId: img.getAttribute('data-public-id'),
    width: parseInt(img.getAttribute('data-width')) || null,
    height: parseInt(img.getAttribute('data-height')) || null,
    format: img.getAttribute('data-format') || null,
    bytes: parseInt(img.getAttribute('data-bytes')) || null
  }));
};
