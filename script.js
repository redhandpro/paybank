import gsap from 'https://esm.sh/gsap@3.13.0'
import Draggable from 'https://esm.sh/gsap@3.13.0/Draggable'
import { Pane } from 'https://esm.sh/tweakpane@4.0.4'
gsap.registerPlugin(Draggable)

/* ── Shared shader sources ── */
const V = `
attribute vec2 aPos;
attribute vec2 aTex;
varying   vec2 vUv;
void main(){
    vUv = aTex;
    gl_Position = vec4(aPos, 0.0, 1.0);
}`

const F = `
precision highp float;

uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec2  uMouse;
uniform vec2  uRes;
uniform float uLightH;
uniform float uStrength;
uniform float uSoft;
uniform float uMinBri;
uniform float uNorm;
uniform float uPara;
uniform float uAO;
uniform float uHover;
uniform float uSpotR;
uniform float uSpotFloor;
uniform float uShadLen;
uniform float uBoost;
uniform float uHighlight;
uniform float uSpotFalloff;
uniform vec3  uSpotColor;
uniform vec2  uUvScale;
uniform vec2  uUvOffset;

varying vec2 vUv;

vec2 coverUv(vec2 uv){
    return uv * uUvScale + uUvOffset;
}

vec3 getNormal(vec2 uv, vec2 tx){
    float l = texture2D(uDepth, coverUv(uv - vec2(tx.x,0.0))).r;
    float r = texture2D(uDepth, coverUv(uv + vec2(tx.x,0.0))).r;
    float u = texture2D(uDepth, coverUv(uv + vec2(0.0,tx.y))).r;
    float d = texture2D(uDepth, coverUv(uv - vec2(0.0,tx.y))).r;
    return normalize(vec3((l-r)*uNorm, (d-u)*uNorm, 1.0));
}

float traceShadow(vec2 uv, float depth, vec2 lp, float lH, float soft, float sLen){
    vec3 orig   = vec3(uv, depth);
    vec3 target = vec3(lp, lH);
    vec3 ray    = (target - orig) * sLen;
    float penumbra = 1e5;
    const int S = 24;
    for(int i=2; i<=S; i++){
        float t   = float(i)/float(S);
        vec3  pos = orig + ray * t;
        if(pos.x<0.0||pos.x>1.0||pos.y<0.0||pos.y>1.0) break;
        float sd   = texture2D(uDepth, coverUv(pos.xy)).r;
        float diff = sd - pos.z;
        if(diff > 0.008){
            penumbra = min(penumbra, soft * float(i) / diff);
        }
    }
    return clamp(penumbra, 0.0, 1.0);
}

float calcAO(vec2 uv, vec2 tx){
    float c = texture2D(uDepth, coverUv(uv)).r;
    float s = 0.0;
    for(int i=0; i<8; i++){
        float a = float(i) * 0.7854;
        vec2  o = vec2(cos(a), sin(a)) * tx * 3.0;
        s += max(c - texture2D(uDepth, coverUv(uv+o)).r, 0.0);
    }
    return clamp(1.0 - s * uAO * 12.0 / 8.0, 0.0, 1.0);
}

void main(){
    vec2  tx    = 1.0 / uRes;
    float depth = texture2D(uDepth, coverUv(vUv)).r;

    vec2  pOff = (uMouse - vUv) * depth * uPara * uHover;
    vec2  uv   = clamp(vUv + pOff, vec2(0.0), vec2(1.0));

    vec4  col = texture2D(uImage, coverUv(uv));
    float d   = texture2D(uDepth, coverUv(uv)).r;
    vec3  N   = getNormal(uv, tx);
    float ao  = calcAO(uv, tx);

    vec3  L     = normalize(vec3(uMouse, uLightH) - vec3(uv, d));
    float NdotL = max(dot(N,L), 0.0);
    float dist  = length(vec3(uMouse, uLightH) - vec3(uv, d));
    float atten = 1.0 / (1.0 + dist*dist*1.5);
    float shad  = traceShadow(uv, d, uMouse, uLightH, uSoft, uShadLen);
    float light = NdotL * atten * shad * ao;
    float factor= mix(uMinBri, 1.0, light);
    factor = mix(1.0, factor, uStrength);
    factor = min(factor, 1.0);

    float aspect  = uRes.x / uRes.y;
    float sDist   = length((uMouse - uv) * vec2(aspect, 1.0));
    float spot    = exp(-sDist * sDist / (uSpotR * uSpotR));

    vec2 cp = clamp(uMouse, vec2(0.001), vec2(0.999));
    float ld = texture2D(uDepth, coverUv(cp)).r;
    float behind = max(ld - d, 0.0);
    spot *= mix(1.0, 1.0 - smoothstep(0.0, 0.25, behind), 0.8);
    spot = pow(spot, uSpotFalloff);

    float spotMul = mix(uSpotFloor, uHighlight, spot);
    vec3  boostRGB = uSpotColor * spot * light * uBoost;

    float finalBri = mix(1.0, max(factor * spotMul, uSpotFloor), uHover);
    col.rgb = col.rgb * finalBri + col.rgb * boostRGB * uHover;
    gl_FragColor = col;
}`

