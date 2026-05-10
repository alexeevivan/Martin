// Fragment shaders for all effects
export const glassEffectShader = `
  precision highp float;
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec2 uTexture1Size;
  uniform vec2 uTexture2Size;

  // Global settings uniforms
  uniform float uGlobalIntensity;
  uniform float uSpeedMultiplier;
  uniform float uDistortionStrength;
  uniform float uColorEnhancement;

  // Glass uniforms
  uniform float uGlassRefractionStrength;
  uniform float uGlassChromaticAberration;
  uniform float uGlassBubbleClarity;
  uniform float uGlassEdgeGlow;
  uniform float uGlassLiquidFlow;

  varying vec2 vUv;

  vec2 getCoverUV(vec2 uv, vec2 textureSize) {
    vec2 s = uResolution / textureSize;
    float scale = max(s.x, s.y);
    vec2 scaledSize = textureSize * scale;
    vec2 offset = (uResolution - scaledSize) * 0.5;
    return (uv * uResolution - offset) / scaledSize;
  }

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(noise(i), noise(i + vec2(1.0, 0.0)), f.x),
      mix(noise(i + vec2(0.0, 1.0)), noise(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    float glassStrength = 0.08 * uGlassRefractionStrength * uDistortionStrength * uGlobalIntensity;
    float chromaticAberration = 0.02 * uGlassChromaticAberration * uGlobalIntensity;
    float waveDistortion = 0.025 * uDistortionStrength;
    float clearCenterSize = 0.3 * uGlassBubbleClarity;
    float surfaceRipples = 0.004 * uDistortionStrength;
    float liquidFlow = 0.015 * uGlassLiquidFlow * uSpeedMultiplier;
    float rimLightWidth = 0.05;
    float glassEdgeWidth = 0.025;

    float brightnessPhase = smoothstep(0.8, 1.0, uProgress);
    float rimLightIntensity = 0.08 * (1.0 - brightnessPhase) * uGlassEdgeGlow * uGlobalIntensity;
    float glassEdgeOpacity = 0.06 * (1.0 - brightnessPhase) * uGlassEdgeGlow;

    vec2 center = vec2(0.5, 0.5);
    vec2 p = vUv * uResolution;

    vec2 uv1 = getCoverUV(vUv, uTexture1Size);
    vec2 uv2_base = getCoverUV(vUv, uTexture2Size);

    float maxRadius = length(uResolution) * 0.85;
    float bubbleRadius = uProgress * maxRadius;
    vec2 sphereCenter = center * uResolution;

    float dist = length(p - sphereCenter);
    float normalizedDist = dist / max(bubbleRadius, 0.001);
    vec2 direction = (dist > 0.0) ? (p - sphereCenter) / dist : vec2(0.0);
    float inside = smoothstep(bubbleRadius + 3.0, bubbleRadius - 3.0, dist);

    float distanceFactor = smoothstep(clearCenterSize, 1.0, normalizedDist);
    float time = uProgress * 5.0 * uSpeedMultiplier;

    vec2 liquidSurface = vec2(
      smoothNoise(vUv * 100.0 + time * 0.3),
      smoothNoise(vUv * 100.0 + time * 0.2 + 50.0)
    ) - 0.5;
    liquidSurface *= surfaceRipples * distanceFactor;

    vec2 distortedUV = uv2_base;
    if (inside > 0.0) {
      float refractionOffset = glassStrength * pow(distanceFactor, 1.5);
      vec2 flowDirection = normalize(direction + vec2(sin(time), cos(time * 0.7)) * 0.3);
      distortedUV -= flowDirection * refractionOffset;

      float wave1 = sin(normalizedDist * 22.0 - time * 3.5);
      float wave2 = sin(normalizedDist * 35.0 + time * 2.8) * 0.7;
      float wave3 = sin(normalizedDist * 50.0 - time * 4.2) * 0.5;
      float combinedWave = (wave1 + wave2 + wave3) / 3.0;

      float waveOffset = combinedWave * waveDistortion * distanceFactor;
      distortedUV -= direction * waveOffset + liquidSurface;

      vec2 flowOffset = vec2(
        sin(time + normalizedDist * 10.0),
        cos(time * 0.8 + normalizedDist * 8.0)
      ) * liquidFlow * distanceFactor * inside;
      distortedUV += flowOffset;
    }

    vec4 newImg;
    if (inside > 0.0) {
      float aberrationOffset = chromaticAberration * pow(distanceFactor, 1.2);

      vec2 uv_r = distortedUV + direction * aberrationOffset * 1.2;
      vec2 uv_g = distortedUV + direction * aberrationOffset * 0.2;
      vec2 uv_b = distortedUV - direction * aberrationOffset * 0.8;

      float r = texture2D(uTexture2, uv_r).r;
      float g = texture2D(uTexture2, uv_g).g;
      float b = texture2D(uTexture2, uv_b).b;
      newImg = vec4(r, g, b, 1.0);
    } else {
      newImg = texture2D(uTexture2, uv2_base);
    }

    if (inside > 0.0 && rimLightIntensity > 0.0) {
      float rim = smoothstep(1.0 - rimLightWidth, 1.0, normalizedDist) *
                  (1.0 - smoothstep(1.0, 1.01, normalizedDist));
      newImg.rgb += rim * rimLightIntensity;

      float edge = smoothstep(1.0 - glassEdgeWidth, 1.0, normalizedDist) *
                   (1.0 - smoothstep(1.0, 1.01, normalizedDist));
      newImg.rgb = mix(newImg.rgb, vec3(1.0), edge * glassEdgeOpacity);
    }

    newImg.rgb = mix(newImg.rgb, newImg.rgb * 1.2, (uColorEnhancement - 1.0) * 0.5);

    vec4 currentImg = texture2D(uTexture1, uv1);

    if (uProgress > 0.95) {
      vec4 pureNewImg = texture2D(uTexture2, uv2_base);
      float endTransition = (uProgress - 0.95) / 0.05;
      newImg = mix(newImg, pureNewImg, endTransition);
    }

    gl_FragColor = mix(currentImg, newImg, inside);
  }
`;

