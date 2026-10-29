import { mountTurnstile } from '../turnstile';
/* Mark Staples 3D gallery engine.
   Ported from the approved prototype. Three.js is pinned to r128 so the scene renders exactly as signed off;
   upgrading Three.js is a separate, planned task (colour management and light units changed in later versions). */
import * as THREE from 'three';

export function mountGallery(root, opts){
  const { artworks, initialSlug = null, openOnLoad = false, about = null, initialView = 'gallery' } = opts;
  let alive = true; const offs = [];
  const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); offs.push(() => el.removeEventListener(ev, fn, o)); };
  const baseTitle = document.title;
  const $ = s => root.querySelector(s);

const IMG = Object.fromEntries(artworks.map(a=>[a.id, a.image]));
const PIECES = artworks.map(a=>({...a}));

const FRAMES = {
  none:{t:0},
  black:{t:.055,color:0x141414,rough:.45,metal:.05},
  cream:{t:.09,color:0xEEE4CA,rough:.55,metal:0},
  silver:{t:.055,color:0xD3D6DA,rough:.28,metal:.85},
  stripe:{t:.08,stripe:true}
};

const coarse = matchMedia('(pointer: coarse)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = n => '£' + n.toLocaleString('en-GB');
const cm = m => Math.round(m*100/5)*5;
PIECES.forEach(p=>{
  const im = IMG[p.id];
  if(!p.sculpture) p.h = p.round ? p.w : +(p.w*im.h/im.w).toFixed(3);
  p.size = p.sizeText || ''; // only real sizes from the CMS, never ones worked out from the 3D hanging size
});

/* ---------- three.js scene ---------- */
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .98;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0xC6C2BB);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xC6C2BB, 10, 26);
const camera = new THREE.PerspectiveCamera(48, 1, .1, 80);
const maxAniso = renderer.capabilities.getMaxAnisotropy();

const hemi = new THREE.HemisphereLight(0xfffaf2, 0xb9b1a5, .47); scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff4e6, .14); key.position.set(2,5,7); scene.add(key);

function canvasTex(w,h,draw,srgb=true){
  const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); if(srgb) t.encoding=THREE.sRGBEncoding; t.anisotropy=maxAniso; return t;
}
const loader = new THREE.TextureLoader();
function imgTex(src){ const t=loader.load(src); t.encoding=THREE.sRGBEncoding; t.anisotropy=maxAniso; return t; }

let rand = (s=>()=>(s=(s*16807)%2147483647)/2147483647)(42);

const shadowRect = canvasTex(256,256,(c)=>{ c.shadowColor='rgba(0,0,0,1)'; c.shadowBlur=22; c.shadowOffsetY=5; c.fillStyle='#000'; c.fillRect(48,48,160,160); });
const shadowDrop = canvasTex(256,256,(c)=>{ c.shadowColor='rgba(20,16,12,1)'; c.shadowBlur=26; c.shadowOffsetY=6; c.fillStyle='rgba(20,16,12,1)'; c.fillRect(64,64,128,128); });
const shadowRound = canvasTex(256,256,(c)=>{ c.shadowColor='rgba(0,0,0,1)'; c.shadowBlur=34; c.shadowOffsetY=10; c.fillStyle='#000'; c.beginPath(); c.arc(128,128,80,0,Math.PI*2); c.fill(); });
const shadowHalo = canvasTex(256,256,(c)=>{ c.shadowColor='rgba(20,16,12,1)'; c.shadowBlur=30; c.fillStyle='rgba(20,16,12,1)'; c.fillRect(64,64,128,128); });
const poolTex = canvasTex(256,256,(c)=>{ const g=c.createRadialGradient(128,110,0,128,128,128); g.addColorStop(0,'rgba(255,250,240,1)'); g.addColorStop(.55,'rgba(255,248,235,.35)'); g.addColorStop(1,'rgba(255,248,235,0)'); c.fillStyle=g; c.fillRect(0,0,256,256); });
const stripeTex = canvasTex(128,32,(c,w,h)=>{ c.fillStyle='#f4f1ea'; c.fillRect(0,0,w,h); c.fillStyle='#d8233d'; for(let x=-32;x<w+32;x+=32){ c.beginPath(); c.moveTo(x,0); c.lineTo(x+16,0); c.lineTo(x+16-h,h); c.lineTo(x-h,h); c.fill(); } });
stripeTex.wrapS = THREE.RepeatWrapping;

/* room */
const ROOM = {start:-2.6, gap:.95};
let cursor = 2.45; // room for the title vinyl beside the tag
PIECES.forEach(p=>{ const fw = p.sculpture ? p.w : p.w + 2*FRAMES[p.frame].t; p.x = cursor + fw/2; cursor += fw + ROOM.gap; });
ROOM.end = cursor - ROOM.gap + 1.6; // the end wall always sits 1.6 m past the last piece, however many pieces hang
const len = ROOM.end - ROOM.start, mid = (ROOM.start+ROOM.end)/2, H = 3.6, D = 14;

const plaster = (()=>{ const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d'); x.fillStyle='#808080'; x.fillRect(0,0,512,512);
  for(let i=0;i<260;i++){ const px=rand()*512,py=rand()*512,r=8+rand()*60,g=x.createRadialGradient(px,py,0,px,py,r),a=(rand()*.07).toFixed(3); g.addColorStop(0,rand()>.5?`rgba(255,255,255,${a})`:`rgba(0,0,0,${a})`); g.addColorStop(1,'rgba(128,128,128,0)'); x.fillStyle=g; x.fillRect(px-r,py-r,r*2,r*2); }
  const id=x.getImageData(0,0,512,512); for(let i=0;i<id.data.length;i+=4){ const n=(rand()-.5)*7; id.data[i]+=n; id.data[i+1]+=n; id.data[i+2]+=n; } x.putImageData(id,0,0); return c; })();
