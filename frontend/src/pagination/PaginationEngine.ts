import { PageContent, PaginationOptions } from './PaginationTypes';
import { DOMMeasurer } from './DOMMeasurer';
import { DOMSplitter } from './DOMSplitter';

export class PaginationEngine {
  private measurer: DOMMeasurer;

  constructor() {
    this.measurer = new DOMMeasurer();
  }

  /**
   * Paginates continuous story HTML content based on browser DOM layout measurements.
   */
  public paginate(cleanContent: string, options: PaginationOptions): PageContent[] {
    const {
      containerWidth,
      containerHeight,
      settings,
      partBannerHtml,
      chapterHeaderHtml,
      currentChapterId,
      currentChapterOrder,
    } = options;

    if (!containerWidth || !containerHeight || containerWidth <= 0 || containerHeight <= 0) {
      return [
        {
          id: 'page-1',
          pageIndex: 0,
          displayPageNumber: 1,
          html: cleanContent || '<p>No content available.</p>',
          chapterId: currentChapterId,
          chapterOrder: currentChapterOrder,
        },
      ];
    }

    // Initialize DOM measurer with active dimensions & typography
    this.measurer.init(containerWidth, containerHeight, settings);

    const pages: PageContent[] = [];
    let pageIndex = 0;

    // 1. Dedicated Standalone Part Cover Page (Centered in middle)
    if (partBannerHtml && partBannerHtml.trim().length > 0) {
      const partCoverHtml = `<div class="h-full min-h-[300px] flex flex-col items-center justify-center text-center my-auto py-8 px-4">
        ${partBannerHtml}
      </div>`;
      pages.push({
        id: `page-${pageIndex + 1}`,
        pageIndex: pageIndex,
        displayPageNumber: pageIndex + 1,
        html: partCoverHtml,
        isPartBannerPage: true,
        chapterId: currentChapterId,
        chapterOrder: currentChapterOrder,
      });
      pageIndex++;
    }

    if (!cleanContent || cleanContent.trim().length === 0) {
      this.measurer.destroy();
      return pages.length > 0
        ? pages
        : [
            {
              id: 'page-1',
              pageIndex: 0,
              displayPageNumber: 1,
              html: '<p>No content in this chapter.</p>',
              chapterId: currentChapterId,
              chapterOrder: currentChapterOrder,
            },
          ];
    }

    // Parse clean content into top-level DOM nodes
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = cleanContent;
    const children = Array.from(tempContainer.children);

    if (children.length === 0) {
      pages.push({
        id: `page-${pageIndex + 1}`,
        pageIndex: pageIndex,
        displayPageNumber: pageIndex + 1,
        html: cleanContent,
        chapterId: currentChapterId,
        chapterOrder: currentChapterOrder,
      });
      this.measurer.destroy();
      return pages;
    }

    let queue: Element[] = [...children];
    let currentChunkHtml = '';
    let isChapterStartPage = true;

    while (queue.length > 0) {
      const node = queue.shift()!;
      const tagName = node.tagName.toLowerCase();
      const isHeader = tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'header';

      // On Chapter Start Page, prepend chapter title header if present
      let testChunkHtml = currentChunkHtml;
      if (isChapterStartPage && chapterHeaderHtml && currentChunkHtml === '') {
        testChunkHtml = `${chapterHeaderHtml}\n${node.outerHTML}`;
      } else {
        testChunkHtml = currentChunkHtml ? `${currentChunkHtml}\n${node.outerHTML}` : node.outerHTML;
      }

      // Check if node fits cleanly inside measurement container
      if (this.measurer.fits(testChunkHtml)) {
        if (isChapterStartPage && chapterHeaderHtml && currentChunkHtml === '') {
          currentChunkHtml = `${chapterHeaderHtml}\n${node.outerHTML}`;
        } else {
          currentChunkHtml = currentChunkHtml ? `${currentChunkHtml}\n${node.outerHTML}` : node.outerHTML;
        }
      } else {
        // Node overflows!
        // Prevent stranded headings: If node is a heading and doesn't fit on current page, move heading to fresh page
        if (isHeader) {
          if (currentChunkHtml.trim().length > 0) {
            pages.push({
              id: `page-${pageIndex + 1}`,
              pageIndex: pageIndex,
              displayPageNumber: pageIndex + 1,
              html: currentChunkHtml,
              isChapterStartPage,
              chapterId: currentChapterId,
              chapterOrder: currentChapterOrder,
            });
            pageIndex++;
            currentChunkHtml = '';
            isChapterStartPage = false;
          }
          queue.unshift(node); // Retry heading on fresh page
          continue;
        }

        // Paragraph splitting via DOM word-boundary binary search
        if (tagName === 'p') {
          const splitRes = DOMSplitter.splitParagraph(currentChunkHtml, node, this.measurer);

          if (splitRes.part1Html) {
            // Part 1 fits on current page!
            const finalPageHtml = isChapterStartPage && chapterHeaderHtml && currentChunkHtml === ''
              ? `${chapterHeaderHtml}\n${splitRes.part1Html}`
              : `${currentChunkHtml ? currentChunkHtml + '\n' : ''}${splitRes.part1Html}`;

            pages.push({
              id: `page-${pageIndex + 1}`,
              pageIndex: pageIndex,
              displayPageNumber: pageIndex + 1,
              html: finalPageHtml,
              isChapterStartPage,
              chapterId: currentChapterId,
              chapterOrder: currentChapterOrder,
            });
            pageIndex++;

            currentChunkHtml = '';
            isChapterStartPage = false;

            if (splitRes.part2Html) {
              const part2Node = document.createElement('div');
              part2Node.innerHTML = splitRes.part2Html;
              if (part2Node.firstElementChild) {
                queue.unshift(part2Node.firstElementChild);
              }
            }
          } else {
            // Not even 1 word of paragraph fits on current page -> push page and retry paragraph on fresh page
            if (currentChunkHtml.trim().length > 0) {
              pages.push({
                id: `page-${pageIndex + 1}`,
                pageIndex: pageIndex,
                displayPageNumber: pageIndex + 1,
                html: currentChunkHtml,
                isChapterStartPage,
                chapterId: currentChapterId,
                chapterOrder: currentChapterOrder,
              });
              pageIndex++;
              currentChunkHtml = '';
              isChapterStartPage = false;
            }
            queue.unshift(node);
          }
        } else {
          // Other block elements (images, blockquotes, lists): push current page & move element to fresh page
          if (currentChunkHtml.trim().length > 0) {
            pages.push({
              id: `page-${pageIndex + 1}`,
              pageIndex: pageIndex,
              displayPageNumber: pageIndex + 1,
              html: currentChunkHtml,
              isChapterStartPage,
              chapterId: currentChapterId,
              chapterOrder: currentChapterOrder,
            });
            pageIndex++;
            currentChunkHtml = '';
            isChapterStartPage = false;
          }
          queue.unshift(node);
        }
      }
    }

    if (currentChunkHtml.trim().length > 0) {
      pages.push({
        id: `page-${pageIndex + 1}`,
        pageIndex: pageIndex,
        displayPageNumber: pageIndex + 1,
        html: currentChunkHtml,
        isChapterStartPage,
        chapterId: currentChapterId,
        chapterOrder: currentChapterOrder,
      });
    }

    this.measurer.destroy();
    return pages.length > 0
      ? pages
      : [
          {
            id: 'page-1',
            pageIndex: 0,
            displayPageNumber: 1,
            html: cleanContent,
            chapterId: currentChapterId,
            chapterOrder: currentChapterOrder,
          },
        ];
  }
}
