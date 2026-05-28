/* 3 · Image Sensing — sampling and quantization */
window.ImageSensing = (function(){
  let step=1, bits=8, bayer=false;
  let canvas;
  function init(){
    canvas=document.getElementById('sensing-canvas');
    document.getElementById('sense-sample').addEventListener('input',e=>{step=+e.target.value;document.getElementById('sense-step').textContent=step;render();});
    document.getElementById('sense-bits').addEventListener('input',e=>{bits=+e.target.value;document.getElementById('sense-levels').textContent=1<<bits;render();});
    document.getElementById('sense-bayer').addEventListener('change',e=>{bayer=e.target.checked;render();});
    CV.onImage(render);
  }
  function render(){
    const src = CV.current; if(!src) return;
    const w=src.width,h=src.height;
    const out = CV.emptyImage(w,h);
    const levels = 1<<bits;
    const q = 256/levels;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      // nearest-neighbor sample to coarser grid
      const sx = (Math.floor(x/step))*step;
      const sy = (Math.floor(y/step))*step;
      const si = (sy*w+sx)*4, di=(y*w+x)*4;
      for(let c=0;c<3;c++){
        let v = src.data[si+c];
        // quantize
        v = Math.floor(v/q)*q;
        if(bayer){
          // Bayer pattern: RGGB
          const r = (y%2===0 && x%2===0);
          const b = (y%2===1 && x%2===1);
          if(c===0 && !r) v=0;
          else if(c===2 && !b) v=0;
          else if(c===1 && (r||b)) v=0;
        }
        out.data[di+c]=v;
      }
      out.data[di+3]=255;
    }
    CV.drawTo(canvas,out);
  }
  return {init};
})();