const plasterBump = new THREE.CanvasTexture(plaster); plasterBump.wrapS=plasterBump.wrapT=THREE.RepeatWrapping; plasterBump.repeat.set(6,1.5);
const plasterCol = canvasTex(512,512,(c)=>{ c.drawImage(plaster,0,0); c.globalCompositeOperation='multiply'; c.fillStyle='#F3F0EA'; c.fillRect(0,0,512,512); c.globalCompositeOperation='screen'; c.fillStyle='rgba(243,240,234,.86)'; c.fillRect(0,0,512,512); });
plasterCol.wrapS=plasterCol.wrapT=THREE.RepeatWrapping; plasterCol.repeat.set(6,1.5);
const wallMat = new THREE.MeshStandardMaterial({map:plasterCol, bumpMap:plasterBump, bumpScale:.0009, roughness:.93, metalness:0});
const wall = new THREE.Mesh(new THREE.PlaneGeometry(len,H), wallMat); wall.position.set(mid,H/2,0); wall.receiveShadow=true; scene.add(wall);
[ROOM.start, ROOM.end].forEach((x,i)=>{ const s=new THREE.Mesh(new THREE.PlaneGeometry(D,H), wallMat); s.rotation.y = i? -Math.PI/2 : Math.PI/2; s.position.set(x,H/2,D/2); scene.add(s); });
const concrete = canvasTex(512,512,(c,w,h)=>{
  c.fillStyle='#cfcac2'; c.fillRect(0,0,w,h);
  for(let i=0;i<70;i++){ const x=rand()*w,y=rand()*h,r=20+rand()*90; const g=c.createRadialGradient(x,y,0,x,y,r); const a=(rand()*.06).toFixed(3); g.addColorStop(0,rand()>.5?`rgba(255,255,255,${a})`:`rgba(90,80,70,${a})`); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(x-r,y-r,r*2,r*2); }
  const id=c.getImageData(0,0,w,h); for(let i=0;i<id.data.length;i+=4){ const n=(rand()-.5)*14; id.data[i]+=n; id.data[i+1]+=n; id.data[i+2]+=n; } c.putImageData(id,0,0);
  c.strokeStyle='rgba(80,72,64,.18)'; c.lineWidth=2; c.beginPath(); c.moveTo(0,1); c.lineTo(w,1); c.moveTo(1,0); c.lineTo(1,h); c.stroke();
});
concrete.wrapS = concrete.wrapT = THREE.RepeatWrapping; concrete.repeat.set(len/3, D/3);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(len,D), new THREE.MeshStandardMaterial({map:concrete, roughness:.58, metalness:0}));
floor.rotation.x=-Math.PI/2; floor.position.set(mid,0,D/2); floor.receiveShadow=true; scene.add(floor);
/* soft corner shading where walls meet floor and ceiling */
const aoUp = canvasTex(8,256,(c,w,h)=>{ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(40,32,24,.42)'); g.addColorStop(.35,'rgba(40,32,24,.14)'); g.addColorStop(1,'rgba(40,32,24,0)'); c.fillStyle=g; c.fillRect(0,0,w,h); });
const aoDown = canvasTex(8,256,(c,w,h)=>{ const g=c.createLinearGradient(0,h,0,0); g.addColorStop(0,'rgba(40,32,24,.42)'); g.addColorStop(.35,'rgba(40,32,24,.14)'); g.addColorStop(1,'rgba(40,32,24,0)'); c.fillStyle=g; c.fillRect(0,0,w,h); });
function aoStrip(tex,w,h,pos,rot){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false})); m.position.copy(pos); if(rot) m.rotation.set(rot[0],rot[1],rot[2]); m.renderOrder=1; scene.add(m); }
aoStrip(aoDown, len, .55, new THREE.Vector3(mid,.275,.0015));
aoStrip(aoUp, len, .75, new THREE.Vector3(mid,.0015,.375), [-Math.PI/2,0,0]);
const aoSoft = canvasTex(8,256,(c,w,h)=>{ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(60,50,40,.16)'); g.addColorStop(.5,'rgba(60,50,40,.05)'); g.addColorStop(1,'rgba(60,50,40,0)'); c.fillStyle=g; c.fillRect(0,0,w,h); });
aoStrip(aoSoft, len, .9, new THREE.Vector3(mid,H-.45,.0015));
[ROOM.start, ROOM.end].forEach((x,i)=>{ aoStrip(aoDown, D, .55, new THREE.Vector3(x+(i?-.0015:.0015),.275,D/2), [0,i?-Math.PI/2:Math.PI/2,0]); });
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(len,D), new THREE.MeshLambertMaterial({color:0xF6F4F0, emissive:0x5f5c58}));
const CEIL_E = new THREE.Color(0x5f5c58);
ceil.rotation.x=Math.PI/2; ceil.position.set(mid,H,D/2); scene.add(ceil);
const skirt = new THREE.Mesh(new THREE.BoxGeometry(len,.12,.018), new THREE.MeshStandardMaterial({color:0xF5F2EC, roughness:.6})); skirt.position.set(mid,.06,.009); skirt.receiveShadow=true; scene.add(skirt);
const black = new THREE.MeshStandardMaterial({color:0x1a1a1a, roughness:.5});

/* the opening wall: Mark's tag painted straight onto the plaster, still wet and dripping */
const TAG_D = 'M495.8 204C472.6 208.2 467.1 213.9 434 268.5C387.1 345.9 342 447.5 325 513.9C323.8 518.6 322.2 523.7 321.3 525.4L319.7 528.5L318.4 524.6C309.5 499 303 412.7 306.1 362.5C309.5 310 305.6 305.2 263.2 309C234.1 311.6 226.7 323.6 208 399C195.6 449.3 189.3 490.3 187.5 534.3C186.5 557.1 186.7 557.3 174.7 523C141.6 428.8 106.6 338.7 100.2 331.7C91.6 322.2 71.2 321.7 60.9 330.9C52.9 338 53.7 343 68.2 372C80.8 397.5 90.2 418.4 101.2 445.9C114.5 479.3 121.8 499.2 151.5 584.5C159.6 607.6 171.1 639.8 177.2 656C188.2 685.5 191.7 695.6 209 749C219.1 780 221.4 785.4 225.9 789.3C235.4 797.3 257.8 797.4 265.7 789.5C270.9 784.3 270.3 780.2 261 751.4C245.8 704.9 232 628.2 232 590.8C232 540.8 236.3 536.8 248 575.5C250.3 583.2 254.2 594.7 256.5 601C281.4 667.7 291.2 694.5 298.8 717C319.1 776.6 320.1 779.4 323.7 784.8C332.2 797.6 345.4 802.2 363 798.5C382.9 794.3 387 785.3 380.5 760.1C363.9 695.4 363.1 607 378.5 544.3C385.6 515.7 403.4 471 407.2 472.2C408.2 472.6 408.8 480.5 409.7 505.1C412.9 595.9 417.9 644.5 428 686.3C436.1 719.6 435.2 722.6 414.5 728.9C406.4 731.3 403.8 732.7 401 735.5L397.5 739.1L397.5 749.3C397.6 758.2 398 760.7 400.9 769.3C407.3 787.9 412.4 791.7 429.6 790.6C447.1 789.4 447.7 790 455.7 815.7C473.8 874.4 483.5 886 505.1 875C522.1 866.3 525.7 849.1 517.2 817C512.9 800.9 510.8 787.6 511.6 782.5C512.7 775.6 513.1 775 516.9 773C526.3 768.2 541.1 766.8 581.3 766.9C625.5 767 623.2 765.7 623.4 790.3C623.5 809.8 627.2 815.2 641.3 816.7C657.8 818.4 665.7 811 669.9 790.2C673.5 772.7 677.6 770.1 698.6 772.5C740.9 777.3 779.5 785.8 873.5 811C942.5 829.5 948.2 830.8 966 831.6C1002.5 833.4 1021.3 815.7 1021.5 779.5C1021.6 753.1 1008.9 735.2 969.5 706C897.4 652.5 815.2 617.5 724.3 601.6C698.8 597.1 699.2 597.9 703.5 565.6C708.1 531.4 708.9 530 725.4 530C742.6 530 787.4 542 833.7 559.1C867.6 571.6 873 572.6 882.4 568.1C898.4 560.3 914.7 528.3 909.9 513.9C903.3 494.2 823.8 464.1 746.5 452C728.8 449.2 729.2 449.4 727 445.7C724.4 441.5 724.4 433.3 727 422C733 395.6 722.2 382.7 694 382.5C663.2 382.4 657.4 389.4 654.1 430.9C652.5 450.6 649.8 454 633.2 457.5C598.4 464.8 564 479.2 520.4 504.8C495.4 519.5 495.3 519.4 496.3 499.7C498.5 456.1 526.5 286.5 538 246.1C546 218.1 543.6 209.4 526.8 205.5C518.2 203.5 502.5 202.7 495.8 204ZM645.8 540.2C648 542.4 644.7 584.9 642 590C640.5 592.8 635.5 592.6 610 588.6C600.9 587.2 588.3 585.6 582 584.9C562.5 583 560.2 580.6 569.1 571.9C580 561.3 596.7 552.3 619 545C638.7 538.5 643.3 537.7 645.8 540.2ZM507.9 623.5C535.2 639 563.8 646.6 621.2 653.5C628 654.4 632.7 657 633.6 660.6C634.5 664.3 630.1 711.8 628.5 715.7C626.1 721.4 625.2 721.5 591.2 720.2C574.3 719.5 548.4 719 533.5 719C496.2 719 497.9 720.3 495 688.7C492.2 658.5 490.6 624.1 491.9 620.7C493.5 616.6 497 617.2 507.9 623.5ZM716.1 669C799 693.4 862.9 724 895.3 754.8C904.2 763.4 903.2 763.7 884.7 758.6C842.9 746.8 768.7 733.4 709.5 727C677.6 723.5 678.2 723.6 677.5 720.7C676.8 717.8 684.8 665 686.2 663.3C688 661.1 691.5 661.8 716.1 669Z', TAG_VB = [53, 201, 970, 680];
const seed = s => () => (s = (s*16807) % 2147483647) / 2147483647;
const TAG_W = 1.4, TAG_CX = -.1, TAG_CY = 1.5, tagS = TAG_W/TAG_VB[2], TAG_H = TAG_VB[3]*tagS;
const tagTex = canvasTex(2048, Math.round(2048*TAG_VB[3]/TAG_VB[2]), (c,w)=>{ const s=w/TAG_VB[2]; c.scale(s,s); c.translate(-TAG_VB[0],-TAG_VB[1]); c.fillStyle='#141312'; c.fill(new Path2D(TAG_D),'evenodd'); });
const tagMesh = new THREE.Mesh(new THREE.PlaneGeometry(TAG_W, TAG_H), new THREE.MeshStandardMaterial({map:tagTex, alphaTest:.5, roughness:.32, metalness:0}));
tagMesh.position.set(TAG_CX, TAG_CY, .002); tagMesh.receiveShadow=true; scene.add(tagMesh);
const paintMat = new THREE.MeshStandardMaterial({color:0x020202, roughness:.22, metalness:0});
const SKIRT = .12, drips = [];
/* three hand-placed runs: two that make it to the floor, one that gives up halfway */
const DRIPS_USE = [[245,795,false,.009,.01],[492,878,true,.011,.015],[871,810,false,.008,.008]];
function stripGeo(len, w, r, z0){
  const rows = Math.max(8, Math.round(len/.004)), pos=[], idx=[], ph=r()*6, ph2=r()*6;
  for(let j=0;j<=rows;j++){
    const v=j/rows, y=-v*len, fillet = 1 + .7*Math.exp(-(v*len)/.008);
    const wob = 1 + .05*Math.sin(v*len*30+ph);
    const hw = .5*w*fillet*wob*(1 - .2*v), cx = 0;
    pos.push(cx-hw,y,z0, cx,y,z0+hw*.4, cx+hw,y,z0);
    if(j<rows){ const a=j*3; idx.push(a,a+3,a+1, a+1,a+3,a+4, a+1,a+4,a+2, a+2,a+4,a+5); }
  }
  const g=new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
  g.userData.rows=rows; g.setDrawRange(0,0); return g;
}
const beadGeo = new THREE.SphereGeometry(1,18,12);
DRIPS_USE.forEach(([px,py,toFloor,w,speed],k)=>{
  const r = seed(211+k*13);
  const x = TAG_CX + (px-(TAG_VB[0]+TAG_VB[2]/2))*tagS, y0 = TAG_CY - (py-(TAG_VB[1]+TAG_VB[3]/2))*tagS + .02;
  const maxL = toFloor ? y0 - SKIRT : [.08,0,.15][k];
  const d = {x, y0, w, maxL, toFloor, speed, delay:.5 + k*1.6, phase:r()*6, len:0, len2:0, pud:0};
  d.g = stripGeo(maxL, w, r, .0025); d.m = new THREE.Mesh(d.g, paintMat); d.m.position.set(x,y0,0); scene.add(d.m);
  d.b = new THREE.Mesh(beadGeo, paintMat); d.b.scale.set(w*.62, w*.9, w*.4); d.b.position.set(x,y0,.003); scene.add(d.b);
  if(toFloor){
    d.g2 = stripGeo(SKIRT, w*.8, r, .0185); d.m2 = new THREE.Mesh(d.g2, paintMat); d.m2.position.set(x,SKIRT,0); scene.add(d.m2);
    d.p = new THREE.Mesh(beadGeo, paintMat); d.p.position.set(x,.0008,.03); d.p.scale.set(.0001,.0001,.0001); d.p.visible=false; scene.add(d.p);
  }
  drips.push(d);
});
function showRows(g, frac){ const n = Math.round(g.userData.rows*frac); g.setDrawRange(0, n*12); }
function updateDrips(T, dt){
  drips.forEach(d=>{
    if(T < d.delay) { showRows(d.g, .012/d.maxL); return; }
    const surge = .2 + .8*Math.pow(.5 + .5*Math.sin(T*.9 + d.phase), 4);
    if(d.len < d.maxL){
      const tire = d.toFloor ? 1 : Math.max(.05, 1 - d.len/d.maxL);
      d.len = Math.min(d.maxL, d.len + d.speed*surge*tire*dt);
      showRows(d.g, Math.max(d.len, .012)/d.maxL);
      const swell = 1 + .1*surge;
      d.b.position.set(d.x, d.y0 - d.len - d.w*.35, .003); d.b.scale.set(d.w*.6*swell, d.w*.8*swell, d.w*.35);
    } else if(d.toFloor && d.len2 < SKIRT){
      d.len2 = Math.min(SKIRT, d.len2 + d.speed*surge*dt); showRows(d.g2, d.len2/SKIRT);
      d.b.position.set(d.x, SKIRT - d.len2 - d.w*.3, .0195);
    } else if(d.toFloor && d.pud < 1){
      d.b.visible = false; d.p.visible = true; d.pud = Math.min(1, d.pud + dt*.06);
      const e = 1 - Math.pow(1-d.pud, 2); d.p.scale.set(d.w*(.6 + 1.1*e), .0018, d.w*(.4 + .6*e));
    }
  });
}



/* ---------- the entrance: title vinyl, spray cans, and the floor credit ---------- */
const INK = '#141312';
function tracked(c, s, x, y, sp){ for(const ch of s){ c.fillText(ch, x, y); x += c.measureText(ch).width + sp; } return x; }
const VIN_W = 1.0, VIN_H = .5;
const vinylTex = canvasTex(2048, 1024, ()=>{});
function drawVinyl(){
  const c = vinylTex.image.getContext('2d'), w = 2048, h = 1024; c.clearRect(0,0,w,h);
  c.textBaseline = 'alphabetic';
  c.fillStyle = '#d8233d'; c.beginPath(); c.arc(26, 104, 20, 0, Math.PI*2); c.fill();
  c.fillStyle = INK; c.font = '700 54px "Montserrat Variable", Montserrat, sans-serif'; tracked(c, 'NOW SHOWING  \u00b7  ROOM ONE', 70, 123, 12);
  c.font = '900 190px "Unbounded Variable", Unbounded, "Arial Black", sans-serif'; tracked(c, 'MARK', -4, 400, 4); tracked(c, 'STAPLES', -4, 650, 4);
  c.fillRect(4, 760, 380, 12);
  c.font = '500 76px "Montserrat Variable", Montserrat, sans-serif'; c.fillText('Street pop art, paintings and sculpture', 4, 880);
  c.globalAlpha = .6; c.font = '700 50px "Montserrat Variable", Montserrat, sans-serif'; tracked(c, 'SOUTHAMPTON, UK', 6, 972, 13); c.globalAlpha = 1;
  // Mark's own hand over the clean lettering, like he signed the vinyl on opening night
  c.save(); c.translate(1090, 318); c.rotate(-.12); c.fillStyle = '#d8233d'; c.font = '124px "Permanent Marker", cursive';
  c.fillText('Peace & love x', 0, 0); c.restore();
  vinylTex.needsUpdate = true;
}
const vinyl = new THREE.Mesh(new THREE.PlaneGeometry(VIN_W, VIN_H), new THREE.MeshStandardMaterial({map:vinylTex, transparent:true, roughness:.34, metalness:0, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2}));
vinyl.receiveShadow = true; vinyl.renderOrder = 1; scene.add(vinyl);

/* two spray cans and a lid left on the floor under the drips */
function canLabel(body, band, tagCol){
  return canvasTex(1024, 512, (c,w,h)=>{
    c.fillStyle = body; c.fillRect(0,0,w,h);
    c.fillStyle = band; c.fillRect(0,0,w,h*.26);
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0,h*.26,w,4);
    for(let k=0;k<2;k++){ // the MS tag twice round the can, so one always faces you
      c.save(); const s = 300/TAG_VB[2]; c.translate(120 + k*512, h*.36); c.scale(s,s); c.translate(-TAG_VB[0],-TAG_VB[1]); c.fillStyle = tagCol; c.fill(new Path2D(TAG_D),'evenodd'); c.restore();
      c.fillStyle = tagCol; c.globalAlpha = .7; c.font = '700 26px "Montserrat Variable", Montserrat, sans-serif'; tracked(c, '400 ML  ·  MATT', 124 + k*512, h*.9, 5); c.globalAlpha = 1;
      c.fillStyle = band; c.beginPath(); c.arc(420 + k*512, h*.86, 22, 0, Math.PI*2); c.fill();
    }
    // a run of its own paint down the side
    c.fillStyle = band; c.fillRect(760, h*.26, 9, h*.22); c.beginPath(); c.arc(764.5, h*.48, 7, 0, Math.PI*2); c.fill();
  });
}
const canMetal = new THREE.MeshStandardMaterial({color:0xc9c7c2, roughness:.28, metalness:.55});
const CAN_R = .033, CAN_H = .16, CAN_S = 1.2;
function sprayCan(body, band, tagCol){
  const g = new THREE.Group();
  const lbl = new THREE.Mesh(new THREE.CylinderGeometry(CAN_R, CAN_R, CAN_H, 40, 1, true), new THREE.MeshStandardMaterial({map:canLabel(body, band, tagCol), roughness:.42, metalness:.12}));
  lbl.position.y = .006 + CAN_H/2; g.add(lbl);
  const pts = [[0,0],[CAN_R*.82,0],[CAN_R*.97,.002],[CAN_R,.006]].map(p=>new THREE.Vector2(p[0],p[1]));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 40), canMetal));
  const top = []; for(let i=0;i<=10;i++){ const a=i/10*Math.PI/2; top.push(new THREE.Vector2(Math.max(.011, CAN_R*Math.cos(a)), .166 + .026*Math.sin(a))); }
  top.push(new THREE.Vector2(.011,.196), new THREE.Vector2(.0105,.2), new THREE.Vector2(0,.2));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(top, 40), canMetal));
  const act = new THREE.Mesh(new THREE.CylinderGeometry(.0085,.0095,.014,24), new THREE.MeshStandardMaterial({color:0xf2f0ea, roughness:.5})); act.position.y = .207; g.add(act);
  const noz = new THREE.Mesh(new THREE.CylinderGeometry(.0018,.0018,.004,10), black); noz.rotation.x = Math.PI/2; noz.position.set(0,.209,.009); g.add(noz);
  g.traverse(m=>{ if(m.isMesh){ m.castShadow = true; m.receiveShadow = true; } });
  g.scale.setScalar(CAN_S); scene.add(g); return g;
}
const canA = sprayCan('#151515', '#76ceff', '#f4f1ea'); // black can, Mark's blue: the one he just used
const canB = sprayCan('#f1eee7', '#151515', '#141312');
const lid = new THREE.Mesh(new THREE.LatheGeometry([[0,.05],[.031,.05],[.034,.046],[.034,0],[.031,0],[.031,.044],[0,.044]].map(p=>new THREE.Vector2(p[0],p[1])),36), new THREE.MeshStandardMaterial({color:0x76ceff, roughness:.4, side:THREE.DoubleSide}));
lid.castShadow = true; lid.scale.setScalar(CAN_S); scene.add(lid);
const contact = (r, op) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(r,r), new THREE.MeshBasicMaterial({map:shadowRound, transparent:true, opacity:op, depthWrite:false})); m.rotation.x = -Math.PI/2; m.renderOrder = 1; scene.add(m); return m; };
const shA = contact(.16, .5), shB = contact(.2, .38), shL = contact(.11, .3);
shB.scale.set(1.5, .6, 1);
// overspray: a faint blue mist on the concrete where he tested the can
const mistTex = canvasTex(256,256,(c)=>{ const r = seed(77); for(let i=0;i<900;i++){ const a=r()*Math.PI*2, d=Math.pow(r(),.6)*118, s=.6+r()*2.2; c.fillStyle=`rgba(70,170,235,${(.12+r()*.4)*(1-d/125)})`; c.beginPath(); c.arc(128+Math.cos(a)*d, 128+Math.sin(a)*d*.7, s, 0, Math.PI*2); c.fill(); } const g=c.createRadialGradient(128,128,0,128,128,90); g.addColorStop(0,'rgba(70,170,235,.16)'); g.addColorStop(1,'rgba(70,170,235,0)'); c.fillStyle=g; c.fillRect(0,0,256,256); });
const mist = new THREE.Mesh(new THREE.PlaneGeometry(.5,.5), new THREE.MeshBasicMaterial({map:mistTex, transparent:true, opacity:.7, depthWrite:false})); mist.rotation.x = -Math.PI/2; mist.renderOrder = 1; scene.add(mist);

/* designer credit printed on the kickboard, starting at the left corner; a real link sits over it (see placeCredit) */
const CR_W = .62, CR_H = .062; let crS = 1;
const creditTex = canvasTex(2000, 200, ()=>{});
function drawCredit(){
  const c = creditTex.image.getContext('2d'); c.clearRect(0,0,2000,200); c.fillStyle = INK; c.textBaseline = 'middle';
  c.font = '500 104px "Montserrat Variable", Montserrat, sans-serif'; c.fillText('Exhibition design by ', 0, 104); let x = c.measureText('Exhibition design by ').width;
  c.font = '800 104px "Montserrat Variable", Montserrat, sans-serif'; c.fillText('Future Faced', x, 104); x += c.measureText('Future Faced').width;
  creditTex.needsUpdate = true;
}
const creditMat = new THREE.MeshBasicMaterial({map:creditTex, transparent:true, opacity:.7, depthWrite:false, color:0xffffff});
const credit = new THREE.Mesh(new THREE.PlaneGeometry(CR_W, CR_H), creditMat); credit.renderOrder = 1; scene.add(credit);
const creditLink = $('#ffCredit'); let creditHover = 0, creditHoverT = 0;
if(creditLink){
  on(creditLink, 'mouseenter', ()=>{ creditHoverT = 1; }); on(creditLink, 'mouseleave', ()=>{ creditHoverT = 0; });
  on(creditLink, 'focus', ()=>{ creditHoverT = 1; }); on(creditLink, 'blur', ()=>{ creditHoverT = 0; });
  on(creditLink, 'wheel', e=>{ e.preventDefault(); canvas.dispatchEvent(new WheelEvent('wheel', e)); }, {passive:false});
}

