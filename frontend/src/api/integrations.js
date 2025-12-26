// Using custom backend - no Base44 integrations needed
export const Core = null;
export const InvokeLLM = null;
export const SendEmail = null;
export const UploadFile = async (file) => {
  // Mock upload for now
  return {
    url: `https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800`,
    key: `uploads/${Date.now()}_${file.name}`,
  };
};
export const GenerateImage = null;
export const ExtractDataFromUploadedFile = null;
export const CreateFileSignedUrl = null;
export const UploadPrivateFile = null;
