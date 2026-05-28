/* 4 · Geometric Transformations */
window.Geometric = (function(){
  let tx=0,ty=0,rot=0,scale=1,shx=0,shy=0,persp=0,interp='bilinear';
  let canvas, mat;
  function init(){
    canvas=document.getElementById('geom-canvas');
    mat=document.getElementById('g-matrix');
    [['g-tx',v=>tx=+v],['g-ty',v=>ty=+v],['g-rot',v=>rot=+v*Math.PI/180],
     ['g-scale',v=>scale=v/100],['g-shx',v=>shx=v/100],['g-shy',v=>shy=v/100],
     ['g-persp',v=>persp=v/10000],['g-interp',v=>interp=v]
    ].forEach(([id,fn])=>{
      document.getElementById(id).addEventListener('input',e=>{fn(e.target.value);render();});
    });
    CV.onImage(render);
  }
  function render(){
    const src=CV.current; if(!src) return;
    const w=src.width,h=src.height;
    const out=CV.emptyImage(w,h);
    const cx=w/2,cy=h/2;
    const c=Math.cos(rot),s=Math.sin(rot);
    // Build forward matrix M then invert (we map output->input)
    // We'll use 3x3 homography for generality
    const M = mul3(translate(cx,cy),
              mul3(persp3(persp,persp),
              mul3(rotate3(rot),
              mul3(scale3(scale,scale),
              mul3(shear3(shx,shy),
              translate(-cx+tx,-cy+ty))))));
    const Mi = inv3(M);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      const denom = Mi[6]*x+Mi[7]*y+Mi[8];
      const sx = (Mi[0]*x+Mi[1]*y+Mi[2])/denom;
      const sy = (Mi[3]*x+Mi[4]*y+Mi[5])/denom;
      const di=(y*w+x)*4;
      if(sx>=0 && sx<w-1 && sy>=0 && sy<h-1){
        if(interp==='nn'){
          const isx=sx|0, isy=sy|0;
          const si=(isy*w+isx)*4;
          out.data[di]=src.data[si]; out.data[di+1]=src.data[si+1];
          out.data[di+2]=src.data[si+2];
        } else {
          const x0=sx|0,y0=sy|0; const fx=sx-x0,fy=sy-y0;
          for(let ch=0;ch<3;ch++){
            const a=src.data[(y0*w+x0)*4+ch], b=src.data[(y0*w+x0+1)*4+ch];
            const cc=src.data[((y0+1)*w+x0)*4+ch], d=src.data[((y0+1)*w+x0+1)*4+ch];
            out.data[di+ch] = a*(1-fx)*(1-fy)+b*fx*(1-fy)+cc*(1-fx)*fy+d*fx*fy;
          }
        }
      }
      out.data[di+3]=255;
    }
    CV.drawTo(canvas,out);
    mat.textContent=
      `M = [${M[0].toFixed(2)} ${M[1].toFixed(2)} ${M[2].toFixed(2)}]\n`+
      `    [${M[3].toFixed(2)} ${M[4].toFixed(2)} ${M[5].toFixed(2)}]\n`+
      `    [${M[6].toFixed(4)} ${M[7].toFixed(4)} ${M[8].toFixed(2)}]`;
  }
  function id(){return [1,0,0,0,1,0,0,0,1];}
  function translate(tx,ty){return [1,0,tx,0,1,ty,0,0,1];}
  function scale3(sx,sy){return [sx,0,0,0,sy,0,0,0,1];}
  function rotate3(a){const c=Math.cos(a),s=Math.sin(a);return [c,-s,0,s,c,0,0,0,1];}
  function shear3(x,y){return [1,x,0,y,1,0,0,0,1];}
  function persp3(a,b){return [1,0,0,0,1,0,a,b,1];}
  function mul3(A,B){
    const r=[0,0,0,0,0,0,0,0,0];
    for(let i=0;i<3;i++) for(let j=0;j<3;j++) for(let k=0;k<3;k++)
      r[i*3+j]+=A[i*3+k]*B[k*3+j];
    return r;
  }
  function inv3(m){
    const a=m[0],b=m[1],c=m[2],d=m[3],e=m[4],f=m[5],g=m[6],h=m[7],i=m[8];
    const det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);
    if(Math.abs(det)<1e-9) return id();
    const inv = [
      (e*i-f*h),-(b*i-c*h),(b*f-c*e),
     -(d*i-f*g),(a*i-c*g),-(a*f-c*d),
      (d*h-e*g),-(a*h-b*g),(a*e-b*d)
    ];
    return inv.map(x=>x/det);
  }
  return {init};
})();
