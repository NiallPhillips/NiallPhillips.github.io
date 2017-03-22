// Define script references required for physi.js
Physijs.scripts.worker = '/scripts/physijs_worker.js';
Physijs.scripts.ammo = '/scripts/ammo.js';

//Create the 3D scene, camera and renderer
var scene = new Physijs.Scene({ reportsize: 50, fixedTimeStep: 1 / 60 });
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
var renderer = new THREE.WebGLRenderer({antialias: true});

// Create new instance of OrbitControls for mouse movement
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

// Create a cube geometry from which all the scenes cubes are cloned
var cubeGeom = new THREE.CubeGeometry(10, 10, 10);

//Load the image to be used to texture the cubes
var noteImage = new THREE.TextureLoader().load("images/quaver.jpg");
var cubeMat = new Physijs.createMaterial(new THREE.MeshStandardMaterial({map:noteImage}),0.4,1);


var cubes = [];			//Holds all of the scenes cubes
var cubeMeshes = [];
var cubeColliders = [];	//Holds all of the cubes boxHelper objects
var box3Colliders = [];	//Holds all of the boxHelper collision boxes
var hitFlags = [];		//Flags used to ensure collision is detected only once every bar pass
var bar;
var barBoundingBox;
var barBox;

var chunks = [];
var audioctx = new AudioContext();
var dest = audioctx.createMediaStreamDestination();
var mediaRecorder = new MediaRecorder(dest.stream);

var clock;

var rayCaster;
var mouse = new THREE.Vector2(), INTERSECTED;

// Declaring global constants for calling note values
// Notes are accessed by their index in their array
// e.g. to play a C4 (middle c), playNote(NOTE_C[4])

var NOTE_C = [16.35,32.70,65.41,130.81,261.63,523.25,1046.50,2093.00,4186.01];
var NOTE_C_SHARP_D_FLAT = [17.32,34.65,69.30,138.59,277.18,554.37,1108.73,2217.46,4434.92];
var NOTE_D = [18.35,36.71,73.42,146.83,293.66,587.33,1174.66,2349.32,4698.63];
var NOTE_D_SHARP_E_FLAT = [19.45,38.89,77.78,155.56,311.13,622.25,1244.51,2489.02,4978.03];
var NOTE_E = [20.60,41.20,82.41,164.81,329.63,659.25,1318.51,2637.02,5274.04];
var NOTE_F = [21.83,43.65,87.31,174.61,349.23,698.46,1396.91,2793.83,5587.65];
var NOTE_F_SHARP_G_FLAT = [23.12,46.25,92.50,185.00,369.99,739.99,1479.98,2959.96,5919.91];
var NOTE_G = [24.50,49.00,98.00,196.00,392.00,783.99,1567.98,3135.96,6271.93];
var NOTE_G_SHARP_A_FLAT = [25.96,51.91,103.83,207.65,415.30,830.61,1661.22,3322.44,6644.88];
var NOTE_A = [27.50,55.00,110.00,220.00,440.00,880.00,1760.00,3520.00,7040.00];
var NOTE_A_SHARP_B_FLAT = [29.14,58.27,116.54,233.08,466.16,932.33,1864.66,3729.31,7458.62];
var NOTE_B = [30.87,61.74,123.47,246.94,493.88,987.77,1975.53,3951.07,7902.13];

//Declare constants for note length values
var quarter = 0.25;
var half = 0.5;
var whole = 1;

// Create nodes for web audio
var delay = audioctx.createDelay();
delay.delayTime.value = control.Delay;
var delayGain = audioctx.createGain();
    delayGain.gain.value = 0.5;
var feedback = audioctx.createGain();
    feedback.gain.value = 0.5;
	
var convolverGain = audioctx.createGain();
	convolverGain.gain.value = control.Reverb;
var convolver = audioctx.createConvolver();
var impulseUrl = 'sounds/irHall.ogg';

var gainNode;
gainNode = audioctx.createGain();

