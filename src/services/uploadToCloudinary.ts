// Cloudinary upload utility for client-side image uploads (no secret needed)
// Usage: await uploadToCloudinary(file, cloudName, uploadPreset)
/**
 * Uploads a file to Cloudinary using unsigned upload preset.
 * Uses environment variables CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET if available.
 *
 * @param file File to upload
 * @param cloudName Optional Cloudinary cloud name (overrides env)
 * @param uploadPreset Optional Cloudinary upload preset (overrides env)
 * @returns URL of uploaded image
 */
export async function uploadToCloudinary(
  file: File,
  cloudName?: string,
  uploadPreset?: string
): Promise<string> {
  const resolvedCloudName = cloudName || process.env.CLOUDINARY_CLOUD_NAME || 'diecgt687';
  const resolvedUploadPreset = uploadPreset || process.env.CLOUDINARY_UPLOAD_PRESET || 'unsigned';
  const url = `https://api.cloudinary.com/v1_1/${resolvedCloudName}/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', resolvedUploadPreset);
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    let errorMsg = 'Cloudinary upload failed';
    try {
      const errorData = await response.json();
      errorMsg += ': ' + (errorData.error?.message || JSON.stringify(errorData));
    } catch (e) {
      // ignore
    }
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  const data = await response.json();
  return data.secure_url;
}