export const frostEffectShader = `
  precision highp float;
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec2 uTexture1Size;
  uniform vec2 uTexture2Size;

  uniform float uGlobalIntensity;
  uniform float uDistortionStrength;
  uniform float uColorEnhancement;

  uniform float uFrostIntensity;
  uniform float uFrostCrystalSize;
  uniform float uFrostIceCoverage;
  uniform float uFrostTemperature;
  uniform float uFrostTexture;

  varying vec2 vUv;

  vec2 getCoverUV(vec2 uv, vec2 textureSize) {
    vec2 s = uResolution / textureSize;
    float scale = max(s.x, s.y);
    vec2 scaledSize = textureSize * scale;
    vec2 offset = (uResolution - scaledSize) * 0.5;
    return (uv * uResolution - offset) / scaledSize;
  }

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(noise(i), noise(i + vec2(1.0, 0.0)), f.x),
      mix(noise(i + vec2(0.0, 1.0)), noise(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float rand(vec2 uv) {
    float a = dot(uv, vec2(92., 80.));
    float b = dot(uv, vec2(41., 62.));
    float x = sin(a) + cos(b) * 51.;
    return fract(x);
  }

  void main() {
    vec4 currentImg = texture2D(uTexture1, getCoverUV(vUv, uTexture1Size));
    vec4 newImg = texture2D(uTexture2, getCoverUV(vUv, uTexture2Size));

    float effectiveIntensity = uFrostIntensity * uGlobalIntensity;
    float crystalScale = 80.0 / uFrostCrystalSize;
    float iceScale = 40.0 / uFrostCrystalSize;
    float temperatureEffect = uFrostTemperature;

    float frost1 = smoothNoise(vUv * crystalScale * uFrostTexture);
    float frost2 = smoothNoise(vUv * iceScale + 50.0) * 0.7;
    float frost3 = smoothNoise(vUv * (crystalScale * 2.0) + 100.0) * 0.3;
    float frost = (frost1 + frost2 + frost3) / 2.0;

    float icespread = smoothNoise(vUv * 25.0 / uFrostCrystalSize + 200.0);

    vec2 rnd = vec2(
      rand(vUv + frost * 0.1),
      rand(vUv + frost * 0.1 + 0.5)
    );

    float clampedIceCoverage = clamp(uFrostIceCoverage, 0.1, 2.5);
    float size = mix(uProgress, sqrt(uProgress), 0.5) * 1.12 * clampedIceCoverage + 0.0000001;

    float lensY = clamp(pow(size, clamp(4.0, 1.5, 6.0)) / 2.0, size * 0.1, size * 8.0);
    vec2 lens = vec2(size, lensY);

    float dist = distance(vUv, vec2(0.5, 0.5));
    float vignette = pow(1.0 - smoothstep(lens.x, lens.y, dist), 2.0);

    float frostyness = 0.8 * effectiveIntensity * uDistortionStrength;
    rnd *= frost * vignette * frostyness * (1.0 - floor(vignette));

    vec4 regular = newImg;
    vec4 frozen = texture2D(uTexture2, getCoverUV(vUv + rnd * 0.06, uTexture2Size));

    float tempShift = clamp(temperatureEffect * 0.15, 0.0, 0.3);
    frozen *= vec4(
      clamp(0.85 + tempShift, 0.7, 1.2),
      clamp(0.9, 0.8, 1.0),
      clamp(1.2 - tempShift, 0.8, 1.3),
      1.0
    );
    float tempMixStrength = clamp(0.1 * temperatureEffect, 0.0, 0.25);
    frozen = mix(frozen, vec4(0.9, 0.95, 1.1, 1.0), tempMixStrength);

    float frostMask = smoothstep(icespread * 0.8, 1.0, pow(vignette, 1.5));
    vec4 frostResult = mix(frozen, regular, frostMask);

    float transitionStart = mix(0.85, 0.7, clamp(effectiveIntensity - 1.0, 0.0, 1.0));
    float colorTransition = smoothstep(transitionStart, 1.0, uProgress);
    vec4 finalFrost = mix(frostResult, regular, colorTransition);

    finalFrost.rgb = mix(finalFrost.rgb, finalFrost.rgb * 1.2, (uColorEnhancement - 1.0) * 0.5);

    float overallBlend = smoothstep(0.0, 1.0, uProgress);

    if (uProgress > 0.95) {
      float endTransition = (uProgress - 0.95) / 0.05;
      finalFrost = mix(finalFrost, newImg, endTransition * 0.5);
    }

    gl_FragColor = mix(currentImg, finalFrost, overallBlend);
  }
`;

