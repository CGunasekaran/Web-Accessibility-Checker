export const exportUtils = {
  // Export as JSON
  exportJSON(data: any, filename: string = "accessibility-report"): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Export as CSV
  exportCSV(
    violations: any[],
    filename: string = "accessibility-report"
  ): void {
    const headers = [
      "Impact",
      "Issue",
      "Description",
      "Elements Affected",
      "Help URL",
    ];
    const rows = violations.map((v) => [
      v.impact,
      v.help,
      v.description.replace(/,/g, ";"),
      v.nodes.length,
      v.helpUrl,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Generate HTML report
  exportHTML(data: any, filename: string = "accessibility-report"): void {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report - ${data.url}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 10px;
      margin-bottom: 2rem;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-label {
      color: #666;
      font-size: 0.875rem;
      text-transform: uppercase;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      margin-top: 0.5rem;
    }
    .critical { color: #dc2626; }
    .serious { color: #ea580c; }
    .moderate { color: #ca8a04; }
    .minor { color: #2563eb; }
    .passes { color: #16a34a; }
    .violation {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      border-left: 4px solid;
    }
    .violation.critical { border-left-color: #dc2626; }
    .violation.serious { border-left-color: #ea580c; }
    .violation.moderate { border-left-color: #ca8a04; }
    .violation.minor { border-left-color: #2563eb; }
    .violation h3 {
      margin-top: 0;
    }
    .footer {
      text-align: center;
      margin-top: 3rem;
      color: #666;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌐 Accessibility Report</h1>
    <p><strong>URL:</strong> ${data.url}</p>
    <p><strong>Scan Date:</strong> ${new Date(
      data.timestamp
    ).toLocaleString()}</p>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">Total Violations</div>
      <div class="stat-value critical">${data.violations.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Critical</div>
      <div class="stat-value critical">${
        data.violations.filter((v: any) => v.impact === "critical").length
      }</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Serious</div>
      <div class="stat-value serious">${
        data.violations.filter((v: any) => v.impact === "serious").length
      }</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Moderate</div>
      <div class="stat-value moderate">${
        data.violations.filter((v: any) => v.impact === "moderate").length
      }</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Minor</div>
      <div class="stat-value minor">${
        data.violations.filter((v: any) => v.impact === "minor").length
      }</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Passes</div>
      <div class="stat-value passes">${data.passes}</div>
    </div>
  </div>

  <h2>Violations Detail</h2>
  ${data.violations
    .map(
      (v: any) => `
    <div class="violation ${v.impact}">
      <h3>${v.help}</h3>
      <p><strong>Impact:</strong> <span class="${
        v.impact
      }">${v.impact.toUpperCase()}</span></p>
      <p>${v.description}</p>
      <p><strong>Affected Elements:</strong> ${v.nodes.length}</p>
      <p><a href="${v.helpUrl}" target="_blank">Learn More →</a></p>
    </div>
  `
    )
    .join("")}

  <div class="footer">
    <p>Generated by Web Accessibility Checker</p>
    <p>© ${new Date().getFullYear()} All rights reserved</p>
  </div>
</body>
</html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Copy results to clipboard
  copyToClipboard(data: any): Promise<void> {
    const text = `
Accessibility Report
URL: ${data.url}
Date: ${new Date(data.timestamp).toLocaleString()}

Summary:
- Total Violations: ${data.violations.length}
- Passes: ${data.passes}
- Incomplete: ${data.incomplete}

Violations by Severity:
- Critical: ${
      data.violations.filter((v: any) => v.impact === "critical").length
    }
- Serious: ${data.violations.filter((v: any) => v.impact === "serious").length}
- Moderate: ${
      data.violations.filter((v: any) => v.impact === "moderate").length
    }
- Minor: ${data.violations.filter((v: any) => v.impact === "minor").length}

Details:
${data.violations
  .map(
    (v: any) => `
${v.impact.toUpperCase()}: ${v.help}
${v.description}
Affected Elements: ${v.nodes.length}
Help: ${v.helpUrl}
`
  )
  .join("\n")}
    `.trim();

    return navigator.clipboard.writeText(text);
  },
};
