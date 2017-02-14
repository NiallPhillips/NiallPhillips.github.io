Physijs.scripts.worker = 'physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var scene = new Physijs.Scene({ reportsize: 50, fixedTimeStep: 1 / 60 });
scene.setGravity(new THREE.Vector3(0, -50, 0));

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
var renderer = new THREE.WebGLRenderer({antialias: true});

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

var cubeGeom = new THREE.CubeGeometry(10, 10, 10);
var maxAnisotropy = renderer.getMaxAnisotropy();
var noteImage = new THREE.TextureLoader().load("quaver.jpg");
noteImage.anisotropy = maxAnisotropy;

var cubes = [];
var cubeColliders = [];
var box3Colliders = [];
var hitFlags = [];
var bar;
var barBoundingBox;
var barBox;
var audioctx = new AudioContext();

var clock;
var time;
var timeDelta;

function initScene() {
    "use strict";
    
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	
	window.addEventListener('resize', onWindowResize, false);
	
	clock = new THREE.Clock;
	
	var light = new THREE.AmbientLight(0x404040, 4); // soft white light
	scene.add(light);
	
	var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
	directionalLight.position.set(0, 1, 0.5);
	scene.add(directionalLight);
	
	var groundGeometry = new THREE.BoxGeometry(100, 1, 100);
	var groundMaterial = new THREE.MeshBasicMaterial({color: 0xff0000,wireframe:true});
	var ground = new Physijs.BoxMesh(groundGeometry, groundMaterial, 0);
	
	var bargeometry = new THREE.BoxGeometry(6, 100, 0.1);
	var barmaterial = new THREE.MeshBasicMaterial({color: 0xffff00,wireframe:true});
	bar = new THREE.Mesh(bargeometry, barmaterial);
	barBox = new THREE.Box3();
	barBox.setFromObject(bar);
	bar.position.set(50, 3.5, 0);
	
	barBoundingBox = new THREE.BoxHelper(bar, 0x00ff00);
	barBoundingBox.visible = true;
	scene.add(bar);
	scene.add(barBoundingBox);
	
	bar.rotation.x = Math.PI / 2;
	bar.rotation.y = Math.PI / 2;
	
	scene.add(ground);
	
	camera.position.z = -80;
	camera.position.y = 50;
	
	updateCubeCounter();
	
	var gridHelper = new THREE.GridHelper( 50, 8 );
	// gridHelper.position = (0,5,0);
	scene.add( gridHelper );
	
	render();
}

function PlusOrMinus() {
    "use strict";
    var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
	return plusOrMinus;
}

function render() {
    "use strict";
	requestAnimationFrame(render);
	////////////////////////////////////
	timeDelta = clock.getDelta();
	controls.update();
	scene.simulate();
	
	if(!control.isPlaying) {
		bar.position.set(50, 3.5, 0);
		barBoundingBox.update(bar);
		barBox.setFromObject(bar);
		} else {
		if (bar.position.x < -49.9) {
			bar.position.set(50, 3.5, 0);
			for(var i = 0; i < hitFlags.length; i++) {
				hitFlags[i] = 0;
			}
		}
		else {
			bar.position.x -= (control.BPM/60)*timeDelta*25; // moves 100 units per second, in this case, 4 beats per second
		}
		barBoundingBox.update(bar);
		barBox.setFromObject(bar);
	}
	
	
	for (var i = 0;i<cubes.length;i++) {
		
		cubeColliders[i].update(cubes[i].mesh);
		box3Colliders[i].setFromObject(cubeColliders[i]);
		cubes[i].updateNoteLength();
		
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

function onWindowResize() {
	
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
	
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( window.innerWidth, window.innerHeight );
	
}

function startApp() {
	
	initScene();
	
}

function newCube(noteValue) {
	if(cubes.length < 8) {
		cubes[cubes.length] = new Cube(noteValue);
		cubeColliders[cubeColliders.length] = new THREE.BoxHelper(cubes[cubes.length-1].mesh,0x0000ff);
		box3Colliders[box3Colliders.length] = new THREE.Box3();
		box3Colliders[box3Colliders.length-1].setFromObject(cubeColliders[cubeColliders.length-1]);
		hitFlags[hitFlags.length] = 0;
		
		cubeColliders[cubeColliders.length-1].visible = true;
		
		cubes[cubes.length-1].mesh.position.set(
		Math.random()*-45*PlusOrMinus(),
		20,
		Math.random()*-45*PlusOrMinus()
		);
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

function Cube(scalar) {
	this.geometry = cubeGeom.clone();
	this.material = new Physijs.createMaterial(new THREE.MeshStandardMaterial({map:noteImage}),0.4,1);
	this.mesh = new Physijs.BoxMesh( this.geometry, this.material,3 );
	this.mesh.scale.set(scalar,scalar,scalar);
	// this.note = NOTE_C[4];
	this.noteLength = 1*scalar;
	var oscillator, gainNode;
	
	this.updateNoteLength = function(){
		this.noteLength = 1/(control.BPM/60)*scalar
	};
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
	this.quantize = function(){
		
	};
	this.playNote = function(){
		this.updateNote();
		oscillator = audioctx.createOscillator();
		oscillator.frequency.value = this.note;
		gainNode = audioctx.createGain();
		gainNode.gain.value = 0.3; // Sounds less harsh when gain is turned down a little
		oscillator.type = control.Wave;
		oscillator.connect(gainNode);
		gainNode.connect(audioctx.destination);
		oscillator.start(0);
		gainNode.gain.setTargetAtTime(0, audioctx.currentTime+this.noteLength, 0.01);
		// oscillator.stop(audioctx.currentTime+this.noteLength);
	};
}

function updateCubeCounter() {
	if(cubes.length==8) {
		document.getElementById('cubeCounter').innerHTML = ("Cubes left: "+ (8-cubes.length)+" :(");
	}else {document.getElementById('cubeCounter').innerHTML = ("Cubes left: "+ (8-cubes.length));}
}

function TimeBar() {
	this.plane = 0;
	this.tempo = 0;
	
	this.updateTempo = function(){};
	this.start = function(){};
	this.stop = function(){};
}