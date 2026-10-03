import { ReaderSettings } from '../types';

export class DOMMeasurer {
  private container: HTMLDivElement | null = null;
  private innerContent: HTMLDivElement | null = null;
  private targetWidth: number = 0;
  private targetHeight: number = 0;

  public init(width: number, height: number, settings: ReaderSettings): void {
    // Deduct top page header height (38px) so text measurement matches actual remaining height in reader layout card
    const effectiveHeight = Math.max(100, height - 38);
    this.targetWidth = width;
    this.targetHeight = effectiveHeight;

    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'book-page-measurer';
      // Hide measurement container offscreen
      this.container.style.position = 'fixed';
      this.container.style.top = '-9999px';
      this.container.style.left = '-9999px';
      this.container.style.visibility = 'hidden';
      this.container.style.pointerEvents = 'none';
      this.container.style.zIndex = '-9999';
      this.container.style.overflow = 'hidden';
      this.container.style.boxSizing = 'border-box';

      this.innerContent = document.createElement('div');
      this.container.appendChild(this.innerContent);
      document.body.appendChild(this.container);
    }

    // Match exact page container styling and dimensions
    this.container.style.width = `${width}px`;
    this.container.style.height = `${effectiveHeight}px`;
    this.container.style.maxHeight = `${effectiveHeight}px`;

    // Apply exact padding & typography classes matching reader layout
    const fontClass = this.getFontFamilyClass(settings.font);
    this.innerContent!.className = `prose-reader ${fontClass} text-stone-900 text-justify leading-snug p-4 sm:p-6`;
    this.innerContent!.style.fontSize = `${settings.fontSize || 17}px`;
    this.innerContent!.style.lineHeight = `${settings.lineHeight || 1.45}`;
    this.innerContent!.style.boxSizing = 'border-box';

    this.clear();
  }

  public clear(): void {
    if (this.innerContent) {
      this.innerContent.innerHTML = '';
    }
  }

  public setContent(html: string): void {
    if (this.innerContent) {
      this.innerContent.innerHTML = html;
    }
  }

  public appendContent(html: string): void {
    if (this.innerContent) {
      this.innerContent.innerHTML += html;
    }
  }

  /**
   * Tests if the given HTML content fits inside the container height without overflowing.
   */
  public fits(html: string): boolean {
    if (!this.innerContent || !this.container) return true;
    this.setContent(html);
    // Strict height check to prevent bottom line clipping
    return this.innerContent.scrollHeight <= this.targetHeight;
  }

  /**
   * Returns current scroll height of content inside the measurer.
   */
  public getScrollHeight(): number {
    return this.innerContent ? this.innerContent.scrollHeight : 0;
  }

  /**
   * Destroys measurement DOM node.
   */
  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
      this.innerContent = null;
    }
  }

  private getFontFamilyClass(font: string): string {
    switch (font) {
      case 'garamond':
        return 'font-garamond';
      case 'lora':
        return 'font-lora';
      case 'playfair':
        return 'font-playfair';
      case 'sans':
        return 'font-sans';
      default:
        return 'font-garamond';
    }
  }
}
