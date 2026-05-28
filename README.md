# CS Vision — Interactive Computer Vision Playground

A single-page, fully client-side companion site for a Computer Vision course.
Every core concept — pinhole cameras, geometric & intensity transforms, convolution,
Fourier, feature detectors, binary objects, MLPs, CNNs, deep architectures,
segmentation, detection, contrastive learning, autoencoders, generative models — is a
live, in-browser demo.

## Run locally

Just open `index.html` in a browser. Or serve it:

```powershell
# from this folder
python -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `cs-vision`).
2. From inside this `site/` folder:

   ```powershell
   git init
   git add .
   git commit -m "Initial interactive CV site"
   git branch -M main
   git remote add origin https://github.com/<your-user>/cs-vision.git
   git push -u origin main
   ```
3. In the repo on GitHub: **Settings → Pages**.
   - Source: **Deploy from a branch**
   - Branch: **main**, folder: **/ (root)**
4. Wait ~30s. Your site appears at `https://<your-user>.github.io/cs-vision/`.

## Layout

```
index.html               single entry point — all sections
css/styles.css           dark UI theme
js/app.js                shared state: current image, sample images, utilities
js/boot.js               binds nav + initializes all modules
js/modules/
  image-formation.js     1. pinhole camera projection
  camera-model.js        2. K [R | t] intrinsics & extrinsics
  image-sensing.js       3. sampling + quantization + Bayer
  geometric.js           4. translate / rotate / scale / shear / projective
  intensity.js           5. point transforms + live histogram
  local.js               6. convolution playground
  fourier.js             7. 2D DFT + low / high / band / Gaussian filters
  features.js            8. Sobel / Canny / Harris / DoG
  binary.js              9. threshold + morphology + connected components
  perceptron.js         10. interactive MLP with backprop
  cnn.js                11. CNN feature maps
  architectures.js      12. LeNet / VGG / ResNet / U-Net / ViT diagrams
  segmentation.js       13. Otsu / k-means / region growing / edge
  detection.js          14. template matching (NCC / SSD)
  ssl.js                15. SimCLR-style contrastive demo
  autoencoder.js        16. PCA (linear autoencoder) on patches
  generative.js         17. latent walk + diffusion noising
```

All demos are intentionally small and dependency-free so the math from the
course slides maps 1-to-1 onto the code.
