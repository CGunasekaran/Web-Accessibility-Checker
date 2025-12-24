# 🌐 Web Accessibility Checker

A powerful, modern web application for analyzing website accessibility and ensuring WCAG 2.1 compliance. Built with Next.js 16, TypeScript, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🔍 Comprehensive Accessibility Analysis
- **Automated WCAG Testing** - Powered by axe-core and Puppeteer
- **25+ Rule Solutions** - Detailed fixes for common accessibility issues
- **Visual Screenshots** - Capture problematic elements automatically
- **Severity Filtering** - Filter by Critical, Serious, Moderate, or Minor issues
- **Real-time Results** - Instant analysis with detailed explanations

### 📊 Export & Reporting
- **Multiple Export Formats** - JSON, CSV, and HTML reports
- **Beautiful HTML Reports** - Standalone reports with statistics and styling
- **Copy to Clipboard** - Quick sharing of results
- **Professional Output** - Ready for clients and stakeholders

### 💾 Smart Caching & History
- **24-Hour Cache** - Avoid re-scanning the same URLs
- **Scan History** - Quick access to previous scans
- **localStorage Integration** - Fast, client-side storage
- **Up to 50 Saved Scans** - Automatic cleanup of old entries

### 🎨 Modern UI/UX
- **Gradient Backgrounds** - Beautiful, modern design
- **Responsive Layout** - Works on all devices
- **Interactive Tiles** - Click to filter by severity
- **Dark Mode Editor** - Monaco editor for code playground
- **Smooth Animations** - Professional transitions and effects

### 🛠️ Developer Features
- **Code Playground** - Test fixes in real-time
- **Live Preview** - See changes instantly
- **Contextual Solutions** - Shows your actual code with fixes
- **WCAG Criteria** - Links to official documentation

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/CGunasekaran/Web-Accessibility-Checker.git
cd Web-Accessibility-Checker
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the development server**
```bash
npm run dev
```

4. **Open your browser**
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## 📖 Usage

### Analyzing a Website

1. Enter the URL of the website you want to analyze
2. Click "Analyze" button
3. Wait for the scan to complete
4. Review the results organized by severity

### Filtering Results

Click on any severity tile to filter issues:
- **Violations** - Show all issues
- **Critical** - High-priority issues
- **Serious** - Important issues
- **Moderate** - Medium-priority issues
- **Minor** - Low-priority issues

### Viewing Solutions

1. Click "View Solution" on any issue card
2. Review the "Issue Details" section
3. See your actual code in "Your Code (Before)"
4. Copy the fixed code from "Fixed Code (After)"
5. Click "Test in Playground" to try the fix

### Exporting Reports

Click any export button at the top of results:
- **Export JSON** - Full scan data for integration
- **Export CSV** - Spreadsheet format
- **Export HTML** - Beautiful standalone report
- **Copy Report** - Text format to clipboard

### Scan History

- Click "Recent Scans" to view previous analyses
- Click any scan to reload cached results
- Click "Clear All" to reset history

## 🏗️ Project Structure

```
accessibility-checker/
├── app/
│   ├── api/
│   │   ├── analyze/          # Main analysis endpoint
│   │   └── screenshot/       # Screenshot capture endpoint
│   ├── components/
│   │   ├── Header.tsx        # App header
│   │   ├── Footer.tsx        # App footer with portfolio link
│   │   ├── URLInput.tsx      # URL input form
│   │   ├── IssueCard.tsx     # Individual issue display
│   │   ├── CodePlayground.tsx # Live code editor
│   │   └── ScanHistory.tsx   # Recent scans dropdown
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Main page
│   └── globals.css           # Global styles
├── lib/
│   ├── solution-provider.ts  # 25+ WCAG solutions
│   ├── cache-manager.ts      # Caching & history
│   ├── export-utils.ts       # Export functionality
│   └── accessibility-scanner.ts
├── types/
│   └── accessibility.ts      # TypeScript interfaces
└── public/                   # Static assets
```

## 🔧 Technologies Used

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Puppeteer](https://pptr.dev/)** - Headless browser automation
- **[axe-core](https://github.com/dequelabs/axe-core)** - Accessibility testing engine
- **[Monaco Editor](https://microsoft.github.io/monaco-editor/)** - VS Code editor in browser

## 📋 Supported Accessibility Rules

The checker detects and provides solutions for 25+ accessibility issues:

### Critical & Serious Issues
- Color contrast violations
- Missing alt text on images
- Form inputs without labels
- Missing page language
- Duplicate IDs
- Invalid ARIA attributes

### Moderate & Minor Issues
- Heading order problems
- Missing H1 heading
- Landmark regions
- Tab index issues
- Meta viewport configuration
- Hidden focusable elements

## 🎯 WCAG Compliance

This tool helps you meet:
- ✅ WCAG 2.1 Level A
- ✅ WCAG 2.1 Level AA
- 📋 WCAG 2.1 Level AAA (partial)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Gunasekaran**

- Portfolio: [https://gunasekaran-portfolio.vercel.app/](https://gunasekaran-portfolio.vercel.app/)
- GitHub: [@CGunasekaran](https://github.com/CGunasekaran)

## 🙏 Acknowledgments

- [axe-core](https://github.com/dequelabs/axe-core) by Deque Systems
- [Puppeteer](https://pptr.dev/) by Google Chrome team
- [Next.js](https://nextjs.org/) by Vercel
- WCAG Guidelines by W3C

## 🔮 Future Enhancements

- [ ] User authentication (NextAuth.js)
- [ ] Cloud database integration (Supabase)
- [ ] Browser extension version
- [ ] PDF export with charts
- [ ] Automated testing suite
- [ ] Multi-language support
- [ ] Email/Slack notifications
- [ ] API for third-party integrations
- [ ] Team collaboration features
- [ ] Scheduled scans

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Visit my [portfolio](https://gunasekaran-portfolio.vercel.app/)

---

Made with ❤️ by Gunasekaran | © 2025 Web Accessibility Checker
