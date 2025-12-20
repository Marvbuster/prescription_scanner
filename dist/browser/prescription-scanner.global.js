"use strict";var PrescriptionScanner=(()=>{var L=Object.defineProperty;var X=Object.getOwnPropertyDescriptor;var ee=Object.getOwnPropertyNames;var te=Object.prototype.hasOwnProperty;var re=(o,e)=>{for(var t in e)L(o,t,{get:e[t],enumerable:!0})},ae=(o,e,t,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let a of ee(e))!te.call(o,a)&&a!==t&&L(o,a,{get:()=>e[a],enumerable:!(r=X(e,a))||r.enumerable});return o};var ne=o=>ae(L({},"__esModule",{value:!0}),o);var ce={};re(ce,{CombinedDecoder:()=>v,DataMatrixDecoder:()=>h,PrescriptionScanner:()=>x,SuperScanner:()=>u,ZBarDecoder:()=>h,adaptiveThreshold:()=>S,binarize:()=>T,binarizeOtsu:()=>b,boxBlur:()=>z,cleanup:()=>Z,gaussianBlur:()=>I,getAvailableCameras:()=>q,grabFrame:()=>k,grayscaleToRGBA:()=>K,invert:()=>E,isCameraSupported:()=>H,medianFilter:()=>U,openScanner:()=>N,otsuThreshold:()=>R,preprocess:()=>_,scan:()=>W,scanAll:()=>$,scanVideo:()=>G,sharpen:()=>C,sharpenLight:()=>A,startCamera:()=>M,startScanner:()=>Q,stopCamera:()=>D,stretchContrast:()=>j,toGrayscale:()=>w,toImageData:()=>P});var oe={DataMatrix:"DataMatrix",QRCode:"QRCode"},h=class{constructor(){this.name="scanner-wasm";this.supportedFormats=["DataMatrix","QRCode"];this.module=null;this.ready=!1;this.loading=null}async init(){if(!this.ready){if(this.loading)return this.loading;this.loading=this.loadModule(),await this.loading}}async loadModule(){await this.loadScript("/wasm/scanner.js");let e=window.createScanner;this.module=await e({locateFile:t=>t.endsWith(".wasm")?"/wasm/scanner.wasm":t}),this.ready=!0}loadScript(e){return new Promise((t,r)=>{if(window.createScanner){t();return}let a=document.createElement("script");a.src=e,a.onload=()=>t(),a.onerror=r,document.head.appendChild(a)})}isReady(){return this.ready}async decode(e,t){if(!this.ready||!this.module)return[];try{let{data:r,width:a,height:s}=e,n=this.module._malloc(r.length);this.module.HEAPU8.set(r,n);let d=this.module.scan(n,a,s);this.module._free(n);let c=[],i=d.size();for(let m=0;m<i;m++){let l=d.get(m),p=oe[l.format];p&&t.includes(p)&&c.push({data:l.text,format:p,points:[{x:l.x0,y:l.y0},{x:l.x1,y:l.y1},{x:l.x2,y:l.y2},{x:l.x3,y:l.y3}]})}return c}catch{return[]}}destroy(){this.module=null,this.ready=!1,this.loading=null}};var v=class{constructor(){this.initialized=!1;this.decoder=new h}async init(e){this.initialized||(await this.decoder.init(),this.initialized=!0)}async decode(e,t){if(!this.initialized)throw new Error("Decoder not initialized");let r=await this.decoder.decode(e,t),a=Date.now();return r.map(s=>({...s,timestamp:a}))}getSupportedFormats(){return this.decoder.supportedFormats}isReady(){return this.initialized&&this.decoder.isReady()}destroy(){this.decoder.destroy(),this.initialized=!1}};async function M(o,e={}){let{facingMode:t="environment",resolution:r={width:1280,height:720}}=e,a={video:{facingMode:t,width:{ideal:r.width},height:{ideal:r.height}},audio:!1};try{let s=await navigator.mediaDevices.getUserMedia(a);o.srcObject=s,await new Promise((m,l)=>{o.onloadedmetadata=()=>{o.play().then(m).catch(l)},o.onerror=()=>l(new Error("Video element error"))});let n=o.videoWidth,d=o.videoHeight,c=document.createElement("canvas");c.width=n,c.height=d;let i=c.getContext("2d",{willReadFrequently:!0});if(!i)throw new Error("Could not get canvas context");return{video:o,stream:s,canvas:c,ctx:i,width:n,height:d}}catch(s){throw new Error(`Camera access denied: ${s}`)}}function D(o){let{stream:e,video:t}=o;for(let r of e.getTracks())r.stop();t.srcObject=null}function k(o){let{video:e,canvas:t,ctx:r,width:a,height:s}=o;return r.drawImage(e,0,0,a,s),r.getImageData(0,0,a,s)}function H(){return!!(navigator.mediaDevices&&typeof navigator.mediaDevices.getUserMedia=="function")}async function q(){return(await navigator.mediaDevices.enumerateDevices()).filter(e=>e.kind==="videoinput")}var y=class y{constructor(e={}){this.camera=null;this.scanning=!1;this.animationFrame=null;this.lastScanTime=0;this.scanHandlers=new Set;this.errorHandlers=new Set;this.startHandlers=new Set;this.stopHandlers=new Set;this.options={...y.defaultOptions,...e,preprocessing:{...y.defaultOptions.preprocessing,...e.preprocessing},camera:{...y.defaultOptions.camera,...e.camera}},this.decoder=new v}async init(){await this.decoder.init(this.options.formats)}on(e,t){switch(e){case"scan":this.scanHandlers.add(t);break;case"error":this.errorHandlers.add(t);break;case"start":this.startHandlers.add(t);break;case"stop":this.stopHandlers.add(t);break}}off(e,t){switch(e){case"scan":this.scanHandlers.delete(t);break;case"error":this.errorHandlers.delete(t);break;case"start":this.startHandlers.delete(t);break;case"stop":this.stopHandlers.delete(t);break}}emit(e,t){try{switch(e){case"scan":for(let r of this.scanHandlers)r(t);break;case"error":for(let r of this.errorHandlers)r(t);break;case"start":for(let r of this.startHandlers)r();break;case"stop":for(let r of this.stopHandlers)r();break}}catch(r){console.error(`Error in ${e} handler:`,r)}}async start(e){if(!this.scanning){if(!H())throw new Error("Camera not supported in this browser");this.decoder.isReady()||await this.init(),this.camera=await M(e,this.options.camera),this.scanning=!0,this.emit("start"),this.scanLoop()}}stop(){this.scanning&&(this.scanning=!1,this.animationFrame!==null&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=null),this.camera&&(D(this.camera),this.camera=null),this.emit("stop"))}scanLoop(){if(!this.scanning||!this.camera)return;let e=Date.now(),t=1e3/(this.options.camera.scanRate||10);if(e-this.lastScanTime>=t){this.lastScanTime=e;let r=k(this.camera);this.processFrame(r).catch(a=>{this.emit("error",a)})}this.animationFrame=requestAnimationFrame(()=>this.scanLoop())}async processFrame(e){let t=await this.decoder.decode(e,this.options.formats);for(let r of t)this.emit("scan",r)}async scanImage(e){this.decoder.isReady()||await this.init();let t=document.createElement("canvas");t.width=e.naturalWidth,t.height=e.naturalHeight;let r=t.getContext("2d");if(!r)throw new Error("Could not get canvas context");r.drawImage(e,0,0);let a=r.getImageData(0,0,t.width,t.height);return this.scanImageData(a)}async scanImageData(e){return this.decoder.isReady()||await this.init(),this.decoder.decode(e,this.options.formats)}async scanCanvas(e){let t=e.getContext("2d");if(!t)throw new Error("Could not get canvas context");let r=t.getImageData(0,0,e.width,e.height);return this.scanImageData(r)}isScanning(){return this.scanning}getSupportedFormats(){return this.decoder.getSupportedFormats()}setOptions(e){e.preprocessing&&(this.options.preprocessing={...this.options.preprocessing,...e.preprocessing}),e.camera&&(this.options.camera={...this.options.camera,...e.camera}),e.formats&&(this.options.formats=e.formats)}destroy(){this.stop(),this.decoder.destroy(),this.scanHandlers.clear(),this.errorHandlers.clear(),this.startHandlers.clear(),this.stopHandlers.clear()}};y.defaultOptions={formats:["QRCode","DataMatrix"],preprocessing:{binarize:"none",sharpen:!1,denoise:!1,invert:!1},camera:{facingMode:"environment",resolution:{width:1280,height:720},scanRate:10}};var u=y;var se=`
.ps-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
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
  max-width: 480px;
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
.ps-result {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: rgba(34,197,94,0.9);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
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
.ps-btn svg {
  width: 20px;
  height: 20px;
}
@keyframes ps-spin {
  to { transform: rotate(360deg); }
}
@keyframes ps-scan {
  0%, 100% { top: 10%; opacity: 1; }
  50% { top: 80%; opacity: 0.5; }
}
`,ie=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
  <line x1="7" y1="12" x2="17" y2="12"/>