/* ── Presets ── */
const STORAGE_KEY = 'depth-map-cards-presets'

const BUILT_IN_PRESETS = {
  Default: {
    lightHeight: 1.45,
    shadowStrength: 1,
    shadowSoftness: 0.044,
    minBrightness: 0.2,
    normalStrength: 1.5,
    parallax: 0,
    aoStrength: 0.3,
    shadowLength: 1.7,
    lightBoost: 0.6,
    highlight: 2.55,
    spotRadius: 0.31,
    spotFloor: 0.14,
    trackingSpeed: 50,
    returnSpeed: 350,
    fadeIn: 60,
    fadeOut: 200,
    hoverDelay: 150,
  },
  Dramatic: {
    lightHeight: 0.8,
    shadowStrength: 1,
    shadowSoftness: 0.02,
    minBrightness: 0.05,
    normalStrength: 2.5,
    parallax: 0.025,
    aoStrength: 1.2,
    shadowLength: 2.5,
    lightBoost: 1.5,
    highlight: 3.5,
    spotRadius: 0.2,
    spotFloor: 0.04,
    spotFalloff: 1.8,
    trackingSpeed: 30,
    returnSpeed: 500,
    fadeIn: 40,
    fadeOut: 300,
    hoverDelay: 100,
  },
  Soft: {
    lightHeight: 2.5,
    shadowStrength: 0.4,
    shadowSoftness: 0.12,
    minBrightness: 0.5,
    normalStrength: 0.8,
    parallax: 0,
    aoStrength: 0.1,
    shadowLength: 1.0,
    lightBoost: 0.4,
    highlight: 1.8,
    spotRadius: 0.8,
    spotFloor: 0.3,
    spotFalloff: 0.5,
    trackingSpeed: 80,
    returnSpeed: 600,
    fadeIn: 100,
    fadeOut: 400,
    hoverDelay: 200,
  },
  Cinematic: {
    lightHeight: 1.0,
    shadowStrength: 0.85,
    shadowSoftness: 0.06,
    minBrightness: 0.15,
    normalStrength: 2.0,
    parallax: 0.04,
    aoStrength: 0.6,
    shadowLength: 2.0,
    lightBoost: 0.8,
    highlight: 2.8,
    spotRadius: 0.35,
    spotFloor: 0.1,
    spotFalloff: 1.3,
    trackingSpeed: 120,
    returnSpeed: 800,
    fadeIn: 200,
    fadeOut: 600,
    hoverDelay: 250,
  },
}

function getCustomPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveCustomPreset(name, data) {
  const presets = getCustomPresets()
  presets[name] = data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

function getAllPresets() {
  return { ...BUILT_IN_PRESETS, ...getCustomPresets() }
}

/* ── Default lighting params ── */
const P = {
  lightHeight: 1.45,
  shadowStrength: 1,
  shadowSoftness: 0.044,
  minBrightness: 0.2,
  normalStrength: 1.5,
  parallax: 0,
  aoStrength: 0.3,
  shadowLength: 1.7,
  lightBoost: 0.6,
  highlight: 2.55,
  spotRadius: 0.31,
  spotFloor: 0.14,
  spotFalloff: 1.0,
  spotColor: '#ffffff',
  trackingSpeed: 50,
  returnSpeed: 350,
  fadeIn: 60,
  fadeOut: 200,
  hoverDelay: 150,
  reveal: false,
  spotlightMode: 'slide',
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

/* ── Sync hover delay to CSS custom property ── */
function syncHoverDelay() {
  document.documentElement.style.setProperty(
    '--hover-delay',
    `${P.hoverDelay}ms`
  )
}
syncHoverDelay()

/* ── Convert duration (ms to reach ~95%) into per-frame lerp factor at 60fps ── */
function msToLerp(ms) {
  if (ms <= 0) return 1
  const frames = (ms / 1000) * 60
  return 1 - Math.exp(-3 / frames)
}

/* ── Shared WebGL context (single offscreen canvas) ── */
let gl,
  prog,
  uni = {},
  glCanvas
let texCache = new Map()
let glReady = false

function initSharedGL() {
  if (glReady) return
  glCanvas = document.createElement('canvas')
  gl = glCanvas.getContext('webgl', {
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  })
  if (!gl) return

  const vs = compileShader(gl, gl.VERTEX_SHADER, V)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, F)
  prog = gl.createProgram()
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('Program link error:', gl.getProgramInfoLog(prog))
  }
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0]),
    gl.STATIC_DRAW
  )

  const aP = gl.getAttribLocation(prog, 'aPos')
  const aT = gl.getAttribLocation(prog, 'aTex')
  gl.enableVertexAttribArray(aP)
  gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 16, 0)
  gl.enableVertexAttribArray(aT)
  gl.vertexAttribPointer(aT, 2, gl.FLOAT, false, 16, 8)

  const names = [
    'uImage',
    'uDepth',
    'uMouse',
    'uRes',
    'uLightH',
    'uStrength',
    'uSoft',
    'uMinBri',
    'uNorm',
    'uPara',
    'uAO',
    'uHover',
    'uSpotR',
    'uSpotFloor',
    'uShadLen',
    'uBoost',
    'uHighlight',
    'uSpotFalloff',
    'uSpotColor',
    'uUvScale',
    'uUvOffset',
  ]
  for (const n of names) uni[n] = gl.getUniformLocation(prog, n)

  gl.uniform1i(uni.uImage, 0)
  gl.uniform1i(uni.uDepth, 1)

  glReady = true
}

function getTextures(imgEl, depEl, key) {
  if (texCache.has(key)) return texCache.get(key)
  const t = {
    img: makeTexture(gl, imgEl),
    dep: makeTexture(gl, depEl),
    imgW: imgEl.naturalWidth,
    imgH: imgEl.naturalHeight,
  }
  texCache.set(key, t)
  return t
}

/* ── Render manager (single rAF, only runs when needed) ── */
const renderManager = {
  active: new Set(),
  running: false,
  add(inst) {
    this.active.add(inst)
    this._start()
  },
  remove(inst) {
    this.active.delete(inst)
    if (this.active.size === 0) this.running = false
  },
  wake(inst) {
    if (!inst._inited) return
    this.active.add(inst)
    this._start()
  },
  _start() {
    if (!this.running) {
      this.running = true
      requestAnimationFrame(this._loop)
    }
  },
  _loop: () => {
    for (const inst of renderManager.active) {
      const settled = inst.render()
      if (settled) renderManager.active.delete(inst)
    }
    if (renderManager.active.size === 0) {
      renderManager.running = false
    } else {
      requestAnimationFrame(renderManager._loop)
    }
  },
}

