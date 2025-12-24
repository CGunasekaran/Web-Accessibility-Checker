export interface AccessibilityIssue {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: {
    html: string;
    target: string[];
    failureSummary: string;
    screenshot?: string;
  }[];
}

export interface Solution {
  title: string;
  description: string;
  codeExample: {
    before: string;
    after: string;
  };
  wcagCriteria: string[];
}
