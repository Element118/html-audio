var Priority_Queue = function(lessThan, createFrom) {
    this.data = [0];
    this.lessThan = lessThan || function(a, b) {
        return a < b;
    };
    if (createFrom) {
        for (var i=0;i<createFrom.length;i++) {
            this.data.push(createFrom[i]);
        }
        for (var i=(createFrom.length+1)<<1;i;i--) {
            this.fixHeap(i);
        }
    }
};
Priority_Queue.prototype.fixHeap = function(where) {
    var l = where<<1;
    if (l >= this.data.length) {
        return 0;
    }
    if (l+1 < this.data.length && this.lessThan(this.data[l], this.data[l+1])) {
        l++;
    }
    if (this.lessThan(this.data[where], this.data[l])) {
        var temp = this.data[where];
        this.data[where] = this.data[l];
        this.data[l] = temp;
        this.fixHeap(l);
        return l;
    }
    return 0;
};
Priority_Queue.prototype.remove = function(where) {
    if (where + 1 === this.data.length) {
        this.data.pop();
        return;
    }
    this.data[where] = this.data.pop();
    while (where && this.fixHeap(where)) {
        where = where >> 1;
    }
};
Priority_Queue.prototype.top = function() {
    return this.data[1];
};
Priority_Queue.prototype.pop = function() {
    this.remove(1);
};
Priority_Queue.prototype.push = function(what) {
    var position = this.data.length >> 1;
    this.data.push(what);
    while (position && this.fixHeap(position)) {
        position = position >> 1;
    }
};
Priority_Queue.prototype.empty = function() {
    return this.data.length === 1;
};
Priority_Queue.prototype.size = function() {
    return this.data.length-1;
};
Priority_Queue.fixHeapHere = function(arr, size, where, lessThan) {
    var l = (where<<1)+1;
    if (l < size) {
        if (l+1 < size && lessThan(arr[l], arr[l+1])) {
            l++;
        }
        if (lessThan(arr[where], arr[l])) {
            var temp = arr[where];
            arr[where] = arr[l];
            arr[l] = temp;
            return l;
        }
    }
    return null;
};
// using https://www.khanacademy.org/computer-programming/ast-nonsense-safe-new/5440494445920256
var new_ = Object.constructor("cls", "args", 
    "args = Array.prototype.slice.call(args);\n" +
    "args.unshift(undefined);\n" +
    "var obj = new (Function.prototype.bind.apply(cls, args))();\n" + 
    "obj.constructor = cls;\n" + // In most cases this line can be removed
    "return obj;"
);
Priority_Queue.heapsortNoPQ = function(arr, lessThan) {
    lessThan = lessThan || function(a, b) {
        return a<b;
    };
    var l = arr.length;
    for (var i=(l+1)<<1;i>=0;i--) {
        Priority_Queue.fixHeap(arr, l, i, lessThan);
    }
    for (var i=l-1;i>=0;i--) {
        var temp = arr[i];
        arr[i] = arr[0];
        arr[0] = temp;
        Priority_Queue.fixHeap(arr, i, 0, lessThan);
    }
};
Priority_Queue.heapsort = function(arr, lessThan) {
    var pq = new_(Priority_Queue, [lessThan, arr]);
    for (var i=arr.length-1;i>=0;i--) {
        arr[i] = pq.top();
        pq.pop();
    }
};

Array.prototype.back = function() {
    return this[this.length-1];
};
/**
 * This manages the number of AudioContext on the page.
 * AudioContextManager.getAudioContext() gets an instance of AudioContext.
 * AudioContextManager.releaseAudioContext() releases an instance of AudioContext.
 */
var AudioContextManager = {
    uses: 0,
    audioContext: null,
    getAudioContext: function() {
        if (this.audioContext === null) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.uses = 0; // just to make sure someone wasn't paranoid that they released more times than needed.
        }
        this.uses++;
        return this.audioContext;
    },
    releaseAudioContext: function() {
        this.uses--;
        if (this.uses <= 0 && this.audioContext) { // prevent paranoid releasing
            this.audioContext.close();
            this.audioContext = null;
        }
    }
};