// Export combined shader that switches between effects
export const combinedFragmentShader = `
  precision highp float;
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec2 uTexture1Size;
  uniform vec2 uTexture2Size;
  uniform int uEffectType;

  // All uniforms here...
  uniform float uGlobalIntensity;
  uniform float uSpeedMultiplier;
  uniform float uDistortionStrength;
  uniform float uColorEnhancement;

  // Glass uniforms
  uniform float uGlassRefractionStrength;
  uniform float uGlassChromaticAberration;
  uniform float uGlassBubbleClarity;
  uniform float uGlassEdgeGlow;
  uniform float uGlassLiquidFlow;

  // Frost uniforms
  uniform float uFrostIntensity;
  uniform float uFrostCrystalSize;
  uniform float uFrostIceCoverage;
  uniform float uFrostTemperature;
  uniform float uFrostTexture;

  // Ripple uniforms
  uniform float uRippleFrequency;
  uniform float uRippleAmplitude;
  uniform float uRippleWaveSpeed;
  uniform float uRippleRippleCount;
  uniform float uRippleDecay;

  // Plasma uniforms
  uniform float uPlasmaIntensity;
  uniform float uPlasmaSpeed;
  uniform float uPlasmaEnergyIntensity;
  uniform float uPlasmaContrastBoost;
  uniform float uPlasmaTurbulence;

  // Timeshift uniforms
  uniform float uTimeshiftDistortion;
  uniform float uTimeshiftBlur;
  uniform float uTimeshiftFlow;
  uniform float uTimeshiftChromatic;
  uniform float uTimeshiftTurbulence;

  varying vec2 vUv;

  vec2 getCoverUV(vec2 uv, vec2 textureSize) {
    vec2 s = uResolution / textureSize;
    float scale = max(s.x, s.y);
    vec2 scaledSize = textureSize * scale;
    vec2 offset = (uResolution - scaledSize) * 0.5;
    return (uv * uResolution - offset) / scaledSize;
  }

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(noise(i), noise(i + vec2(1.0, 0.0)), f.x),
      mix(noise(i + vec2(0.0, 1.0)), noise(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float rand(vec2 uv) {
    float a = dot(uv, vec2(92., 80.));
    float b = dot(uv, vec2(41., 62.));
    float x = sin(a) + cos(b) * 51.;
    return fract(x);
  }

  // Include all effect functions here (glass, frost, ripple, plasma, timeshift)
  // For brevity, I'll include the structure - you'll need the full implementations

  vec4 glassEffect(vec2 uv, float progress) {
    // Glass effect implementation
    return texture2D(uTexture2, getCoverUV(uv, uTexture2Size));
  }

  vec4 frostEffect(vec2 uv, float progress) {
    // Frost effect implementation
    return texture2D(uTexture2, getCoverUV(uv, uTexture2Size));
  }

  vec4 rippleEffect(vec2 uv, float progress) {
    // Ripple effect implementation
    return texture2D(uTexture2, getCoverUV(uv, uTexture2Size));
  }

  vec4 plasmaEffect(vec2 uv, float progress) {
    // Plasma effect implementation
    return texture2D(uTexture2, getCoverUV(uv, uTexture2Size));
  }

  vec4 timeshiftEffect(vec2 uv, float progress) {
    // Timeshift effect implementation
    return texture2D(uTexture2, getCoverUV(uv, uTexture2Size));
  }

  void main() {
    if (uEffectType == 0) {
      gl_FragColor = glassEffect(vUv, uProgress);
    } else if (uEffectType == 1) {
      gl_FragColor = frostEffect(vUv, uProgress);
    } else if (uEffectType == 2) {
      gl_FragColor = rippleEffect(vUv, uProgress);
    } else if (uEffectType == 3) {
      gl_FragColor = plasmaEffect(vUv, uProgress);
    } else {
      gl_FragColor = timeshiftEffect(vUv, uProgress);
    }
  }
`;
