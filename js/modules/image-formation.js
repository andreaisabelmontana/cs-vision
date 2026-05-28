/* 1 · Image Formation — pinhole camera */
window.ImageFormation = (function(){
  let f=200, z=400, rot=30;
  let canvas, ctx;
  function init(){
    canvas = document.getElementById('pinhole-canvas');
    ctx = canvas.getContext('2d');
    const bindings = [['pinhole-f',v=>f=+v],['pinhole-z',v=>z=+v],['pinhole-rot',v=>rot=+v]];
    bindings.forEach(([id,fn])=>{
      const el=document.getElementById(id);
      el.addEventListener('input',e=>{fn(e.target.value); draw();});
    });
    draw();
  }
  function project(X,Y,Z){
    // simple pinhole: x=f X/Z, y=f Y/Z, centered on canvas
    return [canvas.width/2 + f*X/Z, canvas.height/2 + f*Y/Z];
  }
  function draw(){
    ctx.fillStyle='#0d1117'; ctx.fillRect(0,0,canvas.width,canvas.height);
    // optical axis
    ctx.strokeStyle='#30363d'; ctx.beginPath();
    ctx.moveTo(0,canvas.height/2); ctx.lineTo(canvas.width,canvas.height/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(canvas.width/2,0); ctx.lineTo(canvas.width/2,canvas.height); ctx.stroke();

    // a cube
    const s=80;
    const verts = [
      [-s,-s,-s],[s,-s,-s],[s,s,-s],[-s,s,-s],
      [-s,-s,s],[s,-s,s],[s,s,s],[-s,s,s]
    ];
    const a = rot*Math.PI/180;
    const ca=Math.cos(a), sa=Math.sin(a);
    const projected = verts.map(([X,Y,Z])=>{
      // rotate around Y
      const X2 = X*ca - Z*sa;
      const Z2 = X*sa + Z*ca;
      return project(X2,Y,Z2+z);
    });
    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    ctx.strokeStyle='#7ee787'; ctx.lineWidth=2;
    edges.forEach(([a,b])=>{
      ctx.beginPath(); ctx.moveTo(projected[a][0],projected[a][1]);
      ctx.lineTo(projected[b][0],projected[b][1]); ctx.stroke();
    });

    // camera / focal length viz at the right
    ctx.fillStyle='#58a6ff'; ctx.fillRect(canvas.width-30,canvas.height/2-15,30,30);
    ctx.fillStyle='#c9d1d9'; ctx.font='11px Consolas';
    ctx.fillText(`f=${f}  Z=${z}  θ=${rot}°`,10,20);
  }
  return {init};
})();