function initScene() {
    "use strict"; //Prevents accidental creation of global variables
    
	//Initialize the scene and add the renderer to the window
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize, false);
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	
	scene.setGravity(new THREE.Vector3(0, -50, 0)); //Set the gravity for the physics
	
	clock = new THREE.Clock; //Create a clock for handling animation speeds
	
	// Add lights to the scene
	var light = new THREE.AmbientLight(0x404040, 4);
	scene.add(light);
	var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
	directionalLight.position.set(0, 1, 0.5);
	directionalLight.target.position.set(0, 0, 0);
	scene.add(directionalLight);
	
	//Set anisotropic filtering to maximum for the cubes texture image
	var maxAnisotropy = renderer.getMaxAnisotropy();
	noteImage.anisotropy = maxAnisotropy;
	
	//Create the physical ground object
	var groundGeometry = new THREE.BoxGeometry(100, 1, 100);
	var groundMaterial = new THREE.MeshBasicMaterial({color: 0xff0000,wireframe:true});
	var ground = new Physijs.BoxMesh(groundGeometry, groundMaterial, 0);
	
	//Create the time 'bar' plane object, set its location and size
	var bargeometry = new THREE.PlaneGeometry(6, 100);
	var barmaterial = new THREE.MeshBasicMaterial({color: 0xffff00,wireframe:true});
	bar = new THREE.Mesh(bargeometry, barmaterial);
	barBox = new THREE.Box3();
	barBox.setFromObject(bar);
	bar.position.set(50, 3.5, 0);
	bar.rotation.x = Math.PI / 2;
	bar.rotation.y = Math.PI / 2;
	
	//Create the collision box for the bar object
	barBoundingBox = new THREE.BoxHelper(bar, 0x00ff00);
	barBoundingBox.visible = true;
	scene.add(bar);
	scene.add(barBoundingBox);
	
	scene.add(ground);
	
	camera.position.z = -100;
	camera.position.y = 80;
	
	updateCubeCounter(); //Initialize cube counter
	
	var gridHelper = new THREE.GridHelper( 50, 8 );
	scene.add( gridHelper );
	
	rayCaster = new THREE.Raycaster();
	
	render();
}

//Helper function to return a random +1 or -1
function PlusOrMinus() {
    "use strict";
    var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
	return plusOrMinus;
}

function render() {
    "use strict"; 
	requestAnimationFrame(render);
	////////////////////////////////////
	var timeDelta = clock.getDelta(); //Update clock used for controlling movement speed every render pass
	controls.update(); //Update camera with 'OrbitControls' input from the user
	scene.simulate(); //Render phsyics
	
	rayCaster.setFromCamera( mouse, camera );
	
	delay.delayTime.value = control.Delay;
	convolverGain.gain.value = control.Reverb/2;
	
	//Loop handles the movement and playback of the 'bar' object
	//It updates the bars position, hitbox, movement speed if the application 'isPlaying'
	if(!control.isPlaying) {
		bar.position.set(50, 3.5, 0);
		barBoundingBox.update(bar);
		barBox.setFromObject(bar);
		} else {
		if (bar.position.x < -49.9) {
			bar.position.set(50, 3.5, 0);
			for(var i = 0; i < hitFlags.length; i++) {
				hitFlags[i] = 0; //Resets all 'hitFlags' when 'bar' is reset
			}
		}
		else {
			bar.position.x -= (control.BPM/60)*timeDelta*25; //Sets movement speed based on 'control.BPM'
		}
		barBoundingBox.update(bar);
		barBox.setFromObject(bar);
	}
	
	//Loop through all cubes and update there collision boxes, collision detection
	//Also deletes cubes from the scene if it has fallen off the ground
	for (var i = 0;i<cubes.length;i++) {
		
		if(control.deleteMode) {
			cubes[i].material.emissive.setHex(0xff0000);
		}
		
		cubeColliders[i].update(cubes[i].mesh);
		box3Colliders[i].setFromObject(cubeColliders[i]);
		
		if(box3Colliders[i].intersectsBox(barBox)&&control.isPlaying) {
			if(hitFlags[i]==0) {
				hitFlags[i] = 1;
				if(!control.deleteMode) {cubes[i].material.emissive.setHex(0x0000ff);}
				cubes[i].playNote();
			}
			if(!control.deleteMode){
				cubes[i].material.emissive.setHex(0x0000ff);
				cubes[i].material.emissiveIntensity = 5;
			}
			} else {
			if(!control.deleteMode){
				cubes[i].material.emissive.setHex(0x000000);
				cubes[i].material.emissiveIntensity = 1;
			}
		}
		
		if(cubes[i].mesh.position.y < -300){
			deleteCube(i);
		}
	}
	
	////////////////////////////////////
	renderer.render( scene, camera );
}

