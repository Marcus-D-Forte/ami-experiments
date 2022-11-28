import * as THREE from 'three'; // For typescript sake
import { colors, files } from './utils';

import * as dat from 'dat.gui';
// import * as AMI from 'ami.js/';
import Stats from 'three/examples/jsm/libs/stats.module'
import ControlsTrackball from 'ami.js/src/controls/controls.trackball'
import HelpersLut from 'ami.js/src/helpers/helpers.lut'
import HelpersVR from 'ami.js/src/helpers/helpers.volumerendering'
import LoadersVolume from 'ami.js/src/loaders/loaders.volume'


let container;
let controls;
let renderer;
let stats;
let camera;
let scene;
let vrHelper;
let lut;
let ready: boolean = false;
let modified:boolean = false;
let wheel;
let wheelTO;

let myStack = {
  algorithm: 'ray marching',
  lut: 'random',
  opacity: 'random',
  steps: 128,
  alphaCorrection: 0.5,
  frequence: 0,
  amplitude: 0,
  interpolation: 1,
};

function onStart(event) {
  if (vrHelper && vrHelper.uniforms && !wheel) {
    renderer.setPixelRatio(0.1 * window.devicePixelRatio);
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    modified = true;
  }
}

function onEnd(event) {
  if (vrHelper && vrHelper.uniforms && !wheel) {
    renderer.setPixelRatio(0.5 * window.devicePixelRatio);
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    modified = true;

    setTimeout(function() {
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      modified = true;
    }, 100);
  }
}

function onWheel() {
  if (!wheel) {
    renderer.setPixelRatio(0.1 * window.devicePixelRatio);
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    wheel = Date.now();
  }

  if (Date.now() - wheel < 300) {
    clearTimeout(wheelTO);
    wheelTO = setTimeout(function() {
      renderer.setPixelRatio(0.5 * window.devicePixelRatio);
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      modified = true;

      setTimeout(function() {
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        wheel = null;
        modified = true;
      }, 100);
    }, 300);
  }

  modified = true;
}

function onWindowResize() {
  // update the camera
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();

  // notify the renderer of the size change
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  modified = true;
}


// Classic ThreeJS setup
container = document.getElementById('container')!;
renderer = new THREE.WebGLRenderer({
  antialias: true,
});

// standard global letiables
function buildGUI() {
  let gui = new dat.GUI({
    autoPlace: false,
  });

  let customContainer = document.getElementById('my-gui-container');
  customContainer.appendChild(gui.domElement);

  let stackFolder = gui.addFolder('Settings');
  let algorithmUpdate = stackFolder.add(myStack, 'algorithm', ['ray marching', 'mip']);
  algorithmUpdate.onChange(function(value) {
    vrHelper.algorithm = value === 'mip' ? 1 : 0;
    modified = true;
  });

  let lutUpdate = stackFolder.add(myStack, 'lut', lut.lutsAvailable());
  lutUpdate.onChange(function(value) {
    lut.lut = value;
    vrHelper.uniforms.uTextureLUT.value.dispose();
    vrHelper.uniforms.uTextureLUT.value = lut.texture;
    modified = true;
  });
  // init LUT
  lut.lut = myStack.lut;
  vrHelper.uniforms.uTextureLUT.value.dispose();
  vrHelper.uniforms.uTextureLUT.value = lut.texture;

  let opacityUpdate = stackFolder.add(myStack, 'opacity', lut.lutsAvailable('opacity'));
  opacityUpdate.onChange(function(value) {
    lut.lutO = value;
    vrHelper.uniforms.uTextureLUT.value.dispose();
    vrHelper.uniforms.uTextureLUT.value = lut.texture;
    modified = true;
  });

  let stepsUpdate = stackFolder.add(myStack, 'steps', 0, 512).step(1);
  stepsUpdate.onChange(function(value) {
    if (vrHelper.uniforms) {
      vrHelper.uniforms.uSteps.value = value;
      modified = true;
    }
  });

  let alphaCorrrectionUpdate = stackFolder.add(myStack, 'alphaCorrection', 0, 1).step(0.01);
  alphaCorrrectionUpdate.onChange(function(value) {
    if (vrHelper.uniforms) {
      vrHelper.uniforms.uAlphaCorrection.value = value;
      modified = true;
    }
  });

  let interpolationUpdate = stackFolder.add(vrHelper, 'interpolation', 0, 1).step(1);
  interpolationUpdate.onChange(function(value) {
    if (vrHelper.uniforms) {
      modified = true;
    }
  });

  let shadingUpdate = stackFolder.add(vrHelper, 'shading', 0, 1).step(1);
  shadingUpdate.onChange(function(value) {
    if (vrHelper.uniforms) {
      modified = true;
    }
  });

  let shininessUpdate = stackFolder.add(vrHelper, 'shininess', 0, 20).step(0.1);
  shininessUpdate.onChange(function(value) {
    if (vrHelper.uniforms) {
      modified = true;
    }
  });

  stackFolder.open();
}

