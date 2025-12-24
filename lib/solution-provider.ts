import { Solution, AccessibilityIssue } from "@/types/accessibility";

export const getSolution = (
  violationId: string,
  issue?: AccessibilityIssue
): Solution => {
  // If we have the full issue, extract actual HTML examples
  const actualHTML = issue?.nodes[0]?.html || "";
  const failureSummary = issue?.nodes[0]?.failureSummary || "";

  const solutions: Record<string, Solution> = {
    "color-contrast": {
      title: "Fix Color Contrast",
      description:
        "Ensure text has sufficient contrast against its background (minimum 4.5:1 for normal text, 3:1 for large text).",
      codeExample: {
        before:
          actualHTML ||
          `<div style="color: #777; background: #fff;">
  Low contrast text
</div>`,
        after: actualHTML
          ? actualHTML.replace(/color:\s*#[0-9a-fA-F]{3,6}/, "color: #333") +
            "\n\n<!-- Use darker colors like #333, #000, or text-gray-900 for better contrast -->"
          : `<div style="color: #333; background: #fff;">
  Good contrast text
</div>

<!-- Or use Tailwind -->
<div class="text-gray-900 bg-white">
  Good contrast text
</div>`,
      },
      wcagCriteria: ["1.4.3 Contrast (Minimum)", "1.4.6 Contrast (Enhanced)"],
    },
    "image-alt": {
      title: "Add Alt Text to Images",
      description:
        "All images must have descriptive alt text for screen readers.",
      codeExample: {
        before: actualHTML || `<img src="logo.png">`,
        after: actualHTML
          ? actualHTML.replace(/<img\s/, '<img alt="Descriptive text here" ') +
            '\n\n<!-- Replace "Descriptive text here" with actual description -->'
          : `<img src="logo.png" alt="Company Logo">

<!-- For decorative images -->
<img src="decoration.png" alt="" role="presentation">`,
      },
      wcagCriteria: ["1.1.1 Non-text Content"],
    },
    "button-name": {
      title: "Add Accessible Name to Button",
      description: "Buttons must have discernible text or an accessible name.",
      codeExample: {
        before:
          actualHTML ||
          `<button>
  <i class="icon-search"></i>
</button>`,
        after: actualHTML
          ? actualHTML.replace(
              /<button\s/,
              '<button aria-label="Button action" '
            ) + "\n\n<!-- Or add visible text inside the button -->"
          : `<button aria-label="Search">
  <i class="icon-search"></i>
</button>

<!-- Or use visible text -->
<button>
  <i class="icon-search"></i>
  <span>Search</span>
</button>`,
      },
      wcagCriteria: ["4.1.2 Name, Role, Value"],
    },
    "link-name": {
      title: "Add Accessible Name to Link",
      description:
        "Links must have discernible text that describes their purpose.",
      codeExample: {
        before:
          actualHTML ||
          `<a href="/read-more">
  <img src="arrow.png">
</a>`,
        after: actualHTML
          ? actualHTML.replace(
              /<a\s/,
              '<a aria-label="Descriptive link text" '
            ) + "\n\n<!-- Add descriptive aria-label or visible text -->"
          : `<a href="/read-more" aria-label="Read more about accessibility">
  <img src="arrow.png" alt="">
</a>

<!-- Or use visible text -->
<a href="/read-more">
  Read more <img src="arrow.png" alt="">
</a>`,
      },
      wcagCriteria: [
        "2.4.4 Link Purpose (In Context)",
        "4.1.2 Name, Role, Value",
      ],
    },
    label: {
      title: "Add Label to Form Input",
      description: "Form inputs must have associated labels.",
      codeExample: {
        before: actualHTML || `<input type="text" placeholder="Enter email">`,
        after: actualHTML
          ? `<label for="input-${Date.now()}">Input Label</label>\n${actualHTML.replace(
              /<input\s/,
              `<input id="input-${Date.now()}" `
            )}\n\n<!-- Or add aria-label attribute -->`
          : `<label for="email">Email Address</label>
<input type="text" id="email" placeholder="Enter email">

<!-- Or use aria-label -->
<input 
  type="text" 
  aria-label="Email Address" 
  placeholder="Enter email"
>`,
      },
      wcagCriteria: [
        "1.3.1 Info and Relationships",
        "3.3.2 Labels or Instructions",
      ],
    },
    "html-has-lang": {
      title: "Add Language Attribute to HTML",
      description:
        "The html element must have a lang attribute to identify the page language.",
      codeExample: {
        before: `<html>
  <head>...</head>
  <body>...</body>
</html>`,
        after: `<html lang="en">
  <head>...</head>
  <body>...</body>
</html>

<!-- For other languages -->
<html lang="es"> <!-- Spanish -->
<html lang="fr"> <!-- French -->`,
      },
      wcagCriteria: ["3.1.1 Language of Page"],
    },
    "landmark-one-main": {
      title: "Add Main Landmark",
      description:
        "Page must have one main landmark to identify the primary content.",
      codeExample: {
        before: `<div class="content">
  <h1>Page Title</h1>
  <p>Content...</p>
</div>`,
        after: `<main>
  <h1>Page Title</h1>
  <p>Content...</p>
</main>

<!-- Or use role -->
<div role="main">
  <h1>Page Title</h1>
  <p>Content...</p>
</div>`,
      },
      wcagCriteria: ["1.3.1 Info and Relationships", "2.4.1 Bypass Blocks"],
    },
    region: {
      title: "Use Landmark Regions",
      description:
        "Content should be contained within landmark regions for better navigation.",
      codeExample: {
        before: `<div class="header">...</div>
<div class="content">...</div>
<div class="footer">...</div>`,
        after: `<header>...</header>
<main>...</main>
<footer>...</footer>

<!-- Or using ARIA roles -->
<div role="banner">...</div>
<div role="main">...</div>
<div role="contentinfo">...</div>`,
      },
      wcagCriteria: ["1.3.1 Info and Relationships"],
    },
    "heading-order": {
      title: "Fix Heading Order",
      description:
        "Headings must be in a logical order (h1, h2, h3...) without skipping levels.",
      codeExample: {
        before:
          actualHTML ||
          `<h1>Main Title</h1>
<h3>Subsection</h3> <!-- Skipped h2 -->`,
        after: actualHTML
          ? actualHTML.replace(/<h(\d)/, (match, level) => {
              const newLevel = Math.max(1, parseInt(level) - 1);
              return `<h${newLevel}`;
            }) + "\n\n<!-- Ensure proper heading hierarchy -->"
          : `<h1>Main Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>`,
      },
      wcagCriteria: [
        "1.3.1 Info and Relationships",
        "2.4.6 Headings and Labels",
      ],
    },
    "page-has-heading-one": {
      title: "Add H1 Heading",
      description:
        "Page must contain exactly one h1 element as the main heading.",
      codeExample: {
        before: `<div class="title">Welcome</div>`,
        after: `<h1>Welcome</h1>

<!-- Or update existing heading -->
<h2>Welcome</h2> → <h1>Welcome</h1>`,
      },
      wcagCriteria: [
        "1.3.1 Info and Relationships",
        "2.4.6 Headings and Labels",
      ],
    },
    "aria-hidden-focus": {
      title: "Fix Hidden Focusable Element",
      description:
        "Elements with aria-hidden='true' must not contain focusable elements.",
      codeExample: {
        before:
          actualHTML ||
          `<div aria-hidden="true">
  <button>Click me</button> <!-- Should not be focusable -->
</div>`,
        after: actualHTML
          ? actualHTML.replace(/aria-hidden="true"/, "") +
            '\n\n<!-- Remove aria-hidden or add tabindex="-1" to focusable children -->'
          : `<div aria-hidden="true">
  <button tabindex="-1">Click me</button>
</div>

<!-- Or remove aria-hidden -->
<div>
  <button>Click me</button>
</div>`,
      },
      wcagCriteria: ["1.3.1 Info and Relationships", "4.1.2 Name, Role, Value"],
    },
    "aria-required-attr": {
      title: "Add Required ARIA Attributes",
      description: "ARIA roles must have all required attributes.",
      codeExample: {
        before: actualHTML || `<div role="checkbox">Option</div>`,
        after: actualHTML
          ? actualHTML.replace(
              /<(\w+)\s+role="(\w+)"/,
              '<$1 role="$2" aria-checked="false"'
            ) + "\n\n<!-- Add required aria attributes for this role -->"
          : `<div role="checkbox" aria-checked="false">Option</div>

<!-- Or use native elements -->
<input type="checkbox" /> Option`,
      },
      wcagCriteria: ["4.1.2 Name, Role, Value"],
    },
    "duplicate-id": {
      title: "Fix Duplicate IDs",
      description: "ID attributes must be unique across the page.",
      codeExample: {
        before:
          actualHTML ||
          `<div id="header">First</div>
<div id="header">Second</div> <!-- Duplicate! -->`,
        after: actualHTML
          ? actualHTML.replace(/id="([^"]+)"/, 'id="$1-unique"') +
            "\n\n<!-- Make each ID unique -->"
          : `<div id="header-1">First</div>
<div id="header-2">Second</div>`,
      },
      wcagCriteria: ["4.1.1 Parsing"],
    },
    "meta-viewport": {
      title: "Fix Meta Viewport",
      description:
        "Meta viewport should not prevent zooming for accessibility.",
      codeExample: {
        before: `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`,
        after: `<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- Allow users to zoom for better readability -->`,
      },
      wcagCriteria: ["1.4.4 Resize Text"],
    },
    tabindex: {
      title: "Fix Tab Index",
      description:
        "Avoid positive tabindex values. Use 0 or -1 for custom tab order.",
      codeExample: {
        before: actualHTML || `<button tabindex="3">Click me</button>`,
        after: actualHTML
          ? actualHTML.replace(/tabindex="\d+"/, 'tabindex="0"') +
            "\n\n<!-- Use 0 for normal tab order, -1 to remove from tab order -->"
          : `<button tabindex="0">Click me</button>
<button>Normal tab order</button>
<button tabindex="-1">Not in tab order</button>`,
      },
      wcagCriteria: ["2.4.3 Focus Order"],
    },
    "aria-valid-attr-value": {
      title: "Fix Invalid ARIA Attribute Value",
      description: "ARIA attributes must have valid values.",
      codeExample: {
        before: actualHTML || `<button aria-pressed="yes">Toggle</button>`,
        after: actualHTML
          ? actualHTML.replace(/aria-pressed="[^"]*"/, 'aria-pressed="true"') +
            "\n\n<!-- Use true/false for boolean ARIA attributes -->"
          : `<button aria-pressed="true">Toggle</button>
<button aria-pressed="false">Toggle</button>`,
      },
      wcagCriteria: ["4.1.2 Name, Role, Value"],
    },
  };

  return (
    solutions[violationId] || {
      title: `Fix: ${issue?.help || "Accessibility Issue"}`,
      description:
        issue?.description || "Review the WCAG guidelines for this issue.",
      codeExample: {
        before: actualHTML || "// Issue detected in your code",
        after: actualHTML
          ? `${actualHTML}\n\n/* Apply the fix based on the failure summary above */`
          : "// Apply recommended fix from WCAG guidelines",
      },
      wcagCriteria: issue?.tags?.filter((tag) => tag.startsWith("wcag")) || [],
    }
  );
};
