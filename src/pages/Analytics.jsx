import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Calendar,
  AlertCircle,
} from "lucide-react";

const Analytics = () => {
  const [stats, setStats] = useState({
    totalImages: 0,
    totalDetections: 0,
    detectionsByLabel: {},
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Use local date formatting to avoid timezone issues
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      from: formatLocalDate(thirtyDaysAgo),
      to: formatLocalDate(today),
    };
  });

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Convert dates to ensure proper timezone handling
      const fromDate = dateRange.from
        ? new Date(dateRange.from + "T00:00:00").toISOString()
        : null;
      const toDate = dateRange.to
        ? new Date(dateRange.to + "T23:59:59").toISOString()
        : null;

      console.log("Date range:", {
        originalFrom: dateRange.from,
        originalTo: dateRange.to,
        convertedFrom: fromDate,
        convertedTo: toDate,
      });

      // Load all images with filters - fetch in batches to get all data
      let allImages = [];
      let offset = 0;
      const batchSize = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await apiService.getImages({
          limit: batchSize,
          offset: offset,
          from: fromDate,
          to: toDate,
        });

        if (
          response.data &&
          response.data.items &&
          Array.isArray(response.data.items)
        ) {
          allImages = [...allImages, ...response.data.items];
          hasMore =
            response.data.next_offset !== null &&
            response.data.items.length === batchSize;
          offset = response.data.next_offset || 0;
        } else {
          hasMore = false;
        }

        // Safety break to prevent infinite loops
        if (offset > 10000) break;
      }

      // Calculate statistics
      const totalImages = allImages.length;
      let totalDetections = 0;
      const detectionsByLabel = {};

      allImages.forEach((image) => {
        if (image.detections && Array.isArray(image.detections)) {
          totalDetections += image.detections.length;
          image.detections.forEach((detection) => {
            if (detection.label) {
              detectionsByLabel[detection.label] =
                (detectionsByLabel[detection.label] || 0) + 1;
            }
          });
        }
      });

      // Get recent activity (last 10 images)
      const recentActivity = allImages.slice(0, 10);

      setStats({
        totalImages,
        totalDetections,
        detectionsByLabel,
        recentActivity,
      });

      console.log("Analytics loaded:", {
        totalImages,
        totalDetections,
        detectionsByLabel,
      });
      setError("");
    } catch (error) {
      setError(
        "Failed to load analytics data. Please check your connection and try again."
      );
      console.error("Analytics error:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleDateRangeChange = (key, value) => {
    setDateRange((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 text-lg text-gray-600">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          Loading analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-0 flex flex-col gap-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Analytics Dashboard
        </h1>
        <p className="text-xl text-gray-600">
          Insights into your PPE detection data
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <Calendar size={20} className="text-gray-500" />
            <label className="font-medium text-gray-700 min-w-12">From:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => handleDateRangeChange("from", e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-700 font-medium"
            />
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <Calendar size={20} className="text-gray-500" />
            <label className="font-medium text-gray-700 min-w-8">To:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => handleDateRangeChange("to", e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-700 font-medium"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Eye size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Total Images
              </h3>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalImages}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Total Detections
              </h3>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalDetections}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Average Detections
              </h3>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalImages > 0
                  ? (stats.totalDetections / stats.totalImages).toFixed(1)
                  : "0"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detection Types Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Detections by Type
        </h2>
        <div className="space-y-4">
          {Object.entries(stats.detectionsByLabel).length > 0 ? (
            Object.entries(stats.detectionsByLabel).map(([label, count]) => {
              const percentage = (
                (count / stats.totalDetections) *
                100
              ).toFixed(1);
              const labelColors = {
                helmet: "bg-blue-500",
                vest: "bg-orange-500",
                default: "bg-gray-500",
              };
              const colorClass = labelColors[label] || labelColors.default;

              return (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 capitalize">
                      {label.charAt(0).toUpperCase() + label.slice(1)}
                    </span>
                    <span className="text-sm font-semibold text-gray-600">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${colorClass} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No detection data available for the selected date range
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Recent Activity
        </h2>
        {stats.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {stats.recentActivity.map((image) => (
              <div
                key={image._id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
                  <img
                    src={apiService.getAnnotatedImageUrl(image)}
                    alt={image.originalName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If first URL fails, try original image URL
                      if (
                        image.originalImageUrl &&
                        e.target.src !== image.originalImageUrl
                      ) {
                        e.target.src = image.originalImageUrl;
                        return;
                      }
                      // If original image also fails, show fallback
                      e.target.style.display = "none";
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                    onLoad={(e) => {
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = "none";
                    }}
                  />
                  <div
                    className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-400 text-xs"
                    style={{ display: "none" }}
                  >
                    📷
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate">
                    {image.originalName || "Unknown file"}
                  </h4>
                  <p className="text-sm text-gray-500 font-medium">
                    {image.createdAt
                      ? new Date(image.createdAt).toLocaleString()
                      : "Unknown date"}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {image.detections && image.detections.length > 0 ? (
                      image.detections.map((detection, index) => {
                        const labelColors = {
                          helmet: "bg-blue-100 text-blue-700",
                          vest: "bg-orange-100 text-orange-700",
                          default: "bg-gray-100 text-gray-700",
                        };
                        const colorClass =
                          labelColors[detection.label] || labelColors.default;

                        return (
                          <span
                            key={index}
                            className={`px-2 py-1 ${colorClass} rounded-lg text-xs font-medium capitalize`}
                          >
                            {detection.label || "unknown"}
                          </span>
                        );
                      })
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">
                        No detections
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-600">
                    {image.detections ? image.detections.length : 0} detection
                    {!image.detections || image.detections.length !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent activity found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
