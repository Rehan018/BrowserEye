export interface HighlightRule {
  type: 'important' | 'definition' | 'statistic' | 'quote' | 'warning';
  pattern: RegExp;
  color: string;
  priority: number;
}

export class ContentHighlighter {
  private rules: HighlightRule[] = [
    {
      type: 'statistic',
      pattern: /\d+(\.\d+)?%|\$[\d,]+|\d+(\.\d+)?\s*(million|billion|thousand)/gi,
      color: '#3B82F6',
      priority: 3
    },
    {
      type: 'important',
      pattern: /\b(important|critical|essential|key|significant|major)\b/gi,
      color: '#EF4444',
      priority: 2
    },
    {
      type: 'definition',
      pattern: /\b\w+\s+is\s+defined\s+as|\b\w+\s+means\b|\b\w+\s+refers\s+to\b/gi,
      color: '#10B981',
      priority: 1
    },
    {
      type: 'quote',
      pattern: /"[^"]{20,}"/g,
      color: '#8B5CF6',
      priority: 1
    },
    {
      type: 'warning',
      pattern: /\b(warning|caution|danger|risk|alert|note)\b/gi,
      color: '#F59E0B',
      priority: 2
    }
  ];

  highlightContent(element: HTMLElement): void {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node;
    
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        textNodes.push(node as Text);
      }
    }

    textNodes.forEach(textNode => this.highlightTextNode(textNode));
  }

  private highlightTextNode(textNode: Text): void {
    const text = textNode.textContent || '';
    const highlights: Array<{start: number, end: number, rule: HighlightRule}> = [];

    // Find all matches
    this.rules.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
          rule
        });
      }
    });

    if (highlights.length === 0) return;

    // Sort by priority and position
    highlights.sort((a, b) => b.rule.priority - a.rule.priority || a.start - b.start);

    // Remove overlaps
    const nonOverlapping = this.removeOverlaps(highlights);

    if (nonOverlapping.length === 0) return;

    // Create highlighted content
    const parent = textNode.parentNode;
    if (!parent) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    nonOverlapping.forEach(highlight => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, highlight.start)));
      }

      // Add highlighted text
      const span = document.createElement('span');
      span.className = 'browsereye-highlight';
      span.style.cssText = `
        background-color: ${highlight.rule.color}20;
        border-bottom: 2px solid ${highlight.rule.color};
        padding: 1px 2px;
        border-radius: 2px;
        position: relative;
      `;
      span.textContent = text.slice(highlight.start, highlight.end);
      span.title = `${highlight.rule.type.charAt(0).toUpperCase() + highlight.rule.type.slice(1)} content`;
      
      fragment.appendChild(span);
      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    parent.replaceChild(fragment, textNode);
  }

  private removeOverlaps(highlights: Array<{start: number, end: number, rule: HighlightRule}>): Array<{start: number, end: number, rule: HighlightRule}> {
    const result = [];
    let lastEnd = -1;

    for (const highlight of highlights) {
      if (highlight.start >= lastEnd) {
        result.push(highlight);
        lastEnd = highlight.end;
      }
    }

    return result;
  }

  removeHighlights(element: HTMLElement): void {
    const highlights = element.querySelectorAll('.browsereye-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
        parent.normalize();
      }
    });
  }
}