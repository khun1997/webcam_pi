const useResizeCanvas = (srcConvas: HTMLCanvasElement, targetWidth: number) => {
  const canvas = document.createElement("canvas");
  const { width } = srcConvas;
  const { height } = srcConvas;

  const targetRatio = targetWidth / width;

  canvas.width = targetRatio * width;
  canvas.height = targetRatio * height;

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.scale(targetRatio, targetRatio);
  context.drawImage(srcConvas, 0, 0);

  return canvas;
};

export default useResizeCanvas;
