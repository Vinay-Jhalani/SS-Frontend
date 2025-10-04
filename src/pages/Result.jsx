import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../services/api";
import {
  ArrowLeft,
  Download,
  Tag,
  Calendar,
  Hash,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

const Result = () => {
  const { id } = useParams();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hashCopied, setHashCopied] = useState(false);

  const loadImage = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getImage(id);
      setImage(response.data);
      setError("");
    } catch (error) {
      setError("Failed to load image details");
      console.error("Load image error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadImage();
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [loadImage]);

  const downloadImage = async () => {
    try {
      // If annotated image is available, download from Cloudinary
      if (image.annotatedImageUrl) {
        const link = document.createElement("a");
        link.href = image.annotatedImageUrl;
        link.setAttribute("download", `annotated-${image.originalName}`);
        link.setAttribute("target", "_blank");
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // Fallback to original image
        const response = await apiService.getImageFile(id);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", image.originalName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download image");
    }
  };

  const copyHashToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(image.detectionsHash);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 2000);
    } catch (error) {
      console.error("Copy error:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = image.detectionsHash;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">
            Loading image details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Error Loading Image
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/history"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              <ArrowLeft size={20} />
              Back to History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/history"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                <ArrowLeft size={20} />
                Back to History
              </Link>
              <div className="w-px h-6 bg-gray-300"></div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Analysis Results
              </h1>
            </div>
            <button
              onClick={downloadImage}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Download size={20} />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Detection Result
                </h2>
                <div className="relative group">
                  <img
                    src={apiService.getAnnotatedImageUrl(image)}
                    alt={`${image.originalName} - PPE Detection Results`}
                    className="w-full h-auto rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
                    onError={(e) => {
                      // If first URL fails, try original image URL
                      if (
                        image.originalImageUrl &&
                        e.target.src !== image.originalImageUrl
                      ) {
                        e.target.src = image.originalImageUrl;
                      }
                    }}
                  />

                  {/* Show fallback message if no annotated image */}
                  {!image.annotatedImageUrl && (
                    <div className="absolute inset-x-4 bottom-4">
                      <div className="bg-amber-100 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-amber-700">
                          <AlertCircle size={16} />
                          <p className="text-sm font-medium">
                            No PPE Equipment detected, showing original image
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Image Details Card */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Hash size={20} className="text-blue-600" />
                Image Details
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 font-medium">File Name:</span>
                  <span className="text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {image.originalName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">
                    Upload Date:
                  </span>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar size={16} />
                    <span>{new Date(image.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">File Size:</span>
                  <span className="text-gray-900 font-semibold">
                    {(image.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">
                    Processing Status:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      image.processed
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                    }`}
                  >
                    {image.processed ? "Completed" : "Pending"}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 font-medium">
                    Detections Hash:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded max-w-32 truncate">
                      {image.detectionsHash}
                    </span>
                    <button
                      onClick={copyHashToClipboard}
                      className={`p-1.5 rounded-lg transition-all duration-200 ${
                        hashCopied
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
                      }`}
                      title={hashCopied ? "Copied!" : "Copy hash"}
                    >
                      {hashCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PPE Detections Card */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Tag size={20} className="text-purple-600" />
                PPE Detections ({image.detections.length})
              </h2>

              {image.detections.length > 0 ? (
                <div className="space-y-4">
                  {image.detections.map((detection, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              detection.label === "helmet"
                                ? "bg-blue-500"
                                : detection.label === "vest"
                                ? "bg-orange-500"
                                : detection.label === "gloves"
                                ? "bg-green-500"
                                : detection.label === "boots"
                                ? "bg-purple-500"
                                : "bg-gray-500"
                            }`}
                          ></div>
                          <span className="font-semibold text-gray-900 capitalize">
                            {detection.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-700">
                            {(detection.confidence * 100).toFixed(1)}%
                            confidence
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Bounding Box Coordinates:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-blue-50 px-2 py-1 rounded text-blue-700">
                            <span className="font-medium">X:</span>{" "}
                            {detection.boundingBox.x.toFixed(3)}
                          </div>
                          <div className="bg-green-50 px-2 py-1 rounded text-green-700">
                            <span className="font-medium">Y:</span>{" "}
                            {detection.boundingBox.y.toFixed(3)}
                          </div>
                          <div className="bg-purple-50 px-2 py-1 rounded text-purple-700">
                            <span className="font-medium">W:</span>{" "}
                            {detection.boundingBox.width.toFixed(3)}
                          </div>
                          <div className="bg-orange-50 px-2 py-1 rounded text-orange-700">
                            <span className="font-medium">H:</span>{" "}
                            {detection.boundingBox.height.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Tag size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    No PPE items detected in this image.
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Try uploading an image with visible safety equipment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