drawVinyl(); drawCredit();
if(document.fonts){ Promise.all(['900 80px "Unbounded Variable"','800 80px "Montserrat Variable"','500 40px "Montserrat Variable"','80px "Permanent Marker"'].map(f=>document.fonts.load(f))).then(()=>{ if(alive){ drawVinyl(); drawCredit(); } }).catch(()=>{}); }

/* wide screens: the vinyl hangs to the right of the tag; tall phones: tucked under it */
function placeEntrance(aspect){
  const narrow = aspect < .8;
  if(narrow){ vinyl.scale.setScalar(1.05); vinyl.position.set(-.14 + VIN_W*1.05/2, .62, .003); }
  else { vinyl.scale.setScalar(1); vinyl.position.set(.9 + VIN_W/2, 1.32, .003); }
  canA.position.set(narrow ? .58 : .3, 0, .17); canA.rotation.y = -.5;
  canB.position.set(narrow ? -.7 : -.62, CAN_R*CAN_S, .34); canB.rotation.set(0, .55, Math.PI/2);
  lid.position.set(narrow ? .3 : .02, .034, .42); lid.rotation.set(0, .9, Math.PI/2); lid.position.y = .034*CAN_S;
  shA.position.set(canA.position.x, .0012, canA.position.z + .01);
  shB.position.set(canB.position.x - .1*Math.cos(.55), .0012, canB.position.z + .1*Math.sin(.55) + .02); shB.rotation.z = .55;
  shL.position.set(lid.position.x, .0012, lid.position.z + .01);
  mist.position.set(canA.position.x + .1, .0011, .3);
  crS = narrow ? 1.3 : 1; credit.scale.setScalar(crS); credit.position.set((narrow ? -1.03 : ROOM.start + .12) + CR_W*crS/2, .062, .0186);
}
const crCorners = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
function placeCredit(dt){
  if(!creditLink) return;
  creditHover += (creditHoverT - creditHover)*(1-Math.exp(-dt*10));
  creditMat.opacity = .7 + .3*creditHover;
  const hide = inAbout || inInf || aboutV > .02 || infV > .02 || openIdx >= 0 || !grid.hidden;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9, behind=false;
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sz],i)=>{ const v=crCorners[i].set(credit.position.x+sx*CR_W*crS/2, credit.position.y+sz*CR_H*crS/2, credit.position.z).project(camera); if(v.z>1) behind=true;
    const px=(v.x*.5+.5)*vw, py=(-v.y*.5+.5)*vh; x0=Math.min(x0,px); x1=Math.max(x1,px); y0=Math.min(y0,py); y1=Math.max(y1,py); });
  const off = hide || behind || x1 < 0 || x0 > vw || y0 > vh - 4;
  creditLink.classList.toggle('off', off);
  if(!off){ const pad = 6; creditLink.style.transform = `translate(${(x0-pad).toFixed(1)}px,${(y0-pad).toFixed(1)}px)`; creditLink.style.width = (x1-x0+pad*2).toFixed(1)+'px'; creditLink.style.height = (y1-y0+pad*2).toFixed(1)+'px'; }
}


/* pieces */
const hitMeshes = [];
function addHit(m,i){ m.userData.idx=i; hitMeshes.push(m); }
let torsoMesh, torsoGeo, torsoMat;

/* soft wedge of light falling down the wall from a picture light */
const beamTex = (()=>{ const w=256,h=512,c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'), id=x.createImageData(w,h);
  for(let y=0;y<h;y++){ const v=y/h, half=(.16+.84*Math.pow(v,.8))*.5*w, a=Math.pow(1-v,1.25)*(v<.04? v/.04:1);
    for(let xx=0;xx<w;xx++){ const d=Math.abs(xx-w/2)/half; const edge=d>1?0:Math.pow(1-d*d,1.6); const k=(y*w+xx)*4; id.data[k]=255; id.data[k+1]=246; id.data[k+2]=228; id.data[k+3]=Math.round(255*a*edge); } }
  x.putImageData(id,0,0); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; })();
const coneTex = canvasTex(64,256,(c,w,h)=>{ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(255,246,228,.9)'); g.addColorStop(1,'rgba(255,246,228,.05)'); c.fillStyle=g; c.fillRect(0,0,w,h); });
const glowOff = new THREE.Color(0x2b2925), glowOn = new THREE.Color(0xFFF3DA);
const lampMat = new THREE.MeshStandardMaterial({color:0x1c1b19, roughness:.38, metalness:.4});

function pictureLight(x, yTop, width, zOff){
  const g = new THREE.Group(); g.position.set(x, yTop, zOff||0);
  const mount = new THREE.Mesh(new THREE.BoxGeometry(.06,.04,.02), lampMat); mount.position.set(0,.04,.01); g.add(mount);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(.016,.016,.2), lampMat); arm.position.set(0,.04,.11); arm.rotation.x=.35; g.add(arm);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,width,24), lampMat); bar.rotation.z=Math.PI/2; bar.position.set(0,0,.2); g.add(bar);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(width*.96,.006,.026), new THREE.MeshBasicMaterial({color:glowOff.clone()})); strip.position.set(0,-.024,.2); g.add(strip);
  scene.add(g); return strip.material;
}
function beam(x, yTop, yBot, width, z){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, yTop-yBot), new THREE.MeshBasicMaterial({map:beamTex, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending}));
  m.position.set(x,(yTop+yBot)/2, z||.003); m.renderOrder=2; scene.add(m); return m.material;
}

/* the real piece: a body built from Mark's photos (outline from the front and side shots, surface from all four), standing straight on the plinth,
   swapped in for the stand-in shape as soon as it has loaded */
let scanReady = false, scanBase = null;
const footTex = canvasTex(128,128,(c,w,h)=>{ const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2); g.addColorStop(0,'rgba(0,0,0,.75)'); g.addColorStop(.45,'rgba(0,0,0,.45)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(0,0,w,h); });
function loadScan(base){
  fetch(base + '.json').then(r => r.json()).then(d => {
    const tex = loader.load(base + '.webp', () => { if(alive) applyScan(d, tex); }); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = maxAniso;
  }).catch(() => {});
}
function applyScan(d, tex){
  const H = d.height, P = d.profile, f0 = P[0][0], f1 = P[P.length-1][0], baseT = 0, S = 128, N = P.length;
  const pos = [], uv = [], idx = [];
  for(let j=0;j<N;j++){ const [f, w, df, db] = P[j], y = baseT + (f1 - f) * H;
    for(let k=0;k<=S;k++){ const th = k / S * Math.PI * 2, dz = Math.cos(th) >= 0 ? df : db;
      pos.push(w * Math.sin(th) * H, y, dz * Math.cos(th) * H); uv.push(k / S, 1 - (f - f0) / (f1 - f0)); } }
  for(let j=0;j<N-1;j++) for(let k=0;k<S;k++){ const a=j*(S+1)+k, b=a+S+1; idx.push(a,b,a+1, a+1,b,b+1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({map:tex, roughness:.72, metalness:0}); // matte: the photos already carry the real sheen
  const black = new THREE.MeshStandardMaterial({color:0x141312, roughness:.6});
  const makeBase = () => { const grp = new THREE.Group();
    // the open neck, closed with a dark cap just inside the rim
    const [fT, wT, dfT, dbT] = P[0], cap = new THREE.Mesh(new THREE.CircleGeometry(1, 48), black);
    cap.rotation.x = -Math.PI/2; cap.scale.set(wT * H * .97, (dfT + dbT) / 2 * H * .97, 1); cap.position.set(0, baseT + (f1 - fT) * H - .004, (dfT - dbT) / 2 * H); grp.add(cap);
    // a soft contact shadow under its foot that turns with it, instead of the spotlight's hard cast shadow
    const [, wB, dfB, dbB] = P[N-1], foot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map:footTex, transparent:true, opacity:.55, depthWrite:false}));
    foot.rotation.x = -Math.PI/2; foot.scale.set(wB * H * 2.9, (dfB + dbB) * H * 1.45, 1); foot.position.set(0, .0015, (dfB - dbB) / 2 * H); foot.renderOrder = 1; grp.add(foot);
    cap.castShadow = false; return grp; };
  scanReady = true; scanBase = makeBase;
  torsoGeo = g; if(torsoMat && torsoMat.map) torsoMat.map.dispose(); torsoMat = mat;
  PIECES.forEach(p => { if(!p.torso) return; const t = p.torso; t.geometry = g; t.material = mat; t.scale.set(1,1,1); t.position.y = p.ph; t.castShadow = false; t.add(makeBase()); });
  if(spin){ spin.m.geometry = g; spin.m.material = mat; spin.m.scale.set(1,1,1); spin.m.add(makeBase()); }
}
function buildTorso(){
  const pts = [[0,0],[.17,0],[.18,.03],[.16,.14],[.148,.26],[.165,.38],[.2,.47],[.225,.53],[.228,.565],[.21,.595],[.15,.615],[.085,.632],[.06,.65],[.057,.73],[.062,.75],[0,.755]].map(a=>new THREE.Vector2(a[0],a[1]));
  torsoGeo = new THREE.LatheGeometry(pts, 72);
  const words=['LOVE','NO FUTURE','SOHO','PUNK','FOLIE','SMILE','LONDON','XOXO','HEART','RIOT','1977','BABY','DREAM','KISS','STAY'];
  const cols=['#f4f1ea','#f2d64b','#ff7ab6','#7fd6ff','#b8f27a','#ffffff'];
  const tex = canvasTex(1536,768,(c,w,h)=>{
    c.fillStyle='#121212'; c.fillRect(0,0,w,h);
    c.lineCap='round';
    for(let i=0;i<120;i++){ c.strokeStyle=cols[(rand()*cols.length)|0]; c.globalAlpha=.55; c.lineWidth=1.5+rand()*2.5; c.beginPath(); let x=rand()*w,y=rand()*h; c.moveTo(x,y); for(let k=0;k<4;k++){ x+=(rand()-.5)*120; y+=(rand()-.5)*60; c.lineTo(x,y);} c.stroke(); }
    c.globalAlpha=1;
    for(let i=0;i<190;i++){ c.save(); c.translate(rand()*w, rand()*h); c.rotate((rand()-.5)*.9); c.fillStyle=cols[(rand()*cols.length)|0]; c.font=(18+rand()*34|0)+'px "Permanent Marker", cursive'; c.fillText(words[(rand()*words.length)|0],0,0); c.restore(); }
    const g=c.createLinearGradient(0,0,110,0); g.addColorStop(0,'#e9c766'); g.addColorStop(.5,'#b98b2c'); g.addColorStop(1,'#f0d27a');
    c.fillStyle=g; c.fillRect(0,0,64,h); c.save(); c.translate(w,0); c.scale(-1,1); c.fillRect(0,0,64,h); c.restore();
    c.fillStyle='#161514'; c.font='26px "Permanent Marker", cursive'; c.save(); c.translate(20,140); c.rotate(Math.PI/2); c.fillText('ONE OF ONE',0,0); c.restore();
  });
  torsoMat = new THREE.MeshStandardMaterial({map:tex, roughness:.32, metalness:.15});
  torsoMesh = new THREE.Mesh(torsoGeo, torsoMat); torsoMesh.scale.set(1.18,1,.56);
  return torsoMesh;
}

function track(p, mat){ p.mats.push({m:mat, base:mat.color.clone()}); return mat; }

PIECES.forEach((p,i)=>{
  const g = new THREE.Group(); p.mats=[]; p.lit=0; p.onAt=null; p.focus=1;
  if(p.sculpture){
    const ph = p.ph = p.model==='cutout' ? 1.12 : 1.0, pw = p.model==='cutout' ? .42 : .52;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(pw,ph,pw), track(p,new THREE.MeshLambertMaterial({color:0xF7F5F1}))); plinth.position.y=ph/2; g.add(plinth); addHit(plinth,i);
    if(p.model==='torso'){ const t = buildTorso(); t.position.y=1.0; g.add(t); addHit(t,i); p.torso=t; if(p.scan) loadScan(p.scan); }
    else {
      const im=IMG[p.id], fh=p.figH, fw=fh*im.w/im.h, tex=imgTex(im.src);
      const fig = new THREE.Mesh(new THREE.PlaneGeometry(fw,fh), new THREE.MeshStandardMaterial({map:tex, alphaTest:.5, roughness:.45, side:THREE.DoubleSide}));
      fig.customDepthMaterial = new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking, map:tex, alphaTest:.5});
      const holder = new THREE.Group(); holder.position.y = ph; fig.position.y = fh/2 - .004; holder.add(fig); g.add(holder); addHit(fig,i); p.cut = holder;
    }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(.95,.95), new THREE.MeshBasicMaterial({map:shadowRect, transparent:true, opacity:.22, depthWrite:false}));
    sh.rotation.x=-Math.PI/2; sh.position.set(0,.003,0); g.add(sh); p.shMat = sh.material;
    p.point = new THREE.PointLight(0xfff1dc, 0, 3.4); p.point.position.set(.15,2.4,.6); g.add(p.point);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(.07,.62,H-.05,40,1,true), new THREE.MeshBasicMaterial({map:coneTex, transparent:true, opacity:0, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending}));
    cone.position.set(0,(H-.05)/2,0); g.add(cone); p.beamMat = cone.material; p.beamMax=.05;
    const pool = new THREE.Mesh(new THREE.CircleGeometry(.75,48), new THREE.MeshBasicMaterial({map:poolTex, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending}));
    pool.rotation.x=-Math.PI/2; pool.position.y=.005; g.add(pool); p.poolMat = pool.material; p.poolMax=.28;
    const can = new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,.14,20), lampMat); can.position.y=H-.07; g.add(can);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(.062,24), new THREE.MeshBasicMaterial({color:glowOff.clone()})); lens.rotation.x=Math.PI/2; lens.position.y=H-.142; g.add(lens); p.glowMat=lens.material;
    p.cy = 1.4; g.position.set(p.x,0,1.05); p.baseY=0;
    p.spotPos=new THREE.Vector3(p.x,H-.1,1.05+.75); p.spotTgt=new THREE.Vector3(p.x,ph+.15,1.05); p.spotAngle=p.model==='cutout'?.26:.34; p.spotI=1.45;
  } else {
    const f = FRAMES[p.frame], t=f.t, d=.05, W=p.w, Hh=p.h;
    let art;
    if(p.cutWall){
      const tex=imgTex(IMG[p.id].src);
      art = new THREE.Mesh(new THREE.PlaneGeometry(W,W*IMG[p.id].h/IMG[p.id].w), new THREE.MeshStandardMaterial({map:tex, alphaTest:.45, roughness:.4, metalness:.15}));
      art.customDepthMaterial = new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking, map:tex, alphaTest:.45});
      art.position.z = .035;
      const rM = W*.268;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rM, .011, 12, 96), track(p,new THREE.MeshStandardMaterial({color:0xA3172B, roughness:.32, metalness:.45}))); ring.position.z=.037; g.add(ring);
      const sheenTex = canvasTex(256,256,(c,w,h)=>{ const gr=c.createLinearGradient(0,0,w,h); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.42,'rgba(255,255,255,0)'); gr.addColorStop(.5,'rgba(255,255,255,.9)'); gr.addColorStop(.58,'rgba(255,255,255,0)'); gr.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=gr; c.fillRect(0,0,w,h); });
      sheenTex.wrapS = THREE.RepeatWrapping;
      const sheen = new THREE.Mesh(new THREE.CircleGeometry(rM-.006,64), new THREE.MeshBasicMaterial({map:sheenTex, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending}));
      sheen.position.z=.0365; g.add(sheen); p.sheen = sheen.material;
      const back = new THREE.Mesh(new THREE.CylinderGeometry(rM*.9,rM*.9,.026,48), track(p,new THREE.MeshStandardMaterial({color:0x2a2420, roughness:.7}))); back.rotation.x=Math.PI/2; back.position.z=.013; g.add(back);
    } else if(p.box){
      const tex=imgTex(IMG[p.id].src), dz=.045;
      const sideM = p.wrap ? new THREE.MeshStandardMaterial({map:tex, roughness:.7}) : track(p,new THREE.MeshStandardMaterial({color:p.side, roughness:.55}));
      const front = new THREE.MeshStandardMaterial({map:tex, roughness:.6});
      art = new THREE.Mesh(new THREE.BoxGeometry(W,Hh,dz), [sideM,sideM,sideM,sideM,front,sideM]);
      art.position.z = dz/2;
    } else {
      art = new THREE.Mesh(p.round ? new THREE.CircleGeometry(W/2,96) : new THREE.PlaneGeometry(W,Hh), new THREE.MeshStandardMaterial({map:imgTex(IMG[p.id].src), roughness:.62}));
      art.position.z = t ? .015 : .02;
    }
    g.add(art); addHit(art,i); p.artMat = art.material;
    if(p.round && !p.cutWall){ const rim=new THREE.Mesh(new THREE.CylinderGeometry(W/2,W/2,.06,96,1,true), track(p,new THREE.MeshStandardMaterial({color:0x1a1a1a, roughness:.5}))); rim.rotation.x=Math.PI/2; rim.position.z=-.01; g.add(rim); }
    if(t){
      const mat = f.stripe ? null : track(p,new THREE.MeshStandardMaterial({color:f.color, roughness:f.rough, metalness:f.metal}));
      const bars=[[W+2*t,t,0,(Hh+t)/2],[W+2*t,t,0,-(Hh+t)/2],[t,Hh,-(W+t)/2,0],[t,Hh,(W+t)/2,0]];
      bars.forEach(b=>{ let m=mat; if(f.stripe){ const st=stripeTex.clone(); st.needsUpdate=true; st.repeat.set(Math.max(b[0],b[1])/.16,1); if(b[1]>b[0]){ st.center.set(.5,.5); st.rotation=Math.PI/2; } m=track(p,new THREE.MeshStandardMaterial({map:st, roughness:.5})); }
        const bar=new THREE.Mesh(new THREE.BoxGeometry(b[0],b[1],d), m); bar.position.set(b[2],b[3],d/2); g.add(bar); addHit(bar,i); });
      if(p.tape){ const tp=new THREE.Mesh(new THREE.PlaneGeometry(.2,.055), track(p,new THREE.MeshStandardMaterial({color:0xC8A44C, roughness:.5, metalness:.3}))); tp.position.set(W/2+t*.4, Hh/2+t*.4, d+.002); tp.rotation.z=-Math.PI/4; g.add(tp); }
    }
    const FW=W+2*t, FH=Hh+2*t, frac=.5;
    p.cy = 1.5; p.baseY = p.cy; p.fh = FH; p.fw = FW;
    g.position.set(p.x,p.cy,0);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(FW/frac, FH/frac), new THREE.MeshBasicMaterial({map:p.round?shadowRound:shadowDrop, transparent:true, opacity:0, depthWrite:false}));
    sh.position.set(p.x+.012,p.cy-.035,.002); sh.renderOrder=1; sh.visible = !p.cutWall; scene.add(sh); p.shMat = sh.material;
    if(!p.cutWall){ const halo = new THREE.Mesh(new THREE.PlaneGeometry(FW/.5, FH/.5), new THREE.MeshBasicMaterial({map:shadowHalo, transparent:true, opacity:0, depthWrite:false}));
      halo.position.set(p.x, p.cy-.012, .0018); halo.renderOrder=1; scene.add(halo); p.haloMat = halo.material; }
    const yTop = p.cy + FH/2 + .26;
    p.glowMat = pictureLight(p.x, yTop, Math.min(.62, Math.max(.32, FW*.5)));
    p.beamMat = beam(p.x, yTop-.03, yTop-.42, Math.min(.62,Math.max(.32,FW*.5))*2.2); p.beamMax = .15;
    p.spotPos=new THREE.Vector3(p.x, yTop+.3, 1.15); p.spotTgt=new THREE.Vector3(p.x, p.cy-FH*.18, 0);
    p.spotAngle=THREE.MathUtils.clamp(Math.atan((FW*.66+.25)/(FH*.8+.4)),.4,.85); p.spotI=1.35;
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(FW*2.2+.7, FH*1.8+.7), new THREE.MeshBasicMaterial({map:poolTex, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending}));
    pool.position.set(p.x, p.cy+.1, .0025); scene.add(pool); p.poolMat = pool.material; p.poolMax=.035;
    if(p.sold){ const dot=new THREE.Mesh(new THREE.CircleGeometry(.024,32), new THREE.MeshBasicMaterial({color:0xd8233d})); dot.position.set(p.x+FW/2+.07, p.cy-FH/2+.03, .004); scene.add(dot); }
  }
  const realShadow = p.sculpture || p.cutWall;
  g.traverse(m=>{ if(m.isMesh && !m.material.transparent){ m.castShadow=realShadow; m.receiveShadow=true; } });
  p.group = g; scene.add(g);
});

