/* 17 · Generative — latent walks and diffusion */
window.Generative = (function(){
  let mode='vae', z1=0, z2=0, t=0;
  let canvas, info;
  function init(){
    canvas=document.getElementById('gen-canvas');
    info=document.getElementById('gen-info');
    document.getElementById('gen-mode').addEventListener('change',e=>{mode=e.target.value;render();});
    document.getElementById('gen-z1').addEventListener('input',e=>{z1=e.target.value/100;render();});
    document.getElementById('gen-z2').addEventListener('input',e=>{z2=e.target.value/100;render();});
    document.getElementById('gen-t').addEventListener('input',e=>{t=e.target.value/100;render();});
    CV.onImage(render);
  }
  function render(){
    const w=canvas.width, h=canvas.height;
    const out=CV.emptyImage(w,h);
    if(mode==='diff'){
      const src=CV.current; if(!src) return;
      const sm=CV.resize(src,w,h);
      const sigma = t*120;
      for(let i=0;i<sm.data.length;i+=4){
        const n = randn()*sigma;
        for(let k=0;k<3;k++) out.data[i+k]=Math.max(0,Math.min(255,sm.data[i+k]+n));
        out.data[i+3]=255;
      }
      info.textContent = `Diffusion forward process: x_t = x_0 + N(0,σ²),  σ = ${sigma.toFixed(0)}.  Train a denoiser to reverse this — that is diffusion.`;
    } else {
      // VAE / GAN walk: deterministic image as a function of (z1,z2)
      // We synthesize a "face-like" pattern that smoothly morphs
      for(let y=0;y<h;y++) for(let x=0;x<w;x++){
        const u=(x/w-0.5)*2, v=(y/h-0.5)*2;
        const d1 = Math.exp(-((u-0.3-z1*0.2)**2+(v+0.2)**2)*8);
        const d2 = Math.exp(-((u+0.3+z1*0.2)**2+(v+0.2)**2)*8);
        const mouth = Math.exp(-((u)**2*4 + (v-0.3-z2*0.2)**2*16)*4);
        const halo  = Math.exp(-((u**2+v**2)*1.2));
        const blob  = Math.sin(z1*3+u*3)*Math.cos(z2*3+v*3)*0.5+0.5;
        const r = halo*200 + d1*255 + d2*255 + blob*40;
        const g = halo*180 + d1*255 + d2*255 + mouth*200;
        const b = halo*150 + mouth*120;
        const i=(y*w+x)*4;
        out.data[i]=Math.min(255,r);
        out.data[i+1]=Math.min(255,g);
        out.data[i+2]=Math.min(255,b);
        out.data[i+3]=255;
      }
      info.textContent = mode==='vae'
        ? `VAE: encoder maps x to (μ,σ), decoder maps z=μ+σ·ε back to x. You are walking the prior z=(${z1.toFixed(2)}, ${z2.toFixed(2)}).`
        : `GAN: generator G(z) tries to fool discriminator D. Sliders walk the same 2D latent z=(${z1.toFixed(2)}, ${z2.toFixed(2)}).`;
    }
    CV.drawTo(canvas,out);
  }
  function randn(){
    let u=Math.random(), v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }
  return {init};
})();