</svg>`,x=class{constructor(e={}){this.scanner=null;this.overlay=null;this.video=null;this.stream=null;this.stylesInjected=!1;this.options={formats:e.formats||["DataMatrix","QRCode"],title:e.title||"Barcode scannen",buttonText:e.buttonText||"Scanner \xF6ffnen",closeOnScan:e.closeOnScan??!1,onScan:e.onScan||(()=>{}),onError:e.onError||console.error,onClose:e.onClose||(()=>{})}}createButton(e){let t=document.createElement("button");return t.className="ps-btn",t.innerHTML=`${ie} ${this.options.buttonText}`,t.onclick=()=>this.open(),e&&e.appendChild(t),t}async open(){this.injectStyles(),this.createModal(),await this.startScanner()}close(){this.stopScanner(),this.overlay&&(this.overlay.remove(),this.overlay=null),this.options.onClose()}destroy(){this.close(),this.scanner?.destroy(),this.scanner=null}injectStyles(){if(this.stylesInjected)return;let e=document.createElement("style");e.id="prescription-scanner-styles",e.textContent=se,document.head.appendChild(e),this.stylesInjected=!0}createModal(){this.overlay=document.createElement("div"),this.overlay.className="ps-overlay",this.overlay.onclick=t=>{t.target===this.overlay&&this.close()},this.overlay.innerHTML=`
      <div class="ps-modal">
        <div class="ps-header">
          <h2 class="ps-title">${this.options.title}</h2>
          <button class="ps-close" aria-label="Schlie\xDFen">&times;</button>
        </div>
        <div class="ps-content">
          <div class="ps-video-container">
            <video class="ps-video" playsinline muted></video>
            <div class="ps-loading">
              <div class="ps-spinner"></div>
              <span class="ps-loading-text">Scanner wird geladen...</span>
            </div>
          </div>
        </div>
        <div class="ps-footer">
          <button class="ps-cancel">Abbrechen</button>
        </div>
      </div>
    `,this.overlay.querySelector(".ps-close").addEventListener("click",()=>this.close()),this.overlay.querySelector(".ps-cancel").addEventListener("click",()=>this.close());let e=t=>{t.key==="Escape"&&(this.close(),document.removeEventListener("keydown",e))};document.addEventListener("keydown",e),this.video=this.overlay.querySelector(".ps-video"),document.body.appendChild(this.overlay),document.body.style.overflow="hidden"}async startScanner(){if(!this.overlay||!this.video)return;let e=this.overlay.querySelector(".ps-loading"),t=this.overlay.querySelector(".ps-video-container");try{this.scanner=new u({formats:this.options.formats}),await this.scanner.init(),this.scanner.on("scan",a=>{this.showResult(a),this.options.onScan(a),this.options.closeOnScan&&setTimeout(()=>this.close(),1e3)}),this.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}}),this.video.srcObject=this.stream,await this.video.play(),await this.scanner.start(this.video),e.style.display="none";let r=document.createElement("div");r.className="ps-scan-line",t.appendChild(r)}catch(r){e.innerHTML=`
        <span class="ps-loading-text" style="color: #ef4444;">
          Fehler: ${r instanceof Error?r.message:"Unbekannt"}
        </span>
      `,this.options.onError(r instanceof Error?r:new Error(String(r)))}}stopScanner(){this.scanner?.stop(),this.stream&&(this.stream.getTracks().forEach(e=>e.stop()),this.stream=null),document.body.style.overflow=""}showResult(e){if(!this.overlay)return;let t=this.overlay.querySelector(".ps-video-container");if(!t)return;t.querySelector(".ps-scan-line")?.remove();let r=document.createElement("div");r.className="ps-result",r.textContent=`\u2713 ${e.format}: ${e.data.substring(0,50)}${e.data.length>50?"...":""}`,t.appendChild(r),setTimeout(()=>{if(r.remove(),this.overlay&&!this.options.closeOnScan&&!t.querySelector(".ps-scan-line")){let a=document.createElement("div");a.className="ps-scan-line",t.appendChild(a)}},2e3)}};function N(o={}){let e=new x(o);return e.open(),e}var f=null;async function O(){return f||(f=new u({formats:["DataMatrix","QRCode"]}),await f.init()),f}async function W(o){let e=await O(),t;return o instanceof HTMLImageElement?t=await e.scanImage(o):o instanceof HTMLCanvasElement?t=await e.scanCanvas(o):t=await e.scanImageData(o),t[0]||null}async function $(o){let e=await O();return o instanceof HTMLImageElement?e.scanImage(o):o instanceof HTMLCanvasElement?e.scanCanvas(o):e.scanImageData(o)}async function G(o,e,t){let r=await O();return r.on("scan",e),t?.onError&&r.on("error",t.onError),await r.start(o),()=>{r.stop(),r.off("scan",e),t?.onError&&r.off("error",t.onError)}}async function Q(o,e){let t=document.createElement("video");t.setAttribute("playsinline",""),t.setAttribute("muted",""),t.style.width="100%",t.style.height="auto",e?.container&&e.container.appendChild(t);let r=await G(t,o,e);return{video:t,stop:()=>{r(),e?.container&&t.parentNode===e.container&&e.container.removeChild(t)}}}function Z(){f&&(f.destroy(),f=null)}function w(o){let{data:e,width:t,height:r}=o,a=new Uint8Array(t*r);for(let s=0;s<a.length;s++){let n=s*4,d=e[n],c=e[n+1],i=e[n+2];a[s]=d*77+c*150+i*29>>8}return{data:a,width:t,height:r}}function P(o){let{data:e,width:t,height:r}=o,a=new ImageData(t,r);for(let s=0;s<e.length;s++){let n=s*4,d=e[s];a.data[n]=d,a.data[n+1]=d,a.data[n+2]=d,a.data[n+3]=255}return a}function R(o){let{data:e}=o,t=new Uint32Array(256);for(let i=0;i<e.length;i++)t[e[i]]++;let r=e.length,a=0;for(let i=0;i<256;i++)a+=i*t[i];let s=0,n=0,d=0,c=0;for(let i=0;i<256;i++){if(n+=t[i],n===0)continue;let m=r-n;if(m===0)break;s+=i*t[i];let l=s/n,p=(a-s)/m,g=n*m*(l-p)*(l-p);g>d&&(d=g,c=i)}return c}function T(o,e){let{data:t,width:r,height:a}=o,s=new Uint8Array(t.length);for(let n=0;n<t.length;n++)s[n]=t[n]>e?255:0;return{data:s,width:r,height:a}}function b(o){let e=R(o);return T(o,e)}function S(o,e=11,t=2){let{data:r,width:a,height:s}=o,n=new Uint8Array(r.length),d=Math.floor(e/2),c=new Uint32Array((a+1)*(s+1));for(let i=0;i<s;i++){let m=0;for(let l=0;l<a;l++){m+=r[i*a+l];let p=(i+1)*(a+1)+(l+1);c[p]=m+c[p-(a+1)]}}for(let i=0;i<s;i++)for(let m=0;m<a;m++){let l=Math.max(0,m-d),p=Math.max(0,i-d),g=Math.min(a-1,m+d),F=Math.min(s-1,i+d),Y=(g-l+1)*(F-p+1),J=(c[(F+1)*(a+1)+(g+1)]-c[p*(a+1)+(g+1)]-c[(F+1)*(a+1)+l]+c[p*(a+1)+l])/Y,V=i*a+m;n[V]=r[V]>J-t?255:0}return{data:n,width:a,height:s}}function E(o){let{data:e,width:t,height:r}=o,a=new Uint8Array(e.length);for(let s=0;s<e.length;s++)a[s]=255-e[s];return{data:a,width:t,height:r}}function B(o,e){let{data:t,width:r,height:a}=o,s=new Uint8Array(t.length);for(let n=1;n<a-1;n++)for(let d=1;d<r-1;d++){let c=0,i=0;for(let m=-1;m<=1;m++)for(let l=-1;l<=1;l++){let p=(n+m)*r+(d+l);c+=t[p]*e[i++]}s[n*r+d]=Math.max(0,Math.min(255,Math.round(c)))}for(let n=0;n<r;n++)s[n]=t[n],s[(a-1)*r+n]=t[(a-1)*r+n];for(let n=0;n<a;n++)s[n*r]=t[n*r],s[n*r+r-1]=t[n*r+r-1];return{data:s,width:r,height:a}}function C(o){return B(o,[0,-1,0,-1,5,-1,0,-1,0])}function A(o){return B(o,[0,-.5,0,-.5,3,-.5,0,-.5,0])}function I(o){return B(o,[.0625,.125,.0625,.125,.25,.125,.0625,.125,.0625])}function z(o){return B(o,[.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111])}function U(o){let{data:e,width:t,height:r}=o,a=new Uint8Array(e.length),s=new Uint8Array(9);for(let n=1;n<r-1;n++)for(let d=1;d<t-1;d++){let c=0;for(let i=-1;i<=1;i++)for(let m=-1;m<=1;m++)s[c++]=e[(n+i)*t+(d+m)];s.sort(),a[n*t+d]=s[4]}for(let n=0;n<t;n++)a[n]=e[n],a[(r-1)*t+n]=e[(r-1)*t+n];for(let n=0;n<r;n++)a[n*t]=e[n*t],a[n*t+t-1]=e[n*t+t-1];return{data:a,width:t,height:r}}function j(o){let{data:e,width:t,height:r}=o,a=255,s=0;for(let c=0;c<e.length;c++)e[c]<a&&(a=e[c]),e[c]>s&&(s=e[c]);if(s===a)return{data:new Uint8Array(e),width:t,height:r};let n=new Uint8Array(e.length),d=255/(s-a);for(let c=0;c<e.length;c++)n[c]=Math.round((e[c]-a)*d);return{data:n,width:t,height:r}}function _(o,e={}){let{binarize:t="none",sharpen:r=!1,denoise:a=!1,invert:s=!1}=e,n=w(o);return a&&(n=I(n)),r&&(n=C(n)),t==="otsu"?n=b(n):t==="adaptive"&&(n=S(n)),s&&(n=E(n)),n}function K(o){let{data:e,width:t,height:r}=o,a=new Uint8ClampedArray(t*r*4);for(let s=0;s<e.length;s++){let n=s*4,d=e[s];a[n]=d,a[n+1]=d,a[n+2]=d,a[n+3]=255}return a}return ne(ce);})();