/* the wall title gets its own picture light */
const NAME = {x:-.1, lit:0, onAt:null, focus:1};
NAME.glowMat = pictureLight(-.1, TAG_CY+TAG_H/2+.2, .78);
NAME.beamMat = beam(-.1, TAG_CY+TAG_H/2+.17, TAG_CY+TAG_H/2-.3, 1.7); NAME.beamMax=.15;
NAME.spotPos=new THREE.Vector3(-.1,TAG_CY+TAG_H/2+.36,.85); NAME.spotTgt=new THREE.Vector3(-.1,1.05,0); NAME.spotAngle=.66; NAME.spotI=1.45;

/* a small pool of real spotlights follows the lit pieces nearest the visitor */
PIECES.forEach(p=>{ p.seen=true; }); // only the opening canvas flickers; the rest fade up
const LIGHTABLE=[NAME].concat(PIECES), N_SPOTS=4, SMAP=coarse?512:1024, SPOTS=[];
for(let i=0;i<N_SPOTS;i++){ const s=new THREE.SpotLight(0xFFEFD6, 0, 6, .6, .62, 1.1); s.castShadow=true; s.shadow.mapSize.set(SMAP,SMAP); s.shadow.bias=-.0006; s.shadow.radius=3; s.shadow.camera.near=.05; s.shadow.camera.far=6; scene.add(s); scene.add(s.target); SPOTS.push(s); }

/* ---------- about: turn right to a side wall where the bio gets sprayed on ---------- */
let inAbout = false, aboutV = 0, aboutTurn = false, aboutPhase = null, originX = 0;
const ABOUT_X = ROOM.end - 2.6; // where you stand to read the end wall
{ const sk0 = new THREE.Mesh(new THREE.BoxGeometry(.018,.12,D), skirt.material); sk0.position.set(ROOM.start+.009,.06,D/2); sk0.receiveShadow = true; scene.add(sk0); }
{ const sk = new THREE.Mesh(new THREE.BoxGeometry(.018,.12,D), skirt.material); sk.position.set(ROOM.end-.009,.06,D/2); sk.receiveShadow = true; scene.add(sk); }
const ABOUT_L = { x:0, lit:0, onAt:null, focus:1, seen:true, on:false, glowMat:new THREE.MeshBasicMaterial({color:0}), beamMat:new THREE.MeshBasicMaterial(), beamMax:0,
  spotPos:new THREE.Vector3(), spotTgt:new THREE.Vector3(), spotAngle:1.0, spotI:2.3 };
LIGHTABLE.push(ABOUT_L);

/* the end of the room: Mark's painted arrow pointing round the corner to the About wall */
const END_X = ROOM.end - 1.6 + .78;
const endTex = canvasTex(1024, 512, ()=>{});
function drawEnd(nudge = 0, hov = 0){
  // nudge: how far the arrow has slid along (px), hov: 0..1 hover glow. Redrawn only while they change.
  const c = endTex.image.getContext('2d'); c.clearRect(0,0,1024,512);
  c.fillStyle = '#d8233d'; c.strokeStyle = '#d8233d'; c.lineCap = 'round'; c.lineJoin = 'round';
  c.save(); c.translate(70, 190); c.rotate(-.06); c.font = '112px "Permanent Marker", cursive'; c.fillText('Meet the', 0, 0); c.fillText('artist', 40, 120);
  if (hov > .01) { c.globalAlpha = hov; c.lineWidth = 9; c.beginPath(); c.moveTo(44, 150); c.bezierCurveTo(140, 168, 260, 160, 360, 146); c.stroke(); c.globalAlpha = 1; }
  c.restore();
  // a quick, loose hand-drawn arrow that keeps nudging round the corner
  const d = nudge + hov * 34;
  c.lineWidth = 22 + hov * 5; c.beginPath(); c.moveTo(150, 405); c.bezierCurveTo(360, 450, 620 + d * .6, 430, 880 + d, 360); c.stroke();
  c.beginPath(); c.moveTo(770 + d, 300); c.lineTo(888 + d, 356); c.lineTo(800 + d, 452); c.stroke();
  endTex.needsUpdate = true;
}
drawEnd();
if(document.fonts) document.fonts.load('80px "Permanent Marker"').then(()=>{ if(alive) drawEnd(); }).catch(()=>{});
const endMat = new THREE.MeshStandardMaterial({map:endTex, transparent:true, roughness:.3, metalness:0, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2});
const endSign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .55), endMat); endSign.position.set(END_X, 1.3, .003); endSign.renderOrder = 1; scene.add(endSign);
/* and underneath, in Mark's blue: the way to the rest of his work */
const workTex = canvasTex(1024, 256, ()=>{});
function drawWork(nudge = 0, hov = 0){
  // same hand as "Meet the artist": solid marker, no outline. A touch deeper than #76ceff so it reads on the pale wall
  const c = workTex.image.getContext('2d'); c.clearRect(0,0,1024,256);
  c.fillStyle = '#4fb4ec'; c.strokeStyle = '#4fb4ec'; c.lineCap = 'round'; c.lineJoin = 'round';
  c.save(); c.translate(110, 140); c.rotate(-.04); c.font = '104px "Permanent Marker", cursive'; c.fillText('See all work', 0, 0); c.restore();
  const d = nudge + hov * 34;
  c.lineWidth = 20 + hov * 5; c.beginPath(); c.moveTo(150, 205); c.bezierCurveTo(400, 236, 640 + d * .6, 228, 860 + d, 196); c.stroke();
  c.beginPath(); c.moveTo(800 + d, 160); c.lineTo(868 + d, 194); c.lineTo(812 + d, 238); c.stroke();
  workTex.needsUpdate = true;
}
drawWork();
if(document.fonts) document.fonts.load('80px "Permanent Marker"').then(()=>{ if(alive) drawWork(); }).catch(()=>{});
const workMat = new THREE.MeshStandardMaterial({map:workTex, transparent:true, roughness:.3, metalness:0, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2});
const workSign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .275), workMat); workSign.position.set(END_X, .84, .003); workSign.renderOrder = 1; scene.add(workSign);
let endHover = false, workHover = false;
// the end signs nudge their arrows now and then so they read as buttons, and lean in on hover
const SIGN = { eh: 0, wh: 0, last: '' };

/* ---------- after hours: the wall gets tagged up as the day goes on, and is painted white again at 6am ----------
   Everything here is optional dressing: if an image fails or anything throws, the room just stays clean. */
