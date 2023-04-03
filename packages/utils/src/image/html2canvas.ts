import type { Options } from 'html2canvas'
import html2canvas from 'html2canvas'

/**
 * screenshot to base64
 * @param container
 * @returns
 */
export async function screenShotToBase64(containerEl: HTMLElement, options: Partial<Options> = {}): Promise<string | void> {
  return new Promise((resolve) => {
    html2canvas(containerEl, {
      height: containerEl.clientHeight - 2,
      useCORS: true,
      ...options,
    }).then((canvas) => {
      const base64 = canvas.toDataURL()
      resolve(base64)
    }).catch(() => {
      resolve()
    })
  })
}
