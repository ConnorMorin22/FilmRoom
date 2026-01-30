// Using custom backend - no Base44 integrations needed
export const Core = null;
export const InvokeLLM = null;
export const SendEmail = null;
import { api } from "./customClient";

const uploadMultipartFile = async ({ file, folder, contentType }) => {
  const initResponse = await api.post("/admin/videos/multipart/init", {
    filename: file.name,
    contentType,
    folder,
  });

  const { uploadId, s3Key, fileUrl } = initResponse.data;
  const chunkSize = 100 * 1024 * 1024; // 100MB
  const parts = [];

  try {
    let partNumber = 1;
    for (let start = 0; start < file.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const { data } = await api.post("/admin/videos/multipart/presign", {
        uploadId,
        s3Key,
        partNumber,
      });

      const uploadResponse = await fetch(data.uploadUrl, {
        method: "PUT",
        body: chunk,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload part ${partNumber}`);
      }

      const etag = uploadResponse.headers.get("ETag");
      if (!etag) {
        throw new Error(`Missing ETag for part ${partNumber}`);
      }

      parts.push({ ETag: etag, PartNumber: partNumber });
      partNumber += 1;
    }

    await api.post("/admin/videos/multipart/complete", {
      uploadId,
      s3Key,
      parts,
    });

    return {
      file_url: fileUrl,
      s3Key,
    };
  } catch (error) {
    try {
      await api.post("/admin/videos/multipart/abort", { uploadId, s3Key });
    } catch (abortError) {
      console.warn("Failed to abort multipart upload:", abortError);
    }
    throw error;
  }
};

export const UploadFile = async ({ file, folder }) => {
  const contentType = file.type || "application/octet-stream";
  const multipartThreshold = 5 * 1024 * 1024 * 1024; // 5GB S3 single upload limit

  if (file.size > multipartThreshold) {
    return uploadMultipartFile({ file, folder, contentType });
  }

  const { data } = await api.post("/admin/videos/upload", {
    filename: file.name,
    contentType,
    folder,
  });

  let uploadResponse;
  if (data.fields) {
    const formData = new FormData();
    Object.entries(data.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", file);
    uploadResponse = await fetch(data.uploadUrl, {
      method: "POST",
      body: formData,
    });
  } else {
    uploadResponse = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    });
  }

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
