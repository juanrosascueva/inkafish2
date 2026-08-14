export async function uploadToCloudinary(fileBuffer: Buffer, fileName: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(fileBuffer)]);
  formData.append("file", blob, fileName);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Error al subir imagen a Cloudinary");
  }

  const data = await response.json();
  return data.secure_url;
}
