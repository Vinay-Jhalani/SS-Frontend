import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api";
import {
  Search,
  Filter,
  Calendar,
  Tag,
  Trash2,
  Eye,
  AlertCircle,
} from "lucide-react";

const History = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(() => {
    // Initialize with empty dates to avoid timezone issues
    return {
      limit: 8,
      offset: 0,
      label: "",
      from: "",
      to: "",
    };
  });
  const [labels, setLabels] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    hasMore: false,
  });

  useEffect(() => {
    loadLabels();
    loadImages();
  }, []);

  const loadLabels = async () => {
    try {
      const response = await apiService.getLabels();
      setLabels(response.data.labels);
    } catch (error) {
      console.error("Failed to load labels:", error);
    }
  };

  const loadImages = async (newFilters = filters) => {
    try {
      setLoading(true);
      const response = await apiService.getImages(newFilters);

      setImages(response.data.items || []);

      // Use backend pagination data
      setPagination({
        currentPage: response.data.current_page || 1,
        totalPages: response.data.total_pages || 1,
        totalItems: response.data.total || 0,
        hasMore: response.data.next_offset !== null,
      });

      setError("");
    } catch (error) {
      setError("Failed to load images");
      console.error("Load images error:", error);
      // Set default pagination on error
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasMore: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, offset: 0 };
    setFilters(newFilters);

    // Convert dates for API call
    const apiFilters = { ...newFilters };
    if (newFilters.from) {
      apiFilters.from = new Date(newFilters.from + "T00:00:00").toISOString();
    }
    if (newFilters.to) {
      apiFilters.to = new Date(newFilters.to + "T23:59:59").toISOString();
    }

    loadImages(apiFilters);
  };

  const handlePageChange = (page) => {
    const newOffset = (page - 1) * filters.limit;
    const newFilters = { ...filters, offset: newOffset };
    setFilters(newFilters);

    // Convert dates for API call
    const apiFilters = { ...newFilters };
    if (newFilters.from) {
      apiFilters.from = new Date(newFilters.from + "T00:00:00").toISOString();
    }
    if (newFilters.to) {
      apiFilters.to = new Date(newFilters.to + "T23:59:59").toISOString();
    }

    loadImages(apiFilters);

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) {
      return null;
    }

    const { currentPage, totalPages } = pagination;
    const pages = [];
    const maxVisiblePages = 5;

    // Calculate start and end pages
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 mx-1 bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          ←
        </button>
      );
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-2 mx-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-3 py-2 mx-1 text-gray-500">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 mx-1 rounded-lg transition-colors duration-200 ${
            i === currentPage
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-3 py-2 mx-1 text-gray-500">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-2 mx-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 mx-1 bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          →
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-8">
        <div className="flex items-center">{pages}</div>
      </div>
    );
  };

  const deleteImage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      await apiService.deleteImage(id);
      setImages(images.filter((img) => img._id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete image");
    }
  };

  if (loading && images.length === 0) {
    return <div className="loading">Loading images...</div>;
  }

  return (
    <div className="w-full max-w-none mx-0 flex flex-col gap-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Image History
        </h1>
        <p className="text-xl text-gray-600">
          View and manage your uploaded images
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <Filter size={20} className="text-gray-500" />
            <select
              value={filters.label}
              onChange={(e) => handleFilterChange("label", e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-700 font-medium"
            >
              <option value="">All Labels</option>
              {labels.map((label) => (
                <option key={label} value={label}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-gray-600 font-medium text-sm">From</span>
            <Calendar size={20} className="text-gray-500" />
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange("from", e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-700 font-medium"
              placeholder="From date"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-gray-600 font-medium text-sm">To</span>
            <Calendar size={20} className="text-gray-500" />
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange("to", e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-700 font-medium"
              placeholder="To date"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-4 p-6 rounded-2xl mb-6 font-medium text-lg shadow-lg backdrop-blur-lg bg-gradient-to-r from-red-50 to-red-100 text-red-600 border-2 border-red-200">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((image) => (
          <div
            key={image._id}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl"
          >
            <div className="relative h-48 overflow-hidden bg-gray-100">
              <img
                src={apiService.getAnnotatedImageUrl(image)}
                alt={image.originalName}
                loading="lazy"
                className="w-full h-full object-cover"
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
              {image.annotatedImageUrl && (
                <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 py-1 rounded-xl text-xs font-semibold shadow-lg">
                  ✨ PPE Detected
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm truncate">
                {image.originalName}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {new Date(image.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>

              <div className="flex flex-wrap gap-1">
                {image.detections.map((detection, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                  >
                    <Tag size={10} />
                    {detection.label} ({(detection.confidence * 100).toFixed(0)}
                    %)
                  </span>
                ))}
              </div>
            </div>

            <div className="flex border-t border-gray-100">
              <Link
                to={`/result/${image._id}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-blue-600 hover:bg-blue-50 transition-colors duration-200 font-medium text-sm border-r border-gray-100"
              >
                <Eye size={16} />
                View
              </Link>
              <button
                onClick={() => deleteImage(image._id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200 font-medium text-sm"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Pagination Info */}
      {pagination.totalItems > 0 && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Showing {(pagination.currentPage - 1) * filters.limit + 1} to{" "}
          {Math.min(
            pagination.currentPage * filters.limit,
            pagination.totalItems
          )}{" "}
          of {pagination.totalItems} images
        </div>
      )}

      {images.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-800">
              No images found
            </h3>
            <p className="text-gray-600">
              Upload your first image to get started
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Upload Image
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