var checkExists = (window.AudioContext || window.webkitAudioContext);
if (!checkExists) {
    alert("This will not work with the browser you are currently using due to this browser not supporting the Web Audio API. Please use Chrome, Firefox, or Safari.");
}
var notesArr = [];
for (var i=0;i<100;i++) {
    notesArr.push(27.5*Math.pow(2, i/12));
}
/**
 * How to store song data
 * 
 * Human-readable form
 * 
 * Data stored
 * 1. Mapping from characters to notes
 * 2. Instruments (basically the different waveforms)
 * 
 * Notes are written as a string
 * [note character][octave modifier][base ticks]
 * a               ++               4
 * a++4, gives the note and time.
 * 
 * a++4a+4,
 * Plays two notes an octave apart at the same time
 * Same duration (4 ticks)
 * 
 * It is safe to insert random characters between notes, which are not ()/[],0123456789
 * I recommend | as a barline (syntactic sugar only, no effect).
 * 
 * Comma after every note to demonstrate end of a note.
 * Any character for a rest, but I recommend "&".
 * &12: Rest for 12 ticks
 * g++4&2,a++4:
 * Play first note for 4 ticks at time 0,
 * Play second note for 4 ticks at time 0+2.
 * 
 * Brackets allow for octave modifiers and time modifiers /[]
 * Modifiers occur between the / and [ characters.
 * The notes which are modified are within the square brackets []
 * Time modifier 3: /3[notes]
 * Every number that represents an amount of time
 * in the square brackets would be divided by 3.
 * 
 * Example:
 * /3++-7+[]
 * Divides numbers by 21 (3 times 7),
 * Increments by 2 octaves (++-+)
 * 
 * Round brackets:
 * Round brackets are required around everything.
 * It is not allowed to nest them, otherwise
 * undefined behaviour would occur. Round brackets
 * can be used to input BPM. Only integer values of
 * BPM are supported so far
 * (this can be modified in the future,
 * for now, hack in the BPM you want using /[]).
 * 
 * This shows a song with 2 sections, one at 240 BPM
 * and one at 140 BPM.
 * 240(notes)140(more notes)
 * 
 * Computer-readable form
 * Frames, which happen when at least one new note is pressed or one is released
 * Each frame stores the new notes, the notes which would be released,
 * and the notes which are sustained.
 * 
 * Extra info:
 * Songs exist independently of what is playing them, but need their help.
 * 
 * Song iterator
 * More than one song might be playing
 * at a time, but each MusicPlayer
 * should play only one song.
 * It is safe to run multiple
 * MusicPlayers at a time.
 */

/**
 * Construct a note to play as part of a song.
 * Wraps around OscillatorNode.
 */
var PlayableNote = function(config) {
    this.startTime = config.startTime;
    this.frequency = config.frequency;
    this.type = config.type; // "sine", "square", "sawtooth", "triangle", "custom"
    this.wave = this.type === "custom"?config.wave:undefined; // function
    if (PlayableNote.instruments[this.type]) {
        this.wave = PlayableNote.instruments[this.type];
        this.type = "custom";
    }
    this.length = config.length; // in milliseconds
    this.volume = config.volume; // 0: no sound, 1: loud (Not sure if can be louder)
    if (typeof this.volume !== "number") {
        this.volume = 1;
    }
    this.oscillator = null;
};
/**
 * Modifies an object storing waveforms
 * and make them into waves which can be
 * played later.
 * @param {Object} A hashtable of instruments.
 */
PlayableNote.createInstruments = function(obj) {
    var audioContext = AudioContextManager.getAudioContext();
    for (var i in obj) {
        obj[i] = audioContext.createPeriodicWave(obj[i].real, obj[i].imag);
    }
    AudioContextManager.releaseAudioContext();
    return obj;
};
/**
 * An array of default instruments.
 */
PlayableNote.instruments = PlayableNote.createInstruments({
    sample1: {
        real: Float32Array.from([0, 1, 1.5, 0]),
        imag: Float32Array.from([0, 0, 0, 0])
    }
});
/**
 * Begins the note. Automatically stops it at the intended time.
 * Uses AudioContext.
 * @param {AudioContext} audioContext
 * @param {Object} destination Where to send the nodes to
 */
