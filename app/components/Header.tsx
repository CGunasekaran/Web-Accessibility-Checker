"use client";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              🌐 Web Accessibility Checker
            </h1>
            <p className="text-indigo-100 text-sm">
              Analyze websites for WCAG compliance and get actionable solutions
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-sm font-medium">
              WCAG 2.1 AA
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
