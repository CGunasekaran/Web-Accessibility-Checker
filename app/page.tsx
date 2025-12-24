"use client";

import { useState } from "react";
import Header from "./components/Header";
import URLInput from "./components/URLInput";
import IssueCard from "./components/IssueCard";
import CodePlayground from "./components/CodePlayground";
import ScanHistory from "./components/ScanHistory";
import { AccessibilityIssue } from "@/types/accessibility";
import { getSolution } from "@/lib/solution-provider";
import { cacheManager } from "@/lib/cache-manager";
import { exportUtils } from "@/lib/export-utils";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedIssue, setSelectedIssue] = useState<AccessibilityIssue | null>(
    null
  );
  const [showPlayground, setShowPlayground] = useState(false);
  const [playgroundCode, setPlaygroundCode] = useState("");
  const [filter, setFilter] = useState<
    "all" | "critical" | "serious" | "moderate" | "minor"
  >("all");

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setResults(null);
    setSelectedIssue(null);
    setFilter("all");

    // Check cache first
    const cached = cacheManager.getCached(url);
    if (cached) {
      console.log("Using cached results");
      setResults(cached);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      setResults(data);

      // Cache the results
      if (data.violations) {
        cacheManager.setCached(url, data);
        cacheManager.addToHistory(url, data.violations.length);
      }
    } catch (error) {
      console.error("Error analyzing URL:", error);
      alert("Failed to analyze URL. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: "json" | "csv" | "html") => {
    if (!results) return;

    const filename = `accessibility-report-${results.url
      .replace(/https?:\/\//, "")
      .replace(/\//g, "-")}`;

    switch (format) {
      case "json":
        exportUtils.exportJSON(results, filename);
        break;
      case "csv":
        exportUtils.exportCSV(results.violations, filename);
        break;
      case "html":
        exportUtils.exportHTML(results, filename);
        break;
    }
  };

  const handleCopyReport = async () => {
    if (!results) return;

    try {
      await exportUtils.copyToClipboard(results);
      alert("Report copied to clipboard!");
    } catch (error) {
      alert("Failed to copy report");
    }
  };

  const handleViewSolution = (issue: AccessibilityIssue) => {
    setSelectedIssue(issue);
    setShowPlayground(false);
  };

  const handleOpenPlayground = () => {
    if (selectedIssue) {
      const solution = getSolution(selectedIssue.id, selectedIssue);
      setPlaygroundCode(solution.codeExample.after);
    }
    setShowPlayground(true);
  };

  const filteredViolations =
    results?.violations?.filter((issue: AccessibilityIssue) => {
      if (filter === "all") return true;
      return issue.impact === filter;
    }) || [];

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <URLInput onAnalyze={handleAnalyze} isLoading={isLoading} />

          <ScanHistory onSelectUrl={handleAnalyze} />

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-700 font-medium">
                Analyzing accessibility...
              </p>
            </div>
          )}

          {results && results.violations && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Export Buttons */}
              <div className="lg:col-span-3 flex flex-wrap gap-3 mb-4">
                <button
                  onClick={() => handleExport("json")}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export JSON
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport("html")}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Export HTML
                </button>
                <button
                  onClick={handleCopyReport}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Report
                </button>
              </div>

              {/* Summary Cards */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setFilter("all")}
                  className={`bg-gradient-to-br from-red-50 to-red-100 backdrop-blur-sm p-6 rounded-xl shadow-lg border-2 transition-all hover:shadow-xl transform hover:scale-105 text-left ${
                    filter === "all"
                      ? "border-red-500 ring-2 ring-red-200"
                      : "border-red-200"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-red-800">
                    Violations
                  </h3>
                  <p className="text-3xl font-bold text-red-700">
                    {results.violations?.length || 0}
                  </p>
                  {filter === "all" && (
                    <p className="text-xs text-gray-600 mt-1">
                      Showing all issues
                    </p>
                  )}
                </button>
                <button
                  onClick={() => setFilter("critical")}
                  className={`bg-gradient-to-br from-red-100 to-red-200 backdrop-blur-sm p-6 rounded-xl shadow-lg border-2 transition-all hover:shadow-xl transform hover:scale-105 text-left ${
                    filter === "critical"
                      ? "border-red-600 ring-2 ring-red-300"
                      : "border-red-300"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-red-900">
                    Critical
                  </h3>
                  <p className="text-3xl font-bold text-red-800">
                    {results.violations?.filter(
                      (v: any) => v.impact === "critical"
                    ).length || 0}
                  </p>
                  {filter === "critical" && (
                    <p className="text-xs text-gray-600 mt-1">Filtered</p>
                  )}
                </button>
                <button
                  onClick={() => setFilter("serious")}
                  className={`bg-gradient-to-br from-orange-50 to-orange-100 backdrop-blur-sm p-6 rounded-xl shadow-lg border-2 transition-all hover:shadow-xl transform hover:scale-105 text-left ${
                    filter === "serious"
                      ? "border-orange-500 ring-2 ring-orange-200"
                      : "border-orange-200"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-orange-800">
                    Serious
                  </h3>
                  <p className="text-3xl font-bold text-orange-700">
                    {results.violations?.filter(
                      (v: any) => v.impact === "serious"
                    ).length || 0}
                  </p>
                  {filter === "serious" && (
                    <p className="text-xs text-gray-600 mt-1">Filtered</p>
                  )}
                </button>
              </div>

              {/* Secondary Filter Cards */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setFilter("moderate")}
                  className={`bg-gradient-to-br from-yellow-50 to-yellow-100 backdrop-blur-sm p-6 rounded-xl shadow-lg border-2 transition-all hover:shadow-xl transform hover:scale-105 text-left ${
                    filter === "moderate"
                      ? "border-yellow-500 ring-2 ring-yellow-200"
                      : "border-yellow-200"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-yellow-900">
                    Moderate
                  </h3>
                  <p className="text-3xl font-bold text-yellow-700">
                    {results.violations?.filter(
                      (v: any) => v.impact === "moderate"
                    ).length || 0}
                  </p>
                  {filter === "moderate" && (
                    <p className="text-xs text-gray-600 mt-1">Filtered</p>
                  )}
                </button>
                <button
                  onClick={() => setFilter("minor")}
                  className={`bg-gradient-to-br from-blue-50 to-blue-100 backdrop-blur-sm p-6 rounded-xl shadow-lg border-2 transition-all hover:shadow-xl transform hover:scale-105 text-left ${
                    filter === "minor"
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-blue-200"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-blue-900">Minor</h3>
                  <p className="text-3xl font-bold text-blue-700">
                    {results.violations?.filter(
                      (v: any) => v.impact === "minor"
                    ).length || 0}
                  </p>
                  {filter === "minor" && (
                    <p className="text-xs text-gray-600 mt-1">Filtered</p>
                  )}
                </button>
                <div className="bg-gradient-to-br from-green-50 to-green-100 backdrop-blur-sm p-6 rounded-xl shadow-lg border-2 border-green-200">
                  <h3 className="text-lg font-semibold text-green-900">
                    Passes
                  </h3>
                  <p className="text-3xl font-bold text-green-700">
                    {results.passes || 0}
                  </p>
                </div>
              </div>

              {/* Issues List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    Issues Found
                    {filter !== "all" && (
                      <span className="text-lg font-semibold text-gray-900 ml-2 bg-gray-200 px-3 py-1 rounded-full">
                        ({filter})
                      </span>
                    )}
                  </h2>
                  {filter !== "all" && (
                    <button
                      onClick={() => setFilter("all")}
                      className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
                {filteredViolations.length > 0 ? (
                  filteredViolations.map(
                    (issue: AccessibilityIssue, idx: number) => (
                      <IssueCard
                        key={idx}
                        issue={issue}
                        onViewSolution={handleViewSolution}
                      />
                    )
                  )
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl text-center">
                    <p className="text-gray-600">No {filter} issues found</p>
                  </div>
                )}
              </div>

              {/* Solution Panel */}
              <div className="lg:col-span-1">
                {selectedIssue && (
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100 sticky top-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Solution
                    </h2>
                    {(() => {
                      const solution = getSolution(
                        selectedIssue.id,
                        selectedIssue
                      );
                      return (
                        <>
                          <h3 className="font-semibold text-lg mb-2 text-gray-900">
                            {solution.title}
                          </h3>
                          <p className="text-sm text-gray-700 mb-4">
                            {solution.description}
                          </p>

                          {selectedIssue.nodes[0]?.failureSummary && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-xs font-semibold text-red-800 mb-1">
                                Issue Details:
                              </p>
                              <p className="text-xs text-red-700">
                                {selectedIssue.nodes[0].failureSummary}
                              </p>
                            </div>
                          )}

                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              Your Code (Before):
                            </p>
                            <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto border border-red-200">
                              <code className="text-gray-900">
                                {solution.codeExample.before}
                              </code>
                            </pre>
                          </div>

                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              Fixed Code (After):
                            </p>
                            <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto border border-green-200">
                              <code className="text-gray-900">
                                {solution.codeExample.after}
                              </code>
                            </pre>
                          </div>

                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              WCAG Criteria:
                            </p>
                            <ul className="list-disc list-inside text-xs text-gray-600">
                              {solution.wcagCriteria.map((criteria, idx) => (
                                <li key={idx}>{criteria}</li>
                              ))}
                            </ul>
                          </div>

                          <button
                            onClick={handleOpenPlayground}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Test in Playground
                          </button>

                          <a
                            href={selectedIssue.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full mt-2 px-4 py-2 text-center border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                          >
                            Learn More
                          </a>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Code Playground */}
          {showPlayground && (
            <div className="mt-8">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Accessibility Code Playground
                </h2>
                <p className="text-gray-600 mb-4">
                  Test your accessibility fixes in real-time. Edit the code and
                  see the changes instantly.
                </p>
                <CodePlayground initialCode={playgroundCode} />
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
