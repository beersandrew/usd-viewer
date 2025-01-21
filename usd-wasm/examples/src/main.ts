
import { getUsdModule, createThreeHydra, USD, createThreeHydraReturnType } from '@needle-tools/usd';
import { loadEnvMap, run } from './three';
import { Object3D, Scene, WebGLRenderer } from 'three';

import { allDroppedFiles } from './fileHandling';

let hydraDelegate: createThreeHydraReturnType | null;
let scene: Scene;
let usdContent: Object3D;
let usd: USD;

getUsdModule({
  debug: true,
  urlModifier: async (url: string) => {
    // This is just for testing – this code already runs inside emHdBindings.js
    if (url.startsWith("/http")) url = url.slice(1);
    if (url.includes("http:/")) url = url.replace("http:/", "http://");
    if (url.includes("https:/")) url = url.replace("https:/", "https://");

    console.log(url);

    // check if we find this URL in the dropped files
    if (allDroppedFiles) {
      const found = allDroppedFiles.find(f => f.fullPath == url);

      if (found) {
        console.log("found file, returning handle", url, found);
        if ("file" in found) {
          return await new Promise((resolve, reject) => found.file(resolve, reject));
        }
        else if ("getFile" in found) {
          return await found.getFile();
        }
      }
      else {
        console.warn("File not found", url, allDroppedFiles);
      }
    }

    // return "./gingerbread/house/" + url;
    return url;
  }
}).then(async (USD: USD) => {

  // const url = "test.usdz"; // local file
  // const url = "/gingerbread/house/GingerBreadHouse.usdc";
  // const url = "/gingerbread/GingerbreadHouse.usda";
  const url = "/HttpReferences.usda";
  // ... all the URLs
  // --> put them all into the virtual file system
  // --> load the first one (assume which one that actually is)

  // const url = "https://cloud-staging.needle.tools/-/assets/Z23hmXB22WdG2-22WdG2/file.usda"; // remote file
  // const url = "https://cloud-staging.needle.tools/-/assets/Z23hmXB22WdG2-22WdG2/house/GingerBreadHouse.usdc"; // remote file
  
  // using a file/buffer
  /* 
  const buffer = await fetch(url).then(response => response.arrayBuffer());
  const file = new File([buffer], url, { type: "model/usd" });
  file.path = url; // used to determine the directory structure
  */

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  const envmapUrl = "https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/1k/studio_small_09_1k.exr";
  const envmap = await loadEnvMap(envmapUrl, renderer);

  scene = new Scene();
  scene.environment = envmap;

  usd = USD;

  /*
    usdContent = new Object3D();
    scene.add(usdContent);
    hydraDelegate = await createThreeHydra({
      debug: true,
      USD,
      url: url,
      // files: [file],
      // @ts-ignore
      scene: usdContent,
    })
    */

  loadFile(url);

  run({
    renderer,
    scene: scene,
    onRender: (dt) => {
      hydraDelegate?.update(dt);
    }
  });
})

async function loadFile(url: string) {

  if (hydraDelegate)
    hydraDelegate.dispose();
  hydraDelegate = null;

  if (usdContent) {
    scene.remove(usdContent);
    // TODO dispose as well
  }

  usdContent = new Object3D();
  scene.add(usdContent);

  const delegate = await createThreeHydra({
    debug: true,
    USD: usd,
    url: url,
    // @ts-ignore
    scene: usdContent,
  })

  hydraDelegate = delegate;

  console.log("Scene content", usdContent);
}

window.loadFile = loadFile;