// Styles
import '../styles/main.scss';
import '../styles/player.scss';
import '../styles/contact-card.scss';
import '../styles/liquidEther.scss';

// Modules
import './player.js';
import './translation.js';
import { initLanguage } from './translation.js';
import { createLiquidEther } from './liquidEther.js';

// Slider modules
import { SliderLoadingManager } from './slider/preloader.js';
import { SLIDER_CONFIG, getEffectIndex } from './slider/config.js';
import { SliderRenderer } from './slider/renderer.js';
import { loadTexture } from './slider/textureLoader.js';
import {
  createSlidesNavigation,
  updateNavigationState,
  updateSlideProgress,
  quickResetProgress,
  updateCounter
} from './slider/navigation.js';

// Optimized Three.js imports
import { Vector2 } from './utils/threeImports.js';

// Shaders
import { fragmentShader } from './shaders/fullFragmentShader.js';

// GSAP
import gsap from 'gsap';

// Assets
import slide1 from '../assets/images/solo4.webp';
import slideVideo from '../assets/videos/drumshow.mp4';
import collectionSlide from '../assets/images/collection.webp';
import remoteSlide from '../assets/images/remote.webp';
import martinLogo from '../assets/images/martin_logo.webp';

console.log("Webpack works");

// Slider state
let currentSlideIndex = 0;
let isTransitioning = false;
let slideTextures = [];
let texturesLoaded = false;
let autoSlideTimer = null;
let progressAnimation = null;
let sliderEnabled = false;
let pane = null;
let isApplyingPreset = false;
let sliderRenderer = null;

// UI elements
let effectFolders = {};
let currentEffectFolder = null;

const SLIDE_DURATION = (index = currentSlideIndex) => {
  const slide = slides[index];
  return slide.duration ?? SLIDER_CONFIG.settings.autoSlideSpeed;
};

const PROGRESS_UPDATE_INTERVAL = 50;
const TRANSITION_DURATION = () => SLIDER_CONFIG.settings.transitionDuration;

const slides = [
  {
    title: "nav-home",
    media: slideVideo,
    isVideo: true,
    mediaVideo: slideVideo,
    duration: 12000
  },
  {
    title: "nav-intro",
    media: remoteSlide
  },
  {
    title: "nav-collection",
    media: collectionSlide
  },
  {
    title: "nav-contact",
    media: slide1
  }
];

// Touch support
let touchStartX = 0;
let touchEndX = 0;

// Tweakpane setup (keeping original implementation)
import { Pane } from "tweakpane";

const setupPane = () => {
  pane = new Pane({ title: "Visual Effects Controls" });

  const generalFolder = pane.addFolder({ title: "General Settings" });
  generalFolder.addBinding(SLIDER_CONFIG.settings, "globalIntensity", {
    label: "Global Intensity",
    min: 0.1,
    max: 2.0,
    step: 0.1
  });
  generalFolder.addBinding(SLIDER_CONFIG.settings, "speedMultiplier", {
    label: "Speed Multiplier",
    min: 0.1,
    max: 3.0,
    step: 0.1
  });
  generalFolder.addBinding(SLIDER_CONFIG.settings, "distortionStrength", {
    label: "Distortion",
    min: 0.1,
    max: 3.0,
    step: 0.1
  });
  generalFolder.addBinding(SLIDER_CONFIG.settings, "colorEnhancement", {
    label: "Color Enhancement",
    min: 0.5,
    max: 2.0,
    step: 0.1
  });

  const timingFolder = pane.addFolder({ title: "Timing" });
  timingFolder.addBinding(SLIDER_CONFIG.settings, "transitionDuration", {
    label: "Transition Duration",
    min: 0.5,
    max: 5.0,
    step: 0.1
  });
  timingFolder.addBinding(SLIDER_CONFIG.settings, "autoSlideSpeed", {
    label: "Auto Slide Speed",
    min: 2000,
    max: 10000,
    step: 500
  });

  const effectFolder = pane.addFolder({ title: "Effect Selection" });
  effectFolder.addBinding(SLIDER_CONFIG.settings, "currentEffect", {
    label: "Effect Type",
    options: {
      Glass: "glass",
      Frost: "frost",
      Ripple: "ripple",
      Plasma: "plasma",
      Timeshift: "timeshift"
    }
  });

  effectFolder.addButton({ title: "Randomize Effect" }).on("click", randomizeEffect);

  pane.on("change", (event) => {
    if (isApplyingPreset) return;
    if (event.target.key === "currentEffect") {
      handleEffectChange(SLIDER_CONFIG.settings.currentEffect);
    } else {
      if (sliderRenderer) sliderRenderer.updateShaderUniforms();
    }
  });

  const paneElement = document.querySelector(".tp-dfwv");
  if (paneElement) paneElement.style.display = "none";
};