const GRAF = { fade: 0, mode: 'live', v: -1, night: 0, nightT: 0, ready: false, segs: [], items: [], clouds: [], pastes: [] };
try { localStorage.removeItem('ms-clock'); } catch (e) {} // the old manual switch is gone; always follow the real clock
const SEG_W = 3.6, SEG_PX = 1024, PPM = SEG_PX / SEG_W; // segments square: wall height is 3.6 m
const TIME_OVERRIDE = (() => { const t = parseFloat(new URLSearchParams(location.search).get('time')); return t >= 0 && t < 24 ? t : null; })(); // preview any hour: /?time=21
function grafProgress(now) {
  if (GRAF.mode === 'midnight') return { v: 1, night: 1 };
  const h = TIME_OVERRIDE ?? (now.getHours() + now.getMinutes() / 60);
  // 6am clean -> 10am first small tags -> 2pm more -> 6pm words and spray -> 10pm full, until 6am
  const hh = ((h - 6) + 24) % 24 + 6; // 6..30, so the night runs on past midnight
  const v = hh < 10 ? 0 : hh < 14 ? (hh - 10) / 4 * .25 : hh < 18 ? .25 + (hh - 14) / 4 * .3 : hh < 22 ? .55 + (hh - 18) / 4 * .45 : 1;
  const night = h >= 19 || h < 6 ? 1 : h >= 17 ? (h - 17) / 2 : 0; // lights down from 5pm to 7pm
  return { v, night };
}
function buildGrafItems() {
  const r = seed(911), it = [], COLS = ['#d8233d', '#4fb4ec', '#141312', '#f2c230', '#e8317a', '#2e9e5b', '#f4f1ea'];
  const words = ['MS11', 'Peace & love', 'Be you', 'LOVE', 'MS', 'x', 'Mark was here', 'Be kind', 'Never give up', 'Chaos', 'Only love', 'Smile', 'Be you tiful', 'Keep going', 'Soton', 'Brighton', 'xoxo', 'Hope', 'MS11 x', 'Dream'];
  const FONTS = ['"Permanent Marker"', '"Rubik Spray Paint"', '"Sedgwick Ave Display"', 'Knewave', '"Rock Salt"', '"Caveat Brush"'];
  const SHAPES = ['heart', 'smiley', 'star', 'crown', 'arrow', 'splat', 'drips', 'xs', 'heart', 'smiley'];
  for (let x = ROOM.start + .2; x < ROOM.end - .2; x += .32) {
    if (r() < .75) it.push({ k: 'cloud', x: x + r() * .32, y: .3 + r() * 3, w: 1.3 + r() * 1.8, a: .24 + r() * .26, i: Math.floor(r() * 6), t: .5 + r() * .5 });
    if (r() < .85) { const s = .2 + r() * .75; it.push({ k: 'tag', x: x + r() * .5, y: .5 + r() * 2.5, w: s, rot: (r() - .5) * .5, c: COLS[Math.floor(r() * COLS.length)], t: Math.min(1, s * .55 + r() * .5 - .08), drip: r() < .4 }); }
    if (r() < .5) it.push({ k: 'word', x: x + r() * .5, y: .35 + r() * 2.9, s: .07 + r() * .12, rot: (r() - .5) * .35, c: COLS[Math.floor(r() * COLS.length)], w: words[Math.floor(r() * words.length)], t: .3 + r() * .7, f: FONTS[Math.floor(r() * FONTS.length)] });
    if (r() < .75) { const s = .12 + r() * .45; it.push({ k: 'shape', sh: SHAPES[Math.floor(r() * SHAPES.length)], x: x + r() * .32, y: .3 + r() * 3, w: s, rot: (r() - .5) * .6, c: COLS[Math.floor(r() * COLS.length)], t: Math.min(1, s * .7 + r() * .6 - .05), lw: .02 + r() * .025 }); }
  }
  return it.sort((a, b) => a.t - b.t);
}
// soft clouds of Mark's own spray, cut from his canvases
function makeClouds(img) {
  const out = [];
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    const sw = img.width * .45, sx = (img.width - sw) * ((k * .37) % 1), sy = (img.height - sw * .9) * ((k * .61) % 1);
    x.drawImage(img, sx, sy, sw, sw * .9, 0, 0, 512, 512);
    x.globalCompositeOperation = 'destination-in';
    const g = x.createRadialGradient(256, 256, 40, 256, 256, 256); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 512, 512); out.push(c);
  }
  return out;
}
// the parts of the wall that stay clean: behind every piece, the tag, the vinyl and the end signs
function cleanZones() {
  const z = [];
  // no patches behind the art: the graffiti runs right up to the frames
  z.push([TAG_CX, TAG_CY, TAG_W + .2, TAG_H + .25, .45]);
  z.push([vinyl.position.x, vinyl.position.y, VIN_W * vinyl.scale.x + .2, VIN_H * vinyl.scale.y + .2, .72]);
  z.push([END_X, 1.1, 1.45, 1.1, .82]);
  return z;
}
// simple spray-can shapes in Mark's vocabulary: hearts, smileys, stars, crowns, arrows, splats, drips
function drawShape(c, o, s) {
  const r = seed(Math.abs(Math.round(o.x * 1000 + o.y * 77)) + 7); c.strokeStyle = c.fillStyle = o.c; c.lineWidth = Math.max(3, o.lw * PPM); c.lineCap = c.lineJoin = 'round';
  c.shadowColor = o.c; c.shadowBlur = 6; const h = s / 2;
  if (o.sh === 'heart') { c.beginPath(); c.moveTo(0, h * .7); c.bezierCurveTo(-h * 1.3, -h * .2, -h * .5, -h * 1.1, 0, -h * .35); c.bezierCurveTo(h * .5, -h * 1.1, h * 1.3, -h * .2, 0, h * .7); r() < .5 ? c.fill() : c.stroke(); }
  else if (o.sh === 'smiley') { c.beginPath(); c.arc(0, 0, h, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(-h * .35, -h * .2, h * .1, 0, Math.PI * 2); c.arc(h * .35, -h * .2, h * .1, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(0, h * .05, h * .5, .15 * Math.PI, .85 * Math.PI); c.stroke(); }
  else if (o.sh === 'star') { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? h * .42 : h; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); r() < .5 ? c.fill() : c.stroke(); }
  else if (o.sh === 'crown') { c.beginPath(); c.moveTo(-h, h * .4); c.lineTo(-h, -h * .4); c.lineTo(-h * .5, h * .05); c.lineTo(0, -h * .6); c.lineTo(h * .5, h * .05); c.lineTo(h, -h * .4); c.lineTo(h, h * .4); c.closePath(); c.stroke(); }
  else if (o.sh === 'arrow') { c.beginPath(); c.moveTo(-h, h * .2); c.quadraticCurveTo(0, -h * .5, h, 0); c.stroke(); c.beginPath(); c.moveTo(h * .6, -h * .35); c.lineTo(h, 0); c.lineTo(h * .55, h * .3); c.stroke(); }
  else if (o.sh === 'splat') { c.shadowBlur = 0; c.beginPath(); c.arc(0, 0, h * .35, 0, Math.PI * 2); c.fill(); for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = h * (.4 + r() * .7), rr = 1.5 + r() * h * .08; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, rr, 0, Math.PI * 2); c.fill(); } }
  else if (o.sh === 'drips') { c.shadowBlur = 0; c.fillRect(-h, -h * .15, s, h * .25); for (let i = 0; i < 6; i++) { const dx = -h + r() * s, len = h * (.3 + r() * 1.4), w = 3 + r() * 5; c.fillRect(dx, 0, w, len); c.beginPath(); c.arc(dx + w / 2, len, w * .8, 0, Math.PI * 2); c.fill(); } }
  else if (o.sh === 'xs') { c.font = `${Math.round(h * .9)}px "Permanent Marker", cursive`; c.fillText('x x x', -h, 0); }
  c.shadowBlur = 0;
}
function drawSeg(seg, v) {
  const c = seg.ctx, x0 = seg.x0; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, SEG_PX, SEG_PX);
  const X = x => (x - x0) * PPM, Y = y => (H - y) * PPM;
  for (const o of GRAF.items) {
    if (o.t > v) break;
    const span = (o.w || 1) * 1.2; if (o.x + span < x0 || o.x - span > x0 + SEG_W) continue;
    c.save(); try { c.translate(X(o.x), Y(o.y));
    if (o.k === 'cloud' && GRAF.clouds.length) { const s = o.w * PPM; c.globalAlpha = o.a; c.drawImage(GRAF.clouds[o.i % GRAF.clouds.length], -s / 2, -s / 2, s, s); }
    else if (o.k === 'tag') {
      const s = o.w * PPM / TAG_VB[2]; c.rotate(o.rot); c.scale(s, s); c.translate(-TAG_VB[0] - TAG_VB[2] / 2, -TAG_VB[1] - TAG_VB[3] / 2);
      c.globalAlpha = .82; c.shadowColor = o.c; c.shadowBlur = 10 / s * .02; c.fillStyle = o.c; c.fill(new Path2D(TAG_D), 'evenodd');
      if (o.drip) { c.shadowBlur = 0; c.fillRect(TAG_VB[0] + TAG_VB[2] * .45, TAG_VB[1] + TAG_VB[3] * .8, 9, TAG_VB[3] * .55); }
    }
    else if (o.k === 'paste' && GRAF.pastes.length) {
      const im = GRAF.pastes[o.i % GRAF.pastes.length]; const w = o.w * PPM, h = w * im.height / im.width; c.rotate(o.rot);
      c.globalAlpha = .9; c.fillStyle = '#f6f3ec'; c.fillRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12); c.drawImage(im, -w / 2, -h / 2, w, h);
    }
    else if ((o.k === 'word' && o.x > END_X - 1.9 && o.y > .4 && o.y < 1.95) || (o.k === 'shape' && Math.abs(o.x - END_X) < 1 && o.y > .45 && o.y < 1.85)) { /* nothing fighting the end signs */ }
    else if (o.k === 'word') { c.rotate(o.rot); c.globalAlpha = .85; c.fillStyle = o.c; c.font = `${Math.round(o.s * PPM)}px ${o.f || '"Permanent Marker"'}, cursive`; c.fillText(o.w, 0, 0); }
    else if (o.k === 'shape') { c.rotate(o.rot); c.globalAlpha = .8; drawShape(c, o, o.w * PPM); }
    } catch (e) { /* skip this one mark, keep drawing the rest */ } c.shadowBlur = 0; c.restore();
  }
  // fade the whole layer back so it reads as texture, then wipe clean patches with soft edges
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, 0, SEG_PX, SEG_PX);
  for (const [cx, cy, w, h, keep] of cleanZones()) {
    if (cx + w < x0 || cx - w > x0 + SEG_W) continue;
    const step = 1 - Math.pow(1 - keep, 1 / 10); // ten soft steps that add up to `keep`
    for (let k = 0; k < 10; k++) { const g = (9 - k) * .03; c.fillStyle = `rgba(0,0,0,${step})`; c.fillRect(X(cx - w / 2 - g), Y(cy + h / 2 + g), (w + 2 * g) * PPM, (h + 2 * g) * PPM); }
  }
  c.globalCompositeOperation = 'source-over'; seg.tex.needsUpdate = true;
}
function grafUpdate(force) {
  if (!GRAF.ready) return;
  const p = grafProgress(new Date());
  GRAF.nightT = p.night;
  const count = GRAF.items.filter(o => o.t <= p.v).length;
  if (!force && count === GRAF.count) return;
  GRAF.count = count; GRAF.v = p.v;
  GRAF.segs.forEach(s => drawSeg(s, p.v));
}
let grafDone; const grafReady = new Promise(r => { grafDone = r; });
function grafInit() {
  try {
    for (let x0 = ROOM.start; x0 < ROOM.end; x0 += SEG_W) {
      const cv = document.createElement('canvas'); cv.width = cv.height = SEG_PX;
      const tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = maxAniso;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(SEG_W, H), new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, roughness: .9, metalness: 0 }));
      m.position.set(x0 + SEG_W / 2, H / 2, .0011); scene.add(m);
      GRAF.segs.push({ x0, ctx: cv.getContext('2d'), tex, mesh: m });
    }
    GRAF.items = buildGrafItems();
    const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
    fetch('/night/manifest.json').then(r => r.json()).then(async (mf) => {
      const canv = await load(mf.canvases[0]);
      if (!alive) return;
      if (canv) GRAF.clouds = makeClouds(canv);
      if (document.fonts) await Promise.all(['"Permanent Marker"', '"Rubik Spray Paint"', '"Sedgwick Ave Display"', 'Knewave', '"Rock Salt"', '"Caveat Brush"'].map(f => document.fonts.load('60px ' + f).catch(() => {})));
      GRAF.ready = true; grafUpdate(true); grafDone();
    }).catch((e) => { console.warn('after hours layer skipped', e); grafDone(); });
    const iv = setInterval(() => grafUpdate(false), 5 * 60 * 1000); offs.push(() => clearInterval(iv));
  } catch (e) { console.warn('after hours layer skipped', e); grafDone(); }
}
grafInit();
// lights: the room dims after dark and the picture lights carry it
const NIGHT_BG = new THREE.Color(0x5e5a55), DAY_BG = new THREE.Color(0xC6C2BB), tmpBg = new THREE.Color();
function grafLight(dt) {
  GRAF.night += (GRAF.nightT - GRAF.night) * (1 - Math.exp(-dt * 2));
  const n = GRAF.night;
  if (GRAF.ready && GRAF.fade < 1) { GRAF.fade = Math.min(1, GRAF.fade + dt / 1.2); GRAF.segs.forEach(sg => { sg.mesh.material.opacity = GRAF.fade; }); }
  hemi.intensity = .47 * (1 - .55 * n); key.intensity = .14 * (1 - .7 * n);
  tmpBg.copy(DAY_BG).lerp(NIGHT_BG, n); renderer.setClearColor(tmpBg); scene.fog.color.copy(tmpBg);
}
function setClock(mode) {
  GRAF.mode = mode; try { localStorage.setItem('ms-clock', mode); } catch (e) {}
  const b = $('#clockBtn'); if (b) { b.classList.toggle('on', mode === 'midnight'); b.setAttribute('aria-pressed', mode === 'midnight'); b.querySelector('span').textContent = mode === 'midnight' ? 'Back to now' : 'Skip to midnight'; }
  grafUpdate(true);
}
{ const b = $('#clockBtn'); if (b) { b.onclick = () => setClock(GRAF.mode === 'midnight' ? 'live' : 'midnight'); setClock(GRAF.mode); } }

/* ---------- camera + controls ---------- */
const stations = [{x:-.1, idx:-1}].concat(PIECES.map((p,i)=>({x:p.x, idx:i})), [{x:END_X, idx:-2}]);
const minX = stations[0].x, maxX = stations[stations.length-1].x;
let camX = minX, camTarget = minX, camDist = 5, distMul = 1, distMulT = 1, parX=0, parY=0, parXT=0, parYT=0;
let vw=1, vh=1, mpp=.005;

function resize(){
  vw = innerWidth; vh = innerHeight; renderer.setSize(vw, vh, false);
  camera.aspect = vw/vh;
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov/2)), tanH = tanV * camera.aspect;
  const hCz = 3.2/(2*tanV), wCz = camera.aspect < .8 ? 2.05/(2*tanH) : 0;
  camDist = THREE.MathUtils.clamp(Math.max(hCz,wCz), 2.6, 7.5);
  camera.updateProjectionMatrix();
  placeEntrance(camera.aspect);
  mpp = (2*camDist*tanH)/vw;
}
on(window,'resize', resize); resize();

const clampX = x => Math.min(maxX, Math.max(minX, x));
function nearestStation(x){ let b=0,bd=1e9; stations.forEach((s,i)=>{ const d=Math.abs(s.x-x); if(d<bd){bd=d;b=i;} }); return b; }
function goTo(i){ i=Math.max(0,Math.min(stations.length-1,i)); camTarget=stations[i].x; dismissHint(); }
function step(dir){ const cur = nearestStation(camTarget); goTo(cur+dir); }

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pickEnd(cx,cy,mesh){ ndc.set(cx/vw*2-1, -(cy/vh)*2+1); ray.setFromCamera(ndc,camera); return ray.intersectObject(mesh||endSign,false).length>0; }
function pick(cx,cy){ ndc.set(cx/vw*2-1, -(cy/vh)*2+1); ray.setFromCamera(ndc,camera); const h=ray.intersectObjects(hitMeshes,false)[0]; return h ? h.object.userData.idx : -1; }

