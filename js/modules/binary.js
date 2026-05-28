/* 9 · Binary Object Characterization */
window.Binary = (function(){
  let thresh=128, morph='none', se=3, invert=false, label=true;
  let canvas, statsEl;
  function init(){
    canvas=document.getElementById('bin-canvas');
    statsEl=document.getElementById('bin-stats');
    document.getElementById('bin-thresh').addEventListener('input',e=>{thresh=+e.target.value;render();});
    document.getElementById('bin-morph').addEventListener('change',e=>{morph=e.target.value;render();});
    document.getElementById('bin-se').addEventListener('input',e=>{se=+e.target.value;render();});
    document.getElementById('bin-invert').addEventListener('change',e=>{invert=e.target.checked;render();});
    document.getElementById('bin-label').addEventListener('change',e=>{label=e.target.checked;render();});
    CV.onImage(render);
  }
  function erode(b,w,h,r){
    const out=new Uint8Array(b.length);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      let m=1;
      for(let dy=-r;dy<=r&&m;dy++) for(let dx=-r;dx<=r&&m;dx++){
        const xx=Math.min(w-1,Math.max(0,x+dx));
        const yy=Math.min(h-1,Math.max(0,y+dy));
        if(!b[yy*w+xx]) m=0;
      }
      out[y*w+x]=m;
    } return out;
  }
  function dilate(b,w,h,r){
    const out=new Uint8Array(b.length);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      let m=0;
      for(let dy=-r;dy<=r&&!m;dy++) for(let dx=-r;dx<=r&&!m;dx++){
        const xx=Math.min(w-1,Math.max(0,x+dx));
        const yy=Math.min(h-1,Math.max(0,y+dy));
        if(b[yy*w+xx]) m=1;
      }
      out[y*w+x]=m;
    } return out;
  }
  function ccLabel(b,w,h){
    const lab=new Int32Array(b.length); let nxt=1;
    const stack=[];
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      if(b[y*w+x] && !lab[y*w+x]){
        const id=nxt++; stack.push([x,y]);
        while(stack.length){
          const [cx,cy]=stack.pop(); const i=cy*w+cx;
          if(cx<0||cy<0||cx>=w||cy>=h||!b[i]||lab[i]) continue;
          lab[i]=id;
          stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
        }
      }
    }
    return {lab, count: nxt-1};
  }
  function render(){
    const src=CV.current; if(!src) return;
    const w=src.width,h=src.height; const g=CV.toGray(src);
    let b=new Uint8Array(g.length);
    for(let i=0;i<g.length;i++) b[i] = (g[i]>thresh)^invert?1:0;
    const r=(se-1)/2;
    if(morph==='erode') b=erode(b,w,h,r);
    else if(morph==='dilate') b=dilate(b,w,h,r);
    else if(morph==='open') b=dilate(erode(b,w,h,r),w,h,r);
    else if(morph==='close') b=erode(dilate(b,w,h,r),w,h,r);
    const {lab,count}=ccLabel(b,w,h);
    const out=CV.emptyImage(w,h);
    const colors=[];
    for(let i=1;i<=count;i++){
      const hue=(i*47)%360;
      colors.push(hslToRgb(hue/360,0.6,0.55));
    }
    // bounds & areas
    const stats={};
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      const id=lab[y*w+x];
      const di=(y*w+x)*4;
      if(id){
        const c = label?colors[id-1]:[255,255,255];
        out.data[di]=c[0]; out.data[di+1]=c[1]; out.data[di+2]=c[2];
        const s = stats[id] = stats[id]||{n:0,sx:0,sy:0,minx:w,maxx:0,miny:h,maxy:0,perim:0};
        s.n++; s.sx+=x; s.sy+=y;
        if(x<s.minx)s.minx=x; if(x>s.maxx)s.maxx=x;
        if(y<s.miny)s.miny=y; if(y>s.maxy)s.maxy=y;
        // perimeter: pixel touching background
        const n4=[(y-1)*w+x,(y+1)*w+x,y*w+x-1,y*w+x+1];
        for(const k of n4) if(k<0||k>=lab.length||lab[k]!==id){s.perim++;break;}
      } else {
        out.data[di]=out.data[di+1]=out.data[di+2]=20;
      }
      out.data[di+3]=255;
    }
    CV.drawTo(canvas,out);
    let txt = `objects: ${count}\n`;
    Object.entries(stats).slice(0,15).forEach(([id,s])=>{
      txt += `#${id}: area=${s.n}, perim≈${s.perim}, centroid=(${(s.sx/s.n).toFixed(0)},${(s.sy/s.n).toFixed(0)})  bbox=[${s.minx},${s.miny},${s.maxx},${s.maxy}]\n`;
    });
    statsEl.textContent = txt;
  }
  function hslToRgb(h,s,l){
    let r,g,b;
    if(s===0){r=g=b=l;}
    else{
      const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;
        if(t<1/6) return p+(q-p)*6*t;
        if(t<1/2) return q;
        if(t<2/3) return p+(q-p)*(2/3-t)*6;
        return p;};
      const q = l<0.5? l*(1+s) : l+s-l*s;
      const p = 2*l-q;
      r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
    }
    return [r*255|0,g*255|0,b*255|0];
  }
  return {init};
})();