//onWindowResize handles the resizing of the browser window
//It updates the camera aspect ratio and renderer size
function onWindowResize() {
	
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
	
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( window.innerWidth, window.innerHeight );
	
}

function onDocumentMouseMove( event ) {
	//~ event.preventDefault(); //preventDefault() on mouse events appears to break some functionality of dat.gui
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onDocumentMouseDown( event ) {
	//~ event.preventDefault();
	if(control.deleteMode&&event.button==0) {
		var intersects = rayCaster.intersectObjects( cubeMeshes );
		if ( intersects.length > 0 ) {
			var intersect = intersects[ 0 ];
			// delete cube
			deleteCube(cubeMeshes.indexOf(intersect.object));
		}
	}
	if(control.deleteMode&&event.button==2) {
		control.deleteMode=false;
	}
	
}

//Entry point for the application
//Function called on window load
function startApp() {
	
	initScene();
	getImpulse();
}

// Creates an XMLHttprequest() to load the 'irHall.ogg' from the server
function getImpulse() {
  ajaxRequest = new XMLHttpRequest();
  ajaxRequest.open('GET', impulseUrl, true);
  ajaxRequest.responseType = 'arraybuffer';

  ajaxRequest.onload = function() {
    var impulseData = ajaxRequest.response;

		audioctx.decodeAudioData(impulseData, function(buffer) {
        myImpulseBuffer = buffer;
        convolver.buffer = myImpulseBuffer;
        convolver.loop = true;
		convolver.normalize = true;
        convolverGain.gain.value = 0;
		// gainNode.connect(convolverGain);
        convolverGain.connect(convolver);
		convolver.connect(dest);
		convolver.connect(audioctx.destination);
		console.log("reverb loaded");
      },

      function(e){"Error with decoding audio data" + e.err});

  }

  ajaxRequest.send();
}
  
mediaRecorder.ondataavailable = function(evt) {
    // push each chunk (blobs) in an array
    chunks.push(evt.data);
};

mediaRecorder.onstop = function(evt) {
    // Make blob out of chunks[], and open it.
    var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
    var url = URL.createObjectURL(blob);
	var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
	a.href = url;
	var fileName = prompt('Enter a name for your sound clip?','My_Melody');
    a.download = fileName+".ogg";
    a.click();
    window.URL.revokeObjectURL(url);
};

function startRecord() {
	mediaRecorder.start();
}
function stopRecord() {
	mediaRecorder.stop();
}

function deleteCube(number) {
	scene.remove(cubes[number].mesh);
	scene.remove(cubeColliders[number]);
	scene.remove(box3Colliders[number]);
	cubes.splice(number,1);
	cubeMeshes.splice(number,1);
	cubeColliders.splice(number,1);
	box3Colliders.splice(number,1);
	hitFlags.splice(number,1);
	updateCubeCounter();
}

//newCube() creates a new instance of Cube, BoxHelper and Box3
//These instances are appended to the corresponding array and added to the scene
function newCube(noteValue) {
	if(cubes.length < 8) {
		cubes[cubes.length] = new Cube(noteValue);
		cubeMeshes[cubeMeshes.length] = cubes[cubes.length-1].mesh;
		cubeColliders[cubeColliders.length] = new THREE.BoxHelper(cubes[cubes.length-1].mesh,0x0000ff);
		box3Colliders[box3Colliders.length] = new THREE.Box3();
		
		box3Colliders[box3Colliders.length-1].setFromObject(cubeColliders[cubeColliders.length-1]);
		
		hitFlags[hitFlags.length] = 0;
		
		cubeColliders[cubeColliders.length-1].visible = true; //Set cubes bounding box visible
		
		//Give the cube a random spawn point in a 45X45 square 20 units above the ground mesh
		cubes[cubes.length-1].mesh.position.set(
		Math.random()*-45*PlusOrMinus(),
		20,
		Math.random()*-45*PlusOrMinus()
		);
		
		//Give the cube a random rotation on all axes
		cubes[cubes.length-1].mesh.rotation.set(
		Math.random()*Math.PI*2,
		Math.random()*Math.PI*2,
		Math.random()*Math.PI*2
		);
		scene.add(cubes[cubes.length-1].mesh);
		scene.add(cubeColliders[cubeColliders.length-1]);
		
		updateCubeCounter();
		} else {
		alert("You Appear to have run out of cubes!")
	}
}

//Cube object holds all information about a cube (geometry, material, mesh, note information etc.)
//All the functions for updating and playing audio are defined here
function Cube(scalar) {
	this.geometry = cubeGeom.clone();
	this.material = cubeMat.clone();
	this.mesh = new Physijs.BoxMesh( this.geometry, this.material,3 );
	this.mesh.scale.set(scalar,scalar,scalar);
	this.noteLength;
	var oscillator;
	
	//Set the note length based on control.BPM
	this.updateNoteLength = function(){
		this.noteLength = 1/(control.BPM/60)*scalar
	};
	
	//The floor geometry is divided into steps of 8 values and the cubes position on that grid
	//determines its note frequency
	this.updateNote = function(){
		var zpos = this.mesh.position.z;
		switch(true){
			case (zpos >= -50 && zpos < -37.5):
			this.note = NOTE_C[4];
			// console.log("Set to C4");
			break;
			case (zpos >= -37.5 && zpos < -25):
			this.note = NOTE_D[4];
			// console.log("Set to D4");
			break;
			case (zpos >= -25 && zpos < -12.5):
			this.note = NOTE_E[4];
			// console.log("Set to E4");
			break;
			case (zpos >= -12.5 && zpos < 0):
			this.note = NOTE_F[4];
			// console.log("Set to F4");
			break;
			case (zpos >= 0 && zpos < 12.5):
			this.note = NOTE_G[4];
			// console.log("Set to G4");
			break;
			case (zpos >= 12.5 && zpos < 25):
			this.note = NOTE_A[4];
			// console.log("Set to A4");
			break;
			case (zpos >= 25 && zpos < 37.5):
			this.note = NOTE_B[4];
			// console.log("Set to B4");
			break;
			case (zpos >= 37.5 && zpos < 50):
			this.note = NOTE_C[5];
			// console.log("Set to C5");
			break;
		}
	};

	
	//this.playNote creates a new oscillator, sets its note, gain and wave type.
	//The note is then played for a duration of 'noteLength'
	this.playNote = function(){
		this.updateNote();
		this.updateNoteLength();
		//A new oscillator must be created everytime a note is played
		oscillator = audioctx.createOscillator();
		oscillator.frequency.value = this.note;
		gainNode = audioctx.createGain();
		gainNode.gain.value = 0.3; // Reduced gain to prevent clipping
		oscillator.type = control.Wave;
		oscillator.connect(gainNode);
		delay.connect(feedback);
		feedback.connect(delay);
		gainNode.connect(delay);
		gainNode.connect(audioctx.destination);
		gainNode.connect(dest);
		gainNode.connect(convolverGain);
		delay.connect(delayGain);
		delayGain.connect(audioctx.destination);
		delayGain.connect(dest);
		oscillator.start(0);
		gainNode.gain.setTargetAtTime(0, audioctx.currentTime+this.noteLength, 0.01);
		oscillator.stop(audioctx.currentTime+this.noteLength+0.1);
	};
}

//This function updates the 'cubeCounter' DOM element to display the current
//number of cubes remaining.
function updateCubeCounter() {
	if(cubes.length==8) {
		document.getElementById('cubeCounter').innerHTML = ("Cubes remaining: "+ (8-cubes.length)+"<br> :(");
	}else {document.getElementById('cubeCounter').innerHTML = ("Cubes Remaining: "+ (8-cubes.length));}
}			
