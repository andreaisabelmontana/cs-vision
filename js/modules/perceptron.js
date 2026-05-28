/* 10 · MLP playground */
window.Perceptron = (function(){
  let canvas, ctx, points=[], net=null, training=false, epoch=0, lossVal=NaN;
  let H=8, lr=0.1, act='relu', data='manual';
  function init(){
    canvas=document.getElementById('mlp-canvas');
    ctx=canvas.getContext('2d');
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('mousedown',e=>{
      const r=canvas.getBoundingClientRect();
      const x=(e.clientX-r.left)/canvas.width*2-1;
      const y=-((e.clientY-r.top)/canvas.height*2-1);
      points.push({x,y,c:e.button===2?0:1});
      draw();
    });
    document.getElementById('mlp-h').addEventListener('input',e=>{H=+e.target.value;reset();});
    document.getElementById('mlp-lr').addEventListener('input',e=>{lr=e.target.value/1000;});
    document.getElementById('mlp-act').addEventListener('change',e=>{act=e.target.value;reset();});
    document.getElementById('mlp-data').addEventListener('change',e=>{data=e.target.value;loadData();});
    document.getElementById('mlp-train').addEventListener('click',()=>{training=!training; tick();});
    document.getElementById('mlp-step').addEventListener('click',()=>{step(); draw();});
    document.getElementById('mlp-reset').addEventListener('click',reset);
    reset();
  }
  function loadData(){
    points=[];
    if(data==='moons'){
      for(let i=0;i<60;i++){
        const t=Math.PI*Math.random();
        points.push({x:Math.cos(t)*0.6-0.2,y:Math.sin(t)*0.6-0.1,c:1});
        points.push({x:Math.cos(t)*0.6+0.2,y:-Math.sin(t)*0.6+0.1,c:0});
      }
    } else if(data==='xor'){
      for(let i=0;i<50;i++){
        const x=Math.random()*2-1,y=Math.random()*2-1;
        points.push({x,y,c:(x*y>0)?1:0});
      }
    } else if(data==='circles'){
      for(let i=0;i<60;i++){
        const t=2*Math.PI*Math.random();
        points.push({x:Math.cos(t)*0.4,y:Math.sin(t)*0.4,c:1});
        points.push({x:Math.cos(t)*0.8,y:Math.sin(t)*0.8,c:0});
      }
    }
    reset();
  }
  function reset(){
    epoch=0; lossVal=NaN; training=false;
    // 2 -> H -> 1
    net = {
      W1: new Array(H).fill(0).map(()=>[Math.random()*2-1,Math.random()*2-1]),
      b1: new Array(H).fill(0),
      W2: new Array(H).fill(0).map(()=>Math.random()*2-1),
      b2: 0
    };
    draw();
  }
  function f(z){
    if(act==='relu') return z>0?z:0;
    if(act==='tanh') return Math.tanh(z);
    return 1/(1+Math.exp(-z));
  }
  function df(z,a){
    if(act==='relu') return z>0?1:0;
    if(act==='tanh') return 1-a*a;
    return a*(1-a);
  }
  function sigmoid(z){return 1/(1+Math.exp(-z));}
  function forward(x,y){
    const z1=new Array(H), a1=new Array(H);
    for(let i=0;i<H;i++){z1[i]=net.W1[i][0]*x+net.W1[i][1]*y+net.b1[i]; a1[i]=f(z1[i]);}
    let z2=net.b2; for(let i=0;i<H;i++) z2+=net.W2[i]*a1[i];
    return {z1,a1,z2,p:sigmoid(z2)};
  }
  function step(){
    if(points.length<2) return;
    let loss=0;
    const gW1 = net.W1.map(r=>r.map(()=>0));
    const gb1 = new Array(H).fill(0);
    const gW2 = new Array(H).fill(0); let gb2=0;
    points.forEach(p=>{
      const fr=forward(p.x,p.y); const y=p.c;
      loss += -(y*Math.log(fr.p+1e-9)+(1-y)*Math.log(1-fr.p+1e-9));
      const dz2 = fr.p - y;
      for(let i=0;i<H;i++){gW2[i]+=dz2*fr.a1[i];}
      gb2 += dz2;
      for(let i=0;i<H;i++){
        const da1 = dz2*net.W2[i];
        const dz1 = da1 * df(fr.z1[i], fr.a1[i]);
        gW1[i][0]+=dz1*p.x; gW1[i][1]+=dz1*p.y; gb1[i]+=dz1;
      }
    });
    const N=points.length;
    for(let i=0;i<H;i++){
      net.W1[i][0]-=lr*gW1[i][0]/N; net.W1[i][1]-=lr*gW1[i][1]/N;
      net.b1[i]-=lr*gb1[i]/N; net.W2[i]-=lr*gW2[i]/N;
    }
    net.b2 -= lr*gb2/N;
    epoch++; lossVal = loss/N;
  }
  function tick(){
    if(!training) return;
    for(let i=0;i<20;i++) step();
    draw();
    requestAnimationFrame(tick);
  }
  function draw(){
    // decision boundary
    const W=canvas.width,H2=canvas.height;
    const img=ctx.createImageData(W,H2);
    for(let py=0;py<H2;py+=2) for(let px=0;px<W;px+=2){
      const x=px/W*2-1, y=-(py/H2*2-1);
      const p=forward(x,y).p;
      const r=(1-p)*120, b=p*120, g=40;
      for(let dy=0;dy<2;dy++) for(let dx=0;dx<2;dx++){
        const i=((py+dy)*W+(px+dx))*4;
        img.data[i]=r; img.data[i+1]=g; img.data[i+2]=b; img.data[i+3]=255;
      }
    }
    ctx.putImageData(img,0,0);
    points.forEach(p=>{
      const px=(p.x+1)/2*W, py=(-p.y+1)/2*H2;
      ctx.fillStyle=p.c?'#58a6ff':'#f85149';
      ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke();
    });
    document.getElementById('mlp-epoch').textContent=epoch;
    document.getElementById('mlp-loss').textContent=isNaN(lossVal)?'—':lossVal.toFixed(4);
  }
  return {init};
})();
