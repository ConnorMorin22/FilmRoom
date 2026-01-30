// Using custom backend - no Base44 integrations needed
export const Core = null;
export const InvokeLLM = null;
export const SendEmail = null;
import { api } from "./customClient";

const uploadWithProgress = (url, method, body, headers, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded, event.total);
        }
      };
    }
    xhr.onload = () => resolve(xhr);
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(body);
  });

const uploadMultipartFile = async ({
  file,
  folder,
  contentType,
  onProgress,
}) => {
  const initResponse = await api.post("/admin/videos/multipart/init", {
    filename: file.name,
    contentType,
    folder,
  });

  const { uploadId, s3Key, fileUrl } = initResponse.data;
  const chunkSize = 100 * 1024 * 1024; // 100MB
  const parts = [];
  let uploadedBytes = 0;

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

      const uploadResponse = await uploadWithProgress(
        data.uploadUrl,
        "PUT",
        chunk,
        null,
        onProgress
          ? (loaded, total) => {
              onProgress({
                loaded: uploadedBytes + loaded,
                total: file.size,
                part: partNumber,
                partLoaded: loaded,
                partTotal: total,
              });
            }
          : null
      );

      if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
        throw new Error(`Failed to upload part ${partNumber}`);
      }

      const etag = uploadResponse.getResponseHeader("ETag");
      if (!etag) {
        throw new Error(`Missing ETag for part ${partNumber}`);
      }

      uploadedBytes += chunk.size;
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

export const UploadFile = async ({ file, folder, onProgress }) => {
  const contentType = file.type || "application/octet-stream";
  const multipartThreshold = 5 * 1024 * 1024 * 1024; // 5GB S3 single upload limit

  if (file.size > multipartThreshold) {
    return uploadMultipartFile({ file, folder, contentType, onProgress });
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
    uploadResponse = await uploadWithProgress(
      data.uploadUrl,
      "POST",
      formData,
      null,
      onProgress ? (loaded, total) => onProgress({ loaded, total }) : null
    );
  } else {
    uploadResponse = await uploadWithProgress(
      data.uploadUrl,
      "PUT",
      file,
      { "Content-Type": contentType },
      onProgress ? (loaded, total) => onProgress({ loaded, total }) : null
    );
  }

  if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
    let errorBody = "";
    try {
      errorBody = uploadResponse.responseText || "";
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
