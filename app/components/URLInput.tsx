"use client";

import { useState } from "react";

interface URLInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export default function URLInput({ onAnalyze, isLoading }: URLInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto mb-12">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL (e.g., https://example.com)"
          className="flex-1 px-6 py-4 text-gray-900 bg-white/90 backdrop-blur-sm border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 focus:outline-none transition-all shadow-md font-medium placeholder:text-gray-400"
          required
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </form>
  );
}
