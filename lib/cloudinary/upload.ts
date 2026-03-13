export type UploadedImage = {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
};

export async function uploadImageToCloudinary(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Failed to upload image");
  }

  return response.json();
}
