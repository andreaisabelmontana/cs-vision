/* 6 · Local Transformations — Convolution playground */
window.Local = (function(){
  const KERNELS = {
    identity: [[0,0,0],[0,1,0],[0,0,0]],
    boxblur: [[1,1,1],[1,1,1],[1,1,1]].map(r=>r.map(v=>v/9)),
    gauss3: [[1,2,1],[2,4,2],[1,2,1]].map(r=>r.map(v=>v/16)),
    gauss5: gauss5(),
    sobelx: [[-1,0,1],[-2,0,2],[-1,0,1]],
    sobely: [[-1,-2,-1],[0,0,0],[1,2,1]],
    sobelmag:'special',
    laplacian: [[0,1,0],[1,-4,1],[0,1,0]],
    sharpen: [[0,-1,0],[-1,5,-1],[0,-1,0]],
    emboss: [[-2,-1,0],[-1,1,1],[0,1,2]],
    median:'special',
    custom: [[0,0,0],[0,1,0],[0,0,0]]
  };
  function gauss5(){
    const s=1.4; const K=[]; let sum=0;
    for(let y=-2;y<=2;y++){const row=[]; for(let x=-2;x<=2;x++){
      const v=Math.exp(-(x*x+y*y)/(2*s*s)); row.push(v); sum+=v;
    } K.push(row);}
    return K.map(r=>r.map(v=>v/sum));
  }
  let preset='identity', kernel=KERNELS.identity, iters=1;
  let canvas, gridEl;
  function init(){
    canvas=document.getElementById('conv-canvas');
    gridEl=document.getElementById('kernel-grid');
    document.getElementById('k-preset').addEventListener('change',e=>{
      preset=e.target.value;
      kernel = KERNELS[preset]==='special'?KERNELS.identity:KERNELS[preset];
      rebuildGrid(); render();
    });
    document.getElementById('k-iter').addEventListener('input',e=>{iters=+e.target.value;render();});
    rebuildGrid();
    CV.onImage(render);
  }
  function rebuildGrid(){
    const k=kernel; const n=k.length;
    gridEl.style.gridTemplateColumns=`repeat(${n},auto)`;
    gridEl.innerHTML='';
    for(let y=0;y<n;y++) for(let x=0;x<n;x++){
      const inp=document.createElement('input');
      inp.value=k[y][x].toFixed(2); inp.dataset.x=x; inp.dataset.y=y;
      inp.disabled = preset!=='custom';
      inp.addEventListener('input',e=>{
        kernel[y][x]=parseFloat(e.target.value)||0;
        render();
      });
      gridEl.appendChild(inp);
    }
  }
  function convolve(g,w,h,K){
    const n=K.length, r=(n-1)/2;
    const out=new Float32Array(g.length);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      let s=0;
      for(let ky=-r;ky<=r;ky++) for(let kx=-r;kx<=r;kx++){
        const yy=Math.min(h-1,Math.max(0,y+ky));
        const xx=Math.min(w-1,Math.max(0,x+kx));
        s += g[yy*w+xx]*K[ky+r][kx+r];
      }
      out[y*w+x]=s;
    }
    return out;
  }
  function median(g,w,h,n=3){
    const r=(n-1)/2;
    const out=new Float32Array(g.length);
    const buf=new Array(n*n);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      let k=0;
      for(let ky=-r;ky<=r;ky++) for(let kx=-r;kx<=r;kx++){
        const yy=Math.min(h-1,Math.max(0,y+ky));
        const xx=Math.min(w-1,Math.max(0,x+kx));
        buf[k++]=g[yy*w+xx];
      }
      buf.sort((a,b)=>a-b);
      out[y*w+x]=buf[(n*n)>>1];
    }
    return out;
  }
  function render(){
    const src=CV.current; if(!src) return;
    let g = CV.toGray(src);
    const w=src.width,h=src.height;
    for(let i=0;i<iters;i++){
      if(preset==='sobelmag'){
        const gx=convolve(g,w,h,KERNELS.sobelx);
        const gy=convolve(g,w,h,KERNELS.sobely);
        g = new Float32Array(g.length);
        for(let j=0;j<g.length;j++) g[j]=Math.min(255,Math.hypot(gx[j],gy[j]));
      } else if(preset==='median'){
        g = median(g,w,h,3);
      } else {
        g = convolve(g,w,h,kernel);
      }
    }
    // normalize for negative kernels (sobel etc)
    if(['sobelx','sobely','laplacian','emboss'].includes(preset)){
      for(let i=0;i<g.length;i++) g[i]=Math.abs(g[i]);
    }
    CV.drawTo(canvas,CV.grayToImage(g,w,h));
  }
  return {init};
})();
