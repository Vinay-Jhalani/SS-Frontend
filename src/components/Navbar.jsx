import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Upload, History, BarChart3, LogOut, User } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-white to-slate-50 border-b-2 border-gray-200 px-8 py-4 flex justify-between items-center shadow-lg backdrop-blur-lg sticky top-0 z-50 min-h-20">
      <div className="navbar-brand">
        <h1 className="m-0 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          SafetySnap
        </h1>
      </div>

      <div className="flex gap-4 items-center">
        <Link
          to="/upload"
          className={`flex items-center gap-2 px-5 py-3 no-underline rounded-xl transition-all duration-300 font-medium text-base relative overflow-hidden ${
            isActive("/upload")
              ? "text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 transform -translate-y-1 shadow-lg"
              : "text-slate-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:transform hover:-translate-y-1 hover:shadow-lg"
          }`}
        >
          <Upload size={20} />
          Upload
        </Link>

        <Link
          to="/history"
          className={`flex items-center gap-2 px-5 py-3 no-underline rounded-xl transition-all duration-300 font-medium text-base relative overflow-hidden ${
            isActive("/history")
              ? "text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 transform -translate-y-1 shadow-lg"
              : "text-slate-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:transform hover:-translate-y-1 hover:shadow-lg"
          }`}
        >
          <History size={20} />
          History
        </Link>

        <Link
          to="/analytics"
          className={`flex items-center gap-2 px-5 py-3 no-underline rounded-xl transition-all duration-300 font-medium text-base relative overflow-hidden ${
            isActive("/analytics")
              ? "text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 transform -translate-y-1 shadow-lg"
              : "text-slate-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:transform hover:-translate-y-1 hover:shadow-lg"
          }`}
        >
          <BarChart3 size={20} />
          Analytics
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 text-slate-600 font-medium px-4 py-2 bg-slate-100 rounded-xl border border-gray-200">
          <User size={20} />
          <span>{user?.name}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white border-none rounded-xl cursor-pointer transition-all duration-300 font-medium shadow-lg hover:from-red-700 hover:to-red-800 hover:transform hover:-translate-y-1 hover:shadow-xl"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
