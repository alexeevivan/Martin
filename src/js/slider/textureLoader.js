import { TextureLoader, VideoTexture, LinearFilter, RGBFormat, Vector2 } from '../utils/threeImports.js';

export const loadImageTexture = (src) => {
  return new Promise((resolve, reject) => {
    const loader = new TextureLoader();
    const timeout = setTimeout(() => reject(new Error("Timeout")), 10000);
    loader.load(
      src,
      (texture) => {
        clearTimeout(timeout);
        texture.minFilter = texture.magFilter = LinearFilter;
        texture.userData = {
          size: new Vector2(texture.image.width, texture.image.height)
        };
        resolve(texture);
      },
      undefined,
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
};

export const loadVideoTexture = (src) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = src;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    const timeout = setTimeout(() => {
      video.pause();
      video.src = '';
      reject(new Error('Video timeout'));
    }, 8000);

    const onMetadata = () => {
      clearTimeout(timeout);

      const texture = new VideoTexture(video);
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.format = RGBFormat;
      texture.userData = {
        size: new Vector2(video.videoWidth, video.videoHeight),
        video: video
      };

      video.play().catch(err => console.warn('Video autoplay blocked:', err));
      resolve(texture);
    };

    const onError = (err) => {
      clearTimeout(timeout);
      video.pause();
      video.src = '';
      reject(err);
    };

    video.addEventListener('loadedmetadata', onMetadata, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.load();
  });
};

export const loadTexture = (slide) => {
  if (slide.isVideo && slide.mediaVideo) {
    return loadVideoTexture(slide.mediaVideo);
  }
  return loadImageTexture(slide.media);
};