const randomizeEffect = () => {
  const effects = ["glass", "frost", "ripple", "plasma", "timeshift"];
  const randomEffect = effects[Math.floor(Math.random() * effects.length)];
  SLIDER_CONFIG.settings.currentEffect = randomEffect;
  SLIDER_CONFIG.settings.globalIntensity = 0.5 + Math.random() * 1.5;
  SLIDER_CONFIG.settings.speedMultiplier = 0.5 + Math.random() * 2.0;
  SLIDER_CONFIG.settings.distortionStrength = 0.5 + Math.random() * 2.0;
  SLIDER_CONFIG.settings.colorEnhancement = 0.7 + Math.random() * 1.3;
  handleEffectChange(randomEffect);
  if (sliderRenderer) sliderRenderer.updateShaderUniforms();
  pane.refresh();
};

const handleEffectChange = (newEffect) => {
  if (sliderRenderer && sliderRenderer.shaderMaterial) {
    sliderRenderer.shaderMaterial.uniforms.uEffectType.value = getEffectIndex(newEffect);
  }
};

// Timer functions
const startAutoSlideTimer = () => {
  if (!texturesLoaded || !sliderEnabled || slideTextures.length < 2) return;
  stopAutoSlideTimer();
  let progress = 0;
  const increment = (100 / SLIDE_DURATION(currentSlideIndex)) * PROGRESS_UPDATE_INTERVAL;
  progressAnimation = setInterval(() => {
    if (!sliderEnabled) {
      stopAutoSlideTimer();
      return;
    }
    progress += increment;
    updateSlideProgress(currentSlideIndex, progress);
    if (progress >= 100) {
      clearInterval(progressAnimation);
      progressAnimation = null;
      if (!isTransitioning) handleSlideChange();
    }
  }, PROGRESS_UPDATE_INTERVAL);
};

const stopAutoSlideTimer = () => {
  if (progressAnimation) {
    clearInterval(progressAnimation);
    progressAnimation = null;
  }
  if (autoSlideTimer) {
    clearTimeout(autoSlideTimer);
    autoSlideTimer = null;
  }
};

// Navigation
const navigateToSlide = (targetIndex) => {
  const introOverlay = document.getElementById('slide-intro');
  if (introOverlay) {
    if (currentSlideIndex === 1 && targetIndex !== 1) {
      introOverlay.style.transition = 'opacity 0.4s ease';
      introOverlay.style.opacity = '0';
      setTimeout(() => {
        introOverlay.classList.remove('visible');
        introOverlay.style.transition = '';
        introOverlay.style.opacity = '';
      }, 400);
    } else {
      introOverlay.classList.toggle('visible', targetIndex === 1);
    }
  }

  const playerOverlay = document.getElementById('slide-player');
  if (playerOverlay) {
    if (currentSlideIndex === 2 && targetIndex !== 2) {
      playerOverlay.style.transition = 'opacity 0.4s ease';
      playerOverlay.style.opacity = '0';
      setTimeout(() => {
        playerOverlay.classList.remove('visible');
        playerOverlay.style.transition = '';
        playerOverlay.style.opacity = '';
      }, 400);
    } else {
      playerOverlay.classList.toggle('visible', targetIndex === 2);
    }
  }

  const contactOverlay = document.getElementById('slide-contact');
  if (contactOverlay) {
    contactOverlay.classList.toggle('visible', targetIndex === 3);
  }

  if (isTransitioning || targetIndex === currentSlideIndex) return;
  stopAutoSlideTimer();
  quickResetProgress(currentSlideIndex);

  const currentTexture = slideTextures[currentSlideIndex];
  const targetTexture = slideTextures[targetIndex];
  if (!currentTexture || !targetTexture) return;

  isTransitioning = true;
  sliderRenderer.shaderMaterial.uniforms.uTexture1.value = currentTexture;
  sliderRenderer.shaderMaterial.uniforms.uTexture2.value = targetTexture;
  sliderRenderer.shaderMaterial.uniforms.uTexture1Size.value = currentTexture.userData.size;
  sliderRenderer.shaderMaterial.uniforms.uTexture2Size.value = targetTexture.userData.size;

  currentSlideIndex = targetIndex;
  updateCounter(currentSlideIndex, slides.length);
  updateNavigationState(currentSlideIndex);

  if (currentTexture.userData.video) currentTexture.userData.video.pause();
  if (targetTexture.userData.video) {
    targetTexture.userData.video.currentTime = 0;
    targetTexture.userData.video.play().catch(() => {});
  }

  gsap.fromTo(
    sliderRenderer.shaderMaterial.uniforms.uProgress,
    { value: 0 },
    {
      value: 1,
      duration: TRANSITION_DURATION(),
      ease: "power2.inOut",
      onComplete: () => {
        sliderRenderer.shaderMaterial.uniforms.uProgress.value = 0;
        sliderRenderer.shaderMaterial.uniforms.uTexture1.value = targetTexture;
        sliderRenderer.shaderMaterial.uniforms.uTexture1Size.value = targetTexture.userData.size;
        isTransitioning = false;
      }
    }
  );
};

const handleSlideChange = () => {
  if (isTransitioning || !texturesLoaded || !sliderEnabled) return;
  const nextIndex = (currentSlideIndex + 1) % slides.length;
  navigateToSlide(nextIndex);
};

