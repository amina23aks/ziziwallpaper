const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

type CloudinaryImageContext = "feedCard" | "detailMain" | "thumbnail";

const CONTEXT_TRANSFORMS: Record<CloudinaryImageContext, string> = {
  feedCard: "c_fit,w_720,h_960",
  detailMain: "c_limit,w_1800,h_2400",
  thumbnail: "c_fill,g_auto,w_320,h_320",
};

const BASE_DELIVERY_TRANSFORM = "f_auto,q_auto,dpr_auto";

function isCloudinaryUploadUrl(url: string) {
  return url.includes("res.cloudinary.com") && url.includes(CLOUDINARY_UPLOAD_MARKER);
}

export function getCloudinaryImageUrl(url: string, context: CloudinaryImageContext): string {
  if (!url || !isCloudinaryUploadUrl(url)) {
    return url;
  }

  const [prefix, afterUpload] = url.split(CLOUDINARY_UPLOAD_MARKER);
  if (!prefix || !afterUpload) {
    return url;
  }

  const matchWithVersion = afterUpload.match(/^([^/]+)\/((?:v\d+).*)$/);
  const contextTransform = CONTEXT_TRANSFORMS[context];
  const mergedBaseTransform = `${BASE_DELIVERY_TRANSFORM},${contextTransform}`;

  if (!matchWithVersion) {
    return `${prefix}${CLOUDINARY_UPLOAD_MARKER}${mergedBaseTransform}/${afterUpload}`;
  }

  const [, existingTransform, versionAndPath] = matchWithVersion;
  const mergedTransform = existingTransform.startsWith("v")
    ? mergedBaseTransform
    : `${mergedBaseTransform},${existingTransform}`;

  return `${prefix}${CLOUDINARY_UPLOAD_MARKER}${mergedTransform}/${versionAndPath}`;
}
