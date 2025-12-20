"use strict";var PrescriptionScanner=(()=>{var J=Object.defineProperty;var ve=Object.getOwnPropertyDescriptor;var ye=Object.getOwnPropertyNames;var xe=Object.prototype.hasOwnProperty;var we=(o,e)=>{for(var t in e)J(o,t,{get:e[t],enumerable:!0})},be=(o,e,t,a)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of ye(e))!xe.call(o,n)&&n!==t&&J(o,n,{get:()=>e[n],enumerable:!(a=ve(e,n))||a.enumerable});return o};var Se=o=>be(J({},"__esModule",{value:!0}),o);var Le={};we(Le,{CombinedDecoder:()=>w,PrescriptionScanner:()=>F,ScannerWasmDecoder:()=>y,adaptiveThreshold:()=>P,adjustBrightnessContrast:()=>W,binarize:()=>j,binarizeOtsu:()=>I,boxBlur:()=>Z,cleanup:()=>he,enhanceForScanning:()=>g,gaussianBlur:()=>k,getAvailableCameras:()=>ne,grabFrame:()=>B,grayscaleToRGBA:()=>ie,invert:()=>M,isCameraSupported:()=>O,isPDF:()=>A,isPdfJsLoaded:()=>se,medianFilter:()=>K,openScanner:()=>ce,otsuThreshold:()=>G,preprocess:()=>oe,processPDF:()=>D,scan:()=>le,scanAll:()=>de,scanVideo:()=>ee,sharpen:()=>C,sharpenLight:()=>Q,sharpenRGBA:()=>q,startCamera:()=>H,startScanner:()=>pe,stopCamera:()=>T,stretchContrast:()=>Y,toGrayscale:()=>E,toImageData:()=>_,upscaleImage:()=>V});var De={DataMatrix:"DataMatrix",QRCode:"QRCode"},y=class{constructor(){this.name="scanner-wasm";this.supportedFormats=["DataMatrix","QRCode"];this.module=null;this.ready=!1;this.loading=null}async init(){if(!this.ready){if(this.loading)return this.loading;this.loading=this.loadModule(),await this.loading}}async loadModule(){await this.loadScript("/wasm/scanner.js");let e=window.createScanner;if(!e)throw new Error("WASM loader not found");this.module=await e({locateFile:t=>t.endsWith(".wasm")?"/wasm/scanner.wasm":t}),this.ready=!0}loadScript(e){return new Promise((t,a)=>{if(window.createScanner){t();return}let n=document.createElement("script");n.src=e,n.onload=()=>t(),n.onerror=a,document.head.appendChild(n)})}isReady(){return this.ready}async decode(e,t){if(!this.ready||!this.module)return[];try{let{data:a,width:n,height:s}=e,r=this.module._malloc(a.length);this.module.HEAPU8.set(a,r);let i=this.module.scan(r,n,s);this.module._free(r);let l=[],c=i.size();for(let p=0;p<c;p++){let d=i.get(p),h=De[d.format];h&&t.includes(h)&&l.push({data:d.text,format:h,points:[{x:d.x0,y:d.y0},{x:d.x1,y:d.y1},{x:d.x2,y:d.y2},{x:d.x3,y:d.y3}]})}return l}catch{return[]}}destroy(){this.module=null,this.ready=!1,this.loading=null}};var w=class{constructor(){this.initialized=!1;this.decoder=new y}async init(e){this.initialized||(await this.decoder.init(),this.initialized=!0)}async decode(e,t){if(!this.initialized)throw new Error("Decoder not initialized");let a=await this.decoder.decode(e,t),n=Date.now();return a.map(s=>({...s,timestamp:n}))}getSupportedFormats(){return this.decoder.supportedFormats}isReady(){return this.initialized&&this.decoder.isReady()}destroy(){this.decoder.destroy(),this.initialized=!1}};async function H(o,e={}){let{facingMode:t="environment",resolution:a={width:1280,height:720}}=e,n={video:{facingMode:t,width:{ideal:a.width},height:{ideal:a.height}},audio:!1};try{let s=await navigator.mediaDevices.getUserMedia(n);o.srcObject=s,await new Promise((p,d)=>{o.onloadedmetadata=()=>{o.play().then(p).catch(d)},o.onerror=()=>d(new Error("Video element error"))});let r=o.videoWidth,i=o.videoHeight,l=document.createElement("canvas");l.width=r,l.height=i;let c=l.getContext("2d",{willReadFrequently:!0});if(!c)throw new Error("Could not get canvas context");return{video:o,stream:s,canvas:l,ctx:c,width:r,height:i}}catch(s){throw new Error(`Camera access denied: ${s}`)}}function T(o){let{stream:e,video:t}=o;for(let a of e.getTracks())a.stop();t.srcObject=null}function B(o){let{video:e,canvas:t,ctx:a,width:n,height:s}=o;return a.drawImage(e,0,0,n,s),a.getImageData(0,0,n,s)}function O(){return!!(navigator.mediaDevices&&typeof navigator.mediaDevices.getUserMedia=="function")}async function ne(){return(await navigator.mediaDevices.enumerateDevices()).filter(e=>e.kind==="videoinput")}var b=class b{constructor(e={}){this.camera=null;this.scanning=!1;this.animationFrame=null;this.lastScanTime=0;this.scanHandlers=new Set;this.errorHandlers=new Set;this.startHandlers=new Set;this.stopHandlers=new Set;this.options={...b.defaultOptions,...e,preprocessing:{...b.defaultOptions.preprocessing,...e.preprocessing},camera:{...b.defaultOptions.camera,...e.camera}},this.decoder=new w}async init(){await this.decoder.init(this.options.formats)}on(e,t){switch(e){case"scan":this.scanHandlers.add(t);break;case"error":this.errorHandlers.add(t);break;case"start":this.startHandlers.add(t);break;case"stop":this.stopHandlers.add(t);break}}off(e,t){switch(e){case"scan":this.scanHandlers.delete(t);break;case"error":this.errorHandlers.delete(t);break;case"start":this.startHandlers.delete(t);break;case"stop":this.stopHandlers.delete(t);break}}emit(e,t){try{switch(e){case"scan":for(let a of this.scanHandlers)a(t);break;case"error":for(let a of this.errorHandlers)a(t);break;case"start":for(let a of this.startHandlers)a();break;case"stop":for(let a of this.stopHandlers)a();break}}catch(a){console.error(`Error in ${e} handler:`,a)}}async start(e){if(!this.scanning){if(!O())throw new Error("Camera not supported in this browser");this.decoder.isReady()||await this.init(),this.camera=await H(e,this.options.camera),this.scanning=!0,this.emit("start"),this.scanLoop()}}stop(){this.scanning&&(this.scanning=!1,this.animationFrame!==null&&(cancelAnimationFrame(this.animationFrame),this.animationFrame=null),this.camera&&(T(this.camera),this.camera=null),this.emit("stop"))}scanLoop(){if(!this.scanning||!this.camera)return;let e=Date.now(),t=1e3/(this.options.camera.scanRate||10);if(e-this.lastScanTime>=t){this.lastScanTime=e;let a=B(this.camera);this.processFrame(a).catch(n=>{this.emit("error",n)})}this.animationFrame=requestAnimationFrame(()=>this.scanLoop())}async processFrame(e){let t=await this.decoder.decode(e,this.options.formats);for(let a of t)this.emit("scan",a)}async scanImage(e){this.decoder.isReady()||await this.init();let t=document.createElement("canvas");t.width=e.naturalWidth,t.height=e.naturalHeight;let a=t.getContext("2d");if(!a)throw new Error("Could not get canvas context");a.drawImage(e,0,0);let n=a.getImageData(0,0,t.width,t.height);return this.scanImageData(n)}async scanImageData(e){return this.decoder.isReady()||await this.init(),this.decoder.decode(e,this.options.formats)}async scanCanvas(e){let t=e.getContext("2d");if(!t)throw new Error("Could not get canvas context");let a=t.getImageData(0,0,e.width,e.height);return this.scanImageData(a)}isScanning(){return this.scanning}getSupportedFormats(){return this.decoder.getSupportedFormats()}setOptions(e){e.preprocessing&&(this.options.preprocessing={...this.options.preprocessing,...e.preprocessing}),e.camera&&(this.options.camera={...this.options.camera,...e.camera}),e.formats&&(this.options.formats=e.formats)}destroy(){this.stop(),this.decoder.destroy(),this.scanHandlers.clear(),this.errorHandlers.clear(),this.startHandlers.clear(),this.stopHandlers.clear()}};b.defaultOptions={formats:["QRCode","DataMatrix"],preprocessing:{binarize:"none",sharpen:!1,denoise:!1,invert:!1},camera:{facingMode:"environment",resolution:{width:1280,height:720},scanRate:10}};var f=b;var S=null,z=null,Ee="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",Ie="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";async function Pe(){if(!S)return z||(z=new Promise((o,e)=>{let t=document.createElement("script");t.src=Ee,t.onload=()=>{let a=window.pdfjsLib;a?(a.GlobalWorkerOptions.workerSrc=Ie,S=a,o()):e(new Error("PDF.js failed to load"))},t.onerror=()=>e(new Error("Failed to load PDF.js")),document.head.appendChild(t)}),z)}async function D(o,e={}){let{scale:t=2,maxPages:a=10,onProgress:n}=e;if(await Pe(),!S)throw new Error("PDF.js not loaded");let s=o instanceof File?await o.arrayBuffer():o,r=await S.getDocument({data:s}).promise,i=Math.min(r.numPages,a),l=[],c=document.createElement("canvas"),p=c.getContext("2d");try{for(let d=1;d<=i;d++){n?.(d,i);let h=await r.getPage(d),m=h.getViewport({scale:t});c.width=m.width,c.height=m.height,p.fillStyle="#ffffff",p.fillRect(0,0,c.width,c.height),await h.render({canvasContext:p,viewport:m}).promise;let u=p.getImageData(0,0,c.width,c.height);l.push({pageNumber:d,imageData:u,width:c.width,height:c.height})}}finally{r.destroy()}return l}function A(o){return o.type==="application/pdf"||o.name.toLowerCase().endsWith(".pdf")}function se(){return S!==null}function E(o){let{data:e,width:t,height:a}=o,n=new Uint8Array(t*a);for(let s=0;s<n.length;s++){let r=s*4,i=e[r],l=e[r+1],c=e[r+2];n[s]=i*77+l*150+c*29>>8}return{data:n,width:t,height:a}}function _(o){let{data:e,width:t,height:a}=o,n=new ImageData(t,a);for(let s=0;s<e.length;s++){let r=s*4,i=e[s];n.data[r]=i,n.data[r+1]=i,n.data[r+2]=i,n.data[r+3]=255}return n}function G(o){let{data:e}=o,t=new Uint32Array(256);for(let c=0;c<e.length;c++)t[e[c]]++;let a=e.length,n=0;for(let c=0;c<256;c++)n+=c*t[c];let s=0,r=0,i=0,l=0;for(let c=0;c<256;c++){if(r+=t[c],r===0)continue;let p=a-r;if(p===0)break;s+=c*t[c];let d=s/r,h=(n-s)/p,m=r*p*(d-h)*(d-h);m>i&&(i=m,l=c)}return l}function j(o,e){let{data:t,width:a,height:n}=o,s=new Uint8Array(t.length);for(let r=0;r<t.length;r++)s[r]=t[r]>e?255:0;return{data:s,width:a,height:n}}function I(o){let e=G(o);return j(o,e)}function P(o,e=11,t=2){let{data:a,width:n,height:s}=o,r=new Uint8Array(a.length),i=Math.floor(e/2),l=new Uint32Array((n+1)*(s+1));for(let c=0;c<s;c++){let p=0;for(let d=0;d<n;d++){p+=a[c*n+d];let h=(c+1)*(n+1)+(d+1);l[h]=p+l[h-(n+1)]}}for(let c=0;c<s;c++)for(let p=0;p<n;p++){let d=Math.max(0,p-i),h=Math.max(0,c-i),m=Math.min(n-1,p+i),u=Math.min(s-1,c+i),R=(m-d+1)*(u-h+1),N=(l[(u+1)*(n+1)+(m+1)]-l[h*(n+1)+(m+1)]-l[(u+1)*(n+1)+d]+l[h*(n+1)+d])/R,L=c*n+p;r[L]=a[L]>N-t?255:0}return{data:r,width:n,height:s}}function M(o){let{data:e,width:t,height:a}=o,n=new Uint8Array(e.length);for(let s=0;s<e.length;s++)n[s]=255-e[s];return{data:n,width:t,height:a}}function U(o,e){let{data:t,width:a,height:n}=o,s=new Uint8Array(t.length);for(let r=1;r<n-1;r++)for(let i=1;i<a-1;i++){let l=0,c=0;for(let p=-1;p<=1;p++)for(let d=-1;d<=1;d++){let h=(r+p)*a+(i+d);l+=t[h]*e[c++]}s[r*a+i]=Math.max(0,Math.min(255,Math.round(l)))}for(let r=0;r<a;r++)s[r]=t[r],s[(n-1)*a+r]=t[(n-1)*a+r];for(let r=0;r<n;r++)s[r*a]=t[r*a],s[r*a+a-1]=t[r*a+a-1];return{data:s,width:a,height:n}}function C(o){return U(o,[0,-1,0,-1,5,-1,0,-1,0])}function Q(o){return U(o,[0,-.5,0,-.5,3,-.5,0,-.5,0])}function k(o){return U(o,[.0625,.125,.0625,.125,.25,.125,.0625,.125,.0625])}function Z(o){return U(o,[.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111,.1111111111111111])}function K(o){let{data:e,width:t,height:a}=o,n=new Uint8Array(e.length),s=new Uint8Array(9);for(let r=1;r<a-1;r++)for(let i=1;i<t-1;i++){let l=0;for(let c=-1;c<=1;c++)for(let p=-1;p<=1;p++)s[l++]=e[(r+c)*t+(i+p)];s.sort(),n[r*t+i]=s[4]}for(let r=0;r<t;r++)n[r]=e[r],n[(a-1)*t+r]=e[(a-1)*t+r];for(let r=0;r<a;r++)n[r*t]=e[r*t],n[r*t+t-1]=e[r*t+t-1];return{data:n,width:t,height:a}}function Y(o){let{data:e,width:t,height:a}=o,n=255,s=0;for(let l=0;l<e.length;l++)e[l]<n&&(n=e[l]),e[l]>s&&(s=e[l]);if(s===n)return{data:new Uint8Array(e),width:t,height:a};let r=new Uint8Array(e.length),i=255/(s-n);for(let l=0;l<e.length;l++)r[l]=Math.round((e[l]-n)*i);return{data:r,width:t,height:a}}function V(o,e=2.5){let{data:t,width:a,height:n}=o,s=Math.round(a*e),r=Math.round(n*e),i=new Uint8ClampedArray(s*r*4);for(let l=0;l<r;l++)for(let c=0;c<s;c++){let p=c/e,d=l/e,h=Math.floor(p),m=Math.floor(d),u=Math.min(h+1,a-1),R=Math.min(m+1,n-1),$=p-h,N=d-m,L=(l*s+c)*4;for(let v=0;v<4;v++){let te=t[(m*a+h)*4+v],me=t[(m*a+u)*4+v],ae=t[(R*a+h)*4+v],ue=t[(R*a+u)*4+v],re=te+(me-te)*$,fe=ae+(ue-ae)*$,ge=re+(fe-re)*N;i[L+v]=Math.round(ge)}}return new ImageData(i,s,r)}function W(o,e=1.1,t=1.3){let{data:a,width:n,height:s}=o,r=new Uint8ClampedArray(a.length);for(let i=0;i<a.length;i+=4){for(let l=0;l<3;l++){let c=a[i+l];c=(c-128)*t+128,c=c*e,r[i+l]=Math.max(0,Math.min(255,Math.round(c)))}r[i+3]=a[i+3]}return new ImageData(r,n,s)}function q(o){let{data:e,width:t,height:a}=o,n=new Uint8ClampedArray(e.length),s=[0,-1,0,-1,5,-1,0,-1,0];for(let r=1;r<a-1;r++)for(let i=1;i<t-1;i++){let l=(r*t+i)*4;for(let c=0;c<3;c++){let p=0,d=0;for(let h=-1;h<=1;h++)for(let m=-1;m<=1;m++){let u=((r+h)*t+(i+m))*4+c;p+=e[u]*s[d++]}n[l+c]=Math.max(0,Math.min(255,Math.round(p)))}n[l+3]=e[l+3]}for(let r=0;r<t;r++)for(let i=0;i<4;i++)n[r*4+i]=e[r*4+i],n[((a-1)*t+r)*4+i]=e[((a-1)*t+r)*4+i];for(let r=0;r<a;r++)for(let i=0;i<4;i++)n[r*t*4+i]=e[r*t*4+i],n[(r*t+t-1)*4+i]=e[(r*t+t-1)*4+i];return new ImageData(n,t,a)}function g(o,e={}){let{minSize:t=1e3,upscaleFactor:a=2.5,adjustColors:n=!0,sharpen:s=!1}=e,r=o;return r.width<t&&r.height<t&&(r=V(r,a)),n&&(r=W(r,1.1,1.2)),s&&(r=q(r)),r}function oe(o,e={}){let{binarize:t="none",sharpen:a=!1,denoise:n=!1,invert:s=!1}=e,r=E(o);return n&&(r=k(r)),a&&(r=C(r)),t==="otsu"?r=I(r):t==="adaptive"&&(r=P(r)),s&&(r=M(r)),r}function ie(o){let{data:e,width:t,height:a}=o,n=new Uint8ClampedArray(t*a*4);for(let s=0;s<e.length;s++){let r=s*4,i=e[s];n[r]=i,n[r+1]=i,n[r+2]=i,n[r+3]=255}return n}var Me=`
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
  overflow-y: auto;
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
`,Ce=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
  <line x1="7" y1="12" x2="17" y2="12"/>
