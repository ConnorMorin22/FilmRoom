// Using custom backend - no Base44 integrations needed
export const Core = null;
export const InvokeLLM = null;
export const SendEmail = null;
import { api } from "./customClient";

export const UploadFile = async ({ file, folder }) => {
  const contentType = file.type || "application/octet-stream";
  const { data } = await api.post("/admin/videos/upload", {
    filename: file.name,
    contentType,
    folder,
  });

  const uploadResponse = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    let errorBody = "";
    try {
      errorBody = await uploadResponse.text();
    } catch (error) {
      console.warn("Failed to read S3 error body:", error);
    }
    console.error("S3 upload failed", {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      errorBody,
    });
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
