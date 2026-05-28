/* 7 · Fourier Transform — 2D DFT (slow but live) */
window.Fourier = (function(){
  let mode='none', R=30, BW=10, N=64;
  let imgC, specC, reconC;
  function init(){
    imgC=document.getElementById('ft-img');
    specC=document.getElementById('ft-spec');
    reconC=document.getElementById('ft-recon');
    document.getElementById('ft-mode').addEventListener('change',e=>{mode=e.target.value;render();});
    document.getElementById('ft-r').addEventListener('input',e=>{R=+e.target.value;render();});
    document.getElementById('ft-bw').addEventListener('input',e=>{BW=+e.target.value;render();});
    CV.onImage(render);
  }
  // DFT-2D using row/col 1D DFT (O(N^3) — keep N small, e.g. 64)
  function dft1(re,im){
    const N=re.length, R=new Float64Array(N), I=new Float64Array(N);
    for(let k=0;k<N;k++){
      let sr=0,si=0;
      for(let n=0;n<N;n++){
        const a=-2*Math.PI*k*n/N;
        sr += re[n]*Math.cos(a)-im[n]*Math.sin(a);
        si += re[n]*Math.sin(a)+im[n]*Math.cos(a);
      }
      R[k]=sr; I[k]=si;
    }
    return [R,I];
  }
  function idft1(re,im){
    const N=re.length, R=new Float64Array(N), I=new Float64Array(N);
    for(let n=0;n<N;n++){
      let sr=0,si=0;
      for(let k=0;k<N;k++){
        const a=2*Math.PI*k*n/N;
        sr += re[k]*Math.cos(a)-im[k]*Math.sin(a);
        si += re[k]*Math.sin(a)+im[k]*Math.cos(a);
      }
      R[n]=sr/N; I[n]=si/N;
    }
    return [R,I];
  }
  function dft2(re,im,N){
    // rows
    for(let y=0;y<N;y++){
      const rrow=new Float64Array(N), irow=new Float64Array(N);
      for(let x=0;x<N;x++){rrow[x]=re[y*N+x]; irow[x]=im[y*N+x];}
      const [R,I]=dft1(rrow,irow);
      for(let x=0;x<N;x++){re[y*N+x]=R[x]; im[y*N+x]=I[x];}
    }
    // cols
    for(let x=0;x<N;x++){
      const rcol=new Float64Array(N), icol=new Float64Array(N);
      for(let y=0;y<N;y++){rcol[y]=re[y*N+x]; icol[y]=im[y*N+x];}
      const [R,I]=dft1(rcol,icol);
      for(let y=0;y<N;y++){re[y*N+x]=R[y]; im[y*N+x]=I[y];}
    }
  }
  function idft2(re,im,N){
    for(let y=0;y<N;y++){
      const r=new Float64Array(N), i=new Float64Array(N);
      for(let x=0;x<N;x++){r[x]=re[y*N+x]; i[x]=im[y*N+x];}
      const [R,I]=idft1(r,i);
      for(let x=0;x<N;x++){re[y*N+x]=R[x]; im[y*N+x]=I[x];}
    }
    for(let x=0;x<N;x++){
      const r=new Float64Array(N), i=new Float64Array(N);
      for(let y=0;y<N;y++){r[y]=re[y*N+x]; i[y]=im[y*N+x];}
      const [R,I]=idft1(r,i);
      for(let y=0;y<N;y++){re[y*N+x]=R[y]; im[y*N+x]=I[y];}
    }
  }
  function render(){
    const src=CV.current; if(!src) return;
    // downsample to N×N grayscale for tractable DFT
    const small = CV.resize(src,N,N);
    const g = CV.toGray(small);
    // input panel
    CV.drawTo(imgC, scaleUp(CV.grayToImage(g,N,N), 256));
    // FFT
    const re=new Float64Array(N*N), im=new Float64Array(N*N);
    for(let i=0;i<g.length;i++) re[i]=g[i];
    dft2(re,im,N);
    // shift to centre, apply filter, draw spectrum
    const half=N/2;
    const mag = new Float64Array(N*N);
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){
      const sx=(x+half)%N, sy=(y+half)%N;
      mag[y*N+x]=Math.hypot(re[sy*N+sx],im[sy*N+sx]);
    }
    const lmag = mag.map(v=>Math.log(1+v));
    const mx = Math.max(...lmag);
    const sImg = CV.emptyImage(N,N);
    for(let i=0;i<N*N;i++){
      const v = lmag[i]/mx*255;
      sImg.data[i*4]=sImg.data[i*4+1]=sImg.data[i*4+2]=v;
    }
    CV.drawTo(specC, scaleUp(sImg,256));
    // filter (operate on shifted coords)
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){
      const cx=x-half, cy=y-half;
      const d=Math.hypot(cx,cy);
      let H=1;
      if(mode==='low') H = d<=R?1:0;
      else if(mode==='high') H = d>R?1:0;
      else if(mode==='bandpass') H = (d>=R-BW/2 && d<=R+BW/2)?1:0;
      else if(mode==='gaussLow') H = Math.exp(-(d*d)/(2*R*R));
      const sx=(x+half)%N, sy=(y+half)%N;
      re[sy*N+sx]*=H; im[sy*N+sx]*=H;
    }
    idft2(re,im,N);
    const rec = new Float32Array(N*N);
    for(let i=0;i<N*N;i++) rec[i]=re[i];
    CV.drawTo(reconC, scaleUp(CV.grayToImage(rec,N,N),256));
  }
  function scaleUp(img,size){
    const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
    c.getContext('2d').putImageData(CV.toImageData(img),0,0);
    const c2=document.createElement('canvas'); c2.width=size; c2.height=size;
    const ctx=c2.getContext('2d'); ctx.imageSmoothingEnabled=false;
    ctx.drawImage(c,0,0,size,size);
    const id=ctx.getImageData(0,0,size,size);
    return {width:size,height:size,data:id.data};
  }
  return {init};
})();
