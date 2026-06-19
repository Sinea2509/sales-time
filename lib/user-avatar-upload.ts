import { buildUserBlobPath } from "@/lib/blob-paths";
import {
  uploadImageToBlob,
  validateImageFile,
  type ImageUploadResult,
} from "@/lib/image-blob-upload";

export const validateUserAvatarFile = validateImageFile;

export function uploadUserAvatarToBlob(
  userId: string,
  file: File,
): Promise<ImageUploadResult> {
  return uploadImageToBlob({
    file,
    buildPathname: (ext, suffix) =>
      buildUserBlobPath(userId, "avatars", `avatar-${suffix}.${ext}`),
    logLabel: "uploadUserAvatarToBlob",
  });
}
