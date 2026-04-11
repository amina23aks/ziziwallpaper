import { getCloudinaryOriginalUrl, getCloudinaryOriginalUrlFromPublicId } from "@/lib/cloudinary/delivery";
import type { WallpaperImage } from "@/types/wallpaper";

export function getWallpaperDownloadUrl(image?: WallpaperImage | null) {
  if (!image?.secureUrl) {
    return "";
  }

  if (image.publicId) {
    return getCloudinaryOriginalUrlFromPublicId(image.secureUrl, image.publicId);
  }

  return getCloudinaryOriginalUrl(image.secureUrl);
}

export async function downloadImageFromUrl({
  imageUrl,
  filename,
}: {
  imageUrl: string;
  filename?: string;
}) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error("Failed to download image");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename || "wallpaper.jpg";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}