function render() {
  // render
  controls.update();

  if (ready && modified) {
    renderer.render(scene, camera);
    modified = false;
  }

  stats.update();
}

function init() {
  // this function is executed on each animation frame
  function animate() {
    render();

    // request new frame
    requestAnimationFrame(function() {
      animate();
    });
  }

  // renderer
  container = document.getElementById('container');
  renderer = new THREE.WebGLRenderer({
    alpha: true,
  });
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // scene
  scene = new THREE.Scene();

  // stats
  stats = new Stats();
  container.appendChild(stats.domElement);

  // camera
  camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 100000);
  camera.position.x = 166;
  camera.position.y = -471;
  camera.position.z = 153;
  camera.up.set(-0.42, 0.86, 0.26);

  // controls
  controls = new ControlsTrackball(camera, container);
  controls.rotateSpeed = 5.5;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  controls.addEventListener('change', () => {
    modified = true;
  });
  controls.addEventListener('start', onStart);
  controls.addEventListener('end', onEnd);

  window.addEventListener('resize', onWindowResize, false);
  renderer.domElement.addEventListener('wheel', onWheel);
  // start rendering loop
  animate();
}

// Load DICOM images and create AMI Helpers
// const loader = new AMI.VolumeLoader(container);
// console.log(files)
// loader
//   .load(files)
//   .then(() => {

//     const series = loader.data[0].mergeSeries(loader.data);
//     const stack = series[0].stack[0];
//     loader.free();

//     const stackHelper = new AMI.StackHelper(stack);
//     stackHelper.bbox.color = colors.red;
//     stackHelper.border.color = colors.blue;

//     scene.add(stackHelper);

//     // build the gui
//     gui(stackHelper);

//     // center camera and interactor to center of bouding box
//     const centerLPS = stackHelper.stack.worldCenter();
//     camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
//     camera.updateProjectionMatrix();
//     controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);
//   })
//   .catch(error => {
//     window.console.log('oops... something went wrong...');
//     window.console.log(error);
//   });

window.onload = function() {
  // init threeJS
  init();

  // let filename = 'https://cdn.rawgit.com/FNNDSC/data/master/nifti/eun_brain/eun_uchar_8.nii.gz';
  // let files = [filename];

  // load sequence for each file
  // instantiate the loader
  let loader = new LoadersVolume(container);
  console.log(files);
  loader
    .load(files)
    .then(() => {
      let series = loader.data[0].mergeSeries(loader.data)[0];
      loader.free();
      //loader = null;
      // get first stack from series
      let stack = series.stack[0];

      vrHelper = new HelpersVR(stack);
      // scene
      scene.add(vrHelper);

      // CREATE LUT
      lut = new HelpersLut('my-lut-canvases');
      lut.luts = HelpersLut.presetLuts();
      lut.lutsO = HelpersLut.presetLutsO();
      // update related uniforms
      vrHelper.uniforms.uTextureLUT.value = lut.texture;
      vrHelper.uniforms.uLut.value = 1;

      // update camrea's and interactor's target
      let centerLPS = stack.worldCenter();
      camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
      camera.updateProjectionMatrix();
      controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

      // create GUI
      buildGUI();

      // screenshot experiment
      // let screenshotElt = document.getElementById('screenshot');
      // screenshotElt.addEventListener('click', function() {
      //   controls.update();

      //   if (ready) {
      //     renderer.render(scene, camera);
      //   }

      //   let screenshot = renderer.domElement.toDataURL();
      //   screenshotElt.download = 'AMI-' + Date.now() + '.png';
      //   screenshotElt.href = screenshot;
      // });

      // good to go
      ready = true;
      modified = true;

      // force first render
      render();
      // notify puppeteer to take screenshot
      const puppetDiv = document.createElement('div');
      puppetDiv.setAttribute('id', 'puppeteer');
      document.body.appendChild(puppetDiv);
    })
    .catch(error => window.console.log(error));
};