/* ── Image cache ── */
const imageCache = new Map()

function loadImage(url) {
  if (imageCache.has(url)) return imageCache.get(url)
  const p = new Promise((res, rej) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => res(img)
    img.onerror = rej
    img.src = url
  })
  imageCache.set(url, p)
  return p
}

/* ── Helpers ── */
function compileShader(ctx, type, src) {
  const s = ctx.createShader(type)
  ctx.shaderSource(s, src)
  ctx.compileShader(s)
  if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) {
    console.warn('Shader compile error:', ctx.getShaderInfoLog(s))
  }
  return s
}

function makeTexture(ctx, img) {
  const t = ctx.createTexture()
  ctx.bindTexture(ctx.TEXTURE_2D, t)
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE)
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE)
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR)
  ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR)
  ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, img)
  return t
}

/* ── Compute object-fit:cover UV transform ── */
function computeCoverUv(imgW, imgH, canvasW, canvasH) {
  const imgAspect = imgW / imgH
  const canvasAspect = canvasW / canvasH
  let scaleX = 1,
    scaleY = 1,
    offX = 0,
    offY = 0
  if (imgAspect > canvasAspect) {
    scaleX = canvasAspect / imgAspect
    offX = (1 - scaleX) / 2
  } else {
    scaleY = imgAspect / canvasAspect
    offY = (1 - scaleY) / 2
  }
  return { scaleX, scaleY, offX, offY }
}

