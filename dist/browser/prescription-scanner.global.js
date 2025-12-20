"use strict";var PrescriptionScanner=(()=>{var A=Object.defineProperty;var ne=Object.getOwnPropertyDescriptor;var se=Object.getOwnPropertyNames;var oe=Object.prototype.hasOwnProperty;var ie=(s,e)=>{for(var t in e)A(s,t,{get:e[t],enumerable:!0})},ce=(s,e,t,a)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of se(e))!oe.call(s,r)&&r!==t&&A(s,r,{get:()=>e[r],enumerable:!(a=ne(e,r))||a.enumerable});return s};var le=s=>ce(A({},"__esModule",{value:!0}),s);var xe={};ie(xe,{CombinedDecoder:()=>v,DataMatrixDecoder:()=>u,PrescriptionScanner:()=>b,SuperScanner:()=>f,ZBarDecoder:()=>u,adaptiveThreshold:()=>E,binarize:()=>O,binarizeOtsu:()=>D,boxBlur:()=>q,cleanup:()=>X,gaussianBlur:()=>M,getAvailableCameras:()=>Z,grabFrame:()=>F,grayscaleToRGBA:()=>te,invert:()=>P,isCameraSupported:()=>L,isPDF:()=>T,isPdfJsLoaded:()=>_,medianFilter:()=>V,openScanner:()=>J,otsuThreshold:()=>B,preprocess:()=>ee,processPDF:()=>R,scan:()=>Q,scanAll:()=>K,scanVideo:()=>U,sharpen:()=>I,sharpenLight:()=>$,startCamera:()=>C,startScanner:()=>Y,stopCamera:()=>k,stretchContrast:()=>N,toGrayscale:()=>S,toImageData:()=>j});var de={DataMatrix:"DataMatrix",QRCode:"QRCode"},u=class{constructor(){this.name="scanner-wasm";this.supportedFormats=["DataMatrix","QRCode"];this.module=null;this.ready=!1;this.loading=null}async init(){if(!this.ready){if(this.loading)return this.loading;this.loading=this.loadModule(),await this.loading}}async loadModule(){await this.loadScript("/wasm/scanner.js");let e=window.createScanner;this.module=await e({locateFile:t=>t.endsWith(".wasm")?"/wasm/scanner.wasm":t}),this.ready=!0}loadScript(e){return new Promise((t,a)=>{if(window.createScanner){t();return}let r=document.createElement("script");r.src=e,r.onload=()=>t(),r.onerror=a,document.head.appendChild(r)})}isReady(){return this.ready}async decode(e,t){if(!this.ready||!this.module)return[];try{let{data:a,width:r,height:o}=e,n=this.module._malloc(a.length);this.module.HEAPU8.set(a,n);let l=this.module.scan(n,r,o);this.module._free(n);let c=[],i=l.size();for(let p=0;p<i;p++){let d=l.get(p),m=de[d.format];m&&t.includes(m)&&c.push({data:d.text,format:m,points:[{x:d.x0,y:d.y0},{x:d.x1,y:d.y1},{x:d.x2,y:d.y2},{x:d.x3,y:d.y3}]})}return c}catch{return[]}}destroy(){this.module=null,this.ready=!1,this.loading=null}};var v=class{constructor(){this.initialized=!1;this.decoder=new u}async init(e){this.initialized||(await this.decoder.init(),this.initialized=!0)}async decode(e,t){if(!this.initialized)throw new Error("Decoder not initialized");let a=await this.decoder.decode(e,t),r=Date.now();return a.map(o=>({...o,timestamp:r}))}getSupportedFormats(){return this.decoder.supportedFormats}isReady(){return this.initialized&&this.decoder.isReady()}destroy(){this.decoder.destroy(),this.initialized=!1}};async function C(s,e={}){let{facingMode:t="environment",resolution:a={width:1280,height:720}}=e,r={video:{facingMode:t,width:{ideal:a.width},height:{ideal:a.height}},audio:!1};try{let o=await navigator.mediaDevices.getUserMedia(r);s.srcObject=o,await new Promise((p,d)=>{s.onloadedmetadata=()=>{s.play().then(p).catch(d)},s.onerror=()=>d(new Error("Video element error"))});let n=s.videoWidth,l=s.videoHeight,c=document.createElement("canvas");c.width=n,c.height=l;let i=c.getContext("2d",{willReadFrequently:!0});if(!i)throw new Error("Could not get canvas context");return{video:s,stream:o,canvas:c,ctx:i,width:n,height:l}}catch(o){throw new Error(`Camera access denied: ${o}`)}}function k(s){let{stream:e,video:t}=s;for(let a of e.getTracks())a.stop();t.srcObject=null}function F(s){let{video:e,canvas:t,ctx:a,width:r,height:o}=s;return a.drawImage(e,0,0,r,o),a.getImageData(0,0,r,o)}function L(){return!!(navigator.mediaDevices&&typeof navigator.mediaDevices.getUserMedia=="function")}async function Z(){return(await navigator.mediaDevices.enumerateDevices()).filter(e=>e.kind==="videoinput")}var y=class y{constructor(e={}){this.camera=null;this.scanning=!1;this.animationFrame=null;this.lastScanTime=0;this.scanHandlers=new Set;this.errorHandlers=new Set;this.startHandlers=new Set;this.stopHandlers=new Set;this.options={...y.defaultOptions,...e,preprocessing:{...y.defaultOptions.preprocessing,...e.preprocessing},camera:{...y.defaultOptions.camera,...e.camera}},this.decoder=new v}async init(){await this.decoder.init(this.options.formats)}on(e,t){switch(e){case"scan":this.scanHandlers.add(t);break;case"error":this.errorHandlers.add(t);break;case"start":this.startHandlers.add(t);break;case"stop":this.stopHandlers.add(t);break}}off(e,t){switch(e){case"scan":this.scanHandlers.delete(t);break;case"error":this.errorHandlers.delete(t);break;case"start":this.startHandlers.delete(t);break;case"stop":this.stopHandlers.delete(t);break}}emit(e,t){try{switch(e){case"scan":for(let a of this.scanHandlers)a(t);break;case"error":for(let a of this.errorHandlers)a(t);break;case"start":for(let a of this.startHandlers)a();break;case"stop":for(let a of this.stopHandlers)a();break}}catch(a){console.error(`Error in ${e} handler:`,a)}}async start(e){if(!this.scanning){if(!L())throw new Error("Camera not supported in this browser");this.decoder.isReady()||await this.init(),this.camera=await C(e,this.options.camera),this.scanning=!0,this.emit("start"),this.scanLoop()}}stop(){this.scanning&&(this.scanning=!1,this.animationFrame!==null&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=null),this.camera&&(k(this.camera),this.camera=null),this.emit("stop"))}scanLoop(){if(!this.scanning||!this.camera)return;let e=Date.now(),t=1e3/(this.options.camera.scanRate||10);if(e-this.lastScanTime>=t){this.lastScanTime=e;let a=F(this.camera);this.processFrame(a).catch(r=>{this.emit("error",r)})}this.animationFrame=requestAnimationFrame(()=>this.scanLoop())}async processFrame(e){let t=await this.decoder.decode(e,this.options.formats);for(let a of t)this.emit("scan",a)}async scanImage(e){this.decoder.isReady()||await this.init();let t=document.createElement("canvas");t.width=e.naturalWidth,t.height=e.naturalHeight;let a=t.getContext("2d");if(!a)throw new Error("Could not get canvas context");a.drawImage(e,0,0);let r=a.getImageData(0,0,t.width,t.height);return this.scanImageData(r)}async scanImageData(e){return this.decoder.isReady()||await this.init(),this.decoder.decode(e,this.options.formats)}async scanCanvas(e){let t=e.getContext("2d");if(!t)throw new Error("Could not get canvas context");let a=t.getImageData(0,0,e.width,e.height);return this.scanImageData(a)}isScanning(){return this.scanning}getSupportedFormats(){return this.decoder.getSupportedFormats()}setOptions(e){e.preprocessing&&(this.options.preprocessing={...this.options.preprocessing,...e.preprocessing}),e.camera&&(this.options.camera={...this.options.camera,...e.camera}),e.formats&&(this.options.formats=e.formats)}destroy(){this.stop(),this.decoder.destroy(),this.scanHandlers.clear(),this.errorHandlers.clear(),this.startHandlers.clear(),this.stopHandlers.clear()}};y.defaultOptions={formats:["QRCode","DataMatrix"],preprocessing:{binarize:"none",sharpen:!1,denoise:!1,invert:!1},camera:{facingMode:"environment",resolution:{width:1280,height:720},scanRate:10}};var f=y;var w=null,H=null,pe="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",me="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";async function he(){if(!w)return H||(H=new Promise((s,e)=>{let t=document.createElement("script");t.src=pe,t.onload=()=>{let a=window.pdfjsLib;a?(a.GlobalWorkerOptions.workerSrc=me,w=a,s()):e(new Error("PDF.js failed to load"))},t.onerror=()=>e(new Error("Failed to load PDF.js")),document.head.appendChild(t)}),H)}async function R(s,e={}){let{scale:t=2,maxPages:a=10,onProgress:r}=e;if(await he(),!w)throw new Error("PDF.js not loaded");let o=s instanceof File?await s.arrayBuffer():s,n=await w.getDocument({data:o}).promise,l=Math.min(n.numPages,a),c=[],i=document.createElement("canvas"),p=i.getContext("2d");try{for(let d=1;d<=l;d++){r?.(d,l);let m=await n.getPage(d),h=m.getViewport({scale:t});i.width=h.width,i.height=h.height,p.fillStyle="#ffffff",p.fillRect(0,0,i.width,i.height),await m.render({canvasContext:p,viewport:h}).promise;let x=p.getImageData(0,0,i.width,i.height);c.push({pageNumber:d,imageData:x,width:i.width,height:i.height})}}finally{n.destroy()}return c}function T(s){return s.type==="application/pdf"||s.name.toLowerCase().endsWith(".pdf")}function _(){return w!==null}var ue=`
.ps-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.ps-modal {
  background: #1a1a1a;
  border-radius: 12px;
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
}
.ps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #333;
}
.ps-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}
.ps-close {
  background: none;
  border: none;
  color: #888;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.ps-close:hover { color: #fff; }
.ps-content {
  padding: 20px;
}
.ps-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.ps-tab {
  flex: 1;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #888;
  background: #252525;
  border: 1px solid #333;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.ps-tab:hover { background: #2a2a2a; }
.ps-tab.active {
  color: #fff;
  background: #2563eb;
  border-color: #2563eb;
}
.ps-tab svg { width: 18px; height: 18px; }
.ps-video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}
.ps-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ps-upload-zone {
  width: 100%;
  aspect-ratio: 4/3;
  background: #252525;
  border: 2px dashed #444;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.ps-upload-zone:hover, .ps-upload-zone.dragover {
  border-color: #2563eb;
  background: #1e3a5f;
}
.ps-upload-zone svg {
  width: 48px;
  height: 48px;
  color: #666;
}
.ps-upload-zone.dragover svg { color: #2563eb; }
.ps-upload-text {
  color: #888;
  font-size: 14px;
  text-align: center;
}
.ps-upload-text strong { color: #2563eb; }
.ps-upload-hint {
  color: #666;
  font-size: 12px;
}
.ps-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.8);
  gap: 16px;
}
.ps-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #333;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: ps-spin 1s linear infinite;
}
.ps-loading-text {
  color: #888;
  font-size: 14px;
}
.ps-scan-line {
  position: absolute;
  left: 10%;
  right: 10%;
  height: 2px;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
  animation: ps-scan 2s ease-in-out infinite;
}
.ps-results {
  margin-top: 16px;
  max-height: 200px;
  overflow-y: auto;
}
.ps-result-item {
  padding: 12px;
  background: #252525;
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 3px solid #22c55e;
}
.ps-result-format {
  font-size: 11px;
  font-weight: 600;
  color: #22c55e;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.ps-result-data {
  font-size: 13px;
  color: #fff;
  word-break: break-all;
  font-family: monospace;
}
.ps-result-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #22c55e;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border-radius: 20px;
  margin-bottom: 12px;
}
.ps-footer {
  padding: 16px 20px;
  border-top: 1px solid #333;
  display: flex;
  justify-content: center;
}
.ps-cancel {
  padding: 10px 24px;
  font-size: 14px;
  color: #888;
  background: transparent;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
}
.ps-cancel:hover {
  color: #fff;
  border-color: #666;
}
.ps-btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #2563eb;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.ps-btn:hover { background: #1d4ed8; }
.ps-btn svg { width: 20px; height: 20px; }
.ps-hidden { display: none !important; }
@keyframes ps-spin {
  to { transform: rotate(360deg); }
}
@keyframes ps-scan {
  0%, 100% { top: 10%; opacity: 1; }
  50% { top: 80%; opacity: 0.5; }
}
`,fe=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
  <line x1="7" y1="12" x2="17" y2="12"/>
