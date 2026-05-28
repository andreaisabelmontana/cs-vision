/* 11 · CNN — live feature maps */
window.CNN = (function(){
  const KERNELS = {
    sobelx: [[-1,0,1],[-2,0,2],[-1,0,1]],
    sobely: [[-1,-2,-1],[0,0,0],[1,2,1]],
    gauss3: [[1,2,1],[2,4,2],[1,2,1]].map(r=>r.map(v=>v/16)),
    laplacian:[[0,1,0],[1,-4,1],[0,1,0]],
    edge:[[-1,-1,-1],[-1,8,-1],[-1,-1,-1]]
  };
  let k1='sobelx', pool='max', act='relu', depth=3;
  let inputC, stack;
  function init(){
    inputC=document.getElementById('cnn-input');
    stack=document.getElementById('cnn-stack');
    document.getElementById('cnn-k1').addEventListener('change',e=>{k1=e.target.value;render();});
    document.getElementById('cnn-pool').addEventListener('change',e=>{pool=e.target.value;render();});
    document.getElementById('cnn-act').addEventListener('change',e=>{act=e.target.value;render();});
    document.getElementById('cnn-depth').addEventListener('input',e=>{depth=+e.target.value;render();});
    CV.onImage(render);
  }
  function conv(g,w,h,K){
    const n=K.length,r=(n-1)/2,out=new Float32Array(g.length);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){let s=0;
      for(let ky=-r;ky<=r;ky++) for(let kx=-r;kx<=r;kx++){
        const yy=Math.min(h-1,Math.max(0,y+ky));
        const xx=Math.min(w-1,Math.max(0,x+kx));
        s+=g[yy*w+xx]*K[ky+r][kx+r];
      } out[y*w+x]=s;
    } return out;
  }
  function nonlinear(g){
    return g.map(v=>{
      if(act==='relu') return v>0?v:0;
      if(act==='tanh') return Math.tanh(v/100)*128+128;
      return v;
    });
  }
  function pool2(g,w,h){
    const w2=w>>1, h2=h>>1; const out=new Float32Array(w2*h2);
    for(let y=0;y<h2;y++) for(let x=0;x<w2;x++){
      const a=g[(2*y)*w+2*x], b=g[(2*y)*w+2*x+1];
      const c=g[(2*y+1)*w+2*x], d=g[(2*y+1)*w+2*x+1];
      out[y*w2+x] = pool==='max'?Math.max(a,b,c,d):(a+b+c+d)/4;
    } return {g:out,w:w2,h:h2};
  }
  function render(){
    const src=CV.current; if(!src) return;
    // shrink input to 128
    const small=CV.resize(src,128,128);
    let g=CV.toGray(small); let w=128,h=128;
    inputC.width=128; inputC.height=128;
    inputC.getContext('2d').putImageData(CV.toImageData(CV.grayToImage(g,w,h)),0,0);
    stack.innerHTML='';
    for(let i=0;i<depth;i++){
      // pick varying kernels per layer
      const Ks=Object.values(KERNELS);
      const K = i===0?KERNELS[k1]:Ks[(i*3)%Ks.length];
      g = conv(g,w,h,K);
      // normalize
      let mn=Infinity,mx=-Infinity;
      for(let j=0;j<g.length;j++){if(g[j]<mn)mn=g[j]; if(g[j]>mx)mx=g[j];}
      const norm = new Float32Array(g.length);
      for(let j=0;j<g.length;j++) norm[j] = (g[j]-mn)/(mx-mn+1e-9)*255;
      g = nonlinear(norm);
      addLayer(`conv${i+1}+${act}`, g, w, h);
      const p=pool2(g,w,h); g=p.g; w=p.w; h=p.h;
      addLayer(`pool ${w}×${h}`, g, w, h);
    }
  }
  function addLayer(label,g,w,h){
    const div=document.createElement('div'); div.className='layer';
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    c.getContext('2d').putImageData(CV.toImageData(CV.grayToImage(g,w,h)),0,0);
    const s=document.createElement('span'); s.textContent=label;
    div.appendChild(c); div.appendChild(s); stack.appendChild(div);
  }
  return {init};
})();
