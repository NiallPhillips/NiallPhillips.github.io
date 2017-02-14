control = new function() {
	this.isPlaying = false;
	this.playPause = function() {
		if(this.isPlaying) {
			this.isPlaying = false;
			} else {
			this.isPlaying = true;
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
	this.deleteCube = function() {
		
	}
	this.Wave = 'sine';
	this.BPM = 160.00;
	this.Delay = 0.00;
	this.Reverb = 0.00;
};

document.addEventListener('keydown',(event) => {
	if(event.key == ' ') {
		control.isPlaying = !control.isPlaying;
	}
});

addControlGui(control);

function addControlGui(controlObject) {
	var gui = new dat.GUI();
	gui.closed=true;
	gui.add(controlObject, 'playPause').name("Play/Pause");
	gui.add(controlObject, 'makeWholeCube').name("Add Whole Note");
	gui.add(controlObject, 'makeHalfCube').name("Add Half Note");
	gui.add(controlObject, 'makeQuarterCube').name("Add Quarter Note");
	gui.add(controlObject, 'BPM', 0, 240).name("Tempo");
	gui.add(controlObject, 'Delay', 0, 10).name("Delay");
	gui.add(controlObject, 'Reverb', 0, 10).name("Reverb");
	gui.add(controlObject, 'Wave', ['sine','triangle','sawtooth','square']);
}