</svg>`,ge=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
  <circle cx="12" cy="13" r="4"/>
</svg>`,ve=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="17 8 12 3 7 8"/>
  <line x1="12" y1="3" x2="12" y2="15"/>
</svg>`,ye=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
</svg>`,b=class{constructor(e={}){this.scanner=null;this.overlay=null;this.video=null;this.stream=null;this.stylesInjected=!1;this.results=[];this.mode="camera";this.fileInput=null;this.options={formats:e.formats||["DataMatrix","QRCode"],title:e.title||"Barcode scannen",buttonText:e.buttonText||"Scanner \xF6ffnen",closeOnScan:e.closeOnScan??!1,onScan:e.onScan||(()=>{}),onMultiScan:e.onMultiScan||(()=>{}),onError:e.onError||(()=>{}),onClose:e.onClose||(()=>{})}}createButton(e){let t=document.createElement("button");return t.className="ps-btn",t.innerHTML=`${fe} ${this.options.buttonText}`,t.onclick=()=>this.open(),e&&e.appendChild(t),t}async open(){this.results=[],this.injectStyles(),this.createModal(),await this.startScanner()}close(){this.stopScanner(),this.overlay&&(this.overlay.remove(),this.overlay=null),this.results.length>0&&this.options.onMultiScan(this.results),this.options.onClose()}destroy(){this.close(),this.scanner?.destroy(),this.scanner=null}getResults(){return[...this.results]}injectStyles(){if(this.stylesInjected)return;let e=document.createElement("style");e.id="prescription-scanner-styles",e.textContent=ue,document.head.appendChild(e),this.stylesInjected=!0}createModal(){this.overlay=document.createElement("div"),this.overlay.className="ps-overlay",this.overlay.onclick=r=>{r.target===this.overlay&&this.close()},this.overlay.innerHTML=`
      <div class="ps-modal">
        <div class="ps-header">
          <h2 class="ps-title">${this.options.title}</h2>
          <button class="ps-close" aria-label="Schlie\xDFen">&times;</button>
        </div>
        <div class="ps-content">
          <div class="ps-tabs">
            <button class="ps-tab active" data-mode="camera">
              ${ge} Kamera
            </button>
            <button class="ps-tab" data-mode="upload">
              ${ye} Datei/PDF
            </button>
          </div>
          <div class="ps-camera-view">
            <div class="ps-video-container">
              <video class="ps-video" playsinline muted></video>
              <div class="ps-loading">
                <div class="ps-spinner"></div>
                <span class="ps-loading-text">Scanner wird geladen...</span>
              </div>
            </div>
          </div>
          <div class="ps-upload-view ps-hidden">
            <div class="ps-upload-zone">
              ${ve}
              <span class="ps-upload-text"><strong>Klicken</strong> oder Datei hierher ziehen</span>
              <span class="ps-upload-hint">Bilder (JPG, PNG) oder PDF</span>
            </div>
          </div>
          <div class="ps-results"></div>
        </div>
        <div class="ps-footer">
          <button class="ps-cancel">Schlie\xDFen</button>
        </div>
      </div>
    `,this.overlay.querySelector(".ps-close").addEventListener("click",()=>this.close()),this.overlay.querySelector(".ps-cancel").addEventListener("click",()=>this.close()),this.overlay.querySelectorAll(".ps-tab").forEach(r=>{r.addEventListener("click",()=>{let o=r.getAttribute("data-mode");this.switchMode(o)})});let t=this.overlay.querySelector(".ps-upload-zone");this.setupUploadZone(t);let a=r=>{r.key==="Escape"&&(this.close(),document.removeEventListener("keydown",a))};document.addEventListener("keydown",a),this.video=this.overlay.querySelector(".ps-video"),document.body.appendChild(this.overlay),document.body.style.overflow="hidden"}setupUploadZone(e){this.fileInput=document.createElement("input"),this.fileInput.type="file",this.fileInput.accept="image/*,application/pdf",this.fileInput.style.display="none",this.fileInput.addEventListener("change",()=>{let t=this.fileInput?.files?.[0];t&&this.processFile(t)}),e.appendChild(this.fileInput),e.addEventListener("click",()=>{this.fileInput?.click()}),e.addEventListener("dragover",t=>{t.preventDefault(),e.classList.add("dragover")}),e.addEventListener("dragleave",()=>{e.classList.remove("dragover")}),e.addEventListener("drop",t=>{t.preventDefault(),e.classList.remove("dragover");let a=t.dataTransfer?.files[0];a&&this.processFile(a)})}switchMode(e){if(!this.overlay)return;this.mode=e,this.overlay.querySelectorAll(".ps-tab").forEach(o=>{o.classList.toggle("active",o.getAttribute("data-mode")===e)});let a=this.overlay.querySelector(".ps-camera-view"),r=this.overlay.querySelector(".ps-upload-view");e==="camera"?(a.classList.remove("ps-hidden"),r.classList.add("ps-hidden"),this.scanner?.isScanning()||this.startScanner()):(a.classList.add("ps-hidden"),r.classList.remove("ps-hidden"),this.stopScanner())}async processFile(e){if(!this.overlay)return;let t=this.overlay.querySelector(".ps-upload-zone"),a=t.innerHTML;t.innerHTML=`
      <div class="ps-spinner"></div>
      <span class="ps-loading-text">Verarbeite ${e.name}...</span>
    `;try{this.scanner||(this.scanner=new f({formats:this.options.formats}),await this.scanner.init());let r=[];if(T(e)){let n=await R(e,{scale:2,onProgress:(l,c)=>{let i=t.querySelector(".ps-loading-text");i&&(i.textContent=`Seite ${l}/${c}...`)}});for(let l of n){let c=await this.scanner.scanImageData(l.imageData);r.push(...c)}}else{let n=await this.loadImage(e);r=await this.scanner.scanImageData(n)}let o=this.deduplicateResults(r);if(o.length>0){for(let n of o)this.addResult(n);t.innerHTML=`
          <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="width:48px;height:48px">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span class="ps-loading-text" style="color:#22c55e">${o.length} Code${o.length>1?"s":""} gefunden!</span>
        `}else t.innerHTML=`
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="width:48px;height:48px">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span class="ps-loading-text" style="color:#ef4444">Kein Barcode gefunden</span>
        `;setTimeout(()=>{t&&this.overlay&&(t.innerHTML=a,this.setupUploadZone(t))},2500)}catch(r){t.innerHTML=`
        <span class="ps-loading-text" style="color:#ef4444">
          Fehler: ${r instanceof Error?r.message:"Unbekannt"}
        </span>
      `,this.options.onError(r instanceof Error?r:new Error(String(r))),setTimeout(()=>{t&&this.overlay&&(t.innerHTML=a,this.setupUploadZone(t))},3e3)}}async loadImage(e){return new Promise((t,a)=>{let r=new Image;r.onload=()=>{let o=document.createElement("canvas");o.width=r.naturalWidth,o.height=r.naturalHeight;let n=o.getContext("2d");n.drawImage(r,0,0),t(n.getImageData(0,0,o.width,o.height))},r.onerror=()=>a(new Error("Bild konnte nicht geladen werden")),r.src=URL.createObjectURL(e)})}deduplicateResults(e){let t=new Set;return e.filter(a=>{let r=`${a.format}:${a.data}`;return t.has(r)?!1:(t.add(r),!0)})}async startScanner(){if(!this.overlay||!this.video)return;let e=this.overlay.querySelector(".ps-loading"),t=this.overlay.querySelector(".ps-video-container");try{if(this.scanner=new f({formats:this.options.formats}),await this.scanner.init(),this.scanner.on("scan",a=>{this.addResult(a),this.options.closeOnScan&&setTimeout(()=>this.close(),1e3)}),this.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}}),this.video.srcObject=this.stream,await this.video.play(),await this.scanner.start(this.video),e.style.display="none",!t.querySelector(".ps-scan-line")){let a=document.createElement("div");a.className="ps-scan-line",t.appendChild(a)}}catch(a){e.innerHTML=`
        <span class="ps-loading-text" style="color: #ef4444;">
          Fehler: ${a instanceof Error?a.message:"Unbekannt"}
        </span>
      `,this.options.onError(a instanceof Error?a:new Error(String(a)))}}stopScanner(){this.scanner?.stop(),this.stream&&(this.stream.getTracks().forEach(e=>e.stop()),this.stream=null),this.overlay&&this.overlay.querySelector(".ps-scan-line")?.remove(),document.body.style.overflow=""}addResult(e){this.results.some(a=>a.data===e.data&&a.format===e.format)||(this.results.push(e),this.options.onScan(e),this.updateResultsUI())}updateResultsUI(){if(!this.overlay)return;let e=this.overlay.querySelector(".ps-results");e&&(e.innerHTML=`
      <div class="ps-result-count">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        ${this.results.length} Code${this.results.length>1?"s":""} gefunden
      </div>
      ${this.results.map(t=>`
        <div class="ps-result-item">
          <div class="ps-result-format">${t.format}</div>
          <div class="ps-result-data">${this.escapeHtml(t.data)}</div>
        </div>
      `).join("")}
    `)}escapeHtml(e){let t=document.createElement("div");return t.textContent=e,t.innerHTML}};function J(s={}){let e=new b(s);return e.open(),e}var g=null;async function z(){return g||(g=new f({formats:["DataMatrix","QRCode"]}),await g.init()),g}async function Q(s){let e=await z(),t;return s instanceof HTMLImageElement?t=await e.scanImage(s):s instanceof HTMLCanvasElement?t=await e.scanCanvas(s):t=await e.scanImageData(s),t[0]||null}async function K(s){let e=await z();return s instanceof HTMLImageElement?e.scanImage(s):s instanceof HTMLCanvasElement?e.scanCanvas(s):e.scanImageData(s)}async function U(s,e,t){let a=await z();return a.on("scan",e),t?.onError&&a.on("error",t.onError),await a.start(s),()=>{a.stop(),a.off("scan",e),t?.onError&&a.off("error",t.onError)}}async function Y(s,e){let t=document.createElement("video");t.setAttribute("playsinline",""),t.setAttribute("muted",""),t.style.width="100%",t.style.height="auto",e?.container&&e.container.appendChild(t);let a=await U(t,s,e);return{video:t,stop:()=>{a(),e?.container&&t.parentNode===e.container&&e.container.removeChild(t)}}}function X(){g&&(g.destroy(),g=null)}function S(s){let{data:e,width:t,height:a}=s,r=new Uint8Array(t*a);for(let o=0;o<r.length;o++){let n=o*4,l=e[n],c=e[n+1],i=e[n+2];r[o]=l*77+c*150+i*29>>8}return{data:r,width:t,height:a}}function j(s){let{data:e,width:t,height:a}=s,r=new ImageData(t,a);for(let o=0;o<e.length;o++){let n=o*4,l=e[o];r.data[n]=l,r.data[n+1]=l,r.data[n+2]=l,r.data[n+3]=255}return r}function B(s){let{data:e}=s,t=new Uint32Array(256);for(let i=0;i<e.length;i++)t[e[i]]++;let a=e.length,r=0;for(let i=0;i<256;i++)r+=i*t[i];let o=0,n=0,l=0,c=0;for(let i=0;i<256;i++){if(n+=t[i],n===0)continue;let p=a-n;if(p===0)break;o+=i*t[i];let d=o/n,m=(r-o)/p,h=n*p*(d-m)*(d-m);h>l&&(l=h,c=i)}return c}function O(s,e){let{data:t,width:a,height:r}=s,o=new Uint8Array(t.length);for(let n=0;n<t.length;n++)o[n]=t[n]>e?255:0;return{data:o,width:a,height:r}}function D(s){let e=B(s);return O(s,e)}function E(s,e=11,t=2){let{data:a,width:r,height:o}=s,n=new Uint8Array(a.length),l=Math.floor(e/2),c=new Uint32Array((r+1)*(o+1));for(let i=0;i<o;i++){let p=0;for(let d=0;d<r;d++){p+=a[i*r+d];let m=(i+1)*(r+1)+(d+1);c[m]=p+c[m-(r+1)]}}for(let i=0;i<o;i++)for(let p=0;p<r;p++){let d=Math.max(0,p-l),m=Math.max(0,i-l),h=Math.min(r-1,p+l),x=Math.min(o-1,i+l),ae=(h-d+1)*(x-m+1),re=(c[(x+1)*(r+1)+(h+1)]-c[m*(r+1)+(h+1)]-c[(x+1)*(r+1)+d]+c[m*(r+1)+d])/ae,W=i*r+p;n[W]=a[W]>re-t?255:0}return{data:n,width:r,height:o}}function P(s){let{data:e,width:t,height:a}=s,r=new Uint8Array(e.length);for(let o=0;o<e.length;o++)r[o]=255-e[o];return{data:r,width:t,height:a}}function G(s,e){let{data:t,width:a,height:r}=s,o=new Uint8Array(t.length);for(let n=1;n<r-1;n++)for(let l=1;l<a-1;l++){let c=0,i=0;for(let p=-1;p<=1;p++)for(let d=-1;d<=1;d++){let m=(n+p)*a+(l+d);c+=t[m]*e[i++]}o[n*a+l]=Math.max(0,Math.min(255,Math.round(c)))}for(let n=0;n<a;n++)o[n]=t[n],o[(r-1)*a+n]=t[(r-1)*a+n];for(let n=0;n<r;n++)o[n*a]=t[n*a],o[n*a+a-1]=t[n*a+a-1];return{data:o,width:a,height:r}}function I(s){return G(s,[0,-1,0,-1,5,-1,0,-1,0])}function $(s){return G(s,[0,-.5,0,-.5,3,-.5,0,-.5,0])}function M(s){return G(s,[.0625,.125,.0625,.125,.25,.125,.0625,.125,.0625])}function q(s){return G(s,[.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111])}function V(s){let{data:e,width:t,height:a}=s,r=new Uint8Array(e.length),o=new Uint8Array(9);for(let n=1;n<a-1;n++)for(let l=1;l<t-1;l++){let c=0;for(let i=-1;i<=1;i++)for(let p=-1;p<=1;p++)o[c++]=e[(n+i)*t+(l+p)];o.sort(),r[n*t+l]=o[4]}for(let n=0;n<t;n++)r[n]=e[n],r[(a-1)*t+n]=e[(a-1)*t+n];for(let n=0;n<a;n++)r[n*t]=e[n*t],r[n*t+t-1]=e[n*t+t-1];return{data:r,width:t,height:a}}function N(s){let{data:e,width:t,height:a}=s,r=255,o=0;for(let c=0;c<e.length;c++)e[c]<r&&(r=e[c]),e[c]>o&&(o=e[c]);if(o===r)return{data:new Uint8Array(e),width:t,height:a};let n=new Uint8Array(e.length),l=255/(o-r);for(let c=0;c<e.length;c++)n[c]=Math.round((e[c]-r)*l);return{data:n,width:t,height:a}}function ee(s,e={}){let{binarize:t="none",sharpen:a=!1,denoise:r=!1,invert:o=!1}=e,n=S(s);return r&&(n=M(n)),a&&(n=I(n)),t==="otsu"?n=D(n):t==="adaptive"&&(n=E(n)),o&&(n=P(n)),n}function te(s){let{data:e,width:t,height:a}=s,r=new Uint8ClampedArray(t*a*4);for(let o=0;o<e.length;o++){let n=o*4,l=e[o];r[n]=l,r[n+1]=l,r[n+2]=l,r[n+3]=255}return r}return le(xe);})();