PlayableNote.prototype.start = function(audioContext, destination) {
    if (this.oscillator) {
        this.oscillator.stop();
    }
    this.oscillator = audioContext.createOscillator();
    var gainNode = audioContext.createGain();
    gainNode.gain.value = this.volume;
    this.oscillator.connect(gainNode);
    gainNode.connect(destination || audioContext.destination);
    // set the volume
    gainNode.gain.value = this.volume;
    if (this.type === "custom") {
        this.oscillator.setPeriodicWave(this.wave);
    } else {
        this.oscillator.type = this.type;
    }
    this.oscillator.frequency.value = this.frequency; 
    this.oscillator.start(0);
    this.oscillator.stop(audioContext.currentTime+this.length/1000);
    return this.oscillator; // returning it won't hurt
};
/**
 * Begins the note, assuming the current song time.
 * Automatically stops it at the intended time.
 * Uses AudioContext.
 * @param {AudioContext} audioContext
 * @param {Object} destination Where to send the nodes to
 * @param {Number} time Time to start the note at
 */
PlayableNote.prototype.startAt = function(audioContext, destination, time) {
    this.oscillator = audioContext.createOscillator();
    var gainNode = audioContext.createGain();
    gainNode.gain.value = this.volume;
    this.oscillator.connect(gainNode);
    gainNode.connect(destination || audioContext.destination);
    if (this.type === "custom") {
        this.oscillator.setPeriodicWave(this.wave);
    } else {
        this.oscillator.type = this.type;
    }
    this.oscillator.frequency.value = this.frequency; 
    this.oscillator.start(0);
    this.oscillator.stop(audioContext.currentTime+Math.max((this.length+this.startTime-time)/1000, 0));
    return this.oscillator; // returning it won't hurt
};
/**
 * Stops the note early.
 */
PlayableNote.prototype.stop = function() {
    if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator = null;
    }
};

/**
 * Constructs a data structure to hold a song out of the data object.
 * data has important properties that can be set:
 * data.title: title of the song
 * data.noteMapping: define a mapping between characters and notes for easy input
 * Do not use the characters ()[]\,&+-1234567890 in the mapping
 * data.instruments: store what the instruments do
 * @param {Object} data song data
 */
