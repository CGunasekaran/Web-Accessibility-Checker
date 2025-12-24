'use client';

import { AccessibilityIssue } from '@/types/accessibility';
import { useState } from 'react';

interface IssueCardProps {
  issue: AccessibilityIssue;
  onViewSolution: (issue: AccessibilityIssue) => void;
}

export default function IssueCard({ issue, onViewSolution }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);

  const impactColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    serious: 'bg-orange-100 text-orange-800 border-orange-300',
    moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    minor: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  return (
    <div className={`border-l-4 p-4 rounded-lg shadow-sm bg-white ${impactColors[issue.impact]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded ${impactColors[issue.impact]}`}>
              {issue.impact.toUpperCase()}
            </span>
            <h3 className="font-semibold text-gray-900">{issue.help}</h3>
          </div>
          <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
          <p className="text-xs text-gray-600">
            Affected elements: {issue.nodes.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
          <button
            onClick={() => onViewSolution(issue)}
            className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
          >
            View Solution
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {issue.nodes.map((node, idx) => (
            <div key={idx} className="border-t pt-4">
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">Element:</p>
                <code className="block p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                  {node.html}
                </code>
              </div>
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">Selector:</p>
                <code className="block p-2 bg-gray-100 rounded text-xs">
                  {node.target.join(', ')}
                </code>
              </div>
              {node.screenshot && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Screenshot:</p>
                  <img 
                    src={node.screenshot} 
                    alt="Element screenshot" 
                    className="border rounded max-w-md"
                  />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Issue:</p>
                <p className="text-xs text-gray-600">{node.failureSummary}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
