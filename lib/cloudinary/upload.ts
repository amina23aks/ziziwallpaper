import { getClientAuth } from "@/lib/firebase/client";

export type UploadedImage = {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
};

export async function uploadImageToCloudinary(file: File): Promise<UploadedImage> {
  const currentUser = getClientAuth().currentUser;

  if (!currentUser) {
    throw new Error("Authentication is required for uploads.");
  }

  const token = await currentUser.getIdToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || "Failed to upload image");
  }

  return response.json();
}
