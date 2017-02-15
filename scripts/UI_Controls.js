//Control object holds all variables the user will have access to
control = new function() {
	this.isPlaying = false;
	this.deleteMode = false;
	
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
	this.Delay = 0.00;
	this.Reverb = 0.00;
};

//Add eventListener for keyboard shortcuts
document.addEventListener('keydown',(event) => {
	if(event.key == ' ') {
		control.isPlaying = !control.isPlaying;
	}
	if(event.key == 'x') {
		control.deleteMode = !control.deleteMode;
	}
});

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
	gui.add(controlObject, 'Delay', 0, 10).name("Delay");
	gui.add(controlObject, 'Reverb', 0, 10).name("Reverb");
	gui.add(controlObject, 'Wave', ['sine','triangle','sawtooth','square']);
}