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


var cubes = [];			//Holds all of the scenes cubes
var cubeColliders = [];	//Holds all of the cubes boxHelper objects
var box3Colliders = [];	//Holds all of the boxHelper collision boxes
var hitFlags = [];		//Flags used to ensure collision is detected only once every bar pass
var bar;
var barBoundingBox;
var barBox;
var audioctx = new AudioContext();

var clock;
var timeDelta;


function initScene() {
    "use strict"; //Prevents accidental creation of global variables
    
	//Initialize the scene and add the renderer to the window
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize, false);
	
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
	timeDelta = clock.getDelta(); //Update clock used for controlling movement speed every render pass
	controls.update(); //Update camera with 'OrbitControls' input from the user
	scene.simulate(); //Render phsyics
	
	
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
		
		cubeColliders[i].update(cubes[i].mesh);
		box3Colliders[i].setFromObject(cubeColliders[i]);
		
		
		if(box3Colliders[i].intersectsBox(barBox)&&hitFlags[i]==0&&control.isPlaying) {
			hitFlags[i] = 1;
			cubes[i].playNote();
		}
		
		if(cubes[i].mesh.position.y < -100){
			scene.remove(cubes[i]);
			scene.remove(cubeColliders[i]);
			scene.remove(box3Colliders[i]);
			cubes.splice(i,i);
			cubeColliders.splice(i,i);
			box3Colliders.splice(i,i);
			hitFlags.splice(i,i);
			updateCubeCounter();
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

//Entry point for the application
//Function called on window load
function startApp() {
	
	initScene();
	
}

//newCube() creates a new instance of Cube, BoxHelper and Box3
//These instances are appended to the corresponding array and added to the scene
function newCube(noteValue) {
	if(cubes.length < 8) {
		cubes[cubes.length] = new Cube(noteValue);
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
		
		cubes[cubes.length-1].updateNoteLength(); //Sets the length of the cubes note based on its noteValue
		
		updateCubeCounter();
		} else {
		alert("You Appear to have run out of cubes!")
	}
}

//Cube object holds all information about a cube (geometry, material, mesh, note information etc.)
//All the functions for updating and playing audio are defined here
function Cube(scalar) {
	this.geometry = cubeGeom.clone();
	this.material = new Physijs.createMaterial(new THREE.MeshStandardMaterial({map:noteImage}),0.4,1);
	this.mesh = new Physijs.BoxMesh( this.geometry, this.material,3 );
	this.mesh.scale.set(scalar,scalar,scalar);
	this.noteLength;
	var oscillator, gainNode;
	
	//Set the note length based on control.BPM
	this.updateNoteLength = function(){
		this.noteLength = 1/(control.BPM/60)*scalar
	};
	
	//this.updateNote is repeatedly called in the render loop to update a cubes note value.
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
	
	//Function to snap cube position to timing grid
	this.quantize = function(){
		
	};
	
	//this.playNote creates a new oscillator, sets its note, gain and wave type.
	//The note is then played for a duration of 'noteLength'
	this.playNote = function(){
		this.updateNote();
		//A new oscillator must be created everytime a note is played
		oscillator = audioctx.createOscillator();
		oscillator.frequency.value = this.note;
		gainNode = audioctx.createGain();
		gainNode.gain.value = 0.3; // Reduced gain to prevent clipping
		oscillator.type = control.Wave;
		oscillator.connect(gainNode);
		gainNode.connect(audioctx.destination);
		oscillator.start(0);
		gainNode.gain.setTargetAtTime(0, audioctx.currentTime+this.noteLength, 0.01);
	};
}

//This function updates the 'cubeCounter' DOM element to display the current
//number of cubes remaining.
function updateCubeCounter() {
	if(cubes.length==8) {
		document.getElementById('cubeCounter').innerHTML = ("Cubes remaining: "+ (8-cubes.length)+"<br> :(");
	}else {document.getElementById('cubeCounter').innerHTML = ("Cubes Remaining: "+ (8-cubes.length));}
}