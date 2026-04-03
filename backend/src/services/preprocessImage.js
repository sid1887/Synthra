import sharp from "sharp";

function channelAverage(items, key) {
  if (!items.length) return 0;
  const total = items.reduce((sum, item) => sum + (item[key] || 0), 0);
  return total / items.length;
}

export async function preprocessImage(fileBuffer) {
  let pipeline = sharp(fileBuffer, { failOn: "none" }).rotate();
  const metadata = await pipeline.metadata();

  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const maxSide = Math.max(width, height);

  if (maxSide > 1600) {
    pipeline = pipeline.resize({
      width: width >= height ? 1600 : null,
      height: height > width ? 1600 : null,
      fit: "inside",
      withoutEnlargement: true
    });
  }

  const processedBuffer = await pipeline.jpeg({ quality: 85 }).toBuffer();
  const processedMeta = await sharp(processedBuffer).metadata();
  const stats = await sharp(processedBuffer).stats();

  const mean = channelAverage(stats.channels, "mean");
  const stdev = channelAverage(stats.channels, "stdev");
  const aspectRatio = processedMeta.width && processedMeta.height
    ? Math.max(processedMeta.width, processedMeta.height) / Math.max(1, Math.min(processedMeta.width, processedMeta.height))
    : 1;

  return {
    processedBuffer,
    imageMeta: {
      width: processedMeta.width || width,
      height: processedMeta.height || height,
      format: processedMeta.format || metadata.format || "unknown"
    },
    quality: {
      blurry: stdev < 22,
      dark: mean < 70,
      anglePoor: aspectRatio > 2.4,
      contrastScore: Number(stdev.toFixed(2)),
      brightnessScore: Number(mean.toFixed(2))
    }
  };
}
