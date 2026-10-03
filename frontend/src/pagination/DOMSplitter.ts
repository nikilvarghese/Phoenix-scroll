import { DOMMeasurer } from './DOMMeasurer';

export interface SplitResult {
  part1Html: string | null;
  part2Html: string | null;
}

export class DOMSplitter {
  /**
   * Performs word-boundary binary search to split a paragraph element across a page boundary.
   * Finds the maximum number of words that fit on the current page without overflowing.
   */
  public static splitParagraph(
    currentChunkHtml: string,
    paragraphNode: Element,
    measurer: DOMMeasurer
  ): SplitResult {
    const fullText = (paragraphNode.textContent || '').trim();
    if (!fullText) {
      return { part1Html: null, part2Html: paragraphNode.outerHTML };
    }

    const words = fullText.split(/\s+/).filter(Boolean);
    if (words.length <= 1) {
      // Single word paragraph cannot be split without cutting words
      return { part1Html: null, part2Html: paragraphNode.outerHTML };
    }

    let low = 1;
    let high = words.length - 1;
    let bestN = 0;

    const tagName = paragraphNode.tagName.toLowerCase();
    const className = paragraphNode.className ? ` class="${paragraphNode.className}"` : '';

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const testPartText = words.slice(0, mid).join(' ');
      const testPartHtml = `<${tagName}${className}>${testPartText}</${tagName}>`;
      const fullTestHtml = currentChunkHtml ? `${currentChunkHtml}\n${testPartHtml}` : testPartHtml;

      if (measurer.fits(fullTestHtml)) {
        bestN = mid;
        low = mid + 1; // Try fitting more words
      } else {
        high = mid - 1; // Reduce word count
      }
    }

    if (bestN === 0) {
      // Not even 1 word fits on current page
      return { part1Html: null, part2Html: paragraphNode.outerHTML };
    }

    const part1Text = words.slice(0, bestN).join(' ');
    const part2Text = words.slice(bestN).join(' ');

    const part1Html = `<${tagName}${className}>${part1Text}</${tagName}>`;
    const part2Html = `<${tagName}${className}>${part2Text}</${tagName}>`;

    return { part1Html, part2Html };
  }
}
