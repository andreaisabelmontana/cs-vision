/* Boot — wire up nav and global controls, kick off modules */
(function(){
  // sidebar toggle
  const t = document.getElementById('nav-toggle');
  const sb = document.getElementById('sidebar');
  t.addEventListener('click', ()=> sb.classList.toggle('open'));

  // global image input
  document.getElementById('file-input').addEventListener('change', e=>{
    if(e.target.files[0]) CV.loadFromFile(e.target.files[0]);
  });
  document.querySelectorAll('[data-sample]').forEach(b=>{
    b.addEventListener('click',()=>CV.loadSample(b.dataset.sample));
  });

  // init every module
  const modules = ['ImageFormation','CameraModel','ImageSensing','Geometric',
    'Intensity','Local','Fourier','Features','Binary','Perceptron',
    'CNN','Architectures','Segmentation','Detection','SSL',
    'Autoencoder','Generative'];
  modules.forEach(m=>{
    try{ if(window[m] && window[m].init) window[m].init(); }
    catch(e){ console.error('init',m,e); }
  });

  // load default sample so demos have something to chew on
  CV.loadSample('cameraman');
})();