let mx=0, my=0; const cursorEl=document.getElementById('cursor');
let down=null, dragging=false, hovered=-1, lastType='mouse', vel=0, wheelTimer=0;
canvas.addEventListener('pointerdown', e=>{ lastType=e.pointerType; down={x:e.clientX,y:e.clientY,t:performance.now(),lx:e.clientX,lt:performance.now()}; dragging=false; vel=0; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e=>{
  lastType = e.pointerType;
  if(e.pointerType==='mouse'){ parXT=(e.clientX/vw-.5); parYT=(e.clientY/vh-.5); mx=e.clientX; my=e.clientY; }
  if(down && !inAbout && !inInf){
    const dx=e.clientX-down.lx, now=performance.now();
    if(!dragging && Math.abs(e.clientX-down.x)>6) { dragging=true; dismissHint(); }
    if(dragging){ camTarget = clampX(camTarget - dx*mpp*1.15); camX = camTarget; vel = -dx*mpp/Math.max(1,now-down.lt); }
    down.lx=e.clientX; down.lt=now;
  } else if(e.pointerType==='mouse' && openIdx<0 && !inAbout && !inInf){
    hovered = pick(e.clientX,e.clientY); endHover = hovered<0 && pickEnd(e.clientX,e.clientY); workHover = hovered<0 && !endHover && pickEnd(e.clientX,e.clientY,workSign); canvas.style.cursor = hovered>=0 ? 'none' : (endHover || workHover) ? 'pointer' : 'grab';
  }
});
canvas.addEventListener('pointerup', e=>{
  if(!down) return;
  if(inAbout || inInf){ down=null; dragging=false; return; }
  if(dragging){
    const proj = camTarget + vel*260;
    if(e.pointerType==='mouse') camTarget = clampX(proj); else goTo(nearestStation(proj));
  } else {
    const hit = pick(e.clientX,e.clientY);
    if(hit>=0){ if(e.pointerType==='mouse' || active===hit) openDetail(hit); else goTo(hit+1); }
    else if(pickEnd(e.clientX,e.clientY)) openAbout();
    else if(pickEnd(e.clientX,e.clientY,workSign)) location.href = '/work';
  }
  down=null; dragging=false;
});
canvas.addEventListener('pointercancel', ()=>{ down=null; dragging=false; });
canvas.addEventListener('pointerleave', e=>{ if(e.pointerType==='mouse'){ hovered=-1; parXT=parYT=0; } });
canvas.addEventListener('wheel', e=>{ e.preventDefault(); if(inInf){ infEl.querySelector('.inf-scroll').scrollBy(0, e.deltaY); return; } if(inAbout){ aboutEl.querySelector('.about-scroll').scrollBy(0, e.deltaY); return; } if(openIdx>=0) return; camTarget = clampX(camTarget + (e.deltaY+e.deltaX)*mpp*.8); dismissHint();
  clearTimeout(wheelTimer); if(coarse) wheelTimer=setTimeout(()=>goTo(nearestStation(camTarget)),220); }, {passive:false});
on(window,'keydown', e=>{
  if(e.key==='Escape'){ if(!$('#detail').hidden) closeDetail(); else if(!$('#grid').hidden) closeGrid(); else if(inInf) closeInf(); else if(inAbout) closeAbout(); return; }
  if(inAbout || inInf) return;
  if(!$('#detail').hidden){ if(e.key==='ArrowRight') detailStep(1); if(e.key==='ArrowLeft') detailStep(-1); return; }
  if(!$('#grid').hidden) return;
  if(e.key==='ArrowRight'){ step(1); e.preventDefault(); }
  if(e.key==='ArrowLeft'){ step(-1); e.preventDefault(); }
  if(e.key==='Enter' && active>=0) openDetail(active);
});
$('#prev').onclick=()=>step(-1); $('#next').onclick=()=>{ if(stations[nearestStation(camTarget)].idx===-2) openAbout(); else step(1); };

/* hint */
/* hint: stays until the visitor has actually moved. Every so often the camera leans towards the next piece, to show the room moves */
const hint=$('#hint');
hint.innerHTML = (coarse
  ? '<span class="hint-ico swipe" aria-hidden="true"><i></i></span><span><b>Swipe</b> to walk the room</span>'
  : '<span class="hint-ico mouse" aria-hidden="true"><i></i></span><span><b>Scroll</b> to walk the room</span>');
hint.setAttribute('role', 'button'); hint.tabIndex = 0;
let hintGone=false, peekTimer=0;
function dismissHint(){ if(!hintGone){ hintGone=true; clearInterval(peekTimer); document.body.classList.remove('hint-on'); setTimeout(()=>hint.classList.add('gone'),600); } }
function peek(){ if(hintGone || inAbout || inInf || openIdx>=0 || dragging) return; const home=camTarget; camTarget = Math.min(maxX, home + .45); setTimeout(()=>{ if(!hintGone) camTarget = home; }, 700); }
const startHint = () => { document.body.classList.add('hint-on'); peekTimer = setInterval(peek, 7000); setTimeout(peek, 4000); };
hint.addEventListener('click', ()=>step(1)); hint.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); step(1); } });

/* label */
const tag=$('#tag'), v3=new THREE.Vector3();
let active=-1, tagFor=-2;
function setTag(i){
  if(i===tagFor) return; tagFor=i;
  if(i<0){ tag.classList.remove('on'); return; }
  const p=PIECES[i];
  const tt=$('#tagTitle'); tt.textContent=p.title; tt.classList.remove('pull'); void tt.offsetWidth; tt.classList.add('pull');
  $('#tagMeta').innerHTML = (p.sold ? '<span class="dot" aria-hidden="true"></span><b>Sold</b>' : ((p.priceText || (p.venue ? '' : p.statusText)) ? '<b>'+(p.priceText || p.statusText)+'</b>' : '')) + (p.size ? '<span>' + p.size + '</span>' : '') + (p.venue && !p.sold ? '<span class="live">On show at '+p.venue.name+'</span>' : '');
  $('#tagGo').textContent = coarse ? 'Tap to view' : 'Click to view';
  tag.classList.add('on');
}
tag.addEventListener('click', ()=>{ if(active>=0) openDetail(active); });

/* counter and progress rail */
const railEl=$('#rail'), railFill=$('#railFill');
stations.forEach(s=>{ const e=document.createElement('s'); e.style.left=((s.x-minX)/(maxX-minX)*100)+'%'; railEl.appendChild(e); s.tick=e; });
$('#brand').addEventListener('click', e=>{ e.preventDefault(); if(inInf && !inAbout){ closeInf(true, true); history.pushState({gallery:true}, '', '/'); document.title = baseTitle; goTo(0); return; }
  if(inAbout){ originX = minX; closeInf(true, true); closeAbout(); return; } if(!$('#detail').hidden) closeDetail(); if(!$('#grid').hidden) closeGrid(); goTo(0); });
let countFor=-1;
function setCount(si){
  if(si===countFor) return; countFor=si;
  const s=stations[si];
  const atEnd = s.idx===-2, nx = $('#next');
  $('#count').textContent = (atEnd ? 'End' : String(s.idx+1).padStart(2,'0')) + ' / ' + String(PIECES.length).padStart(2,'0');
  $('#countName').textContent = s.idx===-1 ? 'Mark Staples, new work' : atEnd ? 'That\u2019s the room' : PIECES[s.idx].title;
  $('#prev').disabled = si===0;
  nx.classList.toggle('to-about', atEnd); nx.setAttribute('aria-label', atEnd ? 'Meet the artist' : 'Next piece');
  stations.forEach((st,j)=>st.tick.classList.toggle('on', j===si));
}

/* ---------- loop ---------- */
let t0=0, last=0, openIdx=-1, started=false;
const ease = x => 1 - Math.pow(1-x,3);
const FLICK = [0,1,0,0,1,1,0,1];
function lightLevel(s){
  if(s<0) return 0;
  if(reduce) return Math.min(1, s/.35);
  if(s < FLICK.length*.06) return FLICK[Math.floor(s/.06)] * .55;
  return .55 + .45*ease(Math.min(1,(s-FLICK.length*.06)/.7));
}
const tmpC = new THREE.Color();
function shade(item, T, dt, reveal, focusT){
  if(reveal && !item.on){ item.on=true; item.onAt=T; }
  if(!reveal) item.on=false;
  if(item.on){
    if(!item.seen){ item.lit = lightLevel(T-item.onAt); if(T-item.onAt>1.3) item.seen=true; }
    else item.lit += (1-item.lit)*(1-Math.exp(-dt*4.5));
  } else { item.lit += (0-item.lit)*(1-Math.exp(-dt*3.2)); if(item.lit<.003) item.lit=0; }
  item.focus += (focusT - item.focus)*(1-Math.exp(-dt*8));
  const L = item.lit * item.focus;
  item.beamMat.opacity = item.beamMax * Math.min(1.25, L);
  item.glowMat.color.copy(glowOff).lerp(glowOn, Math.min(1,item.lit));
  return L;
}

function frame(now){
  if(!alive) return;
  requestAnimationFrame(frame);
  if(!started) return;
  const dt = Math.min(.05, (now-last)/1000 || .016); last=now;
  const T = (now - t0)/1000;
  const k = 1 - Math.exp(-dt*(dragging?20:5.5));
  camX += (camTarget-camX)*k;
  distMul += (distMulT-distMul)*(1-Math.exp(-dt*5));
  parX += (parXT-parX)*(1-Math.exp(-dt*3)); parY += (parYT-parY)*(1-Math.exp(-dt*3));
  const cz = camDist*distMul;
  // About: glide to the far end, then turn right to face the end wall; reverse on the way out
  if(inAbout && aboutPhase === 'travel' && Math.abs(camX - ABOUT_X) < .06){ aboutPhase = 'turn'; aboutTurn = true; setTimeout(showAboutText, 950); }
  if(!inAbout && aboutPhase === 'out' && aboutV < .03){ aboutPhase = null; camTarget = clampX(originX); }
  aboutV += ((aboutTurn?1:0) - aboutV) * (1 - Math.exp(-dt*2.4));
  if(!aboutTurn && aboutV < .004) aboutV = 0;
  const te = aboutV*aboutV*(3 - 2*aboutV), ta = te*Math.PI/2, tl = cz*(1-te) + 2.6*te, keep = 1 - te;
  infV = Math.max(0, Math.min(1, infV + (inInf ? 1 : -1) * dt / (reduce ? .3 : 1.7)));
  const ie = .5 - .5*Math.cos(Math.PI*infV); // eases in and out, like turning your head
  const cpx = camX + parX*.2*keep - .45*ie*te, cpy = 1.55 - parY*.08*keep - .06*ie, cpz = cz + .45*ie*(1-te);
  camera.position.set(cpx, cpy, cpz);
  let lx = cpx + .45*ie*te + Math.sin(ta)*tl + parX*.08*keep, ly = (1.16 - parY*.04)*keep + 1.5*te, lz = cpz - .45*ie*(1-te) - Math.cos(ta)*tl;
  if(inInf && !infShown && infV > .62){ infShown = true; infEl.classList.add('show'); clearTimeout(infTimer); infTimer = setTimeout(() => { if(inInf) infEl.classList.add('settled'); }, 70*(inspires.names.length) + 1300); }
  if(bioPending && !inInf && infV < .25){ bioPending = false; if(inAbout) aboutEl.classList.add('show'); }
  if(infV > 0){ // tilt the head back to look up at the ceiling
    const dx = lx - cpx, dy = ly - camera.position.y, dz = lz - cpz, hz = Math.hypot(dx, dz) || 1, L = Math.hypot(hz, dy);
    const p = Math.atan2(dy, hz) + (1.32 - Math.atan2(dy, hz))*ie;
    lx = cpx + dx/hz*Math.cos(p)*L; ly = camera.position.y + Math.sin(p)*L; lz = cpz + dz/hz*Math.cos(p)*L;
    ceil.material.emissive.setRGB(CEIL_E.r + (.46 - CEIL_E.r)*ie, CEIL_E.g + (.455 - CEIL_E.g)*ie, CEIL_E.b + (.44 - CEIL_E.b)*ie);
  } else if(ceil.material.emissive.r !== CEIL_E.r) ceil.material.emissive.copy(CEIL_E);
  camera.lookAt(lx, ly, lz);
  railFill.style.width = Math.min(100, Math.max(0, (camX-minX)/(maxX-minX)*100)).toFixed(2)+'%';

  // which piece is "active"
  const si = nearestStation(camX); setCount(si);
  const settled = Math.abs(stations[si].x-camX)<.3 && !dragging;
  const mouseMode = lastType==='mouse' && !coarse;
  if(openIdx>=0) active=openIdx;
  else if(mouseMode) active = hovered;
  else active = settled ? stations[si].idx : -1;
  if(inAbout || inInf || aboutV > .05 || infV > .05) active = -1;
  const focusIdx = openIdx<0 && mouseMode && !inAbout && !inInf ? hovered : -1;

  // lights switch on as you reach each piece and off again once you've moved on
  const half = vw*mpp/2, reach = half*.62;
  shade(ABOUT_L, T, dt, inAbout && aboutPhase === 'turn' && aboutV > .35, 1);
  const nL = shade(NAME, T, dt, T>.35 && Math.abs(NAME.x-camX) < Math.max(reach,1.2), focusIdx>=0 ? .45 : 1);

  updateDrips(T, dt);
  grafLight(dt);
  { const near = Math.abs(END_X-camX) < 1.4 && !inAbout; endMat.color.setScalar(near ? (endHover ? 1.12 : 1) : .78); workMat.color.setScalar(near ? (workHover ? 1.12 : 1) : .78);
    if (near) {
      const k = Math.min(1, dt * 10); SIGN.eh += ((endHover ? 1 : 0) - SIGN.eh) * k; SIGN.wh += ((workHover ? 1 : 0) - SIGN.wh) * k;
      // every 2.6s the arrows push forward twice, like someone pointing: ok to skip for reduced motion
      const ph = (performance.now() / 1000) % 2.6, push = reduce ? 0 : (ph < 1 ? Math.pow(Math.sin(ph * Math.PI * 2), 2) * 26 : 0);
      const eN = Math.round(push), wN = Math.round(ph > .25 && ph < 1.25 ? Math.pow(Math.sin((ph - .25) * Math.PI * 2), 2) * 22 : 0) * (reduce ? 0 : 1);
      const key = eN + ',' + wN + ',' + SIGN.eh.toFixed(2) + ',' + SIGN.wh.toFixed(2);
      if (key !== SIGN.last) { SIGN.last = key; drawEnd(eN, SIGN.eh); drawWork(wN, SIGN.wh); }
      const se = 1 + SIGN.eh * .05, sw = 1 + SIGN.wh * .06; endSign.scale.set(se, se, 1); workSign.scale.set(sw, sw, 1);
    } }
  PIECES.forEach((p,i)=>{
    const ft = focusIdx<0 ? 1 : (i===focusIdx ? 1 : .45);
    const L = shade(p, T, dt, T>.6 && Math.abs(p.x-camX) < reach, ft);
    const lv = Math.min(1.12, L);
    const artV = .13 + .87*lv;
    const fv = .38 + .62*Math.min(1,lv);
    p.poolMat.opacity = p.poolMax * lv;
    p.shMat.opacity = (p.sculpture ? .14 : .24) * Math.min(1,lv) + .06;
    if(p.haloMat) p.haloMat.opacity = .34 * Math.min(1,lv);
    if(p.sheen){ p.sheen.opacity = .22*Math.min(1,lv); p.sheen.map.offset.x = (camera.position.x - p.x)*.45; }
    if(p.cut){ p.cut.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - 1.05); p.point.intensity = .25*lv; }
    if(p.torso){
      p.point.intensity = .25*lv;
      const isA = i===active;
      const tgt = isA ? p.torso.rotation.y + dt*.7 : Math.round(p.torso.rotation.y/(Math.PI*2))*Math.PI*2;
      p.torso.rotation.y += (tgt - p.torso.rotation.y) * (isA ? 1 : (1-Math.exp(-dt*3)));
    }
  });

  // hand the real spotlights to the lit pieces closest to the camera
  const cands = LIGHTABLE.filter(o=>o.lit>0).sort((a,b)=>Math.abs(a.x-camX)-Math.abs(b.x-camX));
  SPOTS.forEach((s,i)=>{ const o=cands[i]; if(o){ s.position.copy(o.spotPos); s.target.position.copy(o.spotTgt); s.angle=o.spotAngle; s.intensity=o.spotI*o.lit*o.focus; } else s.intensity=0; });

  // label
  if(active>=0 && openIdx<0){
    const p=PIECES[active];
    if(p.sculpture) v3.set(p.x, p.ph-.1, 1.05+.27); else v3.set(p.x, p.baseY - p.fh/2 - .07, 0);
    v3.project(camera);
    const sx=(v3.x*.5+.5)*vw, sy=(-v3.y*.5+.5)*vh;
    tag.style.transform = `translate(${sx}px, ${Math.min(sy+8, vh-190)}px) translate(-50%,0)`;
    setTag(active);
  } else setTag(-1);

  // hover cursor
  if(focusIdx>=0){ cursorEl.classList.add('on'); cursorEl.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`; }
  else cursorEl.classList.remove('on');

  placeCredit(dt);
  renderer.render(scene,camera);
  if(spin && spin.on) spin.render(dt);
}
requestAnimationFrame(frame);

/* ---------- detail view ---------- */
const detail=$('#detail');
function openDetail(i, fromHistory){
  const wasOpen = openIdx>=0;
  if(!fromHistory) history.pushState({gallery:true, slug:PIECES[i].slug}, '', '/work/'+PIECES[i].slug);
  document.title = PIECES[i].title + ' by Mark Staples';
  openIdx=i; const p=PIECES[i];
  camTarget = p.x; distMulT = .72;
  const media=$('#dMedia'); media.innerHTML=''; media.classList.toggle('is-spin', !!p.torso);
  if(spin) spin.on=false;
  if(p.torso){
    const wrap=document.createElement('div'); wrap.className='spin';
    wrap.innerHTML = '<canvas id="spinCanvas" aria-label="3D view of the sculpture. Drag to turn it."></canvas><div class="photo"><img alt="Photo of the actual piece" src="'+IMG[p.id].src+'">The real piece</div>';
    media.appendChild(wrap);
    const cap=document.createElement('div'); cap.className='cap'; cap.textContent= coarse ? 'Drag to turn it round' : 'Drag to turn it round'; media.appendChild(cap);
    requestAnimationFrame(()=>startSpin(wrap.querySelector('canvas')));
  } else {
    const box=document.createElement('div'); box.className='zoombox'+((p.cutWall||p.cut)?' cut':(p.round?' round':''));
    const img=new Image(); img.src=IMG[p.id].src; img.alt=p.title+', '+p.medium; img.draggable=false; box.appendChild(img);
    media.appendChild(box);
    const cap=document.createElement('div'); cap.className='cap'; cap.textContent= coarse ? 'Tap the image to zoom, drag to look around' : 'Click the image to zoom, move to look around'; media.appendChild(cap);
    setupZoom(box,img);
  }
  const eb = [p.kind, p.year].filter(Boolean).join(', '); $('#dEyebrow').textContent = eb ? '/ ' + eb : '';
  $('#dTitle').textContent = p.title;
  const vLink = v => '<a class="venue" href="'+v.url+'" target="_blank" rel="noopener">'+v.name+' <span aria-hidden="true">\u2197\uFE0E</span></a>';
  $('#dPrice').innerHTML = p.sold
    ? '<strong><span class="dot" aria-hidden="true"></span> Sold</strong><span>'+(p.soldNote && p.soldNote!=='Sold' ? p.soldNote+'. ' : '')+'Ask about similar work or commissions.</span>'
    : (p.priceText ? '<strong>'+p.priceText+'</strong><span>'+(p.sculpture?'Free UK delivery, carefully packed':'Free UK delivery, ready to hang')+'</span>'
        : (p.statusText && !p.venue ? '<strong>'+p.statusText+'</strong>' : '')+'<span>Enquire for details</span>')
      + (p.venue ? '<div class="onshow"><i aria-hidden="true"></i><span>On show now at '+vLink(p.venue)+'</span><small>'+p.venue.place+'. Pop in and see it in person.</small></div>' : '');
  // only show what we actually know about the piece
  const specs=[['Medium',p.medium],['Size',p.size],['Frame',p.frameText],['Year',p.year],['On show at',p.venue&&!p.sold?vLink(p.venue):''],[p.sold?'Sold via':'Shown at',p.pastVenue?vLink(p.pastVenue):'']].filter(s=>s[1]);
  $('#dSpecs').innerHTML = specs.map(s=>'<div><dt>'+s[0]+'</dt><dd>'+s[1]+'</dd></div>').join('');
  $('#dSpecs').hidden = !specs.length;
  $('#dStory').textContent = p.story || ''; $('#dStory').hidden = !p.story;
  $('#dEnquire').textContent = p.sold ? 'Ask about similar work' : 'Enquire about this piece';
  $('#dEnquire').hidden=false; $('#dForm').hidden=true; $('#dDone').hidden=true;
  $('#fMsg').value = p.sold ? `Hi, I love "${p.title}". Do you have anything similar available, or take commissions?` : `Hi, I'm interested in "${p.title}". Is it still available?`;
  $('#dCount').textContent = String(i+1).padStart(2,'0') + ' / ' + String(PIECES.length).padStart(2,'0');
  if(!wasOpen){ detail.hidden=false; requestAnimationFrame(()=>detail.classList.add('show')); detail.scrollTop=0; setTimeout(()=>$('#dClose').focus({preventScroll:true}),50); }
  else detail.scrollTop=0;
  hovered=-1;
}
function closeDetail(fromHistory){
  if(openIdx>=0 && !fromHistory) history.pushState({gallery:true}, '', '/');
  document.title = baseTitle;
  detail.classList.remove('show'); distMulT=1;
  const i=openIdx; openIdx=-1; if(spin) spin.on=false;
  setTimeout(()=>{ if(openIdx<0) detail.hidden=true; }, 360);
  if(i>=0) camTarget = PIECES[i].x;
  canvas.focus({preventScroll:true});
}
function detailStep(d){ openDetail((openIdx + d + PIECES.length) % PIECES.length); }
$('#dClose').onclick=()=>closeDetail(); $('#dPrev').onclick=()=>detailStep(-1); $('#dNext').onclick=()=>detailStep(1);
detail.addEventListener('click', e=>{ if(e.target===detail || e.target.classList.contains('detail-wrap')) closeDetail(); });
let dTs = null;
$('#dEnquire').onclick=()=>{ $('#dEnquire').hidden=true; $('#dForm').hidden=false; $('#fName').focus(); if(!dTs) dTs = mountTurnstile($('#dTs')); };
$('#dForm').addEventListener('submit', e=>{
  e.preventDefault();
  const name=$('#fName').value.trim(), email=$('#fEmail').value.trim();
  if(!name || !/^\S+@\S+\.\S+$/.test(email)){ ($('#fName').value.trim()? $('#fEmail') : $('#fName')).focus(); return; }
  const p = PIECES[openIdx], btn = $('#dForm button[type=submit]'); btn.disabled = true; btn.textContent = 'Sending';
  fetch('/api/enquiry', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, email, message:$('#fMsg').value, slug:p.slug, website:$('#fWebsite').value, turnstile: dTs ? dTs.token() : ''})})
    .then(r=>r.json().then(j=>({ok:r.ok, j}))).then(({ok,j})=>{
      btn.disabled=false; btn.textContent='Send enquiry';
      if(!ok){ dTs && dTs.reset(); const d=$('#dDone'); d.hidden=false; d.textContent = j.error || 'Something went wrong. Please try again, or email Mark directly.'; return; }
      $('#dForm').hidden=true; const d=$('#dDone'); d.hidden=false;
      d.textContent = `Thanks ${name}. Mark has your enquiry about "${p.title}" and will reply to ${email} soon.`; dTs && dTs.reset();
    }).catch(()=>{ btn.disabled=false; btn.textContent='Send enquiry'; const d=$('#dDone'); d.hidden=false; d.textContent='Could not reach the server. Check your connection and try again.'; });
});

