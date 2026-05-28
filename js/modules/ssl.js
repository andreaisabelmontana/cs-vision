/* 15 · Self-Supervised / Contrastive learning */
window.SSL = (function(){
  let viewsEl, embedC, embedCtx;
  let augStrength=0.5;
  // We have several "images" (sample previews). Each gets a fixed feature vector;
  // then we apply random augmentations and a learnable linear projection.
  let anchors = [], proj = null;
  let posSim=0, negSim=0;
  function init(){
    viewsEl=document.getElementById('ssl-views');
    embedC=document.getElementById('ssl-embed');
    embedCtx=embedC.getContext('2d');
    document.getElementById('ssl-aug').addEventListener('input',e=>{augStrength=e.target.value/100;regen();});
    document.getElementById('ssl-step').addEventListener('click',trainStep);
    document.getElementById('ssl-reset').addEventListener('click',()=>{init2(); render();});
    init2();
    render();
  }
  function init2(){
    anchors=[];
    const samples = [CV.sampleCameraman(80), CV.sampleCheckerboard(80), CV.sampleShapes(80), CV.sampleGradient(80)];
    samples.forEach(img=>{
      anchors.push({img, feat: featurize(img)});
    });
    // 8-dim features -> 2-dim projection
    proj = [];
    for(let i=0;i<2;i++){const row=[]; for(let j=0;j<8;j++) row.push(Math.random()*2-1); proj.push(row);}
  }
  function featurize(img){
    // very simple feature: 8 grid means of grayscale
    const g=CV.toGray(img); const w=img.width,h=img.height;
    const feat = new Array(8).fill(0);
    const cells = 4; // 2x2 grid? 2x4 -> 8
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      const cx = Math.min(3,(x/(w/4))|0), cy=Math.min(1,(y/(h/2))|0);
      feat[cy*4+cx] += g[y*w+x];
    }
    for(let i=0;i<8;i++) feat[i]/= (w*h/8)*255;
    return feat;
  }
  function augment(img){
    const out=CV.clone(img);
    const w=img.width,h=img.height;
    // brightness shift
    const b = (Math.random()-0.5)*100*augStrength;
    const c = 1+(Math.random()-0.5)*augStrength;
    // flip
    const flip = Math.random()<augStrength*0.5;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      const sx = flip?(w-1-x):x;
      const i=(y*w+x)*4, si=(y*w+sx)*4;
      for(let k=0;k<3;k++){
        let v=img.data[si+k];
        v = (v-128)*c+128+b;
        out.data[i+k]=Math.max(0,Math.min(255,v));
      }
    }
    return out;
  }
  function project(feat){
    const z=[0,0];
    for(let i=0;i<2;i++) for(let j=0;j<8;j++) z[i]+=proj[i][j]*feat[j];
    return z;
  }
  function normalize(z){
    const n=Math.hypot(z[0],z[1])+1e-9;
    return [z[0]/n,z[1]/n];
  }
  function cosine(a,b){return a[0]*b[0]+a[1]*b[1];}
  function regen(){
    render();
  }
  function trainStep(){
    // Build augmented views & gradient step to maximize positive cosine, minimize negative
    const views = anchors.map(a=>[augment(a.img),augment(a.img)]);
    const feats = views.map(pair=>[featurize(pair[0]),featurize(pair[1])]);
    const N=feats.length;
    const lr=0.05;
    // numerical gradient w.r.t. proj entries
    const compute = ()=>{
      let pos=0,neg=0;
      const zs = feats.map(p=>[normalize(project(p[0])),normalize(project(p[1]))]);
      for(let i=0;i<N;i++) pos+=cosine(zs[i][0],zs[i][1]);
      for(let i=0;i<N;i++) for(let j=0;j<N;j++) if(i!==j) neg+=cosine(zs[i][0],zs[j][1]);
      return {pos:pos/N, neg:neg/(N*(N-1)), loss: -pos/N + neg/(N*(N-1))*0.8};
    };
    const eps=0.02;
    const base=compute();
    for(let i=0;i<2;i++) for(let j=0;j<8;j++){
      proj[i][j]+=eps;
      const v=compute();
      const grad=(v.loss-base.loss)/eps;
      proj[i][j]-=eps;
      proj[i][j]-=lr*grad;
    }
    const after=compute();
    posSim=after.pos; negSim=after.neg;
    render();
  }
  function render(){
    viewsEl.innerHTML='';
    anchors.forEach((a,i)=>{
      const v1=augment(a.img), v2=augment(a.img);
      [v1,v2].forEach(img=>{
        const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
        c.getContext('2d').putImageData(CV.toImageData(img),0,0);
        viewsEl.appendChild(c);
      });
    });
    // embed plot
    embedCtx.fillStyle='#0d1117'; embedCtx.fillRect(0,0,embedC.width,embedC.height);
    embedCtx.strokeStyle='#30363d'; embedCtx.strokeRect(0,0,embedC.width,embedC.height);
    const cols=['#58a6ff','#7ee787','#f7d65a','#f85149'];
    anchors.forEach((a,i)=>{
      for(let k=0;k<6;k++){
        const aug = augment(a.img);
        const z = normalize(project(featurize(aug)));
        const px=embedC.width/2+z[0]*embedC.height*0.45;
        const py=embedC.height/2+z[1]*embedC.height*0.45;
        embedCtx.fillStyle=cols[i];
        embedCtx.beginPath(); embedCtx.arc(px,py,4,0,Math.PI*2); embedCtx.fill();
      }
    });
    document.getElementById('ssl-pos').textContent=posSim?posSim.toFixed(3):'—';
    document.getElementById('ssl-neg').textContent=negSim?negSim.toFixed(3):'—';
  }
  return {init};
})();