/* ── <product-spotlight> Web Component ── */
class ProductSpotlight extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._mouse = { x: 0.5, y: 0.5 }
    this._sm = { x: 0.5, y: 0.5 }
    this._hov = false
    this._focused = false
    this._hm = 0
    this._inited = false
    this._tex = null
    this._ctx2d = null
    this._w = 0
    this._h = 0
    this._cover = { scaleX: 1, scaleY: 1, offX: 0, offY: 0 }
    this._hoverTimer = null
    this._mouseOver = false
  }

  connectedCallback() {
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'display:block;width:100%;height:100%;'
    this.shadowRoot.appendChild(canvas)
    this._canvas = canvas

    // Pre-load the product image and draw it to canvas as a placeholder
    const src = this.getAttribute('src')
    if (src) {
      loadImage(src)
        .then((img) => {
          if (this._inited) return // WebGL already took over
          const dpr = Math.min(window.devicePixelRatio || 1, 2)
          const rect = this.getBoundingClientRect()
          const w = Math.round(rect.width * dpr)
          const h = Math.round(rect.height * dpr)
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          // Draw with object-fit:cover logic
          const imgAspect = img.naturalWidth / img.naturalHeight
          const canvasAspect = w / h
          let sw, sh, sx, sy
          if (imgAspect > canvasAspect) {
            sh = img.naturalHeight
            sw = sh * canvasAspect
            sx = (img.naturalWidth - sw) / 2
            sy = 0
          } else {
            sw = img.naturalWidth
            sh = sw / canvasAspect
            sx = 0
            sy = (img.naturalHeight - sh) / 2
          }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
        })
        .catch(() => {})
    }

    // Pointer + focus tracking: listen on carousel/card if present.
    // Only the first spotlight binds shared listeners.
    const carousel = this.closest('spotlight-carousel')
    const pointerTarget = carousel || canvas
    const card = this.closest('article, .card')
    const getSiblings = () =>
      carousel ? [...carousel.querySelectorAll('product-spotlight')] : [this]

    if (!pointerTarget._spotlightBound) {
      pointerTarget._spotlightBound = true

      pointerTarget.addEventListener('pointermove', (e) => {
        if (e.target.closest('[role="tablist"]')) return
        const r = pointerTarget.getBoundingClientRect()
        const mx = (e.clientX - r.left) / r.width
        const my = (e.clientY - r.top) / r.height
        for (const sp of getSiblings()) {
          sp._mouse.x = mx
          sp._mouse.y = my
          renderManager.wake(sp)
          if (!sp._mouseOver) {
            sp._mouseOver = true
            sp._hoverTimer = setTimeout(() => {
              sp._hov = true
              renderManager.wake(sp)
            }, P.hoverDelay)
          }
        }
      })

      pointerTarget.addEventListener('pointerleave', () => {
        for (const sp of getSiblings()) {
          sp._mouseOver = false
          clearTimeout(sp._hoverTimer)
          sp._hov = false
          renderManager.wake(sp)
        }
      })
    }

    if (card && !card._spotlightFocusBound) {
      card._spotlightFocusBound = true

      card.addEventListener('focusin', (e) => {
        if (e.target.closest('[role="tablist"]')) return
        for (const sp of getSiblings()) {
          sp._focused = true
          sp._mouse.x = 0.5
          sp._mouse.y = 0.5
          renderManager.wake(sp)
        }
      })
      card.addEventListener('focusout', (e) => {
        if (e.relatedTarget?.closest('[role="tablist"]')) return
        for (const sp of getSiblings()) {
          sp._focused = false
          renderManager.wake(sp)
        }
      })
    }

    this._observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!this._inited) {
              this._setup()
            } else {
              renderManager.add(this)
            }
          } else {
            renderManager.remove(this)
          }
        }
      },
      { threshold: 0 }
    )
    this._observer.observe(this)
  }

  disconnectedCallback() {
    if (this._observer) this._observer.disconnect()
    clearTimeout(this._hoverTimer)
    renderManager.remove(this)
  }

  async _setup() {
    if (this._inited) return
    const src = this.getAttribute('src')
    const depth = this.getAttribute('depth')
    if (!src || !depth) return

    let imgEl, depEl
    try {
      ;[imgEl, depEl] = await Promise.all([loadImage(src), loadImage(depth)])
    } catch {
      return
    }

    initSharedGL()
    if (!glReady) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = this.getBoundingClientRect()
    this._w = Math.round(rect.width * dpr)
    this._h = Math.round(rect.height * dpr)

    const cv = this._canvas
    cv.width = this._w
    cv.height = this._h
    this._ctx2d = cv.getContext('2d')

    this._carousel = this.closest('spotlight-carousel')
    if (this._carousel) {
      const lis = this._carousel.querySelectorAll(':scope > ul > li')
      this._slideIndex = [...lis].indexOf(this.closest('li'))
    } else {
      this._slideIndex = 0
    }

    const texKey = `${src}|${depth}`
    this._tex = getTextures(imgEl, depEl, texKey)

    this._cover = computeCoverUv(
      this._tex.imgW,
      this._tex.imgH,
      this._w,
      this._h
    )

    this._inited = true
    renderManager.add(this)
  }

  render() {
    if (!this._inited || !this._ctx2d) return true

    // Update animation state every frame — even for off-screen siblings —
    // so when they scroll into view the spotlight is already in the right
    // place and at the right uHover, continuous with its neighbour.
    const active = this._hov || this._focused
    const lr = msToLerp(active ? P.trackingSpeed : P.returnSpeed)
    const tx = active ? this._mouse.x : 0.5
    const ty = active ? this._mouse.y : 0.5
    this._sm.x += (tx - this._sm.x) * lr
    this._sm.y += (ty - this._sm.y) * lr
    this._hm +=
      ((active ? 1 : 0) - this._hm) * msToLerp(active ? P.fadeIn : P.fadeOut)

    const EPS = 1e-4
    const settled =
      !active &&
      Math.abs(this._sm.x - tx) < EPS &&
      Math.abs(this._sm.y - ty) < EPS &&
      this._hm < EPS

    if (settled) {
      this._sm.x = tx
      this._sm.y = ty
      this._hm = 0
    }

    // Skip GL work for slides scrolled out of the carousel viewport.
    if (this._hasRendered && this._carousel) {
      const dist = Math.abs(
        (this._carousel._scrollProgress || 0) - this._slideIndex
      )
      if (dist >= 1) return settled
    }

    // Resize shared GL canvas if needed
    if (glCanvas.width !== this._w || glCanvas.height !== this._h) {
      glCanvas.width = this._w
      glCanvas.height = this._h
      gl.viewport(0, 0, this._w, this._h)
    }

    // Anchor spotlight to carousel viewport instead of each slide's local uv.
    let mouseX = this._sm.x
    if (P.spotlightMode === 'scroll' && this._carousel) {
      mouseX += (this._carousel._scrollProgress || 0) - this._slideIndex
    }

    gl.uniform2f(uni.uMouse, mouseX, this._sm.y)
    gl.uniform2f(uni.uRes, this._w, this._h)
    gl.uniform1f(uni.uLightH, P.lightHeight)
    gl.uniform1f(uni.uStrength, P.shadowStrength)
    gl.uniform1f(uni.uSoft, P.shadowSoftness)
    gl.uniform1f(uni.uMinBri, P.minBrightness)
    gl.uniform1f(uni.uNorm, P.normalStrength)
    gl.uniform1f(uni.uPara, P.parallax)
    gl.uniform1f(uni.uAO, P.aoStrength)
    gl.uniform1f(uni.uHover, this._hm)
    gl.uniform1f(uni.uSpotR, P.spotRadius)
    gl.uniform1f(uni.uSpotFloor, P.spotFloor)
    gl.uniform1f(uni.uShadLen, P.shadowLength)
    gl.uniform1f(uni.uBoost, P.lightBoost)
    gl.uniform1f(uni.uHighlight, P.highlight)
    gl.uniform1f(uni.uSpotFalloff, P.spotFalloff)
    gl.uniform3f(uni.uSpotColor, ...hexToRgb(P.spotColor))
    gl.uniform2f(uni.uUvScale, this._cover.scaleX, this._cover.scaleY)
    gl.uniform2f(uni.uUvOffset, this._cover.offX, this._cover.offY)

    // Bind this instance's textures
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this._tex.img)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this._tex.dep)

    // Draw to shared GL canvas
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // Blit to this instance's 2D canvas
    this._ctx2d.drawImage(glCanvas, 0, 0)
    this._hasRendered = true

    return settled
  }
}