function setupZoom(box,img){
  let zoomed=false, moved=false, sx=0, sy=0;
  const setOrigin=(cx,cy)=>{ const r=box.getBoundingClientRect(); img.style.transformOrigin = `${THREE.MathUtils.clamp((cx-r.left)/r.width*100,0,100)}% ${THREE.MathUtils.clamp((cy-r.top)/r.height*100,0,100)}%`; };
  box.addEventListener('pointerdown', e=>{ sx=e.clientX; sy=e.clientY; moved=false; if(zoomed) box.setPointerCapture(e.pointerId); });
  box.addEventListener('pointermove', e=>{ if(!zoomed) return; if(Math.hypot(e.clientX-sx,e.clientY-sy)>6) moved=true; if(e.pointerType==='mouse' || e.buttons) setOrigin(e.clientX,e.clientY); });
  box.addEventListener('click', e=>{ if(moved && zoomed && e.pointerType!=='mouse') return; zoomed=!zoomed; if(zoomed) setOrigin(e.clientX,e.clientY); box.classList.toggle('zoomed',zoomed); });
}

/* sculpture spin viewer */
let spin=null;
function startSpin(cv){
  if(!spin){
    const r = new THREE.WebGLRenderer({antialias:true, alpha:true}); r.outputEncoding=THREE.sRGBEncoding; r.setPixelRatio(Math.min(devicePixelRatio||1,2));
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff,0xcfc8bc,.85));
    const dl=new THREE.DirectionalLight(0xfff2e0,.8); dl.position.set(1.5,2,2.5); sc.add(dl);
    const rim=new THREE.DirectionalLight(0xffffff,.5); rim.position.set(-2,1.5,-2); sc.add(rim);
    const m = new THREE.Mesh(torsoGeo, torsoMat); if(scanReady){ m.add(scanBase()); } else m.scale.set(1.18,1,.56); sc.add(m);
    const top = new THREE.Mesh(new THREE.BoxGeometry(.52,.06,.52), new THREE.MeshLambertMaterial({color:0xF7F5F1})); top.position.y=-.03; sc.add(top);
    const cam = new THREE.PerspectiveCamera(32,1,.05,20); cam.position.set(0,.5,1.75); cam.lookAt(0,.38,0);
    spin = {r, sc, cam, m, rot:0, vel:.5, drag:false, on:false, lx:0, cv:null, tilt:0, tiltT:.0,
      render(dt){ if(!this.drag){ this.rot += this.vel*dt; this.vel += (.5-this.vel)*(1-Math.exp(-dt*1.5)); } this.m.rotation.y=this.rot; this.r.render(this.sc,this.cam); }};
  }
  spin.cv = cv;
  const ctx = cv; // swap renderer onto new canvas by copying its DOM element
  cv.replaceWith(spin.r.domElement); spin.r.domElement.id='spinCanvas'; spin.r.domElement.style.width='100%'; spin.r.domElement.style.height='100%';
  const el = spin.r.domElement, box = el.parentElement.getBoundingClientRect();
  spin.r.setSize(box.width, box.height, false); spin.cam.aspect = box.width/Math.max(1,box.height); spin.cam.updateProjectionMatrix();
  if(!el._wired){ el._wired=true;
    el.addEventListener('pointerdown', e=>{ spin.drag=true; spin.lx=e.clientX; el.setPointerCapture(e.pointerId); el.style.cursor='grabbing'; });
    el.addEventListener('pointermove', e=>{ if(!spin.drag) return; const dx=e.clientX-spin.lx; spin.lx=e.clientX; spin.rot += dx*.012; spin.vel = dx*.6; });
    const up=()=>{ spin.drag=false; el.style.cursor='grab'; spin.vel = THREE.MathUtils.clamp(spin.vel, -6, 6); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
  spin.on = true;
}


/* ---------- about overlay: the bio, sprayed word by word, with drips ---------- */
const aboutEl = $('#about'), aboutBody = $('#aboutBody');
let aboutBuilt = false, aboutObs = null;
const INF_COL = ['#d8233d','#2F6FD0','#E2387F','#E08A12','#2E9E5B','#7C4FC9','#0E9BB0','#C9A12B','#D8322F'];
function buildAbout(){
  if(aboutBuilt || !about) return; aboutBuilt = true;
  const words = (el, text) => { text.split(/(\s+)/).forEach(tok => { if(!tok) return; if(/^\s+$/.test(tok)){ el.appendChild(document.createTextNode(' ')); return; } const s=document.createElement('span'); s.className='w'; s.textContent=tok; el.appendChild(s); }); };
  const h = document.createElement('h2'); h.className = 'spray spray-title'; words(h, about.heading);
  h.insertAdjacentHTML('beforeend', '<svg class="swoosh" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true"><path d="M6 26 C 140 10, 300 34, 594 14"/></svg>');
  aboutBody.appendChild(h);
  about.paragraphs.forEach(p => {
    const el = document.createElement('p'); el.className = 'spray';
    if(p.includes('{influences}')){
      const [a, b] = p.split('{influences}'); words(el, a);
      about.influences.forEach((n, i) => { const s = document.createElement('span'); s.className = 'w inf'; s.style.setProperty('--c', INF_COL[i % INF_COL.length]); s.textContent = n + (i < about.influences.length - 1 ? ',' : ''); el.appendChild(s); el.appendChild(document.createTextNode(' ')); });
      words(el, b.trim());
    } else words(el, p);
    aboutBody.appendChild(el);
  });
  const sig = document.createElement('p'); sig.className = 'spray sig'; words(sig, about.signoff);
  sig.insertAdjacentHTML('beforeend', ' <span class="w">MS11</span>');
  const ig = document.createElement('p'); ig.className = 'inf-cta about-ig'; ig.innerHTML = '<a class="chip" href="https://www.instagram.com/marky_s11/" target="_blank" rel="noopener">Follow on Instagram @marky_s11</a>';
  aboutBody.appendChild(sig);
  aboutBody.appendChild(ig);
  if(about.inspires){ const cta = document.createElement('p'); cta.className = 'inf-cta'; cta.innerHTML = '<button class="chip" type="button" id="infGo">Who inspires me &uarr;</button>'; aboutBody.appendChild(cta); cta.firstChild.onclick = () => openInf();
    aboutBody.querySelectorAll('.inf').forEach(s => { s.setAttribute('role','link'); s.tabIndex = 0; s.onclick = () => openInf(); s.onkeydown = e => { if(e.key === 'Enter') openInf(); }; }); }
  // photos: three taped beside the text, the rest in a reel that scrolls past forever
  const photos = about.photos || [];
  const print = (ph, n) => '<figure class="print'+(ph.w > ph.h ? ' wide' : '')+'" style="--ar:'+(ph.w && ph.h ? (ph.w/ph.h).toFixed(3) : '0.8')+'"><i class="tape t1"></i><i class="tape t2"></i>' +
    (ph.src ? '<img src="'+ph.src+'" width="'+(ph.w||400)+'" height="'+(ph.h||500)+'" alt="'+(ph.caption || 'Mark Staples')+'" loading="lazy" decoding="async">' : '') +
    (ph.caption ? '<figcaption>'+ph.caption+'</figcaption>' : '') + '</figure>';
  $('#aboutPhotos').innerHTML = photos.slice(0, 3).map((ph, i) => print(ph, i + 1)).join('');
  const rest = photos.slice(3);
  if(rest.length){
    const once = rest.map((ph, i) => '<div class="reel-item" style="--ar:'+(ph.w && ph.h ? (ph.w/ph.h).toFixed(3) : '0.8')+'">' + print(ph, i + 4) + '</div>').join('');
    const reel = $('#aboutReel');
    reel.innerHTML = '<div class="reel-track" style="--dur:' + (rest.length * 4.5) + 's">' + once + once.replace(/class="reel-item"/g, 'class="reel-item" aria-hidden="true"') + '</div>';
    reel.hidden = false;
  }
  // number the words so they're sprayed on one after another
  aboutBody.querySelectorAll('.spray').forEach(el => [...el.querySelectorAll('.w')].forEach((w, i) => w.style.setProperty('--i', i)));
}
function startSpray(){
  const els = aboutBody.querySelectorAll('.spray');
  if(reduce || !('IntersectionObserver' in window)){ els.forEach(e => e.classList.add('on')); return; }
  aboutObs && aboutObs.disconnect();
  aboutObs = new IntersectionObserver(es => es.forEach(en => { if(en.isIntersecting){ en.target.classList.add('on'); aboutObs.unobserve(en.target); } }), { root: aboutEl.querySelector('.about-scroll'), threshold: .25 });
  els.forEach(e => aboutObs.observe(e));
}
function showAboutText(){ if(inAbout && !inInf && aboutPhase === 'turn'){ aboutEl.classList.add('show'); startSpray(); } }
function openAbout(fromHistory, instant){
  if(inAbout) return;
  if(openIdx >= 0) closeDetail(true);
  inAbout = true; hovered = -1; originX = instant ? maxX : camX;
  const cz = camDist*distMul;
  ABOUT_L.x = ABOUT_X; ABOUT_L.spotPos.set(ROOM.end - 1.7, H - .15, cz); ABOUT_L.spotTgt.set(ROOM.end, 1.4, cz);
  document.body.classList.add('in-about');
  if(!fromHistory) history.pushState({gallery:true, about:true}, '', '/about');
  document.title = 'About Mark Staples';
  buildAbout(); buildInf(); aboutEl.hidden = false; aboutEl.querySelector('.about-scroll').scrollTop = 0;
  if(instant || reduce){ camX = camTarget = ABOUT_X; aboutTurn = true; aboutPhase = 'turn'; if(instant) aboutV = 1; setTimeout(showAboutText, instant ? 60 : 600); }
  else { aboutPhase = 'travel'; aboutTurn = false; camTarget = ABOUT_X; }
  dismissHint();
}
function closeAbout(fromHistory){
  if(!inAbout) return;
  inAbout = false; aboutTurn = false; aboutPhase = 'out';
  aboutEl.classList.remove('show'); document.body.classList.remove('in-about');
  if(!fromHistory) history.pushState({gallery:true}, '', '/');
  document.title = baseTitle;
  setTimeout(() => { if(!inAbout) aboutEl.hidden = true; }, 500);
  canvas.focus({preventScroll:true});
}
$('#aboutBtn').onclick = e => { e.preventDefault(); if(inInf && inAbout) closeInf(); else if(inInf){ closeInf(true, true); openAbout(); } else if(inAbout) closeAbout(); else openAbout(); };
$('#aboutBack').onclick = () => closeAbout();

/* ---------- influences: from the About wall, look up at a ceiling tagged with the artists Mark rates ---------- */
let inInf = false, infShown = false, bioPending = false, infV = 0, infBuilt = false, infTimer = 0, infKey = null;
const infEl = $('#inf'), infBoard = $('#infBoard'), inspires = about && about.inspires;
// hand-placed spots for the desktop ceiling, in % of the screen: [x, y, size px at 1440 wide, rotation, hand]
const INF_NAME_POS = [[38,20,64,-4,'f1'],[52,12,24,7,'f4'],[56,25,32,3,'f2'],[23,15,26,6,'f5'],[87,30,24,-5,'f3'],[41,33,26,-3,'f4'],[28,42,17,-8,'f8'],[62,37,38,-5,'f7'],[76,41,32,4,'f5'],[26,54,42,-6,'f3'],[40,62,50,5,'f1'],[60,62,36,-3,'f4'],[76,56,34,-7,'f2'],[77,67,24,-3,'f5'],[50,75,30,4,'f1'],[20,85,30,4,'f7'],[50,84,17,-3,'f6'],[80,88,24,-3,'f8'],[54,90,15,3,'f6']];
const INF_PHOTO_POS = [[15,34,142,-5],[10,69,160,3],[34,79,176,4],[71,22,200,3],[89,50,200,-4],[65,79,140,-3],[91,80,126,5]];
const INF_SPARE = [[12,51,30,-5,'f3'],[88,64,20,4,'f5'],[30,26,20,-4,'f7'],[67,51,20,3,'f6'],[60,86,18,-3,'f5']]; // extra names land here
const HANDS = ['f1','f4','f2','f5','f3','f7','f8','f6'];
function buildInf(){
  if(infBuilt || !inspires) return; infBuilt = true;
  const names = inspires.names, photos = inspires.photos;
  const esc = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const nameEl = (n, i) => { const p = INF_NAME_POS[i] || INF_SPARE[i - INF_NAME_POS.length] || [50, 50, 22, (i%2?4:-4), HANDS[i % HANDS.length]];
    return '<'+(n.key?'button type="button"':'span')+' class="inf-name '+p[4]+'"'+(n.key?' data-k="'+n.key+'"':'')+' style="--x:'+p[0]+'%;--y:'+p[1]+'%;--s:'+p[2]+';--r:'+p[3]+'deg;--d:'+(i*70)+'ms">'+esc(n.name)+(n.met?'<i class="heart" aria-label="met">&hearts;</i>':'')+'</'+(n.key?'button':'span')+'>'; };
  const photoEl = (ph, i) => { const p = INF_PHOTO_POS[i] || [50, 50, 150, 0];
    return '<figure class="inf-photo'+(i%2?' r':'')+'" data-ks="'+ph.keys.join(' ')+'" style="--x:'+p[0]+'%;--y:'+p[1]+'%;--w:'+p[2]+';--r:'+p[3]+'deg;--d:'+(300+i*120)+'ms;--ar:'+(ph.w/ph.h).toFixed(3)+'"><i class="tape t1"></i><i class="tape t2"></i><img src="'+ph.src+'" width="'+ph.w+'" height="'+ph.h+'" alt="'+esc(ph.caption)+'" decoding="async"><figcaption>'+esc(ph.caption)+'</figcaption></figure>'; };
  // interleave in the DOM (a few names, then a photo) so the phone layout flows; desktop places everything absolutely
  let html = '<header class="inf-title"><h2>'+esc(inspires.heading)+'</h2><p>'+esc(inspires.intro)+'</p></header>';
  const per = Math.ceil(names.length / (photos.length + 1));
  names.forEach((n, i) => { html += nameEl(n, i); if((i + 1) % per === 0){ const k = (i + 1) / per - 1; if(photos[k]) html += photoEl(photos[k], k); } });
  photos.forEach((ph, k) => { if(k >= Math.floor(names.length / per)) html += photoEl(ph, k); });
  html += '<i class="inf-down" style="--x:7%;--y:19%"></i><i class="inf-down" style="--x:97%;--y:38%"></i><i class="inf-down" style="--x:65%;--y:12%"></i>';
  infBoard.innerHTML = html;
  const light = k => { if(k === infKey) return; infKey = k; infBoard.classList.toggle('hov', !!k);
    infBoard.querySelectorAll('[data-k]').forEach(e => e.classList.toggle('on', e.dataset.k === k));
    infBoard.querySelectorAll('.inf-photo').forEach(e => e.classList.toggle('on', !!k && e.dataset.ks.split(' ').includes(k))); };
  let clearT = 0;
  const hoverTo = k => { clearTimeout(clearT); if(k) light(k); else clearT = setTimeout(() => light(null), 110); };
  on(infBoard, 'pointerover', e => { if(e.pointerType !== 'mouse') return; const t = e.target.closest('[data-k],.inf-photo'); if(t && t.classList.contains('inf-photo')){ if(infKey && t.dataset.ks.split(' ').includes(infKey)) { clearTimeout(clearT); return; } } hoverTo(t && t.dataset.k ? t.dataset.k : null); });
  on(infBoard, 'pointerleave', e => { if(e.pointerType === 'mouse') hoverTo(null); });
  on(infBoard, 'click', e => { const t = e.target.closest('[data-k]'); if(!t) { if(!e.target.closest('.inf-photo')) light(null); return; }
    const k = infKey === t.dataset.k && !coarse ? null : t.dataset.k; light(k);
    if(k && coarse){ const ph = infBoard.querySelector('.inf-photo.on'); ph && ph.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'center'}); } });
}
/* look up from wherever you are: in the gallery it tilts up on the spot; on the About wall it looks up from the bio */
function openInf(fromHistory, instant){
  if(!inspires || inInf) return;
  if(openIdx >= 0) closeDetail(true);
  if(!grid.hidden) closeGrid(true);
  if(!fromHistory) history.pushState({gallery:true, about:inAbout, inf:true}, '', '/influences');
  document.title = 'Who inspires Mark Staples';
  inInf = true; hovered = -1; dragging = false; down = null; clearTimeout(infTimer);
  aboutEl.classList.remove('show'); document.body.classList.add('in-inf');
  buildInf(); infEl.hidden = false; infEl.querySelector('.inf-scroll').scrollTop = 0;
  $('#infBack').innerHTML = inAbout ? '&darr; Back to the bio' : '&darr; Back to the gallery';
  if(instant) infV = 1;
  infShown = false; bioPending = false;
  dismissHint();
}
function closeInf(fromHistory, silent){
  if(!inInf) return;
  inInf = false; infShown = false; clearTimeout(infTimer);
  infEl.classList.remove('show'); document.body.classList.remove('in-inf');
  setTimeout(() => { if(!inInf){ infEl.hidden = true; infEl.classList.remove('settled'); } }, 600);
  if(silent) return;
  if(inAbout){
    if(!fromHistory) history.pushState({gallery:true, about:true}, '', '/about');
    document.title = 'About Mark Staples';
    bioPending = true;
  } else {
    if(!fromHistory) history.pushState({gallery:true}, '', '/');
    document.title = baseTitle; canvas.focus({preventScroll:true});
  }
}
$('#infBack').onclick = () => closeInf();
$('#infBtn').onclick = e => { e.preventDefault(); openInf(); };