var PlayableMusic = function(data) {
    this.title = data.title || "";
    this.minBPM = Infinity;
    this.maxBPM = 0;
    this.timeFrames = []; // objects
    this.composer = data.composer || "";
    this.arranger = data.arranger || "";
    this.transcriber = data.transcriber || "";
    var mapping = data.noteMapping; // hashtable
    var volumeChar = (data.volume && data.volume.characters) || {};
    var volumeMap = (data.volume && data.volume.mapping) || {};
    var stack = []; // an array repurposed as stack
    var EPSILON = 0.5; // honestly, anything less than a 0.5 millisecond difference doesn't matter much. We can't even show the difference for <1 ms.
    var timeFrameIndex = 0; // a number index pointer
    // I think I need to process in parallel...
    var initPQ = [];
    // I can expect to have hundreds of instruments
    for (var i=0;i<data.instruments.length;i++) {
        initPQ.push({
            instrumentIndex: i,
            stringPointer: 0,
            millis: 0,
            bpm: 0,
            // 0 is default volume
            // volume exists outside the stack
            volume: 0,
            parseState: "bpm entry",
            modifierStack: [{
                timeMultiplier: 1,
                octaveChange: 0,
            }],
        });
    }
    var pq = new Priority_Queue(function(a, b) {
        return a.millis>b.millis;
    }, initPQ);
    // array to store sustained notes.
    var sustainedArray = [];
    var lastSustained = -1;
    while (!pq.empty()) {
        var x = pq.top(); pq.pop();
        if (this.timeFrames.length === 0 || Math.abs(this.timeFrames.back().millis-x.millis)>EPSILON) {
            // produce new time frame
            this.timeFrames.push({
                millis: Math.round(x.millis), // round it
                onNotes: [],
                offNotes: [],
                sustainNotes: []
            });
        }
        // time frame exists.
        // check the sustained array
        // delete elements past the time.
        if (lastSustained<this.timeFrames.back().millis) {
            lastSustained = this.timeFrames.back().millis;
            var replaceSus = [];
            var susNotes = this.timeFrames.back().sustainNotes;
            for (var i=0;i<sustainedArray.length;i++) {
                // add to the sustain notes
                if (Math.abs(sustainedArray[i].startTime+sustainedArray[i].length-this.timeFrames.back().millis)<EPSILON) {
                    this.timeFrames.back().offNotes.push(sustainedArray[i]);
                } else {
                    susNotes.push(sustainedArray[i]);
                    // check if should add to the next batch
                    if (this.timeFrames.back().millis+EPSILON<sustainedArray[i].startTime+sustainedArray[i].length) {
                        replaceSus.push(sustainedArray[i]);
                    }
                }
            }
            sustainedArray = replaceSus;
        }
        if (typeof x.instrumentIndex === "number") {
            var numberDetected = false;
            var volumeDetected = false;
            var curVolume;
            var curNumber = 0;
            var noteBuffer = {
                startTime: x.millis,
                noteNumber: NaN, // store note number
                frequency: 0,
                length: 0,
                volume: 1,
                type: data.instruments[x.instrumentIndex].type,
                wave: data.instruments[x.instrumentIndex].wave
            };
            var modifierBuffer = {
                timeMultiplier: 1,
                octaveChange: 0
            };
            for (;x.stringPointer<data.instruments[x.instrumentIndex].notes.length;x.stringPointer++) {
                var currentChar = data.instruments[x.instrumentIndex].notes[x.stringPointer];
                if (numberDetected && !(48 <= currentChar.charCodeAt(0) && currentChar.charCodeAt(0) <= 57)) {
                    numberDetected = false;
                    if (x.parseState === "bpm entry") {
                        x.bpm = curNumber;
                        this.minBPM = Math.min(this.minBPM, x.bpm);
                        this.maxBPM = Math.max(this.maxBPM, x.bpm);
                    } else if (x.parseState === "settings") {
                        modifierBuffer.timeMultiplier *= curNumber;
                    } else { // note entry
                        noteBuffer.length = curNumber / x.modifierStack.back().timeMultiplier * (60000 / x.bpm);
                        // create note
                        if (notesArr[noteBuffer.noteNumber]) {
                            // if exists create note from the note buffer
                            noteBuffer.frequency = notesArr[noteBuffer.noteNumber+12*x.modifierStack.back().octaveChange];
                            noteBuffer.volume = volumeMap[x.volume] || 1;
                            var newNote = new PlayableNote(noteBuffer);
                            // add to onNotes
                            this.timeFrames.back().onNotes.push(newNote);
                            // add to sustainedArray
                            sustainedArray.push(newNote);
                            // add element to pq to end the note.
                            pq.push({ millis: x.millis+newNote.length });
                            noteBuffer.noteNumber = NaN; // ensure nothing gets played
                        }
                    }
                    curNumber = 0;
                }
                if (data.instruments[x.instrumentIndex].notes[x.stringPointer] === ",") {
                    // advance time
                    x.millis = noteBuffer.length + noteBuffer.startTime;
                    // advance character
                    x.stringPointer++;
                    break;
                }
                // handle volume
                if (volumeChar.soft === currentChar) {
                    if (!volumeDetected) { curVolume = 0; }
                    curVolume--;
                    volumeDetected = true;
                } else if (volumeChar.loud === currentChar) {
                    if (!volumeDetected) { curVolume = 0; }
                    curVolume++;
                    volumeDetected = true;
                } else if (volumeDetected) {
                    x.volume = curVolume;
                    volumeDetected = false;
                }
                switch (currentChar) {
                    case "/":
                        x.parseState = "settings";
                        break;
                    case "[":
                        x.modifierStack.push({
                            timeMultiplier: x.modifierStack.back().timeMultiplier*modifierBuffer.timeMultiplier,
                            octaveChange: x.modifierStack.back().octaveChange+modifierBuffer.octaveChange,
                        });
                        modifierBuffer.timeMultiplier = 1;
                        modifierBuffer.octaveChange = 0;
                        // push settings on the stack
                        x.parseState = "note entry";
                        break;
                    case "]":
                        // pop settings off the stack
                        x.modifierStack.pop();
                        break;
                    case "(":
                        x.parseState = "note entry";
                        break;
                    case ")":
                        x.parseState = "bpm entry";
                        break;
                    case "+": // up octave
                        if (x.parseState === "settings") {
                            modifierBuffer.octaveChange++;
                        } else {
                            noteBuffer.noteNumber += 12;
                        }
                        break;
                    case "-": // down octave
                        if (x.parseState === "settings") {
                            modifierBuffer.octaveChange--;
                        } else {
                            noteBuffer.noteNumber -= 12;
                        }
                        break;
                    case "0": case "1": case "2": case "3": case "4": // fallthrough
                    case "5": case "6": case "7": case "8": case "9":
                        // number process
                        if (!numberDetected) {
                            curNumber = currentChar.charCodeAt(0)-48;
                            numberDetected = true;
                        } else {
                            curNumber = curNumber * 10 + currentChar.charCodeAt(0)-48;
                        }
                        break;
                    default:
                        noteBuffer.noteNumber = mapping[currentChar] || NaN;
                }
            }
            // is there still input?
            if (x.stringPointer<data.instruments[x.instrumentIndex].notes.length) {
                pq.push(x);
            }
        }
    }
    this.length = this.timeFrames.back().millis;
};
/**
 * With the help of a manager, play the music at a certain time.
 * @param {MusicPlayer} manager
 */
