/* 12 · Architectures — SVG diagrams */
window.Architectures = (function(){
  let pick='lenet', size=128;
  let el, info;
  function init(){
    el=document.getElementById('arch-diagram');
    info=document.getElementById('arch-info');
    document.getElementById('arch-pick').addEventListener('change',e=>{pick=e.target.value;render();});
    document.getElementById('arch-size').addEventListener('input',e=>{size=+e.target.value;render();});
    render();
  }
  function box(x,y,w,h,label,color){
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="#30363d" rx="6"/>`+
           `<text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" font-size="11" fill="#0d1117" font-family="Consolas">${label}</text>`;
  }
  function arrow(x1,y1,x2,y2){
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#7ee787" stroke-width="2" marker-end="url(#a)"/>`;
  }
  function svgWrap(inner,h=300){
    return `<svg viewBox="0 0 720 ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="a" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#7ee787"/></marker></defs>
      ${inner}</svg>`;
  }
  function render(){
    let s=size, html='', txt='';
    if(pick==='lenet'){
      const layers = [
        [`Input ${s}×${s}`, '#58a6ff'],
        [`C1 6×${s-4}×${s-4}`, '#7ee787'],
        [`S2 6×${(s-4)/2|0}²`, '#f7d65a'],
        [`C3 16`, '#7ee787'],
        [`S4 16`, '#f7d65a'],
        [`FC 120`, '#d2a8ff'],
        [`FC 84`, '#d2a8ff'],
        [`Out 10`, '#f85149']
      ];
      layers.forEach((L,i)=>{
        const x=20+i*85;
        html += box(x,120-i*4,75,55+i*4, L[0], L[1]);
        if(i<layers.length-1) html += arrow(x+75, 145, x+85, 145);
      });
      txt = 'Classic LeNet-5: conv → subsample (pool) → conv → subsample → fully connected stack. The pattern that started CNN classification.';
    } else if(pick==='vgg'){
      const block=['3×3 conv','3×3 conv','2×2 pool'];
      block.forEach((L,i)=>{
        html += box(40+i*180,100,160,80,L,i===2?'#f7d65a':'#7ee787');
        if(i<2) html += arrow(40+i*180+160,140,40+(i+1)*180,140);
      });
      txt='VGG block: repeated 3×3 convolutions then 2×2 pool. Stack 5 of these to get VGG-16. Receptive field grows by stacking small kernels.';
    } else if(pick==='resnet'){
      html += box(40,110,140,60,'Input','#58a6ff');
      html += box(220,40,140,60,'3×3 conv','#7ee787');
      html += box(220,180,140,60,'3×3 conv','#7ee787');
      html += box(400,110,140,60,'⊕ (residual)','#f7d65a');
      html += box(580,110,120,60,'Output','#d2a8ff');
      html += arrow(180,140,220,70); html += arrow(180,140,220,210);
      html += arrow(360,70,400,140); html += arrow(360,210,400,140);
      html += arrow(540,140,580,140);
      // skip
      html += `<path d="M110 110 C 200 0, 500 0, 400 110" stroke="#f85149" stroke-width="2" fill="none" stroke-dasharray="4 3" marker-end="url(#a)"/>`;
      html += `<text x="270" y="22" fill="#f85149" font-size="11" font-family="Consolas">skip connection</text>`;
      txt='ResNet residual block: y = F(x) + x. The skip lets gradients flow back, enabling very deep nets (50, 101, 152 layers).';
    } else if(pick==='unet'){
      // encoder/decoder with skip lines
      const enc=[`${s}`,`${s/2}`,`${s/4}`,`${s/8}`];
      const dec=[`${s/8}`,`${s/4}`,`${s/2}`,`${s}`];
      enc.forEach((L,i)=>{html += box(40,40+i*55,100,45,`enc ${L}`,'#7ee787');});
      dec.forEach((L,i)=>{html += box(580,40+i*55,100,45,`dec ${L}`,'#d2a8ff');});
      html += box(280,150,160,55,'bottleneck','#f7d65a');
      // skip lines
      for(let i=0;i<4;i++){
        const y1=62+i*55, y2=62+(3-i)*55;
        html += `<path d="M140 ${y1} C 350 ${y1}, 350 ${y2}, 580 ${y2}" stroke="#f85149" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/>`;
      }
      txt='U-Net: encoder downsamples, decoder upsamples, skip connections carry fine details across. Dominant for medical / semantic segmentation.';
    } else if(pick==='transformer'){
      html += box(40,130,90,50,`Image ${s}²`,'#58a6ff');
      html += box(160,130,110,50,'Patch → tokens','#7ee787');
      html += box(300,130,140,50,'+ pos enc','#7ee787');
      html += box(470,80,160,50,'Self-attention','#f7d65a');
      html += box(470,180,160,50,'MLP','#f7d65a');
      html += box(660,130,40,50,'cls','#d2a8ff');
      html += arrow(130,155,160,155); html += arrow(270,155,300,155); html += arrow(440,155,470,105); html += arrow(440,155,470,205);
      html += arrow(630,105,660,155); html += arrow(630,205,660,155);
      txt='Vision Transformer (ViT): split image into patches, treat as tokens, run through self-attention layers. Replaces convolutions with global attention.';
    }
    el.innerHTML = svgWrap(html);
    info.textContent = txt;
  }
  return {init};
})();