customElements.define('product-spotlight', ProductSpotlight)

/* ── <spotlight-carousel> — light DOM carousel; markers are authored in markup ── */
class SpotlightCarousel extends HTMLElement {
  connectedCallback() {
    this._isBlueprint = !!this.closest('.card--blueprint')
    this._scrollProgress = 0

    const items = this.querySelectorAll(':scope > ul > li')
    const nav = this.querySelector(':scope > [role="tablist"]')
    if (items.length < 2 || !nav) return

    this._items = items
    this._markers = [...nav.querySelectorAll('[role="tab"]')]
    this._current = this._markers.findIndex(
      (m) => m.getAttribute('aria-selected') === 'true'
    )
    if (this._current < 0) this._current = 0

    if (!this._isBlueprint) {
      this._markers.forEach((btn, i) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          this._goTo(i)
        })
      })

      nav.addEventListener('keydown', (e) => {
        let next
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          next = (this._current + 1) % this._markers.length
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          next =
            (this._current - 1 + this._markers.length) % this._markers.length
        } else if (e.key === 'Home') {
          next = 0
        } else if (e.key === 'End') {
          next = this._markers.length - 1
        }
        if (next != null) {
          e.preventDefault()
          this._goTo(next)
          this._markers[next].focus()
        }
      })
    }

    const scroller = this.querySelector(':scope > ul')
    if (scroller) {
      let ticking = false
      scroller.addEventListener('scroll', () => {
        if (ticking) return
        ticking = true
        requestAnimationFrame(() => {
          ticking = false
          const slideWidth = scroller.offsetWidth
          if (slideWidth === 0) return
          this._scrollProgress = scroller.scrollLeft / slideWidth
          if (P.spotlightMode === 'scroll' && !this._isBlueprint) {
            for (const sp of this.querySelectorAll('product-spotlight')) {
              renderManager.wake(sp)
            }
          }
          const idx = Math.round(this._scrollProgress)
          if (idx !== this._current && idx >= 0 && idx < this._markers.length) {
            this._setActive(idx)
          }
        })
      })
    }
  }

  _goTo(idx) {
    const li = this._items[idx]
    if (!li) return
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    li.scrollIntoView({
      behavior: reducedMotion ? 'instant' : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
    this._setActive(idx)
  }

  _setActive(idx) {
    this._markers[this._current]?.setAttribute('aria-selected', 'false')
    if (!this._isBlueprint) {
      this._markers[this._current]?.setAttribute('tabindex', '-1')
    }
    this._current = idx
    this._markers[idx]?.setAttribute('aria-selected', 'true')
    if (!this._isBlueprint) {
      this._markers[idx]?.setAttribute('tabindex', '0')
    }
  }
}

customElements.define('spotlight-carousel', SpotlightCarousel)

/* ── Card click delegation ── */
document.querySelectorAll('.card:not(.card--blueprint)').forEach((card) => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('a, [role="tablist"]')) return
    card.querySelector('a')?.click()
  })
})

