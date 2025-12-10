import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

declare global {
  interface Window {
    Tesseract: any;
    hebocr: any;
  }
}

export interface HebrewOCROptions {
  tesseractPath: string;
  hebocrPath: string;
  onOCRResult?: (text: string) => void;
  onOCRError?: (error: string) => void;
}

export const HebrewOCR = Extension.create<HebrewOCROptions>({
  name: 'hebrewOCR',

  addOptions() {
    return {
      tesseractPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js',
      hebocrPath: 'https://cdn.jsdelivr.net/npm/hebocr@1.0.0/dist/hebocr.min.js',
      onOCRResult: (text: string) => console.log('OCR Result:', text),
      onOCRError: (error: string) => console.error('OCR Error:', error),
    };
  },

  addProseMirrorPlugins() {
    let ocrWorker: Worker | null = null;

    // Load OCR libraries when the plugin is created
    if (!document.querySelector('script[src*="hebocr"]')) {
      const hebocrScript = document.createElement('script');
      hebocrScript.src = this.options.hebocrPath;
      hebocrScript.onload = () => console.log('hebocr loaded');
      hebocrScript.onerror = () => console.warn('Failed to load hebocr');
      document.head.appendChild(hebocrScript);
    }

    if (!document.querySelector('script[src*="tesseract"]')) {
      const tesseractScript = document.createElement('script');
      tesseractScript.src = this.options.tesseractPath;
      tesseractScript.onload = () => console.log('Tesseract.js loaded');
      tesseractScript.onerror = () => console.warn('Failed to load Tesseract.js');
      document.head.appendChild(tesseractScript);
    }

    const processImageLocal = (file: File, view: any) => {
      if (!file) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        // Try Hebrew OCR first, fallback to Tesseract
        performHebrewOCR(canvas, view)
          .then(text => {
            if (text && text.trim()) {
              this.options.onOCRResult?.(text);
              // Insert the text directly
              const { state, dispatch } = view;
              const textNode = state.schema.text(text);
              const transaction = state.tr.insert(state.selection.from, textNode);
              dispatch(transaction);
            } else {
              // Fallback to Tesseract
              performTesseractOCR(canvas, view);
            }
          })
          .catch(error => {
            console.warn('Hebrew OCR failed, trying Tesseract:', error);
            performTesseractOCR(canvas, view);
          });
      };

      img.src = URL.createObjectURL(file);
    };

    const performHebrewOCR = (canvas: HTMLCanvasElement, view: any): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (typeof window.hebocr !== 'undefined') {
          try {
            // hebocr API - adjust based on actual library interface
            const result = window.hebocr.recognize(canvas.toDataURL());
            resolve(result || '');
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('hebocr library not loaded'));
        }
      });
    };

    const performTesseractOCR = async (canvas: HTMLCanvasElement, view: any) => {
      if (typeof window.Tesseract === 'undefined') {
        this.options.onOCRError?.('Tesseract.js not loaded');
        return;
      }

      try {
        const { data: { text } } = await window.Tesseract.recognize(canvas, 'heb+eng', {
          logger: (m: any) => console.log(m)
        });

        if (text && text.trim()) {
          this.options.onOCRResult?.(text);
          // Insert the text directly
          const { state, dispatch } = view;
          const textNode = state.schema.text(text);
          const transaction = state.tr.insert(state.selection.from, textNode);
          dispatch(transaction);
        } else {
          this.options.onOCRError?.('No text found in image');
        }
      } catch (error) {
        this.options.onOCRError?.(`OCR failed: ${error}`);
      }
    };

    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            paste: (view, event) => {
              const items = event.clipboardData?.items;
              if (!items) return false;

              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') === 0) {
                  const file = item.getAsFile();
                  if (file) {
                    processImageLocal(file, view);
                    return true; // Prevent default paste
                  }
                }
              }
              return false;
            },
          },
        },
      }),
    ];
  },

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          'data-ocr-source': {
            default: null,
            parseHTML: element => element.getAttribute('data-ocr-source'),
            renderHTML: attributes => {
              if (!attributes['data-ocr-source']) return {};
              return { 'data-ocr-source': attributes['data-ocr-source'] };
            },
          },
        },
      },
    ];
  },
});
