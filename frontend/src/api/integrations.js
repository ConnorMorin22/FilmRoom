// Using custom backend - no Base44 integrations needed
export const Core = null;
export const InvokeLLM = null;
export const SendEmail = null;
import { api } from "./customClient";

export const UploadFile = async ({ file, folder }) => {
  const { data } = await api.post("/admin/videos/upload", {
    filename: file.name,
    contentType: file.type,
    folder,
  });

  const uploadResponse = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to S3");
  }

  return {
    file_url: data.fileUrl,
    s3Key: data.s3Key,
  };
};
export const GenerateImage = null;
export const ExtractDataFromUploadedFile = null;
export const CreateFileSignedUrl = null;
export const UploadPrivateFile = null;
