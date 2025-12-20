var _={DataMatrix:"DataMatrix",QRCode:"QRCode"},u=class{constructor(){this.name="scanner-wasm";this.supportedFormats=["DataMatrix","QRCode"];this.module=null;this.ready=false;this.loading=null;}async init(){if(!this.ready){if(this.loading)return this.loading;this.loading=this.loadModule(),await this.loading;}}async loadModule(){await this.loadScript("/wasm/scanner.js");let e=window.createScanner;this.module=await e({locateFile:t=>t.endsWith(".wasm")?"/wasm/scanner.wasm":t}),this.ready=true;}loadScript(e){return new Promise((t,a)=>{if(window.createScanner){t();return}let r=document.createElement("script");r.src=e,r.onload=()=>t(),r.onerror=a,document.head.appendChild(r);})}isReady(){return this.ready}async decode(e,t){if(!this.ready||!this.module)return [];try{let{data:a,width:r,height:s}=e,n=this.module._malloc(a.length);this.module.HEAPU8.set(a,n);let l=this.module.scan(n,r,s);this.module._free(n);let c=[],i=l.size();for(let p=0;p<i;p++){let d=l.get(p),m=_[d.format];m&&t.includes(m)&&c.push({data:d.text,format:m,points:[{x:d.x0,y:d.y0},{x:d.x1,y:d.y1},{x:d.x2,y:d.y2},{x:d.x3,y:d.y3}]});}return c}catch{return []}}destroy(){this.module=null,this.ready=false,this.loading=null;}};var x=class{constructor(){this.initialized=false;this.decoder=new u;}async init(e){this.initialized||(await this.decoder.init(),this.initialized=true);}async decode(e,t){if(!this.initialized)throw new Error("Decoder not initialized");let a=await this.decoder.decode(e,t),r=Date.now();return a.map(s=>({...s,timestamp:r}))}getSupportedFormats(){return this.decoder.supportedFormats}isReady(){return this.initialized&&this.decoder.isReady()}destroy(){this.decoder.destroy(),this.initialized=false;}};async function F(o,e={}){let{facingMode:t="environment",resolution:a={width:1280,height:720}}=e,r={video:{facingMode:t,width:{ideal:a.width},height:{ideal:a.height}},audio:false};try{let s=await navigator.mediaDevices.getUserMedia(r);o.srcObject=s,await new Promise((p,d)=>{o.onloadedmetadata=()=>{o.play().then(p).catch(d);},o.onerror=()=>d(new Error("Video element error"));});let n=o.videoWidth,l=o.videoHeight,c=document.createElement("canvas");c.width=n,c.height=l;let i=c.getContext("2d",{willReadFrequently:!0});if(!i)throw new Error("Could not get canvas context");return {video:o,stream:s,canvas:c,ctx:i,width:n,height:l}}catch(s){throw new Error(`Camera access denied: ${s}`)}}function L(o){let{stream:e,video:t}=o;for(let a of e.getTracks())a.stop();t.srcObject=null;}function H(o){let{video:e,canvas:t,ctx:a,width:r,height:s}=o;return a.drawImage(e,0,0,r,s),a.getImageData(0,0,r,s)}function R(){return !!(navigator.mediaDevices&&typeof navigator.mediaDevices.getUserMedia=="function")}async function J(){return (await navigator.mediaDevices.enumerateDevices()).filter(e=>e.kind==="videoinput")}var v=class v{constructor(e={}){this.camera=null;this.scanning=false;this.animationFrame=null;this.lastScanTime=0;this.scanHandlers=new Set;this.errorHandlers=new Set;this.startHandlers=new Set;this.stopHandlers=new Set;this.options={...v.defaultOptions,...e,preprocessing:{...v.defaultOptions.preprocessing,...e.preprocessing},camera:{...v.defaultOptions.camera,...e.camera}},this.decoder=new x;}async init(){await this.decoder.init(this.options.formats);}on(e,t){switch(e){case "scan":this.scanHandlers.add(t);break;case "error":this.errorHandlers.add(t);break;case "start":this.startHandlers.add(t);break;case "stop":this.stopHandlers.add(t);break}}off(e,t){switch(e){case "scan":this.scanHandlers.delete(t);break;case "error":this.errorHandlers.delete(t);break;case "start":this.startHandlers.delete(t);break;case "stop":this.stopHandlers.delete(t);break}}emit(e,t){try{switch(e){case "scan":for(let a of this.scanHandlers)a(t);break;case "error":for(let a of this.errorHandlers)a(t);break;case "start":for(let a of this.startHandlers)a();break;case "stop":for(let a of this.stopHandlers)a();break}}catch(a){console.error(`Error in ${e} handler:`,a);}}async start(e){if(!this.scanning){if(!R())throw new Error("Camera not supported in this browser");this.decoder.isReady()||await this.init(),this.camera=await F(e,this.options.camera),this.scanning=true,this.emit("start"),this.scanLoop();}}stop(){this.scanning&&(this.scanning=false,this.animationFrame!==null&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=null),this.camera&&(L(this.camera),this.camera=null),this.emit("stop"));}scanLoop(){if(!this.scanning||!this.camera)return;let e=Date.now(),t=1e3/(this.options.camera.scanRate||10);if(e-this.lastScanTime>=t){this.lastScanTime=e;let a=H(this.camera);this.processFrame(a).catch(r=>{this.emit("error",r);});}this.animationFrame=requestAnimationFrame(()=>this.scanLoop());}async processFrame(e){let t=await this.decoder.decode(e,this.options.formats);for(let a of t)this.emit("scan",a);}async scanImage(e){this.decoder.isReady()||await this.init();let t=document.createElement("canvas");t.width=e.naturalWidth,t.height=e.naturalHeight;let a=t.getContext("2d");if(!a)throw new Error("Could not get canvas context");a.drawImage(e,0,0);let r=a.getImageData(0,0,t.width,t.height);return this.scanImageData(r)}async scanImageData(e){return this.decoder.isReady()||await this.init(),this.decoder.decode(e,this.options.formats)}async scanCanvas(e){let t=e.getContext("2d");if(!t)throw new Error("Could not get canvas context");let a=t.getImageData(0,0,e.width,e.height);return this.scanImageData(a)}isScanning(){return this.scanning}getSupportedFormats(){return this.decoder.getSupportedFormats()}setOptions(e){e.preprocessing&&(this.options.preprocessing={...this.options.preprocessing,...e.preprocessing}),e.camera&&(this.options.camera={...this.options.camera,...e.camera}),e.formats&&(this.options.formats=e.formats);}destroy(){this.stop(),this.decoder.destroy(),this.scanHandlers.clear(),this.errorHandlers.clear(),this.startHandlers.clear(),this.stopHandlers.clear();}};v.defaultOptions={formats:["QRCode","DataMatrix"],preprocessing:{binarize:"none",sharpen:false,denoise:false,invert:false},camera:{facingMode:"environment",resolution:{width:1280,height:720},scanRate:10}};var f=v;var w=null,b=null,Q="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",K="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";async function Y(){if(!w)return b||(b=new Promise((o,e)=>{let t=document.createElement("script");t.src=Q,t.onload=()=>{let a=window.pdfjsLib;a?(a.GlobalWorkerOptions.workerSrc=K,w=a,o()):e(new Error("PDF.js failed to load"));},t.onerror=()=>e(new Error("Failed to load PDF.js")),document.head.appendChild(t);}),b)}async function T(o,e={}){let{scale:t=2,maxPages:a=10,onProgress:r}=e;if(await Y(),!w)throw new Error("PDF.js not loaded");let s=o instanceof File?await o.arrayBuffer():o,n=await w.getDocument({data:s}).promise,l=Math.min(n.numPages,a),c=[],i=document.createElement("canvas"),p=i.getContext("2d");try{for(let d=1;d<=l;d++){r?.(d,l);let m=await n.getPage(d),h=m.getViewport({scale:t});i.width=h.width,i.height=h.height,p.fillStyle="#ffffff",p.fillRect(0,0,i.width,i.height),await m.render({canvasContext:p,viewport:h}).promise;let y=p.getImageData(0,0,i.width,i.height);c.push({pageNumber:d,imageData:y,width:i.width,height:i.height});}}finally{n.destroy();}return c}function B(o){return o.type==="application/pdf"||o.name.toLowerCase().endsWith(".pdf")}function X(){return w!==null}var ee=`
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
`,te=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
  <line x1="7" y1="12" x2="17" y2="12"/>