</svg>`,ke=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
  <circle cx="12" cy="13" r="4"/>
</svg>`,Fe=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="17 8 12 3 7 8"/>
  <line x1="12" y1="3" x2="12" y2="15"/>
</svg>`,Re=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
</svg>`,F=class{constructor(e={}){this.scanner=null;this.overlay=null;this.video=null;this.stream=null;this.stylesInjected=!1;this.results=[];this.mode="camera";this.fileInput=null;this.initialized=!1;this.initializing=!1;this.options={headless:e.headless??!0,preload:e.preload??"lazy",formats:e.formats||["DataMatrix","QRCode"],title:e.title||"Barcode scannen",buttonText:e.buttonText||"Scanner \xF6ffnen",closeOnScan:e.closeOnScan??!1,onReady:e.onReady||(()=>{}),onScan:e.onScan||(()=>{}),onMultiScan:e.onMultiScan||(()=>{}),onError:e.onError||(()=>{}),onClose:e.onClose||(()=>{})},this.handlePreload()}handlePreload(){let e=this.options.preload;e==="eager"?this.preload():e==="idle"&&(typeof requestIdleCallback<"u"?requestIdleCallback(()=>this.preload(),{timeout:5e3}):setTimeout(()=>this.preload(),100))}preload(){return this.init()}async init(){if(!this.initialized){if(this.initializing){for(;this.initializing;)await new Promise(e=>setTimeout(e,10));return}this.initializing=!0;try{this.scanner=new f({formats:this.options.formats}),await this.scanner.init(),this.initialized=!0,this.options.onReady()}finally{this.initializing=!1}}}isReady(){return this.initialized}async scanImage(e){return await this.init(),this.scanner.scanImage(e)}async scanImageData(e){await this.init();let t=g(e);return this.scanner.scanImageData(t)}async scanCanvas(e){return await this.init(),this.scanner.scanCanvas(e)}async scanPDF(e){await this.init();let t=await D(e,{scale:2}),a=[];for(let n of t){let s=g(n.imageData),r=await this.scanner.scanImageData(s);a.push(...r)}return this.deduplicateResults(a)}async start(e){await this.init(),this.scanner.on("scan",t=>{this.addResult(t)}),this.scanner.on("error",t=>{this.options.onError(t)}),await this.scanner.start(e),this.video=e}async startCamera(e){await this.init();let t=document.createElement("video");return t.setAttribute("playsinline",""),t.setAttribute("muted",""),t.muted=!0,t.style.width="100%",t.style.height="100%",t.style.objectFit="cover",e.appendChild(t),this.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}}),t.srcObject=this.stream,await t.play(),this.scanner.on("scan",a=>{this.addResult(a)}),this.scanner.on("error",a=>{this.options.onError(a)}),await this.scanner.start(t),this.video=t,t}stop(){this.scanner?.stop(),this.stream&&(this.stream.getTracks().forEach(e=>e.stop()),this.stream=null),this.video&&this.video.parentElement&&(this.video.srcObject=null,this.video.remove()),this.video=null}isScanning(){return this.scanner?.isScanning()??!1}createButton(e){let t=document.createElement("button");return t.className="ps-btn",t.innerHTML=`${Ce} ${this.options.buttonText}`,t.onclick=()=>this.open(),e&&e.appendChild(t),t}async open(){this.results=[],this.injectStyles(),this.createModal(),await this.startScanner()}close(){this.stopScanner(),this.overlay&&(this.overlay.remove(),this.overlay=null),this.results.length>0&&this.options.onMultiScan(this.results),this.options.onClose()}destroy(){this.close(),this.scanner?.destroy(),this.scanner=null}getResults(){return[...this.results]}clearResults(){this.results=[]}injectStyles(){if(this.stylesInjected)return;let e=document.createElement("style");e.id="prescription-scanner-styles",e.textContent=Me,document.head.appendChild(e),this.stylesInjected=!0}createModal(){this.overlay=document.createElement("div"),this.overlay.className="ps-overlay",this.overlay.onclick=n=>{n.target===this.overlay&&this.close()},this.overlay.innerHTML=`
      <div class="ps-modal">
        <div class="ps-header">
          <h2 class="ps-title">${this.options.title}</h2>
          <button class="ps-close" aria-label="Schlie\xDFen">&times;</button>
        </div>
        <div class="ps-content">
          <div class="ps-tabs">
            <button class="ps-tab active" data-mode="camera">
              ${ke} Kamera
            </button>
            <button class="ps-tab" data-mode="upload">
              ${Re} Datei/PDF
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
              ${Fe}
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
    `,this.overlay.querySelector(".ps-close").addEventListener("click",()=>this.close()),this.overlay.querySelector(".ps-cancel").addEventListener("click",()=>this.close()),this.overlay.querySelectorAll(".ps-tab").forEach(n=>{n.addEventListener("click",()=>{let s=n.getAttribute("data-mode");this.switchMode(s)})});let t=this.overlay.querySelector(".ps-upload-zone");this.setupUploadZone(t);let a=n=>{n.key==="Escape"&&(this.close(),document.removeEventListener("keydown",a))};document.addEventListener("keydown",a),this.video=this.overlay.querySelector(".ps-video"),document.body.appendChild(this.overlay),document.body.style.overflow="hidden"}setupUploadZone(e){this.fileInput=document.createElement("input"),this.fileInput.type="file",this.fileInput.accept="image/*,application/pdf",this.fileInput.style.display="none",this.fileInput.addEventListener("change",()=>{let t=this.fileInput?.files?.[0];t&&this.processFile(t)}),e.appendChild(this.fileInput),e.addEventListener("click",()=>{this.fileInput?.click()}),e.addEventListener("dragover",t=>{t.preventDefault(),e.classList.add("dragover")}),e.addEventListener("dragleave",()=>{e.classList.remove("dragover")}),e.addEventListener("drop",t=>{t.preventDefault(),e.classList.remove("dragover");let a=t.dataTransfer?.files[0];a&&this.processFile(a)})}switchMode(e){if(!this.overlay)return;this.mode=e,this.overlay.querySelectorAll(".ps-tab").forEach(s=>{s.classList.toggle("active",s.getAttribute("data-mode")===e)});let a=this.overlay.querySelector(".ps-camera-view"),n=this.overlay.querySelector(".ps-upload-view");e==="camera"?(a.classList.remove("ps-hidden"),n.classList.add("ps-hidden"),this.scanner?.isScanning()||this.startScanner()):(a.classList.add("ps-hidden"),n.classList.remove("ps-hidden"),this.stopScanner())}async processFile(e){if(!this.overlay)return;let t=this.overlay.querySelector(".ps-upload-zone"),a=t.innerHTML;t.innerHTML=`
      <div class="ps-spinner"></div>
      <span class="ps-loading-text">Verarbeite ${e.name}...</span>
    `;try{this.scanner||(this.scanner=new f({formats:this.options.formats}),await this.scanner.init());let n=[];if(A(e)){let r=await D(e,{scale:2,onProgress:(i,l)=>{let c=t.querySelector(".ps-loading-text");c&&(c.textContent=`Seite ${i}/${l}...`)}});for(let i of r){let l=g(i.imageData),c=await this.scanner.scanImageData(l);n.push(...c)}}else{let r=await this.loadImage(e),i=g(r);n=await this.scanner.scanImageData(i)}let s=this.deduplicateResults(n);if(s.length>0){for(let r of s)this.addResult(r);t.innerHTML=`
          <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="width:48px;height:48px">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span class="ps-loading-text" style="color:#22c55e">${s.length} Code${s.length>1?"s":""} gefunden!</span>
        `}else t.innerHTML=`
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="width:48px;height:48px">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span class="ps-loading-text" style="color:#ef4444">Kein Barcode gefunden</span>
        `;setTimeout(()=>{t&&this.overlay&&(t.innerHTML=a,this.setupUploadZone(t))},2500)}catch(n){t.innerHTML=`
        <span class="ps-loading-text" style="color:#ef4444">
          Fehler: ${n instanceof Error?n.message:"Unbekannt"}
        </span>
      `,this.options.onError(n instanceof Error?n:new Error(String(n))),setTimeout(()=>{t&&this.overlay&&(t.innerHTML=a,this.setupUploadZone(t))},3e3)}}async loadImage(e){return new Promise((t,a)=>{let n=new Image;n.onload=()=>{let s=document.createElement("canvas");s.width=n.naturalWidth,s.height=n.naturalHeight;let r=s.getContext("2d");r.drawImage(n,0,0),t(r.getImageData(0,0,s.width,s.height))},n.onerror=()=>a(new Error("Bild konnte nicht geladen werden")),n.src=URL.createObjectURL(e)})}deduplicateResults(e){let t=new Set;return e.filter(a=>{let n=`${a.format}:${a.data}`;return t.has(n)?!1:(t.add(n),!0)})}async startScanner(){if(!this.overlay||!this.video)return;let e=this.overlay.querySelector(".ps-loading"),t=this.overlay.querySelector(".ps-video-container");try{if(this.scanner=new f({formats:this.options.formats}),await this.scanner.init(),this.scanner.on("scan",a=>{this.addResult(a),this.options.closeOnScan&&setTimeout(()=>this.close(),1e3)}),this.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}}),this.video.srcObject=this.stream,await this.video.play(),await this.scanner.start(this.video),e.style.display="none",!t.querySelector(".ps-scan-line")){let a=document.createElement("div");a.className="ps-scan-line",t.appendChild(a)}}catch(a){e.innerHTML=`
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
    `)}escapeHtml(e){let t=document.createElement("div");return t.textContent=e,t.innerHTML}};function ce(o={}){let e=new F(o);return e.open(),e}var x=null;async function X(){return x||(x=new f({formats:["DataMatrix","QRCode"]}),await x.init()),x}async function le(o){let e=await X(),t;return o instanceof HTMLImageElement?t=await e.scanImage(o):o instanceof HTMLCanvasElement?t=await e.scanCanvas(o):t=await e.scanImageData(o),t[0]||null}async function de(o){let e=await X();return o instanceof HTMLImageElement?e.scanImage(o):o instanceof HTMLCanvasElement?e.scanCanvas(o):e.scanImageData(o)}async function ee(o,e,t){let a=await X();return a.on("scan",e),t?.onError&&a.on("error",t.onError),await a.start(o),()=>{a.stop(),a.off("scan",e),t?.onError&&a.off("error",t.onError)}}async function pe(o,e){let t=document.createElement("video");t.setAttribute("playsinline",""),t.setAttribute("muted",""),t.style.width="100%",t.style.height="auto",e?.container&&e.container.appendChild(t);let a=await ee(t,o,e);return{video:t,stop:()=>{a(),e?.container&&t.parentNode===e.container&&e.container.removeChild(t)}}}function he(){x&&(x.destroy(),x=null)}return Se(Le);})();