/* ── Carousel sync (main → blueprint) ── */
document.querySelectorAll('.card-stack').forEach((stack) => {
  const carousels = stack.querySelectorAll('spotlight-carousel')
  if (carousels.length < 2) return
  const [blueprint, main] = carousels
  const mainScroller = main.querySelector(':scope > ul')
  const blueprintScroller = blueprint.querySelector(':scope > ul')
  if (!mainScroller || !blueprintScroller) return
  mainScroller.addEventListener('scroll', () => {
    blueprintScroller.scrollLeft = mainScroller.scrollLeft
  })
})

/* ── Tweakpane (rebuilt on preset load) ── */
let ctrl
let d

function getPresetData() {
  const { reveal, ...data } = P
  return JSON.parse(JSON.stringify(data))
}

function buildPane() {
  const prevPos = d ? { x: d[0].x, y: d[0].y } : null
  if (ctrl) ctrl.dispose()

  ctrl = new Pane({
    title: 'Spotlight Config',
    expanded: true,
  })

  // ── Reveal toggle (top level) ──
  ctrl.addBinding(P, 'reveal', { label: 'Reveal' }).on('change', (e) => {
    document.documentElement.toggleAttribute('data-reveal', e.value)
  })

  ctrl.addBlade({ view: 'separator' })

  // ── Presets ──
  const presetsFolder = ctrl.addFolder({ title: 'Presets', expanded: false })
  const allPresets = getAllPresets()
  const presetOptions = Object.fromEntries(
    Object.keys(allPresets).map((k) => [k, k])
  )
  const presetState = { preset: '' }

  presetsFolder
    .addBinding(presetState, 'preset', {
      label: 'Load',
      options: { '— select —': '', ...presetOptions },
    })
    .on('change', ({ value }) => {
      if (!value) return
      const preset = getAllPresets()[value]
      if (!preset) return
      const loaded = JSON.parse(JSON.stringify(preset))
      Object.assign(P, loaded)
      syncHoverDelay()
      buildPane()
    })

  presetsFolder
    .addButton({ title: 'Save current as preset' })
    .on('click', () => {
      const name = prompt('Preset name:')
      if (!name?.trim()) return
      saveCustomPreset(name.trim(), getPresetData())
      buildPane()
    })

  // ── Lighting ──
  const lighting = ctrl.addFolder({ title: 'Lighting', expanded: false })
  lighting.addBinding(P, 'lightHeight', {
    min: 0.05,
    max: 3.0,
    step: 0.01,
    label: 'Light Height',
  })
  lighting.addBinding(P, 'shadowStrength', {
    min: 0,
    max: 1,
    step: 0.01,
    label: 'Shadow Strength',
  })
  lighting.addBinding(P, 'shadowSoftness', {
    min: 0.005,
    max: 0.2,
    step: 0.001,
    label: 'Shadow Softness',
  })
  lighting.addBinding(P, 'shadowLength', {
    min: 0.1,
    max: 3.0,
    step: 0.05,
    label: 'Shadow Reach',
  })
  lighting.addBinding(P, 'minBrightness', {
    min: 0,
    max: 1,
    step: 0.01,
    label: 'Min Brightness',
  })
  lighting.addBinding(P, 'normalStrength', {
    min: 0,
    max: 5,
    step: 0.1,
    label: 'Relief',
  })
  lighting.addBinding(P, 'aoStrength', {
    min: 0,
    max: 2,
    step: 0.05,
    label: 'AO Strength',
  })

  // ── Spotlight ──
  const spot = ctrl.addFolder({ title: 'Spotlight', expanded: false })
  spot.addBinding(P, 'spotlightMode', {
    label: 'Mode',
    options: { 'Per-slide': 'slide', 'Scroll track': 'scroll' },
  })
  spot.addBinding(P, 'spotRadius', {
    min: 0.05,
    max: 1.5,
    step: 0.01,
    label: 'Radius',
  })
  spot.addBinding(P, 'spotFloor', {
    min: 0,
    max: 0.5,
    step: 0.01,
    label: 'Floor',
  })
  spot.addBinding(P, 'highlight', {
    min: 0.5,
    max: 5.0,
    step: 0.05,
    label: 'Peak',
  })
  spot.addBinding(P, 'spotFalloff', {
    min: 0.2,
    max: 4.0,
    step: 0.05,
    label: 'Falloff',
  })
  spot.addBinding(P, 'lightBoost', {
    min: 0,
    max: 3.0,
    step: 0.05,
    label: 'Glow',
  })
  spot.addBinding(P, 'spotColor', { label: 'Glow Color' })

  // ── Effects ──
  const fx = ctrl.addFolder({ title: 'Effects', expanded: false })
  fx.addBinding(P, 'parallax', {
    min: 0,
    max: 0.05,
    step: 0.001,
    label: 'Parallax',
  })

  // ── Timing ──
  const mouse = ctrl.addFolder({ title: 'Timing (ms)', expanded: false })
  mouse.addBinding(P, 'trackingSpeed', {
    min: 0,
    max: 500,
    step: 5,
    label: 'Tracking',
  })
  mouse.addBinding(P, 'returnSpeed', {
    min: 0,
    max: 1000,
    step: 10,
    label: 'Return',
  })
  mouse.addBinding(P, 'fadeIn', { min: 0, max: 500, step: 5, label: 'Fade In' })
  mouse.addBinding(P, 'fadeOut', {
    min: 0,
    max: 1000,
    step: 10,
    label: 'Fade Out',
  })
  mouse
    .addBinding(P, 'hoverDelay', {
      min: 0,
      max: 500,
      step: 10,
      label: 'Hover Delay',
    })
    .on('change', syncHoverDelay)

  // Make tweakpane panel draggable
  const tweakClass = 'div.tp-dfwv'
  d = Draggable.create(tweakClass, {
    type: 'x,y',
    allowEventDefault: true,
    trigger: tweakClass + ' button.tp-rotv_b',
  })

  if (prevPos) {
    gsap.set(tweakClass, { x: prevPos.x, y: prevPos.y })
  }

  document.querySelector(tweakClass).addEventListener('dblclick', () => {
    gsap.to(tweakClass, {
      x: `+=${d[0].x * -1}`,
      y: `+=${d[0].y * -1}`,
      onComplete: () => {
        gsap.set(tweakClass, { clearProps: 'all' })
      },
    })
  })
}

buildPane()