</svg>`,ae=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
  <circle cx="12" cy="13" r="4"/>
</svg>`,re=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="17 8 12 3 7 8"/>
  <line x1="12" y1="3" x2="12" y2="15"/>
</svg>`,ne=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
</svg>`,S=class{constructor(e={}){this.scanner=null;this.overlay=null;this.video=null;this.stream=null;this.stylesInjected=false;this.results=[];this.mode="camera";this.fileInput=null;this.options={formats:e.formats||["DataMatrix","QRCode"],title:e.title||"Barcode scannen",buttonText:e.buttonText||"Scanner \xF6ffnen",closeOnScan:e.closeOnScan??false,onScan:e.onScan||(()=>{}),onMultiScan:e.onMultiScan||(()=>{}),onError:e.onError||(()=>{}),onClose:e.onClose||(()=>{})};}createButton(e){let t=document.createElement("button");return t.className="ps-btn",t.innerHTML=`${te} ${this.options.buttonText}`,t.onclick=()=>this.open(),e&&e.appendChild(t),t}async open(){this.results=[],this.injectStyles(),this.createModal(),await this.startScanner();}close(){this.stopScanner(),this.overlay&&(this.overlay.remove(),this.overlay=null),this.results.length>0&&this.options.onMultiScan(this.results),this.options.onClose();}destroy(){this.close(),this.scanner?.destroy(),this.scanner=null;}getResults(){return [...this.results]}injectStyles(){if(this.stylesInjected)return;let e=document.createElement("style");e.id="prescription-scanner-styles",e.textContent=ee,document.head.appendChild(e),this.stylesInjected=true;}createModal(){this.overlay=document.createElement("div"),this.overlay.className="ps-overlay",this.overlay.onclick=r=>{r.target===this.overlay&&this.close();},this.overlay.innerHTML=`
      <div class="ps-modal">
        <div class="ps-header">
          <h2 class="ps-title">${this.options.title}</h2>
          <button class="ps-close" aria-label="Schlie\xDFen">&times;</button>
        </div>
        <div class="ps-content">
          <div class="ps-tabs">
            <button class="ps-tab active" data-mode="camera">
              ${ae} Kamera
            </button>
            <button class="ps-tab" data-mode="upload">
              ${ne} Datei/PDF
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
              ${re}
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
    `,this.overlay.querySelector(".ps-close").addEventListener("click",()=>this.close()),this.overlay.querySelector(".ps-cancel").addEventListener("click",()=>this.close()),this.overlay.querySelectorAll(".ps-tab").forEach(r=>{r.addEventListener("click",()=>{let s=r.getAttribute("data-mode");this.switchMode(s);});});let t=this.overlay.querySelector(".ps-upload-zone");this.setupUploadZone(t);let a=r=>{r.key==="Escape"&&(this.close(),document.removeEventListener("keydown",a));};document.addEventListener("keydown",a),this.video=this.overlay.querySelector(".ps-video"),document.body.appendChild(this.overlay),document.body.style.overflow="hidden";}setupUploadZone(e){this.fileInput=document.createElement("input"),this.fileInput.type="file",this.fileInput.accept="image/*,application/pdf",this.fileInput.style.display="none",this.fileInput.addEventListener("change",()=>{let t=this.fileInput?.files?.[0];t&&this.processFile(t);}),e.appendChild(this.fileInput),e.addEventListener("click",()=>{this.fileInput?.click();}),e.addEventListener("dragover",t=>{t.preventDefault(),e.classList.add("dragover");}),e.addEventListener("dragleave",()=>{e.classList.remove("dragover");}),e.addEventListener("drop",t=>{t.preventDefault(),e.classList.remove("dragover");let a=t.dataTransfer?.files[0];a&&this.processFile(a);});}switchMode(e){if(!this.overlay)return;this.mode=e,this.overlay.querySelectorAll(".ps-tab").forEach(s=>{s.classList.toggle("active",s.getAttribute("data-mode")===e);});let a=this.overlay.querySelector(".ps-camera-view"),r=this.overlay.querySelector(".ps-upload-view");e==="camera"?(a.classList.remove("ps-hidden"),r.classList.add("ps-hidden"),this.scanner?.isScanning()||this.startScanner()):(a.classList.add("ps-hidden"),r.classList.remove("ps-hidden"),this.stopScanner());}async processFile(e){if(!this.overlay)return;let t=this.overlay.querySelector(".ps-upload-zone"),a=t.innerHTML;t.innerHTML=`
      <div class="ps-spinner"></div>
      <span class="ps-loading-text">Verarbeite ${e.name}...</span>
    `;try{this.scanner||(this.scanner=new f({formats:this.options.formats}),await this.scanner.init());let r=[];if(B(e)){let n=await T(e,{scale:2,onProgress:(l,c)=>{let i=t.querySelector(".ps-loading-text");i&&(i.textContent=`Seite ${l}/${c}...`);}});for(let l of n){let c=await this.scanner.scanImageData(l.imageData);r.push(...c);}}else {let n=await this.loadImage(e);r=await this.scanner.scanImageData(n);}let s=this.deduplicateResults(r);if(s.length>0){for(let n of s)this.addResult(n);t.innerHTML=`
          <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="width:48px;height:48px">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span class="ps-loading-text" style="color:#22c55e">${s.length} Code${s.length>1?"s":""} gefunden!</span>
        `;}else t.innerHTML=`
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="width:48px;height:48px">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span class="ps-loading-text" style="color:#ef4444">Kein Barcode gefunden</span>
        `;setTimeout(()=>{t&&this.overlay&&(t.innerHTML=a,this.setupUploadZone(t));},2500);}catch(r){t.innerHTML=`
        <span class="ps-loading-text" style="color:#ef4444">
          Fehler: ${r instanceof Error?r.message:"Unbekannt"}
        </span>
      `,this.options.onError(r instanceof Error?r:new Error(String(r))),setTimeout(()=>{t&&this.overlay&&(t.innerHTML=a,this.setupUploadZone(t));},3e3);}}async loadImage(e){return new Promise((t,a)=>{let r=new Image;r.onload=()=>{let s=document.createElement("canvas");s.width=r.naturalWidth,s.height=r.naturalHeight;let n=s.getContext("2d");n.drawImage(r,0,0),t(n.getImageData(0,0,s.width,s.height));},r.onerror=()=>a(new Error("Bild konnte nicht geladen werden")),r.src=URL.createObjectURL(e);})}deduplicateResults(e){let t=new Set;return e.filter(a=>{let r=`${a.format}:${a.data}`;return t.has(r)?false:(t.add(r),true)})}async startScanner(){if(!this.overlay||!this.video)return;let e=this.overlay.querySelector(".ps-loading"),t=this.overlay.querySelector(".ps-video-container");try{if(this.scanner=new f({formats:this.options.formats}),await this.scanner.init(),this.scanner.on("scan",a=>{this.addResult(a),this.options.closeOnScan&&setTimeout(()=>this.close(),1e3);}),this.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}}),this.video.srcObject=this.stream,await this.video.play(),await this.scanner.start(this.video),e.style.display="none",!t.querySelector(".ps-scan-line")){let a=document.createElement("div");a.className="ps-scan-line",t.appendChild(a);}}catch(a){e.innerHTML=`
        <span class="ps-loading-text" style="color: #ef4444;">
          Fehler: ${a instanceof Error?a.message:"Unbekannt"}
        </span>
      `,this.options.onError(a instanceof Error?a:new Error(String(a)));}}stopScanner(){this.scanner?.stop(),this.stream&&(this.stream.getTracks().forEach(e=>e.stop()),this.stream=null),this.overlay&&this.overlay.querySelector(".ps-scan-line")?.remove(),document.body.style.overflow="";}addResult(e){this.results.some(a=>a.data===e.data&&a.format===e.format)||(this.results.push(e),this.options.onScan(e),this.updateResultsUI());}updateResultsUI(){if(!this.overlay)return;let e=this.overlay.querySelector(".ps-results");e&&(e.innerHTML=`
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
    `);}escapeHtml(e){let t=document.createElement("div");return t.textContent=e,t.innerHTML}};function se(o={}){let e=new S(o);return e.open(),e}var g=null;async function O(){return g||(g=new f({formats:["DataMatrix","QRCode"]}),await g.init()),g}async function oe(o){let e=await O(),t;return o instanceof HTMLImageElement?t=await e.scanImage(o):o instanceof HTMLCanvasElement?t=await e.scanCanvas(o):t=await e.scanImageData(o),t[0]||null}async function ie(o){let e=await O();return o instanceof HTMLImageElement?e.scanImage(o):o instanceof HTMLCanvasElement?e.scanCanvas(o):e.scanImageData(o)}async function U(o,e,t){let a=await O();return a.on("scan",e),t?.onError&&a.on("error",t.onError),await a.start(o),()=>{a.stop(),a.off("scan",e),t?.onError&&a.off("error",t.onError);}}async function ce(o,e){let t=document.createElement("video");t.setAttribute("playsinline",""),t.setAttribute("muted",""),t.style.width="100%",t.style.height="auto",e?.container&&e.container.appendChild(t);let a=await U(t,o,e);return {video:t,stop:()=>{a(),e?.container&&t.parentNode===e.container&&e.container.removeChild(t);}}}function le(){g&&(g.destroy(),g=null);}function D(o){let{data:e,width:t,height:a}=o,r=new Uint8Array(t*a);for(let s=0;s<r.length;s++){let n=s*4,l=e[n],c=e[n+1],i=e[n+2];r[s]=l*77+c*150+i*29>>8;}return {data:r,width:t,height:a}}function j(o){let{data:e,width:t,height:a}=o,r=new ImageData(t,a);for(let s=0;s<e.length;s++){let n=s*4,l=e[s];r.data[n]=l,r.data[n+1]=l,r.data[n+2]=l,r.data[n+3]=255;}return r}function G(o){let{data:e}=o,t=new Uint32Array(256);for(let i=0;i<e.length;i++)t[e[i]]++;let a=e.length,r=0;for(let i=0;i<256;i++)r+=i*t[i];let s=0,n=0,l=0,c=0;for(let i=0;i<256;i++){if(n+=t[i],n===0)continue;let p=a-n;if(p===0)break;s+=i*t[i];let d=s/n,m=(r-s)/p,h=n*p*(d-m)*(d-m);h>l&&(l=h,c=i);}return c}function A(o,e){let{data:t,width:a,height:r}=o,s=new Uint8Array(t.length);for(let n=0;n<t.length;n++)s[n]=t[n]>e?255:0;return {data:s,width:a,height:r}}function E(o){let e=G(o);return A(o,e)}function P(o,e=11,t=2){let{data:a,width:r,height:s}=o,n=new Uint8Array(a.length),l=Math.floor(e/2),c=new Uint32Array((r+1)*(s+1));for(let i=0;i<s;i++){let p=0;for(let d=0;d<r;d++){p+=a[i*r+d];let m=(i+1)*(r+1)+(d+1);c[m]=p+c[m-(r+1)];}}for(let i=0;i<s;i++)for(let p=0;p<r;p++){let d=Math.max(0,p-l),m=Math.max(0,i-l),h=Math.min(r-1,p+l),y=Math.min(s-1,i+l),W=(h-d+1)*(y-m+1),Z=(c[(y+1)*(r+1)+(h+1)]-c[m*(r+1)+(h+1)]-c[(y+1)*(r+1)+d]+c[m*(r+1)+d])/W,z=i*r+p;n[z]=a[z]>Z-t?255:0;}return {data:n,width:r,height:s}}function I(o){let{data:e,width:t,height:a}=o,r=new Uint8Array(e.length);for(let s=0;s<e.length;s++)r[s]=255-e[s];return {data:r,width:t,height:a}}function M(o,e){let{data:t,width:a,height:r}=o,s=new Uint8Array(t.length);for(let n=1;n<r-1;n++)for(let l=1;l<a-1;l++){let c=0,i=0;for(let p=-1;p<=1;p++)for(let d=-1;d<=1;d++){let m=(n+p)*a+(l+d);c+=t[m]*e[i++];}s[n*a+l]=Math.max(0,Math.min(255,Math.round(c)));}for(let n=0;n<a;n++)s[n]=t[n],s[(r-1)*a+n]=t[(r-1)*a+n];for(let n=0;n<r;n++)s[n*a]=t[n*a],s[n*a+a-1]=t[n*a+a-1];return {data:s,width:a,height:r}}function C(o){return M(o,[0,-1,0,-1,5,-1,0,-1,0])}function $(o){return M(o,[0,-0.5,0,-0.5,3,-0.5,0,-0.5,0])}function k(o){return M(o,[.0625,.125,.0625,.125,.25,.125,.0625,.125,.0625])}function q(o){return M(o,[.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111])}function V(o){let{data:e,width:t,height:a}=o,r=new Uint8Array(e.length),s=new Uint8Array(9);for(let n=1;n<a-1;n++)for(let l=1;l<t-1;l++){let c=0;for(let i=-1;i<=1;i++)for(let p=-1;p<=1;p++)s[c++]=e[(n+i)*t+(l+p)];s.sort(),r[n*t+l]=s[4];}for(let n=0;n<t;n++)r[n]=e[n],r[(a-1)*t+n]=e[(a-1)*t+n];for(let n=0;n<a;n++)r[n*t]=e[n*t],r[n*t+t-1]=e[n*t+t-1];return {data:r,width:t,height:a}}function N(o){let{data:e,width:t,height:a}=o,r=255,s=0;for(let c=0;c<e.length;c++)e[c]<r&&(r=e[c]),e[c]>s&&(s=e[c]);if(s===r)return {data:new Uint8Array(e),width:t,height:a};let n=new Uint8Array(e.length),l=255/(s-r);for(let c=0;c<e.length;c++)n[c]=Math.round((e[c]-r)*l);return {data:n,width:t,height:a}}function de(o,e={}){let{binarize:t="none",sharpen:a=false,denoise:r=false,invert:s=false}=e,n=D(o);return r&&(n=k(n)),a&&(n=C(n)),t==="otsu"?n=E(n):t==="adaptive"&&(n=P(n)),s&&(n=I(n)),n}function pe(o){let{data:e,width:t,height:a}=o,r=new Uint8ClampedArray(t*a*4);for(let s=0;s<e.length;s++){let n=s*4,l=e[s];r[n]=l,r[n+1]=l,r[n+2]=l,r[n+3]=255;}return r}export{x as CombinedDecoder,u as DataMatrixDecoder,S as PrescriptionScanner,f as SuperScanner,u as ZBarDecoder,P as adaptiveThreshold,A as binarize,E as binarizeOtsu,q as boxBlur,le as cleanup,k as gaussianBlur,J as getAvailableCameras,H as grabFrame,pe as grayscaleToRGBA,I as invert,R as isCameraSupported,B as isPDF,X as isPdfJsLoaded,V as medianFilter,se as openScanner,G as otsuThreshold,de as preprocess,T as processPDF,oe as scan,ie as scanAll,U as scanVideo,C as sharpen,$ as sharpenLight,F as startCamera,ce as startScanner,L as stopCamera,N as stretchContrast,D as toGrayscale,j as toImageData};