const handleSwipe = () => {
  if (Math.abs(touchEndX - touchStartX) < 50) return;
  if (touchEndX < touchStartX && !isTransitioning && sliderEnabled) {
    stopAutoSlideTimer();
    quickResetProgress(currentSlideIndex);
    handleSlideChange();
  } else if (touchEndX > touchStartX && !isTransitioning && sliderEnabled) {
    stopAutoSlideTimer();
    quickResetProgress(currentSlideIndex);
    const prevIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
    navigateToSlide(prevIndex);
  }
};

// Initialize
const initializeRenderer = async () => {
  const canvas = document.querySelector(".webgl-canvas");
  if (!canvas) return;

  sliderRenderer = new SliderRenderer();
  sliderRenderer.init(canvas, fragmentShader);

  for (let i = 0; i < slides.length; i++) {
    try {
      const texture = await loadTexture(slides[i]);
      slideTextures.push(texture);
    } catch (error) {
      console.warn(`Failed to load slide ${i}`, error);
    }
  }

  if (slideTextures.length >= 2) {
    sliderRenderer.shaderMaterial.uniforms.uTexture1.value = slideTextures[0];
    sliderRenderer.shaderMaterial.uniforms.uTexture2.value = slideTextures[1];
    sliderRenderer.shaderMaterial.uniforms.uTexture1Size.value = slideTextures[0].userData.size;
    sliderRenderer.shaderMaterial.uniforms.uTexture2Size.value = slideTextures[1].userData.size;
    texturesLoaded = true;
    sliderEnabled = true;
  }

  const render = () => {
    requestAnimationFrame(render);
    sliderRenderer.render();
  };
  render();
};

// Event listeners
let liquidEtherCleanup = null;

window.addEventListener("load", async () => {
  createSlidesNavigation(slides);
  initLanguage();
  updateCounter(0, slides.length);
  setupPane();
  await initializeRenderer();

  const liquidEtherContainer = document.getElementById('liquid-ether-bg');
  if (liquidEtherContainer) {
    liquidEtherCleanup = createLiquidEther(liquidEtherContainer, {
      colors: ['#14021F', '#FF6060', '#CECCD1'],
      mouseForce: 21,
      cursorSize: 55,
      isViscous: true,
      viscous: 81,
      iterationsViscous: 32,
      iterationsPoisson: 57,
      resolution: 0.45,
      isBounce: false,
      autoDemo: true,
      autoSpeed: 0.5,
      autoIntensity: 1.1,
      takeoverDuration: 0.25,
      autoResumeDelay: 3000,
      autoRampDuration: 0.6
    });
  }

  const logo = document.querySelector('.logo img');
  if (logo) logo.src = martinLogo;

  document.addEventListener("DOMContentLoaded", () => {
    new SliderLoadingManager();
  });
});

document.addEventListener("click", (e) => {
  if (e.target.closest('#intro-container')) return;
  if (e.target.closest('#player-container')) return;
  if (e.target.closest('#contact-container')) return;
  if (e.target.closest('#lang-switcher')) return;
  if (e.target.closest(".slides-navigation")) return;
  if (!isTransitioning && sliderEnabled) {
    stopAutoSlideTimer();
    quickResetProgress(currentSlideIndex);
    handleSlideChange();
  }
});

// Add click handlers to navigation items
document.addEventListener("click", (e) => {
  const navItem = e.target.closest(".slide-nav-item");
  if (navItem) {
    e.stopPropagation();
    const targetIndex = parseInt(navItem.dataset.slideIndex);
    if (targetIndex !== currentSlideIndex && !isTransitioning) {
      navigateToSlide(targetIndex);
    }
  }
});

document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

window.addEventListener("resize", () => {
  if (sliderRenderer) sliderRenderer.resize();
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowRight") {
    e.preventDefault();
    if (!isTransitioning && sliderEnabled) {
      stopAutoSlideTimer();
      quickResetProgress(currentSlideIndex);
      handleSlideChange();
    }
  } else if (e.code === "ArrowLeft") {
    e.preventDefault();
    if (!isTransitioning && sliderEnabled) {
      stopAutoSlideTimer();
      quickResetProgress(currentSlideIndex);
      const prevIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
      navigateToSlide(prevIndex);
    }
  } else if (e.code === "KeyH") {
    e.preventDefault();
    const paneElement = document.querySelector(".tp-dfwv");
    if (paneElement) {
      paneElement.style.display = paneElement.style.display === "none" ? "block" : "none";
    }
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAutoSlideTimer();
    slideTextures.forEach(texture => {
      if (texture.userData.video) texture.userData.video.pause();
    });
  } else if (sliderEnabled && !isTransitioning) {
    const currentTexture = slideTextures[currentSlideIndex];
    if (currentTexture?.userData.video) {
      currentTexture.userData.video.play().catch(() => {});
    }
  }
});

window.addEventListener('beforeunload', () => {
  if (liquidEtherCleanup) liquidEtherCleanup();
  slideTextures.forEach(texture => {
    if (texture.userData.video) {
      texture.userData.video.pause();
      texture.userData.video.src = '';
      texture.userData.video.load();
    }
    texture.dispose();
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/Martin/sw.js')
      .then(() => console.log('SW registered'))
      .catch((err) => console.log('SW error:', err));
  });
}
