/* 2 · Camera Model — K[R|t] */
window.CameraModel = (function(){
  let fx=400,fy=400,cx=260,cy=160,s=0,ry=20,tz=500;
  let canvas,ctx,mat;
  function init(){
    canvas=document.getElementById('camera-canvas');
    ctx=canvas.getContext('2d');
    mat=document.getElementById('cam-matrix');
    [['cam-fx',v=>fx=+v],['cam-fy',v=>fy=+v],['cam-cx',v=>cx=+v],
     ['cam-cy',v=>cy=+v],['cam-s',v=>s=+v],['cam-ry',v=>ry=+v],['cam-tz',v=>tz=+v]
    ].forEach(([id,fn])=>{
      document.getElementById(id).addEventListener('input',e=>{fn(e.target.value);draw();});
    });
    draw();
  }
  function draw(){
    ctx.fillStyle='#0d1117'; ctx.fillRect(0,0,canvas.width,canvas.height);
    // grid plane in 3D
    const a=ry*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a);
    const pts=[];
    for(let X=-200;X<=200;X+=40) for(let Z=-200;Z<=200;Z+=40){
      const Xr = X*ca - Z*sa;
      const Zr = X*sa + Z*ca + tz;
      pts.push([Xr, 80, Zr]);
    }
    ctx.fillStyle='#7ee787';
    pts.forEach(([X,Y,Z])=>{
      if(Z<=1) return;
      // K * [X/Z, Y/Z, 1]
      const u = fx*X/Z + s*Y/Z + cx;
      const v = fy*Y/Z + cy;
      ctx.fillRect(u-1,v-1,2,2);
    });
    // axes
    ctx.strokeStyle='#58a6ff'; ctx.beginPath();
    [[0,0,0],[100,0,0]].map(([X,Y,Z])=>[X*ca-Z*sa,Y,X*sa+Z*ca+tz])
      .forEach((p,i)=>{ const u=fx*p[0]/p[2]+cx, v=fy*p[1]/p[2]+cy;
        if(i===0) ctx.moveTo(u,v); else ctx.lineTo(u,v); });
    ctx.stroke();
    // show matrix
    mat.textContent =
      `K = [${fx.toFixed(0).padStart(4)}  ${s.toFixed(0).padStart(4)}  ${cx.toFixed(0).padStart(4)}]\n`+
      `    [   0  ${fy.toFixed(0).padStart(4)}  ${cy.toFixed(0).padStart(4)}]\n`+
      `    [   0     0     1]\n\n`+
      `Ry=${ry}°  tz=${tz}`;
  }
  return {init};
})();
