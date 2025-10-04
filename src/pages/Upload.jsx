import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import {
  Upload as UploadIcon,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "Please select valid image files (JPEG, PNG, or WebP)";
    }

    if (file.size > 10 * 1024 * 1024) {
      return "File size must be less than 10MB";
    }

    return null;
  };

  const handleFiles = useCallback((selectedFiles) => {
    setError("");
    setSuccess("");

    const validFiles = [];
    const errors = [];

    selectedFiles.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          id: `${file.name}-${file.size}-${file.lastModified}`,
          preview: null,
          uploaded: false,
          error: null,
        });
      }
    });

    if (errors.length > 0) {
      setError(errors.join(", "));
      return;
    }

    // Create previews for valid files
    validFiles.forEach((fileObj) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFiles((prev) => {
          const updated = [...prev];
          const existingIndex = updated.findIndex((f) => f.id === fileObj.id);
          if (existingIndex >= 0) {
            updated[existingIndex].preview = e.target.result;
          }
          return updated;
        });
      };
      reader.readAsDataURL(fileObj.file);
    });

    setFiles((prev) => [...prev, ...validFiles]);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    },
    [handleFiles]
  );

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setError("");
    setSuccess("");
  };

  const clearAllFiles = () => {
    setFiles([]);
    setError("");
    setSuccess("");
    setUploadProgress({});
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file to upload");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    // Initialize progress for all files
    const initialProgress = {};
    files.forEach((fileObj) => {
      initialProgress[fileObj.id] = { status: "uploading", progress: 0 };
    });
    setUploadProgress(initialProgress);

    try {
      // Use unified upload endpoint for both single and multiple files
      const fileArray = files.map((fileObj) => fileObj.file);

      const response = await apiService.uploadImages(fileArray, (progress) => {
        // Update progress for all files
        const progressUpdate = {};
        files.forEach((fileObj) => {
          progressUpdate[fileObj.id] = { status: "uploading", progress };
        });
        setUploadProgress(progressUpdate);
      });

      // Handle response based on single vs multiple files
      if (files.length === 1) {
        // Single file response format
        const fileObj = files[0];
        const responseData = response.data;

        setUploadProgress({
          [fileObj.id]: {
            status: "completed",
            progress: 100,
            response: responseData,
          },
        });

        // Ensure we have a valid id before navigating
        if (responseData && responseData.id) {
          setSuccess("Image uploaded and analyzed successfully!");
          setTimeout(() => {
            navigate(`/result/${responseData.id}`);
          }, 1500);
        } else if (responseData?.existing && responseData?.id) {
          setSuccess("Image already processed. Redirecting to result...");
          setTimeout(() => {
            navigate(`/result/${responseData.id}`);
          }, 1200);
        } else {
          setError("Upload succeeded but no result id was returned.");
        }
      } else {
        // Multiple files response format
        const { results, errors } = response.data;

        // Update progress for each file based on results
        const finalProgress = {};
        results.forEach((result, index) => {
          const fileObj = files[index];
          if (fileObj) {
            finalProgress[fileObj.id] = {
              status:
                result.status === "success" || result.status === "duplicate"
                  ? "completed"
                  : "error",
              progress: 100,
              response: result,
            };
          }
        });

        if (errors && errors.length > 0) {
          errors.forEach((error) => {
            const fileObj = files.find((f) => f.file.name === error.filename);
            if (fileObj) {
              finalProgress[fileObj.id] = {
                status: "error",
                progress: 0,
                error: error.error,
              };
            }
          });
        }

        setUploadProgress(finalProgress);

        const successCount = results.filter(
          (r) => r.status === "success" || r.status === "duplicate"
        ).length;
        const errorCount = errors ? errors.length : 0;

        if (successCount === files.length) {
          setSuccess(
            `All ${successCount} images uploaded and analyzed successfully!`
          );
        } else if (successCount > 0) {
          setSuccess(
            `${successCount} images uploaded successfully. ${errorCount} failed.`
          );
        } else {
          setError("All uploads failed. Please try again.");
        }

        // Navigate to history page for batch uploads
        if (successCount > 0) {
          setTimeout(() => {
            navigate("/history");
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);

      // Update all files to error status
      const errorProgress = {};
      files.forEach((fileObj) => {
        errorProgress[fileObj.id] = { status: "error", progress: 0, error };
      });
      setUploadProgress(errorProgress);

      const serverMsg = error?.response?.data?.error?.message;
      setError(serverMsg || "Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-none mx-0 flex flex-col gap-8">
      {error && (
        <div className="flex items-center gap-4 p-6 rounded-2xl mb-6 font-medium text-lg shadow-lg backdrop-blur-lg bg-gradient-to-r from-red-50 to-red-100 text-red-600 border-2 border-red-200">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-4 p-6 rounded-2xl mb-6 font-medium text-lg shadow-lg backdrop-blur-lg bg-gradient-to-r from-green-50 to-green-100 text-green-600 border-2 border-green-200">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
        <div
          className={`border-3 border-dashed rounded-3xl p-16 text-center transition-all duration-300 cursor-pointer relative overflow-hidden ${
            dragActive
              ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 transform -translate-y-1 shadow-2xl"
              : "border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 hover:border-blue-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 hover:transform hover:-translate-y-1 hover:shadow-2xl"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-6 relative z-10">
            <UploadIcon
              size={64}
              className={`transition-all duration-300 ${
                dragActive
                  ? "text-blue-600 transform scale-110"
                  : "text-gray-400 hover:text-blue-600 hover:scale-110"
              }`}
            />
            <h3 className="text-2xl font-semibold text-gray-800">
              Drag and drop your images here
            </h3>
            <p className="text-lg text-gray-600">or</p>
            <label className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl cursor-pointer transition-all duration-300 font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-blue-800 hover:transform hover:-translate-y-1 hover:shadow-xl">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              Browse Files
            </label>
            <div className="text-gray-500 text-sm font-medium">
              <p>Supported formats: JPEG, PNG, WebP</p>
              <p>Maximum size: 10MB per file</p>
              <p>Supports Maximum 10 file uploads at a time.</p>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200 mt-8">
            <div className="flex justify-between items-center p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-gray-200">
              <h3 className="text-gray-800 text-xl font-semibold">
                Selected Images ({files.length})
              </h3>
              <button
                onClick={clearAllFiles}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white border-none cursor-pointer p-3 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:from-red-600 hover:to-red-700 hover:transform hover:-translate-y-1 hover:shadow-xl"
              >
                <X size={20} />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {files.map((fileObj) => (
                <div
                  key={fileObj.id}
                  className="bg-slate-50 border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:transform hover:-translate-y-1 hover:shadow-lg hover:border-slate-300"
                >
                  <div className="relative w-full h-48 overflow-hidden bg-slate-100 flex items-center justify-center">
                    {fileObj.preview && (
                      <img
                        src={fileObj.preview}
                        alt={fileObj.file.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      className="absolute top-3 right-3 bg-red-500/90 text-white border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-md hover:bg-red-600/95 hover:transform hover:scale-110 hover:shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-5 bg-white">
                    <div className="flex items-center gap-2 text-gray-800 font-semibold mb-3 text-sm">
                      <ImageIcon size={16} />
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                        {fileObj.file.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs mb-3 font-medium">
                      <span>
                        Size: {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span>
                        Type: {fileObj.file.type.split("/")[1].toUpperCase()}
                      </span>
                    </div>

                    {uploadProgress[fileObj.id] && (
                      <div className="mt-3">
                        {uploadProgress[fileObj.id].status === "uploading" && (
                          <div className="flex flex-col gap-2">
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                                style={{
                                  width: `${
                                    uploadProgress[fileObj.id].progress
                                  }%`,
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>Uploading...</span>
                            </div>
                          </div>
                        )}
                        {uploadProgress[fileObj.id].status === "completed" && (
                          <div className="flex items-center gap-2 text-xs text-green-600 font-medium bg-green-50 px-3 py-2 rounded-lg">
                            <CheckCircle size={16} />
                            <span>Completed</span>
                          </div>
                        )}
                        {uploadProgress[fileObj.id].status === "error" && (
                          <div className="flex items-center gap-2 text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span>Failed</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold text-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl mt-6"
            >
              {uploading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    Analyzing {files.length} image{files.length > 1 ? "s" : ""}
                    ...
                  </span>
                </div>
              ) : (
                <>
                  <UploadIcon size={20} />
                  Upload & Analyze {files.length} Image
                  {files.length > 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 mt-12">
        <h3 className="text-3xl font-bold text-gray-800 text-center mb-8">
          How it works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
              1
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-gray-800">
                Upload Image
              </h4>
              <p className="text-gray-600">
                Upload or drag an image showing people wearing construction PPE
                (hard hats, safety vests).
              </p>
            </div>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
              2
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-gray-800">
                AI Analysis
              </h4>
              <p className="text-gray-600">
                Our system detects helmets, safety vests with our Deep Learning
                model.
              </p>
            </div>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
              3
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-gray-800">
                View Results
              </h4>
              <p className="text-gray-600">
                Get detailed results with bounding boxes and confidence scores
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
