/* 13 · Segmentation */
window.Segmentation = (function(){
  let mode='thresh', K=3, tol=20, seed=null;
  let canvas;
  function init(){
    canvas=document.getElementById('seg-canvas');
    document.getElementById('seg-mode').addEventListener('change',e=>{mode=e.target.value;render();});
    document.getElementById('seg-k').addEventListener('input',e=>{K=+e.target.value;render();});
    document.getElementById('seg-tol').addEventListener('input',e=>{tol=+e.target.value;render();});
    canvas.addEventListener('click',e=>{
      const r=canvas.getBoundingClientRect();
      seed=[Math.round((e.clientX-r.left)*canvas.width/r.width),
            Math.round((e.clientY-r.top)*canvas.height/r.height)];
      if(mode==='region') render();
    });
    CV.onImage(render);
  }
  function otsu(g){
    const H=new Array(256).fill(0);
    for(let i=0;i<g.length;i++) H[Math.min(255,g[i]|0)]++;
    const N=g.length; let sum=0; for(let i=0;i<256;i++) sum+=i*H[i];
    let sumB=0,wB=0,max=0,t=0;
    for(let i=0;i<256;i++){
      wB+=H[i]; if(!wB) continue;
      const wF=N-wB; if(!wF) break;
      sumB+=i*H[i];
      const mB=sumB/wB, mF=(sum-sumB)/wF;
      const v=wB*wF*(mB-mF)**2;
      if(v>max){max=v;t=i;}
    }
    return t;
  }
  function render(){
    const src=CV.current; if(!src) return;
    const w=src.width,h=src.height;
    const out=CV.emptyImage(w,h);
    if(mode==='thresh'){
      const g=CV.toGray(src);
      const t=otsu(g);
      for(let i=0,j=0;j<g.length;i+=4,j++){
        const v = g[j]>t?255:30;
        out.data[i]=out.data[i+1]=out.data[i+2]=v; out.data[i+3]=255;
      }
      document.getElementById('seg-info').textContent=`Otsu threshold = ${t}`;
    } else if(mode==='kmeans'){
      // k-means in RGB
      const cents=[]; for(let i=0;i<K;i++){
        const r=Math.random()*src.data.length/4|0;
        cents.push([src.data[r*4],src.data[r*4+1],src.data[r*4+2]]);
      }
      const N=src.data.length/4;
      const lab=new Int32Array(N);
      for(let it=0;it<6;it++){
        for(let p=0;p<N;p++){
          let best=0, bd=Infinity;
          const r=src.data[p*4], g=src.data[p*4+1], b=src.data[p*4+2];
          for(let c=0;c<K;c++){
            const d=(r-cents[c][0])**2+(g-cents[c][1])**2+(b-cents[c][2])**2;
            if(d<bd){bd=d; best=c;}
          }
          lab[p]=best;
        }
        const sum=cents.map(()=>[0,0,0,0]);
        for(let p=0;p<N;p++){
          sum[lab[p]][0]+=src.data[p*4];
          sum[lab[p]][1]+=src.data[p*4+1];
          sum[lab[p]][2]+=src.data[p*4+2];
          sum[lab[p]][3]++;
        }
        for(let c=0;c<K;c++) if(sum[c][3]){
          cents[c][0]=sum[c][0]/sum[c][3];
          cents[c][1]=sum[c][1]/sum[c][3];
          cents[c][2]=sum[c][2]/sum[c][3];
        }
      }
      for(let p=0;p<N;p++){
        const c=cents[lab[p]];
        out.data[p*4]=c[0]; out.data[p*4+1]=c[1]; out.data[p*4+2]=c[2]; out.data[p*4+3]=255;
      }
      document.getElementById('seg-info').textContent=`k-means converged with k=${K}`;
    } else if(mode==='region'){
      if(!seed){
        for(let i=0;i<src.data.length;i++) out.data[i]=src.data[i];
        document.getElementById('seg-info').textContent='Click on image to set seed';
      } else {
        const g=CV.toGray(src);
        const sx=Math.max(0,Math.min(w-1,seed[0])), sy=Math.max(0,Math.min(h-1,seed[1]));
        const target=g[sy*w+sx];
        const mask=new Uint8Array(g.length);
        const stack=[[sx,sy]];
        while(stack.length){
          const [x,y]=stack.pop();
          if(x<0||y<0||x>=w||y>=h) continue;
          const i=y*w+x; if(mask[i]) continue;
          if(Math.abs(g[i]-target)>tol) continue;
          mask[i]=1;
          stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
        }
        for(let p=0;p<g.length;p++){
          if(mask[p]){out.data[p*4]=120;out.data[p*4+1]=220;out.data[p*4+2]=140;}
          else {out.data[p*4]=src.data[p*4]/2;out.data[p*4+1]=src.data[p*4+1]/2;out.data[p*4+2]=src.data[p*4+2]/2;}
          out.data[p*4+3]=255;
        }
        // mark seed
        const si=(sy*w+sx)*4; out.data[si]=255; out.data[si+1]=0; out.data[si+2]=0;
        document.getElementById('seg-info').textContent=`Seed=(${sx},${sy}), tol=${tol}`;
      }
    } else if(mode==='edge'){
      // sobel + threshold = edge map
      const g=CV.toGray(src);
      const Sx=[[-1,0,1],[-2,0,2],[-1,0,1]], Sy=[[-1,-2,-1],[0,0,0],[1,2,1]];
      function c(g,K){const out=new Float32Array(g.length); for(let y=0;y<h;y++) for(let x=0;x<w;x++){let s=0;
        for(let ky=-1;ky<=1;ky++) for(let kx=-1;kx<=1;kx++){
          const yy=Math.min(h-1,Math.max(0,y+ky)),xx=Math.min(w-1,Math.max(0,x+kx));
          s+=g[yy*w+xx]*K[ky+1][kx+1];
        } out[y*w+x]=s;} return out;}
      const gx=c(g,Sx), gy=c(g,Sy);
      for(let j=0;j<g.length;j++){
        const m=Math.hypot(gx[j],gy[j]);
        const v = m>tol?255:0;
        out.data[j*4]=out.data[j*4+1]=out.data[j*4+2]=v; out.data[j*4+3]=255;
      }
      document.getElementById('seg-info').textContent='Edge-based: |∇I| > threshold';
    }
    CV.drawTo(canvas,out);
  }
  return {init};
})();
