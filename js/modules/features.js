/* 8 · Feature Detectors */
window.Features = (function(){
  let mode='sobel', thresh=80, sigma=14, nms=true;
  let canvas;
  function init(){
    canvas=document.getElementById('feat-canvas');
    document.getElementById('feat-mode').addEventListener('change',e=>{mode=e.target.value;render();});
    document.getElementById('feat-thresh').addEventListener('input',e=>{thresh=+e.target.value;render();});
    document.getElementById('feat-sigma').addEventListener('input',e=>{sigma=+e.target.value;render();});
    document.getElementById('feat-nms').addEventListener('change',e=>{nms=e.target.checked;render();});
    CV.onImage(render);
  }
  const SOBELX=[[-1,0,1],[-2,0,2],[-1,0,1]];
  const SOBELY=[[-1,-2,-1],[0,0,0],[1,2,1]];
  function conv(g,w,h,K){
    const n=K.length,r=(n-1)/2,out=new Float32Array(g.length);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){let s=0;
      for(let ky=-r;ky<=r;ky++) for(let kx=-r;kx<=r;kx++){
        const yy=Math.min(h-1,Math.max(0,y+ky));
        const xx=Math.min(w-1,Math.max(0,x+kx));
        s+=g[yy*w+xx]*K[ky+r][kx+r];
      }
      out[y*w+x]=s;
    } return out;
  }
  function gauss(g,w,h,sig){
    const r=Math.max(1,Math.round(sig*2/10));
    const K=[]; let sum=0;
    const s2=sig*sig/100;
    for(let y=-r;y<=r;y++){const row=[];for(let x=-r;x<=r;x++){
      const v=Math.exp(-(x*x+y*y)/(2*s2)); row.push(v); sum+=v;
    } K.push(row);}
    for(let i=0;i<K.length;i++) for(let j=0;j<K[0].length;j++) K[i][j]/=sum;
    return conv(g,w,h,K);
  }
  function render(){
    const src=CV.current; if(!src) return;
    const w=src.width,h=src.height;
    let g=CV.toGray(src);
    let out, count=0;
    if(mode==='sobel'){
      const gx=conv(g,w,h,SOBELX), gy=conv(g,w,h,SOBELY);
      const m=new Float32Array(g.length);
      for(let i=0;i<g.length;i++){m[i]=Math.hypot(gx[i],gy[i]); if(m[i]>thresh) count++;}
      out=CV.grayToImage(m,w,h);
    } else if(mode==='canny'){
      g = gauss(g,w,h,sigma);
      const gx=conv(g,w,h,SOBELX), gy=conv(g,w,h,SOBELY);
      const mag=new Float32Array(g.length), dir=new Float32Array(g.length);
      for(let i=0;i<g.length;i++){mag[i]=Math.hypot(gx[i],gy[i]); dir[i]=Math.atan2(gy[i],gx[i]);}
      // non-max suppression
      const supp=new Float32Array(g.length);
      for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
        const i=y*w+x, ang=(dir[i]*180/Math.PI+180)%180;
        let a,b;
        if(ang<22.5||ang>=157.5){a=mag[i-1]; b=mag[i+1];}
        else if(ang<67.5){a=mag[i-w-1]; b=mag[i+w+1];}
        else if(ang<112.5){a=mag[i-w]; b=mag[i+w];}
        else {a=mag[i-w+1]; b=mag[i+w-1];}
        supp[i] = (mag[i]>=a && mag[i]>=b)?mag[i]:0;
      }
      // threshold (double thresh simplified)
      const edge=new Float32Array(g.length);
      for(let i=0;i<g.length;i++){edge[i] = supp[i]>thresh?255:0; if(edge[i]) count++;}
      out=CV.grayToImage(edge,w,h);
    } else if(mode==='harris'){
      g = gauss(g,w,h,8);
      const Ix=conv(g,w,h,SOBELX), Iy=conv(g,w,h,SOBELY);
      const Ixx=new Float32Array(g.length), Iyy=new Float32Array(g.length), Ixy=new Float32Array(g.length);
      for(let i=0;i<g.length;i++){Ixx[i]=Ix[i]*Ix[i]; Iyy[i]=Iy[i]*Iy[i]; Ixy[i]=Ix[i]*Iy[i];}
      // box-blur the products (window)
      const B = (a)=>conv(a,w,h,[[1,1,1],[1,1,1],[1,1,1]].map(r=>r.map(v=>v/9)));
      const Sxx=B(Ixx), Syy=B(Iyy), Sxy=B(Ixy);
      const R=new Float32Array(g.length);
      const k=0.04;
      for(let i=0;i<g.length;i++){
        const det = Sxx[i]*Syy[i]-Sxy[i]*Sxy[i];
        const tr  = Sxx[i]+Syy[i];
        R[i] = det - k*tr*tr;
      }
      // draw original gray + red dots at corners
      out = CV.grayToImage(CV.toGray(src),w,h);
      const T = thresh*1e4;
      for(let y=2;y<h-2;y++) for(let x=2;x<w-2;x++){
        const i=y*w+x;
        if(R[i]<T) continue;
        if(nms){
          let max=true;
          for(let dy=-1;dy<=1&&max;dy++) for(let dx=-1;dx<=1&&max;dx++){
            if(dx||dy){ if(R[i+dy*w+dx]>R[i]) max=false; }
          }
          if(!max) continue;
        }
        count++;
        for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){
          if(dx*dx+dy*dy<=4){
            const j=((y+dy)*w+(x+dx))*4;
            out.data[j]=255; out.data[j+1]=80; out.data[j+2]=80;
          }
        }
      }
    } else if(mode==='dog'){
      const a=gauss(g,w,h,sigma*0.6);
      const b=gauss(g,w,h,sigma);
      const d=new Float32Array(g.length);
      for(let i=0;i<g.length;i++) d[i]=Math.abs(a[i]-b[i])*4;
      for(let i=0;i<d.length;i++) if(d[i]>thresh) count++;
      out=CV.grayToImage(d,w,h);
    }
    CV.drawTo(canvas,out);
    document.getElementById('feat-count').textContent = count;
  }
  return {init};
})();
