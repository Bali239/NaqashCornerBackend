import cloudinary from "../config/cloudinary.js";
import AppError from "../utils/AppError.js";

export const uploadImage = (file, folder = "naqash-corner/products") => new Promise((resolve, reject) => {
  if (!file?.buffer) return reject(new AppError("Image upload was empty.", { statusCode: 400, code: "EMPTY_UPLOAD" }));
  const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image", transformation: [{ quality: "auto", fetch_format: "auto" }] }, (error, result) => {
    if (error) return reject(new AppError("Image upload failed.", { statusCode: 502, code: "IMAGE_UPLOAD_FAILED" }));
    resolve({ publicId: result.public_id, secureUrl: result.secure_url, width: result.width, height: result.height, format: result.format, bytes: result.bytes });
  });
  stream.end(file.buffer);
});

export const deleteImage = async (publicId) => {
  if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};
