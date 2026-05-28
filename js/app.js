/* CS Vision — shared state and utilities */
window.CV = (function(){
  const listeners = [];
  let current = null; // {width,height,data:Uint8ClampedArray RGBA}

  function emit(){ listeners.forEach(fn=>{ try{fn(current)}catch(e){console.error(e)} }); }
  function onImage(fn){ listeners.push(fn); if(current) fn(current); }
  function setImage(imgData){ current = imgData; emit(); updateMeta(); drawGlobal(); }

  function updateMeta(){
    if(!current) return;
    document.getElementById('img-dims').textContent = `${current.width}×${current.height}`;
    document.getElementById('img-channels').textContent = '4 (RGBA)';
    let sum=0;
    for(let i=0;i<current.data.length;i+=4){
      sum += (current.data[i]+current.data[i+1]+current.data[i+2])/3;
    }
    const mean = sum/(current.width*current.height);
    document.getElementById('img-mean').textContent = mean.toFixed(1);
  }

  function drawGlobal(){
    const c = document.getElementById('global-canvas');
    const ctx = c.getContext('2d');
    c.width = current.width; c.height = current.height;
    ctx.putImageData(toImageData(current), 0, 0);
  }

  // ---------- utils ----------
  function toImageData(img){
    const id = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
    return id;
  }
  function clone(img){
    return {width:img.width, height:img.height, data:new Uint8ClampedArray(img.data)};
  }
  function emptyImage(w,h){
    const d = new Uint8ClampedArray(w*h*4);
    for(let i=3;i<d.length;i+=4) d[i]=255;
    return {width:w,height:h,data:d};
  }
  function toGray(img){
    const g = new Float32Array(img.width*img.height);
    for(let i=0,j=0;i<img.data.length;i+=4,j++){
      g[j] = 0.299*img.data[i]+0.587*img.data[i+1]+0.114*img.data[i+2];
    }
    return g;
  }
  function grayToImage(g,w,h){
    const img = emptyImage(w,h);
    for(let i=0,j=0;j<g.length;i+=4,j++){
      const v = Math.max(0,Math.min(255,g[j]|0));
      img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=255;
    }
    return img;
  }
  function drawTo(canvas, img){
    canvas.width = img.width; canvas.height = img.height;
    canvas.getContext('2d').putImageData(toImageData(img),0,0);
  }
  function resize(img, w, h){
    const c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
    c.getContext('2d').putImageData(toImageData(img),0,0);
    const c2 = document.createElement('canvas'); c2.width=w; c2.height=h;
    const ctx = c2.getContext('2d'); ctx.imageSmoothingEnabled=true;
    ctx.drawImage(c,0,0,w,h);
    const id = ctx.getImageData(0,0,w,h);
    return {width:w,height:h,data:id.data};
  }

  // ---------- sample images ----------
  function sampleCheckerboard(s=320){
    const img = emptyImage(s,s); const k=20;
    for(let y=0;y<s;y++) for(let x=0;x<s;x++){
      const v = ((x/k|0)+(y/k|0))%2?230:30;
      const i=(y*s+x)*4; img.data[i]=img.data[i+1]=img.data[i+2]=v;
    } return img;
  }
  function sampleGradient(s=320){
    const img = emptyImage(s,s);
    for(let y=0;y<s;y++) for(let x=0;x<s;x++){
      const i=(y*s+x)*4;
      img.data[i]=x*255/s; img.data[i+1]=y*255/s;
      img.data[i+2]=255-(x*255/s);
    } return img;
  }
  function sampleNoise(s=320){
    const img = emptyImage(s,s);
    for(let i=0;i<img.data.length;i+=4){
      const v=Math.random()*255;
      img.data[i]=img.data[i+1]=img.data[i+2]=v;
    } return img;
  }
  function sampleShapes(s=320){
    const img = emptyImage(s,s);
    const c = document.createElement('canvas'); c.width=s; c.height=s;
    const ctx = c.getContext('2d');
    ctx.fillStyle='#222'; ctx.fillRect(0,0,s,s);
    ctx.fillStyle='#e6edf3'; ctx.beginPath(); ctx.arc(110,110,55,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#7ee787'; ctx.fillRect(180,60,90,90);
    ctx.fillStyle='#f85149'; ctx.beginPath();
    ctx.moveTo(70,220); ctx.lineTo(170,220); ctx.lineTo(120,300); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#58a6ff'; ctx.beginPath(); ctx.arc(240,250,40,0,Math.PI*2); ctx.fill();
    const id = ctx.getImageData(0,0,s,s);
    return {width:s,height:s,data:id.data};
  }
  function sampleCameraman(s=320){
    // simple synthetic "scene": gradient sky, ground, silhouette
    const img = emptyImage(s,s);
    const c = document.createElement('canvas'); c.width=s; c.height=s;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0,0,0,s);
    g.addColorStop(0,'#1a3a6b'); g.addColorStop(0.6,'#8baad9'); g.addColorStop(1,'#3b2f1f');
    ctx.fillStyle=g; ctx.fillRect(0,0,s,s);
    // sun
    ctx.fillStyle='#f7d65a'; ctx.beginPath(); ctx.arc(240,80,30,0,Math.PI*2); ctx.fill();
    // figure
    ctx.fillStyle='#111';
    ctx.beginPath(); ctx.arc(150,170,18,0,Math.PI*2); ctx.fill();
    ctx.fillRect(135,188,30,55);
    ctx.fillRect(120,243,18,50); ctx.fillRect(162,243,18,50);
    // camera box
    ctx.fillStyle='#222'; ctx.fillRect(120,160,30,18);
    const id = ctx.getImageData(0,0,s,s);
    // grayscale it
    for(let i=0;i<id.data.length;i+=4){
      const v=0.299*id.data[i]+0.587*id.data[i+1]+0.114*id.data[i+2];
      id.data[i]=id.data[i+1]=id.data[i+2]=v;
    }
    return {width:s,height:s,data:id.data};
  }

  function loadSample(name){
    let img;
    switch(name){
      case 'checker': img=sampleCheckerboard(); break;
      case 'gradient': img=sampleGradient(); break;
      case 'noise': img=sampleNoise(); break;
      case 'shapes': img=sampleShapes(); break;
      default: img=sampleCameraman();
    }
    setImage(img);
  }

  function loadFromFile(file){
    const reader = new FileReader();
    reader.onload = e=>{
      const im = new Image();
      im.onload = ()=>{
        const max = 320;
        const r = Math.min(max/im.width, max/im.height, 1);
        const w = Math.round(im.width*r), h=Math.round(im.height*r);
        const c = document.createElement('canvas'); c.width=w; c.height=h;
        c.getContext('2d').drawImage(im,0,0,w,h);
        const id = c.getContext('2d').getImageData(0,0,w,h);
        setImage({width:w,height:h,data:id.data});
      };
      im.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  return {
    onImage, setImage, get current(){return current;},
    clone, emptyImage, toGray, grayToImage, drawTo, toImageData, resize,
    loadSample, loadFromFile,
    sampleCheckerboard, sampleGradient, sampleNoise, sampleShapes, sampleCameraman
  };
})();
