/* 16 · Autoencoders / PCA */
window.Autoencoder = (function(){
  let k=16, patch=8;
  let inC, outC;
  function init(){
    inC=document.getElementById('ae-input');
    outC=document.getElementById('ae-recon');
    document.getElementById('ae-k').addEventListener('input',e=>{k=+e.target.value;render();});
    document.getElementById('ae-patch').addEventListener('input',e=>{patch=+e.target.value;render();});
    CV.onImage(render);
  }
  function render(){
    const src=CV.current; if(!src) return;
    // shrink to a manageable size, run PCA on patches
    const W=128;
    const small = CV.resize(src,W,W);
    const g = CV.toGray(small);
    inC.width=W; inC.height=W;
    inC.getContext('2d').putImageData(CV.toImageData(CV.grayToImage(g,W,W)),0,0);
    const P=patch;
    const nx = W/P, ny=W/P;
    const D = P*P;
    const Kk = Math.min(k, D);
    // collect patches
    const X = []; // each row is a flattened patch
    for(let by=0;by<ny;by++) for(let bx=0;bx<nx;bx++){
      const v = new Float64Array(D);
      for(let y=0;y<P;y++) for(let x=0;x<P;x++){
        v[y*P+x]=g[(by*P+y)*W+(bx*P+x)];
      }
      X.push(v);
    }
    const N = X.length;
    // center
    const mean = new Float64Array(D);
    for(const v of X) for(let i=0;i<D;i++) mean[i]+=v[i];
    for(let i=0;i<D;i++) mean[i]/=N;
    for(const v of X) for(let i=0;i<D;i++) v[i]-=mean[i];
    // covariance (D x D)
    const C = new Float64Array(D*D);
    for(const v of X) for(let i=0;i<D;i++) for(let j=0;j<D;j++) C[i*D+j]+=v[i]*v[j];
    for(let i=0;i<D*D;i++) C[i]/=N;
    // power iteration for top-Kk eigenvectors
    const eigs=[]; const Cwork=new Float64Array(C);
    for(let it=0;it<Kk;it++){
      let v=new Float64Array(D);
      for(let i=0;i<D;i++) v[i]=Math.random()-0.5;
      for(let p=0;p<30;p++){
        const u=new Float64Array(D);
        for(let i=0;i<D;i++) for(let j=0;j<D;j++) u[i]+=Cwork[i*D+j]*v[j];
        let n=0; for(let i=0;i<D;i++) n+=u[i]*u[i]; n=Math.sqrt(n)+1e-12;
        for(let i=0;i<D;i++) v[i]=u[i]/n;
      }
      // eigenvalue
      let lam=0;
      const tmp=new Float64Array(D);
      for(let i=0;i<D;i++) for(let j=0;j<D;j++) tmp[i]+=Cwork[i*D+j]*v[j];
      for(let i=0;i<D;i++) lam+=v[i]*tmp[i];
      eigs.push({v,lam});
      // deflate
      for(let i=0;i<D;i++) for(let j=0;j<D;j++) Cwork[i*D+j]-=lam*v[i]*v[j];
    }
    // reconstruct
    const recon=new Float32Array(W*W); let mse=0;
    for(let by=0;by<ny;by++) for(let bx=0;bx<nx;bx++){
      const idx=by*nx+bx;
      const v=X[idx];
      const r=new Float64Array(D);
      // project then back
      for(let i=0;i<Kk;i++){
        let dot=0; for(let j=0;j<D;j++) dot+=v[j]*eigs[i].v[j];
        for(let j=0;j<D;j++) r[j]+=dot*eigs[i].v[j];
      }
      for(let y=0;y<P;y++) for(let x=0;x<P;x++){
        const val = r[y*P+x]+mean[y*P+x];
        recon[(by*P+y)*W+(bx*P+x)] = val;
        const orig = X[idx][y*P+x]+mean[y*P+x];
        mse += (val-orig)*(val-orig);
      }
    }
    mse /= (W*W);
    outC.width=W; outC.height=W;
    outC.getContext('2d').putImageData(CV.toImageData(CV.grayToImage(recon,W,W)),0,0);
    const ratio = (Kk/D);
    document.getElementById('ae-ratio').textContent=`${Kk}/${D} (${(ratio*100).toFixed(0)}%)`;
    document.getElementById('ae-mse').textContent=mse.toFixed(1);
  }
  return {init};
})();