PlayableMusic.prototype.play = function(manager) {
    var time = manager.getTime();
    var low = 0, high = this.timeFrames.length;
    while (low+1<high) {
        var mid = Math.floor((low+high)/2);
        if (this.timeFrames[mid].millis > time) {
            high = mid;
        } else if (this.timeFrames[mid].millis < time) {
            low = mid;
        } else {
            low = mid;
            high = mid+1;
        }
    }
    manager.playingFrame = low;
    // start notes
    if (low<this.timeFrames.length) {
        for (var i=0;i<this.timeFrames[low].onNotes.length;i++) {
            this.timeFrames[low].onNotes[i].startAt(manager.audioContext, manager.volumeNode, time);
        }
        for (var i=0;i<this.timeFrames[low].sustainNotes.length;i++) {
            this.timeFrames[low].sustainNotes[i].startAt(manager.audioContext, manager.volumeNode, time);
        }
        if (low+1<this.timeFrames.length) {
            manager.currentTimeout = setTimeout(function() {
                manager.playingFrame++;
                this.playFrame(manager);
            }.bind(this), Math.max(this.timeFrames[low+1].millis-time, 0));
        } else {
            manager.endSong(); // music tells manager to stop
        }
    } else {
        manager.endSong();
    }
};
/**
 * With the help of a manager, play the music at a certain frame.
 * This should not be normally called.
 * @param {MusicPlayer} manager
 */
PlayableMusic.prototype.playFrame = function(manager) {
    var frame = manager.playingFrame; // get the actual frame
    var time = manager.getTime();
    for (var i=0;i<this.timeFrames[frame].onNotes.length;i++) {
        this.timeFrames[frame].onNotes[i].startAt(manager.audioContext, manager.volumeNode, time);
    }
    if (frame+1<this.timeFrames.length) {
        manager.currentTimeout = setTimeout(function() {
            manager.playingFrame++;
            this.playFrame(manager);
        }.bind(this), Math.max(this.timeFrames[frame+1].millis-time, 0));
    } else {
        manager.endSong(); // music tells manager to stop
    }
};
/**
 * With the help of a manager, stop the music now.
 * @param {MusicPlayer} manager
 */
PlayableMusic.prototype.stop = function(manager) {
    clearTimeout(manager.currentTimeout); // should be responsible for it.
    var frame = manager.playingFrame; // the frame used
    if (frame<this.timeFrames.length) {
        // stop everything
        for (var i=0;i<this.timeFrames[frame].onNotes.length;i++) {
            this.timeFrames[frame].onNotes[i].stop();
        }
        for (var i=0;i<this.timeFrames[frame].sustainNotes.length;i++) {
            this.timeFrames[frame].sustainNotes[i].stop();
        }
    }
};

