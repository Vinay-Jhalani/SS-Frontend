import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle 401 errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common["Authorization"];
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.api.post("/auth/login", { email, password });
  }

  async register(name, email, password) {
    return this.api.post("/auth/register", { name, email, password });
  }

  async getProfile() {
    return this.api.get("/auth/profile");
  }

  // Image endpoints
  async uploadImage(file, idempotencyKey = null) {
    const formData = new FormData();
    formData.append("image", file);

    const headers = {
      "Content-Type": "multipart/form-data",
    };

    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    return this.api.post("/images", formData, { headers });
  }

  async uploadImages(files, onProgress = null) {
    const formData = new FormData();

    // For multiple files, use 'images' field name
    // For single file, use 'image' field name
    if (files.length === 1) {
      formData.append("image", files[0]);
    } else {
      files.forEach((file) => {
        formData.append("images", file);
      });
    }

    const headers = {
      "Content-Type": "multipart/form-data",
    };

    // Provide an idempotency key for single-file uploads to avoid duplicate processing on retries
    if (files.length === 1) {
      const f = files[0];
      const key = `${f.name}-${f.size}-${f.lastModified}`;
      headers["Idempotency-Key"] = key;
    }

    const config = { headers };

    // Add progress tracking if callback provided
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }

    return this.api.post("/images", formData, config);
  }

  async getImages(params = {}) {
    return this.api.get("/images", { params });
  }

  async getImage(id) {
    return this.api.get(`/images/${id}`);
  }

  async deleteImage(id) {
    return this.api.delete(`/images/${id}`);
  }

  async getImageFile(id) {
    return this.api.get(`/images/${id}/file`, {
      responseType: "blob",
    });
  }

  // Labels endpoint
  async getLabels() {
    return this.api.get("/labels");
  }

  // Utility method to create image URL (redirects to Cloudinary)
  getImageUrl(id) {
    return `${API_BASE_URL}/images/${id}/file`;
  }

  // Get direct Cloudinary URL from image object
  getDirectImageUrl(image) {
    return image.originalImageUrl || this.getImageUrl(image._id);
  }

  // Get annotated image URL from image object
  getAnnotatedImageUrl(image) {
    return (
      image.annotatedImageUrl ||
      image.originalImageUrl ||
      this.getImageUrl(image._id)
    );
  }
}

export const apiService = new ApiService();
