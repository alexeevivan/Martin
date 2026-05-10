import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  PlaneGeometry,
  Mesh,
  RawShaderMaterial,
  Vector2
} from '../utils/threeImports.js';
import { faceVertexShader } from '../shaders/vertexShaders.js';
import { getEffectIndex, SLIDER_CONFIG } from './config.js';

export class SliderRenderer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.shaderMaterial = null;
    this.mesh = null;
  }

  init(canvas, fragmentShader) {
    this.scene = new Scene();
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.renderer = new WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Handle WebGL context loss
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL context lost');
    });

    canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
      this.init(canvas, this.fragmentShader);
    });

    this.shaderMaterial = new RawShaderMaterial({
      uniforms: this.createUniforms(),
      vertexShader: faceVertexShader,
      fragmentShader: fragmentShader
    });

    const geometry = new PlaneGeometry(2, 2);
    this.mesh = new Mesh(geometry, this.shaderMaterial);
    this.scene.add(this.mesh);
  }

  createUniforms() {
    return {
      uTexture1: { value: null },
      uTexture2: { value: null },
      uProgress: { value: 0.0 },
      uResolution: { value: new Vector2(window.innerWidth, window.innerHeight) },
      uTexture1Size: { value: new Vector2(1, 1) },
      uTexture2Size: { value: new Vector2(1, 1) },
      uEffectType: { value: getEffectIndex(SLIDER_CONFIG.settings.currentEffect) },

      // Global settings
      uGlobalIntensity: { value: SLIDER_CONFIG.settings.globalIntensity },
      uSpeedMultiplier: { value: SLIDER_CONFIG.settings.speedMultiplier },
      uDistortionStrength: { value: SLIDER_CONFIG.settings.distortionStrength },
      uColorEnhancement: { value: SLIDER_CONFIG.settings.colorEnhancement },

      // Glass uniforms
      uGlassRefractionStrength: { value: SLIDER_CONFIG.settings.glassRefractionStrength },
      uGlassChromaticAberration: { value: SLIDER_CONFIG.settings.glassChromaticAberration },
      uGlassBubbleClarity: { value: SLIDER_CONFIG.settings.glassBubbleClarity },
      uGlassEdgeGlow: { value: SLIDER_CONFIG.settings.glassEdgeGlow },
      uGlassLiquidFlow: { value: SLIDER_CONFIG.settings.glassLiquidFlow },

      // Frost uniforms
      uFrostIntensity: { value: SLIDER_CONFIG.settings.frostIntensity },
      uFrostCrystalSize: { value: SLIDER_CONFIG.settings.frostCrystalSize },
      uFrostIceCoverage: { value: SLIDER_CONFIG.settings.frostIceCoverage },
      uFrostTemperature: { value: SLIDER_CONFIG.settings.frostTemperature },
      uFrostTexture: { value: SLIDER_CONFIG.settings.frostTexture },

      // Ripple uniforms
      uRippleFrequency: { value: SLIDER_CONFIG.settings.rippleFrequency },
      uRippleAmplitude: { value: SLIDER_CONFIG.settings.rippleAmplitude },
      uRippleWaveSpeed: { value: SLIDER_CONFIG.settings.rippleWaveSpeed },
      uRippleRippleCount: { value: SLIDER_CONFIG.settings.rippleRippleCount },
      uRippleDecay: { value: SLIDER_CONFIG.settings.rippleDecay },

      // Plasma uniforms
      uPlasmaIntensity: { value: SLIDER_CONFIG.settings.plasmaIntensity },
      uPlasmaSpeed: { value: SLIDER_CONFIG.settings.plasmaSpeed },
      uPlasmaEnergyIntensity: { value: SLIDER_CONFIG.settings.plasmaEnergyIntensity },
      uPlasmaContrastBoost: { value: SLIDER_CONFIG.settings.plasmaContrastBoost },
      uPlasmaTurbulence: { value: SLIDER_CONFIG.settings.plasmaTurbulence },

      // Timeshift uniforms
      uTimeshiftDistortion: { value: SLIDER_CONFIG.settings.timeshiftDistortion },
      uTimeshiftBlur: { value: SLIDER_CONFIG.settings.timeshiftBlur },
      uTimeshiftFlow: { value: SLIDER_CONFIG.settings.timeshiftFlow },
      uTimeshiftChromatic: { value: SLIDER_CONFIG.settings.timeshiftChromatic },
      uTimeshiftTurbulence: { value: SLIDER_CONFIG.settings.timeshiftTurbulence }
    };
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.shaderMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  }

  updateShaderUniforms() {
    const uniforms = this.shaderMaterial.uniforms;
    const settings = SLIDER_CONFIG.settings;

    // Update all uniforms
    if (uniforms.uGlobalIntensity) uniforms.uGlobalIntensity.value = settings.globalIntensity;
    if (uniforms.uSpeedMultiplier) uniforms.uSpeedMultiplier.value = settings.speedMultiplier;
    if (uniforms.uDistortionStrength) uniforms.uDistortionStrength.value = settings.distortionStrength;
    if (uniforms.uColorEnhancement) uniforms.uColorEnhancement.value = settings.colorEnhancement;

    // Glass
    if (uniforms.uGlassRefractionStrength) uniforms.uGlassRefractionStrength.value = settings.glassRefractionStrength;
    if (uniforms.uGlassChromaticAberration) uniforms.uGlassChromaticAberration.value = settings.glassChromaticAberration;
    if (uniforms.uGlassBubbleClarity) uniforms.uGlassBubbleClarity.value = settings.glassBubbleClarity;
    if (uniforms.uGlassEdgeGlow) uniforms.uGlassEdgeGlow.value = settings.glassEdgeGlow;
    if (uniforms.uGlassLiquidFlow) uniforms.uGlassLiquidFlow.value = settings.glassLiquidFlow;

    // Frost
    if (uniforms.uFrostIntensity) uniforms.uFrostIntensity.value = settings.frostIntensity;
    if (uniforms.uFrostCrystalSize) uniforms.uFrostCrystalSize.value = settings.frostCrystalSize;
    if (uniforms.uFrostIceCoverage) uniforms.uFrostIceCoverage.value = settings.frostIceCoverage;
    if (uniforms.uFrostTemperature) uniforms.uFrostTemperature.value = settings.frostTemperature;
    if (uniforms.uFrostTexture) uniforms.uFrostTexture.value = settings.frostTexture;

    // Ripple
    if (uniforms.uRippleFrequency) uniforms.uRippleFrequency.value = settings.rippleFrequency;
    if (uniforms.uRippleAmplitude) uniforms.uRippleAmplitude.value = settings.rippleAmplitude;
    if (uniforms.uRippleWaveSpeed) uniforms.uRippleWaveSpeed.value = settings.rippleWaveSpeed;
    if (uniforms.uRippleRippleCount) uniforms.uRippleRippleCount.value = settings.rippleRippleCount;
    if (uniforms.uRippleDecay) uniforms.uRippleDecay.value = settings.rippleDecay;

    // Plasma
    if (uniforms.uPlasmaIntensity) uniforms.uPlasmaIntensity.value = settings.plasmaIntensity;
    if (uniforms.uPlasmaSpeed) uniforms.uPlasmaSpeed.value = settings.plasmaSpeed;
    if (uniforms.uPlasmaEnergyIntensity) uniforms.uPlasmaEnergyIntensity.value = settings.plasmaEnergyIntensity;
    if (uniforms.uPlasmaContrastBoost) uniforms.uPlasmaContrastBoost.value = settings.plasmaContrastBoost;
    if (uniforms.uPlasmaTurbulence) uniforms.uPlasmaTurbulence.value = settings.plasmaTurbulence;

    // Timeshift
    if (uniforms.uTimeshiftDistortion) uniforms.uTimeshiftDistortion.value = settings.timeshiftDistortion;
    if (uniforms.uTimeshiftBlur) uniforms.uTimeshiftBlur.value = settings.timeshiftBlur;
    if (uniforms.uTimeshiftFlow) uniforms.uTimeshiftFlow.value = settings.timeshiftFlow;
    if (uniforms.uTimeshiftChromatic) uniforms.uTimeshiftChromatic.value = settings.timeshiftChromatic;
    if (uniforms.uTimeshiftTurbulence) uniforms.uTimeshiftTurbulence.value = settings.timeshiftTurbulence;
  }
}