/**
 * MusicPlayer manages the playing of PlayableMusic
 * It can store multiple PlayableMusic as a song selector.
 * @param {PlayableMusic[]} songData
 */
var MusicPlayer = function(songData) {
    this.data = songData || []; // store song data as array of playable music
    this.songIndex = -1;
    this.playing = false;
    this.time = 0;
    this.startTime = 0;
    this.currentTimeout = undefined;
    this.audioContext = null;
    this.loop = false;
    this.playAll = false;
    this.volume = 1; // volume multiplier
    this.playingFrame = 0;
    this.speed = 1; // speed multiplier
};
/**
 * Set if the song should loop
 * @param {Boolean} loop
 */
MusicPlayer.prototype.setLoop = function(loop) {
    this.loop = !!loop; // cast to boolean for the rebels
};
/**
 * Set if this should play all the songs.
 * @param {Boolean} playAll
 */
MusicPlayer.prototype.setPlayAll = function(playAll) {
    this.playAll = !!playAll;
};
/**
 * MusicPlayer version number. Doesn't do much.
 */
MusicPlayer.version = "1.6"; // storing version number for version control

/**
 * Plays the selected song at time this.time.
 */
MusicPlayer.prototype.play = function() {
    if (!this.playing && 0 <= this.songIndex && this.songIndex < this.data.length) {
        // generate AudioContext
        this.audioContext = AudioContextManager.getAudioContext();
        this.volumeNode = this.audioContext.createGain();
        this.volumeNode.connect(this.audioContext.destination);
        this.volumeNode.gain.value = this.volume;
        // play
        this.playing = true;
        if (this.time>=this.data[this.songIndex].length) {
            this.time = 0;
        }
        this.startTime = new Date().getTime();
        this.data[this.songIndex].play(this);
    }
};
/**
 * Set the volume of the music. 1 means original volume.
 * @param {Number} volume What to set it to.
 */
MusicPlayer.prototype.setVolume = function(volume) {
    this.volume = (+volume);
    if (this.playing && this.audioContext) {
        this.volumeNode = this.audioContext.createGain();
        this.volumeNode.connect(this.audioContext.destination);
        this.volumeNode.gain.value = this.volume;
        this.pause();
        this.play();
    }
};
/**
 * A callback back to stop the current song playing.
 * Used by the song to tell the instance of MusicPlayer that it ended.
 */
MusicPlayer.prototype.endSong = function() {
    if (this.playing) {
        // release AudioContext
        AudioContextManager.releaseAudioContext();
        this.playing = false;
        this.startTime = new Date().getTime();
        this.time = this.data[this.songIndex].length;
        if (this.playAll) {
            this.songIndex++;
            if (this.songIndex === this.data.length) {
                this.songIndex = this.loop?0:-1;
            }
            this.play();
        } else if (this.loop) {
            this.play(); // loop!
        }
    }
};
/**
 * Pauses the song.
 * Stores enough information to play the song
 * from this point when .play is called.
 */
MusicPlayer.prototype.pause = function() {
    if (this.playing) {
        this.playing = false;
        this.time += (new Date().getTime()-this.startTime)*this.speed;
        this.data[this.songIndex].stop(this); // this helps it stop
        AudioContextManager.releaseAudioContext();
        this.audioContext = null;
    }
};
/**
 * Set the point the song should be at.
 * @param {Number} time
 */
MusicPlayer.prototype.seek = function(time) {
    this.time = time*1000;
};
/**
 * Select a song.
 * On failure, this.songIndex is -1.
 * On success, this.songIndex selects the song.
 * @param {Number|String} selector title of song or index
 */
MusicPlayer.prototype.select = function(selector) {
    if (typeof selector === "number") {
        if (selector === -1) {
            this.songIndex = -1;
        } else {
            // use index
            this.songIndex = (Math.floor(selector)%this.data.length+this.data.length)%this.data.length;
        }
    } else if (typeof selector === "string") {
        this.songIndex = -1;
        for (var i=0;i<this.data.length;i++) {
            if (this.data[i].title === selector) {
                this.songIndex = i;
                break;
            }
        }
    }
    this.time = 0;
};
/**
 * Naively shuffles all the songs
 * Use only if you want a real random shuffle.
 */
