import { buildOrgBlobPath } from "@/lib/blob-paths";
import {
  uploadImageToBlob,
  validateImageFile,
  type ImageUploadResult,
} from "@/lib/image-blob-upload";

export const validateOrgLogoFile = validateImageFile;

export function uploadOrgLogoToBlob(
  organizationId: string,
  file: File,
): Promise<ImageUploadResult> {
  return uploadImageToBlob({
    file,
    buildPathname: (ext, suffix) =>
      buildOrgBlobPath(organizationId, "logos", `logo-${suffix}.${ext}`),
    logLabel: "uploadOrgLogoToBlob",
  });
}
