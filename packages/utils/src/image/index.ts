export * from './html2canvas'

export function getImagesOptions(images: Record<string, string>) {
  return Object.entries(images).map(([_key, image]) => ({ src: image }))
}

/**
 * 将 DataUrl 下载为图片
 * @param dataUrl
 */
export function downloadDataUrlAsImage(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
