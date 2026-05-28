/* 5 · Intensity Transformations */
window.Intensity = (function(){
  let op='identity',gamma=1,lo=20,hi=235;
  let canvas, hist;
  function init(){
    canvas=document.getElementById('intensity-canvas');
    hist=document.getElementById('intensity-hist');
    document.getElementById('i-op').addEventListener('change',e=>{op=e.target.value;render();});
    document.getElementById('i-param').addEventListener('input',e=>{gamma=e.target.value/100;render();});
    document.getElementById('i-lo').addEventListener('input',e=>{lo=+e.target.value;render();});
    document.getElementById('i-hi').addEventListener('input',e=>{hi=+e.target.value;render();});
    CV.onImage(render);
  }
  function lut(){
    const L=new Uint8Array(256);
    if(op==='equalize') return null;
    for(let r=0;r<256;r++){
      let s;
      switch(op){
        case 'negative': s=255-r; break;
        case 'log': s=Math.round(45*Math.log(1+r)); break;
        case 'gamma': s=255*Math.pow(r/255,gamma); break;
        case 'stretch':
          s = r<=lo?0 : r>=hi?255 : (r-lo)*255/(hi-lo); break;
        case 'threshold': s = r > Math.round(gamma*255/5) ? 255:0; break;
        default: s=r;
      }
      L[r]=Math.max(0,Math.min(255,s|0));
    }
    return L;
  }
  function render(){
    const src=CV.current; if(!src) return;
    const w=src.width,h=src.height;
    const out=CV.emptyImage(w,h);
    let L = lut();
    if(op==='equalize'){
      // build histogram of gray, then cdf
      const g=CV.toGray(src);
      const H=new Array(256).fill(0);
      for(let i=0;i<g.length;i++) H[Math.min(255,g[i]|0)]++;
      const cdf=new Array(256); let acc=0;
      for(let i=0;i<256;i++){acc+=H[i]; cdf[i]=acc;}
      const N=g.length, cmin=cdf.find(v=>v>0);
      L = cdf.map(v=>Math.round((v-cmin)/(N-cmin)*255));
    }
    for(let i=0;i<src.data.length;i+=4){
      out.data[i]=L[src.data[i]];
      out.data[i+1]=L[src.data[i+1]];
      out.data[i+2]=L[src.data[i+2]];
      out.data[i+3]=255;
    }
    CV.drawTo(canvas,out);
    drawHist(out);
  }
  function drawHist(img){
    const g=CV.toGray(img);
    const H=new Array(256).fill(0);
    for(let i=0;i<g.length;i++) H[Math.min(255,Math.max(0,g[i]|0))]++;
    const ctx=hist.getContext('2d');
    ctx.fillStyle='#0d1117'; ctx.fillRect(0,0,hist.width,hist.height);
    const mx=Math.max(...H);
    ctx.fillStyle='#7ee787';
    const bw=hist.width/256;
    for(let i=0;i<256;i++){
      const hh=H[i]/mx*(hist.height-10);
      ctx.fillRect(i*bw,hist.height-hh,bw,hh);
    }
    ctx.fillStyle='#8b949e'; ctx.font='10px Consolas';
    ctx.fillText('Histogram (gray)',6,12);
  }
  return {init};
})();