MusicPlayer.prototype.naiveShuffle = function() {
    for (var i = this.data.length;i>=1;i--) {
        var index = Math.floor(Math.random() * i);
        var temp = this.data[index];
        this.data[index] = this.data[i-1];
        this.data[i-1] = temp;
    }
};
/**
 * Sorts the songs based off a function
 * @param {sortFunc} a function to sort by.
 */
MusicPlayer.prototype.sort = function(sortFunc) {
    this.data.sort(sortFunc);
};
/**
 * Smartly shuffles all the songs
 * Used when you hate naive shuffles.
 * Not implemented yet.
 */
MusicPlayer.prototype.smartShuffle = function() {
    throw {
        message: "MusicPlayer.prototype.smartShuffle not implemented yet",
        toString: function() {
            return this.message;
        }
    };
};
/**
 * Get the titles of all the songs.
 * Helps with selecting the song.
 * @param {Function} sortFunc a function to sort the titles by
 * @return {String[]} array of titles
 */
MusicPlayer.prototype.getTitles = function(sortFunc) {
    if (!this.titles) {
        this.titles = [];
        for (var i=0;i<this.data.length;i++) {
            this.titles.push(this.data[i].title);
        }
    }
    if (sortFunc) {
        this.titles.sort(sortFunc);
    }
    return this.titles; // array of titles
};
/**
 * Get the data of the current song.
 * @return {Object} data
 */
MusicPlayer.prototype.getCurrentSongData = function() {
    if (this.songIndex === -1) {
        return {
            title: "",
            composer: "",
            arranger: "",
            transcriber: "",
            duration: 0, // seconds
            bpm: {
                min: 0,
                max: 0
            },
            year: 0
        };
    }
    return {
        title: this.data[this.songIndex].title,
        composer: this.data[this.songIndex].composer,
        arranger: this.data[this.songIndex].arranger,
        transcriber: this.data[this.songIndex].transcriber,
        duration: this.data[this.songIndex].length/1000, // seconds
        bpm: {
            min: this.data[this.songIndex].minBPM,
            max: this.data[this.songIndex].maxBPM
        },
        year: 0
    };
};
/**
 * Get the current time of the song. Used to calibrate PlayableMusic.
 * @return {Object} data
 */
MusicPlayer.prototype.getTime = function() {
    // Much oblivious
    return this.time + (new Date().getTime() - this.startTime)*this.speed;
};
/**
 * Get the data of the current playing song.
 * @return {Object} data
 */
MusicPlayer.prototype.getCurrentPlayingData = function() {
    if (this.songIndex === -1) {
        return {
            time: 0,
        };
    }
    if (this.playing) {
        return {
            time: (this.time + (new Date().getTime() - this.startTime)*this.speed)/1000
        };
    } else {
        return {
            time: this.time/1000
        };
    }
};
/**
 * Does this even make sense?
 * @return {String} ""
 */
MusicPlayer.prototype.toString = function() {
    return "";
};
var module = {
    Priority_Queue: Priority_Queue,
    AudioContextManager: AudioContextManager,
    PlayableNote: PlayableNote,
    PlayableMusic: PlayableMusic,
    MusicPlayer: MusicPlayer
};
/**
 * @hidden
 * Used to export modules for this:
 * https://www.khanacademy.org/computer-programming/bens-module-system/4728010161913856?qa_expand_key=ag5zfmtoYW4tYWNhZGVteXJpCxIIVXNlckRhdGEiRnVzZXJfaWRfa2V5X2h0dHA6Ly9pZC5raGFuYWNhZGVteS5vcmcvMzY5YWZiZDA0YTc5NGQ0OGJiODQyNDVlM2IyNmI5NDAMCxIIRmVlZGJhY2sYgICAwP-tngoM
 */
var export_module;
if (export_module) {
    export_module(module);
}
