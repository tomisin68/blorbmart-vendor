const MAX_DIMENSION = 1600
const DEFAULT_QUALITY = 0.78

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.onload = () => resolve(img)
      img.src = String(reader.result || '')
    }
    reader.readAsDataURL(file)
  })

export const compressImageFile = async (file: File, quality = DEFAULT_QUALITY): Promise<string> => {
  const image = await loadImage(file)
  const ratio = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * ratio))
  const height = Math.max(1, Math.round(image.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported on this browser')

  ctx.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}