/* ---------- grid view ---------- */
const grid=$('#grid');
$('#cards').innerHTML = PIECES.map((p,i)=>`<button class="card" type="button" data-i="${i}">
  <div class="thumb"><img loading="lazy" alt="" src="${IMG[p.id].src}"></div>
  <h3>${p.title}</h3>
  <div class="row">${p.sold?'<span><span class="dot" aria-hidden="true"></span> <b>Sold</b></span>':((p.priceText||p.statusText) ? '<b>'+(p.priceText||p.statusText)+'</b>' : '')}<span>${p.venue&&!p.sold?'On show at '+p.venue.name:(p.kind||'')}</span></div></button>`).join('');
$('#cards').addEventListener('click', e=>{ const c=e.target.closest('.card'); if(!c) return; const i=+c.dataset.i; closeGrid(true); camTarget=camX=PIECES[i].x; openDetail(i); });
function openGrid(){ grid.hidden=false; requestAnimationFrame(()=>grid.classList.add('show')); setTimeout(()=>$('#gClose').focus({preventScroll:true}),50); dismissHint(); }
function closeGrid(instant){ grid.classList.remove('show'); if(instant) grid.hidden=true; else setTimeout(()=>{ grid.hidden=true; }, 360); }
/* All work is a real page now (the full archive) */ $('#gClose').onclick=()=>closeGrid();

/* ---------- intro, then start once fonts are ready (they're painted into textures) ---------- */
try{ const n=document.createElement('canvas'); n.width=n.height=180; const x=n.getContext('2d'), id=x.createImageData(180,180);
  for(let i=0;i<id.data.length;i+=4){ const v=Math.random()*255|0; id.data[i]=id.data[i+1]=id.data[i+2]=v; id.data[i+3]=255; }
  x.putImageData(id,0,0);  }catch(e){}
const intro=$('#loader'); requestAnimationFrame(()=>intro.classList.add('play'));
const fontsReady = document.fonts ? Promise.all([document.fonts.load('900 120px "Unbounded Variable"'), document.fonts.load('600 40px "Montserrat Variable"'), document.fonts.load('40px "Permanent Marker"')]) : Promise.resolve();
// the intro waits for the graffiti too (up to 4s), so the walls don't change after the room appears
Promise.all([Promise.race([fontsReady, new Promise(r=>setTimeout(r,2500))]), Promise.race([grafReady, new Promise(r=>setTimeout(r,4000))]), new Promise(r=>setTimeout(r, reduce?150:2300))]).then(()=>{
  if(GRAF.ready){ GRAF.fade = 1; GRAF.segs.forEach(sg => { sg.mesh.material.opacity = 1; }); }
  if(torsoMat && !scanReady){ const old=torsoMat.map; buildTorsoTexOnly(); old.dispose(); }
  intro.classList.add('gone'); started=true; t0=last=performance.now();
  if(initialView==='gallery' && !initialSlug) setTimeout(startHint, 900); else dismissHint();
  if(initialView==='about') openAbout(true, true);
  else if(initialView==='influences') openInf(true, true);
  else if(initialSlug){ const i=PIECES.findIndex(p=>p.slug===initialSlug); if(i>=0){ camTarget=camX=PIECES[i].x; if(openOnLoad) openDetail(i, true); } }
});
function buildTorsoTexOnly(){
  const p=PIECES.find(x=>x.model==='torso'); const g=p.group; g.remove(p.torso);
  const i=hitMeshes.indexOf(p.torso); const t=buildTorso(); t.position.y=1.0; t.castShadow=true; t.receiveShadow=true; g.add(t); t.userData.idx=PIECES.indexOf(p); hitMeshes[i]=t; p.torso=t;
}

  /* back/forward buttons open and close artworks */
  on(window, 'popstate', () => {
    const m = location.pathname.match(/^\/work\/([^/]+)/);
    if(location.pathname === '/influences'){ openInf(true); return; }
    if(location.pathname === '/about'){ if(inInf && inAbout) closeInf(true); else { closeInf(true, true); openAbout(true); } return; }
    if(inInf && !inAbout) closeInf(true); else closeInf(true, true);
    if(inAbout) closeAbout(true);
    if(m){ const i = PIECES.findIndex(p=>p.slug===m[1]); if(i>=0){ camTarget=camX=PIECES[i].x; openDetail(i, true); } }
    else if(openIdx>=0) closeDetail(true);
  });
  const gp = $('.grid-head p'); if(gp) gp.textContent = 'Mark Staples \u00b7 ' + PIECES.length + ' pieces';
  const ct = $('#count'); if(ct) ct.textContent = '00 / ' + String(PIECES.length).padStart(2,'0');

  return () => {
    alive = false; offs.forEach(f=>f());
    try{ renderer.dispose(); renderer.forceContextLoss(); }catch(e){}
    try{ if(spin){ spin.r.dispose(); spin.r.forceContextLoss(); } }catch(e){}
  };
}
