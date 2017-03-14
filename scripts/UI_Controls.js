//Control object holds all variables the user will have access to
control = new function() {
	this.isPlaying = false;
	this.deleteMode = false;
	this.isRecording = false;
	
	this.playPause = function() {
		if(this.isPlaying) {
			this.isPlaying = false;
			console.log("Paused");
			} else {
			this.isPlaying = true;
			console.log("Playing");
		}
	}
	this.deleteCube = function() {
		if(this.deleteMode) {
			this.deleteMode = false;
			console.log("Delete mode off");
			} else {
			this.deleteMode = true;
			console.log("Delete mode on");
		}
	}
	this.record = function() {
	
		var recBtn = document.getElementsByClassName('dg main a')[0].getElementsByTagName('ul')[0].childNodes[9];
		
		if(this.isRecording) {
			stopRecord();
			this.isRecording = false;
			this.isPlaying = false;
			recBtn.classList.remove("recordingAnim");
			recBtn.getElementsByTagName('div')[0].getElementsByClassName('property-name')[0].innerHTML="Record Audio";
			console.log("Stopped Recording");
			} else if(cubes.length>0){
			startRecord();
			this.isPlaying = true;
			this.isRecording = true;
			recBtn.classList.add("recordingAnim");
			recBtn.getElementsByTagName('div')[0].getElementsByClassName('property-name')[0].innerHTML="Recording...";
			console.log("Recording");
		}
	}
	
	this.makeQuarterCube = function() {
		newCube(quarter);
	}
	this.makeHalfCube = function() {
		newCube(half);
	}
	this.makeWholeCube = function() {
		newCube(whole);
	}
	this.Wave = 'sine';
	this.BPM = 160.00;
	this.Delay = 0;
	this.Reverb = 0;
};

function createKeyEvents() {
	//Add eventListener for keyboard shortcuts
	document.addEventListener('keydown',(event) => {
	if(event.key == ' ') {
		control.isPlaying = !control.isPlaying;
	}
	if(event.key == 'x') {
		control.deleteMode = !control.deleteMode;
	}
});
}

createKeyEvents();
addControlGui(control);

//Creates new GUI object and adds elements from the control object to it
function addControlGui(controlObject) {
	var gui = new dat.GUI();
	gui.closed=true; //Gui is closed on start
	gui.add(controlObject, 'playPause').name("Play/Pause");
	gui.add(controlObject, 'makeWholeCube').name("Add Whole Note");
	gui.add(controlObject, 'makeHalfCube').name("Add Half Note");
	gui.add(controlObject, 'makeQuarterCube').name("Add Quarter Note");
	gui.add(controlObject, 'deleteCube').name("Delete Cube");
	gui.add(controlObject, 'BPM', 0, 300).name("Tempo");
	gui.add(controlObject, 'Delay', 0, 1).name("Delay").min(0).max(1).step(0.01);
	gui.add(controlObject, 'Reverb', 0, 10).name("Reverb");
	gui.add(controlObject, 'Wave', ['sine','triangle','sawtooth','square']);
	gui.add(controlObject, 'record').name("Record Audio");
}