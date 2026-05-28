/* 14 · Object Detection — template matching */
window.Detection = (function(){
  let main, heat;
  let template=null, dragging=false, start=null, sel=null;
  let threshPct=80, mode='ncc';
  function init(){
    main=document.getElementById('det-canvas');
    heat=document.getElementById('det-heat');
    document.getElementById('det-pick').addEventListener('click',()=>{sel=null; template=null; render();});
    document.getElementById('det-thresh').addEventListener('input',e=>{threshPct=+e.target.value;render();});
    document.getElementById('det-mode').addEventListener('change',e=>{mode=e.target.value;render();});
    main.addEventListener('mousedown',e=>{
      const r=main.getBoundingClientRect();
      dragging=true; start=[Math.round((e.clientX-r.left)*main.width/r.width),Math.round((e.clientY-r.top)*main.height/r.height)];
      sel=null; template=null;
    });
    main.addEventListener('mousemove',e=>{
      if(!dragging) return;
      const r=main.getBoundingClientRect();
      const x=Math.round((e.clientX-r.left)*main.width/r.width);
      const y=Math.round((e.clientY-r.top)*main.height/r.height);
      sel=[Math.min(start[0],x),Math.min(start[1],y),Math.abs(x-start[0]),Math.abs(y-start[1])];
      drawOverlay();
    });
    main.addEventListener('mouseup',e=>{
      dragging=false;
      if(sel && sel[2]>4 && sel[3]>4) buildTemplate();
      render();
    });
    CV.onImage(()=>{template=null;sel=null;render();});
  }
  function buildTemplate(){
    const src=CV.current; const w=src.width;
    const [x,y,tw,th]=sel;
    template={w:tw,h:th,data:new Float32Array(tw*th)};
    const g=CV.toGray(src);
    for(let yy=0;yy<th;yy++) for(let xx=0;xx<tw;xx++){
      template.data[yy*tw+xx] = g[(y+yy)*w+(x+xx)];
    }
  }
  function drawOverlay(){
    const src=CV.current; if(!src) return;
    CV.drawTo(main,src);
    if(sel){
      const ctx=main.getContext('2d');
      ctx.strokeStyle='#7ee787'; ctx.lineWidth=2;
      ctx.strokeRect(sel[0]+.5,sel[1]+.5,sel[2],sel[3]);
    }
  }
  function render(){
    const src=CV.current; if(!src) return;
    CV.drawTo(main,src);
    const ctx=main.getContext('2d');
    if(sel){ctx.strokeStyle='#7ee787';ctx.lineWidth=2;ctx.strokeRect(sel[0]+.5,sel[1]+.5,sel[2],sel[3]);}
    if(!template){
      const hctx=heat.getContext('2d');
      heat.width=src.width; heat.height=src.height;
      hctx.fillStyle='#0d1117'; hctx.fillRect(0,0,heat.width,heat.height);
      hctx.fillStyle='#8b949e'; hctx.font='12px Consolas';
      hctx.fillText('Drag a rectangle on the left to pick a template',12,20);
      return;
    }
    const g=CV.toGray(src);
    const w=src.width,h=src.height;
    const tw=template.w, th=template.h;
    // template mean / norm
    let tmean=0; for(let i=0;i<tw*th;i++) tmean+=template.data[i]; tmean/=(tw*th);
    let tvar=0; for(let i=0;i<tw*th;i++) tvar+=(template.data[i]-tmean)**2;
    const heatMap = new Float32Array(w*h);
    let maxR=-Infinity;
    for(let y=0;y<=h-th;y+=2) for(let x=0;x<=w-tw;x+=2){
      let smean=0;
      for(let yy=0;yy<th;yy++) for(let xx=0;xx<tw;xx++) smean+=g[(y+yy)*w+(x+xx)];
      smean/=(tw*th);
      if(mode==='ncc'){
        let num=0,svar=0;
        for(let yy=0;yy<th;yy++) for(let xx=0;xx<tw;xx++){
          const a=g[(y+yy)*w+(x+xx)]-smean, b=template.data[yy*tw+xx]-tmean;
          num+=a*b; svar+=a*a;
        }
        const r = num/Math.sqrt(svar*tvar+1e-9);
        heatMap[y*w+x]=r;
        if(r>maxR) maxR=r;
      } else {
        let ssd=0;
        for(let yy=0;yy<th;yy++) for(let xx=0;xx<tw;xx++){
          const d=g[(y+yy)*w+(x+xx)]-template.data[yy*tw+xx];
          ssd+=d*d;
        }
        heatMap[y*w+x] = -ssd;
        if(-ssd>maxR) maxR=-ssd;
      }
    }
    // normalize heatMap to 0..1
    let mn=Infinity,mx=-Infinity;
    for(let i=0;i<heatMap.length;i++){if(heatMap[i]&&heatMap[i]<mn)mn=heatMap[i]; if(heatMap[i]&&heatMap[i]>mx)mx=heatMap[i];}
    if(mn===Infinity){mn=0;mx=1;}
    heat.width=w; heat.height=h;
    const himg=heat.getContext('2d').createImageData(w,h);
    for(let i=0;i<heatMap.length;i++){
      const v = (heatMap[i]-mn)/(mx-mn+1e-9);
      himg.data[i*4]=v*255; himg.data[i*4+1]=v*64; himg.data[i*4+2]=(1-v)*180; himg.data[i*4+3]=255;
    }
    heat.getContext('2d').putImageData(himg,0,0);
    // detections (local maxima above threshold)
    const T = mn + (mx-mn)*threshPct/100;
    let count=0;
    for(let y=0;y<=h-th;y+=2) for(let x=0;x<=w-tw;x+=2){
      const v=heatMap[y*w+x];
      if(v<T) continue;
      // crude NMS: check 8 neighbours in heatmap (stride 2)
      let max=true;
      for(let dy=-2;dy<=2&&max;dy+=2) for(let dx=-2;dx<=2&&max;dx+=2){
        if(!dx&&!dy) continue;
        const nx=x+dx, ny=y+dy;
        if(nx<0||ny<0||nx>w-tw||ny>h-th) continue;
        if(heatMap[ny*w+nx]>v) max=false;
      }
      if(!max) continue;
      ctx.strokeStyle='#f7d65a'; ctx.lineWidth=2;
      ctx.strokeRect(x+.5,y+.5,tw,th);
      count++;
      if(count>50) break;
    }
    document.getElementById('det-count').textContent=count;
  }
  return {init};
})();
