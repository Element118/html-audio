// tried to unroll the loop so that this would work
for (var i=0;i<100000;i+=8) {
    clearInterval(i);
    clearTimeout(i);
    cancelAnimationFrame(i);
    clearInterval(i+1);
    clearTimeout(i+1);
    cancelAnimationFrame(i+1);
    clearInterval(i+2);
    clearTimeout(i+2);
    cancelAnimationFrame(i+2);
    clearInterval(i+3);
    clearTimeout(i+3);
    cancelAnimationFrame(i+3);
    clearInterval(i+4);
    clearTimeout(i+4);
    cancelAnimationFrame(i+4);
    clearInterval(i+5);
    clearTimeout(i+5);
    cancelAnimationFrame(i+5);
    clearInterval(i+6);
    clearTimeout(i+6);
    cancelAnimationFrame(i+6);
    clearInterval(i+7);
    clearTimeout(i+7);
    cancelAnimationFrame(i+7);
}
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
Array.prototype.shuffle = function() {
    var r, temp, i = this.length;
    for (i=this.length;i>0;i--) {
        r = Math.floor(Math.random()*i);
        temp = this[i-1];
        this[i-1] = this[r];
        this[r] = temp;
    }
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

if (!(window.AudioContext || window.webkitAudioContext)) {
    console.log("This will not work with the browser you are currently using due to this browser not supporting the Web Audio API. Please use Chrome, Firefox, Safari or Edge.");
}
var notesArr = {};
for (var i=0;i<100;i++) {
    notesArr[i] = 27.5*Math.pow(2, i/12);
}

/**
 * Construct a note to play as part of a song.
 * Wraps around OscillatorNode.
 */
var PlayableNote = function(config) {
    this.startTime = config.startTime;
    this.frequency = config.frequency;
    this.type = config.type;
    this.wave = this.type === "custom"?config.wave:undefined; // function
    if (PlayableNote.instruments[this.type]) {
        this.wave = PlayableNote.instruments[this.type];
    }
    this.length = config.length; // in milliseconds
    this.volume = config.volume;
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
        if (obj[i].hasOwnProperty(i)) {
            obj[i] = audioContext.createPeriodicWave(obj[i].real, obj[i].imag);
        }
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
    },
    violin: {
        real: Float32Array.from([0.62144,0.57895,0.47158,0.31905,0.15253,0.00626,-0.09205,-0.12895,-0.10804,-0.04609,0.03530,0.11310,0.17038,0.19649,0.18810,0.14547,0.07607,-0.00906,-0.09445,-0.16319,-0.19995,-0.19556,-0.15453,-0.09045,-0.02598,0.01678,0.02718,0.00626,-0.03330,-0.07433,-0.10577,-0.12589,-0.14001,-0.15453,-0.16918,-0.17904,-0.17464,-0.15293,-0.11923,-0.08726,-0.07234,-0.08392,-0.11763,-0.15746,-0.18450,-0.18450,-0.15826,-0.11869,-0.08579,-0.07247,-0.07780,-0.08646,-0.07913,-0.04476,0.01172,0.07114,0.11163,0.12176,0.10484,0.07753,0.05502,0.04223,0.03237,0.01199,-0.02638,-0.07513,-0.11563,-0.12416,-0.08619,-0.00440,0.10297,0.21168,0.30080,0.35835,0.38685,0.39125,0.37473,0.33916,0.28348,0.21128,0.13455,0.07074,0.03690,0.04050,0.07806,0.13495,0.19223,0.23126,0.24085,0.21727,0.16798,0.10684,0.05102,0.02051,0.02851,0.07993,0.16958,0.28375,0.40018,0.49582]),
        imag: Float32Array.from([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
    },
    piano: {
        real: Float32Array.from([-0.28068,-0.28789,-0.28867,-0.28380,-0.27464,-0.26179,-0.24737,-0.23335,-0.22010,-0.20900,-0.19946,-0.19206,-0.18465,-0.17725,-0.16849,-0.15894,-0.14628,-0.13167,-0.11590,-0.09992,-0.08415,-0.06973,-0.05843,-0.05006,-0.04480,-0.04305,-0.04441,-0.04753,-0.05064,-0.05337,-0.05571,-0.05590,-0.05493,-0.05142,-0.04616,-0.03993,-0.03292,-0.02805,-0.02649,-0.02980,-0.03779,-0.05045,-0.06642,-0.08415,-0.10207,-0.11804,-0.13050,-0.13732,-0.13849,-0.13362,-0.12427,-0.11297,-0.09992,-0.08785,-0.07713,-0.06876,-0.06350,-0.06116,-0.06019,-0.05960,-0.05727,-0.05123,-0.04071,-0.02571,-0.00779,0.01091,0.02727,0.04051,0.04928,0.05220,0.05103,0.04733,0.04285,0.03837,0.03701,0.04013,0.04811,0.06233,0.08142,0.10382,0.12563,0.14511,0.15953,0.16849,0.17258,0.17141,0.16732,0.16070,0.15232,0.14453,0.13888,0.13401,0.13167,0.13031,0.12836,0.12525,0.11979,0.11142,0.10031,0.08726,0.07168,0.05532,0.03915,0.02513,0.01363,0.00370,-0.00331,-0.01013,-0.01675,-0.02357,-0.03097,-0.03857,-0.04538,-0.05240,-0.06058,-0.06934,-0.07791,-0.08726,-0.09583,-0.10246,-0.10577,-0.10518,-0.10129,-0.09311,-0.08142,-0.06623,-0.04733,-0.02513,-0.00058,0.02454,0.04928,0.07129,0.08882,0.10323,0.11297,0.12057,0.12758,0.13343,0.14024,0.14842,0.15544,0.16206,0.16790,0.17141,0.17199,0.16868,0.16147,0.15018,0.13440,0.11706,0.09759,0.07830,0.06058,0.04441,0.03058,0.01850,0.00760,-0.00584,-0.02240,-0.04383,-0.06973,-0.09953,-0.13109,-0.16342,-0.19634,-0.22751,-0.25575,-0.27971,-0.29704]),
        imag: Float32Array.from([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
    }
});
/**
 * Begins the note. Automatically stops it at the intended time.
 * Uses AudioContext.
 * @param {AudioContext} audioContext
 * @param {Object} destination Where to send the nodes to
 */
PlayableNote.prototype.start = function(audioContext, destination) {
    // just trying not to repeat myself
    return this.startAt(this.startTime);
};
/**
 * Begins the note, assuming the current song time.
 * Automatically stops it at the intended time.
 * Uses AudioContext.
 * @param {AudioContext} audioContext
 * @param {Object} destination Where to send the nodes to
 * @param {Number} time Time to start the note at
 * @param {Number} speed Speed to play the note at
 */
PlayableNote.prototype.startAt = function(audioContext, destination, time, speed) {
    speed = speed || 1; // set speed to 1 if missing
    this.oscillator = audioContext.createOscillator();
    var gainNode = audioContext.createGain();
    gainNode.gain.value = this.volume;
    this.oscillator.connect(gainNode);
    gainNode.connect(destination || audioContext.destination);
    if (this.wave) {
        this.oscillator.setPeriodicWave(this.wave);
    } else {
        this.oscillator.type = this.type;
    }
    this.oscillator.frequency.value = this.frequency;
    this.oscillator.start(0);
    this.oscillator.stop(audioContext.currentTime+Math.max((this.length+this.startTime-time)/1000/speed, 0));
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
    this.arranger = data.arranger || this.composer;
    this.transcriber = data.transcriber || "";
    this.length = 0;
    var mapping = data.noteMapping; // hashtable
    var volumeChar = (data.volume && data.volume.characters) || {};
    var volumeMap = (data.volume && data.volume.mapping) || {};
    var EPSILON = 0.5; // honestly, anything less than a 0.5 millisecond difference doesn't matter much. We can't even show the difference for <1 ms.
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
                if (sustainedArray[i].startTime+sustainedArray[i].length>lastSustained) {
                    susNotes.push(sustainedArray[i]);
                    // add to the next batch
                    replaceSus.push(sustainedArray[i]);
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
                            // update length of song
                            this.length = Math.max(this.length, x.millis+newNote.length);
                            //pq.push({ millis: x.millis+newNote.length });
                            noteBuffer.noteNumber = NaN; // ensure nothing gets played
                        }
                    }
                    curNumber = 0;
                }
                if (currentChar === ",") {
                    // advance time
                    x.millis = noteBuffer.length + noteBuffer.startTime;
                    // advance character
                    x.stringPointer++;
                    break;
                } else if (currentChar === ")") {
                    x.parseState = "bpm entry";
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
};
/**
 * Asynchronously constructs music from data.
 * @param {Object[]} musicData an array of song data
 * @param {Number} timeDelay how much time to wait between constructions
 * @return promise
 */
PlayableMusic.async_construction = function(musicData, timeDelay) {
    timeDelay = timeDelay || 200;
    var p = new Promise(function(resolve, reject) {
        var index = 0;
        var constructionInterval = setInterval(function() {
            if (index < musicData.length) {
                musicData[index] = new PlayableMusic(musicData[index]);
                index++;
            }
            if (index >= musicData.length) {
                clearInterval(constructionInterval);
                resolve(musicData);
            }
        }, timeDelay);
    });
    return p;
};
/**
 * Get the last frame of music before the time.
 * @param {Number} time in milliseconds
 * @return the last frame of music
 */
PlayableMusic.prototype.getFrame = function(time) {
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
    return low;
};
/**
 * With the help of a manager, play the music at a certain time.
 * @param {MusicPlayer} manager
 */
PlayableMusic.prototype.play = function(manager) {
    var time = manager.getTime();
    var frame = this.getFrame(time);
    manager.playingFrame = frame;
    // start notes
    if (frame<this.timeFrames.length) {
        for (var i=0;i<this.timeFrames[frame].onNotes.length;i++) {
            this.timeFrames[frame].onNotes[i].startAt(manager.audioContext, manager.volumeNode, time, manager.speed);
        }
        for (var i=0;i<this.timeFrames[frame].sustainNotes.length;i++) {
            this.timeFrames[frame].sustainNotes[i].startAt(manager.audioContext, manager.volumeNode, time, manager.speed);
        }
        if (frame+1<this.timeFrames.length) {
            manager.currentTimeout = setTimeout(function() {
                manager.playingFrame++;
                this.playFrame(manager);
            }.bind(this), Math.max((this.timeFrames[frame+1].millis-time)/manager.speed, 0));
        } else {
            manager.currentTimeout = setTimeout(function() {
                manager.endSong(); // music tells manager to stop
            }.bind(this), Math.max((this.length-time)/manager.speed, 0));
        }
    } else {
        manager.currentTimeout = setTimeout(function() {
            manager.endSong(); // music tells manager to stop
        }.bind(this), Math.max((this.length-time)/manager.speed, 0));
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
        this.timeFrames[frame].onNotes[i].startAt(manager.audioContext, manager.volumeNode, time, manager.speed);
    }
    if (frame+1<this.timeFrames.length) {
        manager.currentTimeout = setTimeout(function() {
            manager.playingFrame++;
            this.playFrame(manager);
        }.bind(this), Math.max((this.timeFrames[frame+1].millis-time)/manager.speed, 0));
    } else {
        manager.currentTimeout = setTimeout(function() {
            manager.endSong(); // music tells manager to stop
        }.bind(this), Math.max((this.length-time)/manager.speed, 0));
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
 * Add a song to the current songs.
 * @param {PlayableMusic} songData
 */
MusicPlayer.prototype.addSong = function(songData) {
    this.data.push(songData);
};
/**
 * Add an array of songs to the current songs.
 * @param {PlayableMusic} songData
 */
MusicPlayer.prototype.addSongs = function(songData) {
    this.data = this.data.concat(songData);
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
MusicPlayer.version = "2.0.3"; // storing version number for version control

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
 * Set the speed of the music. 1 means original speed.
 * @param {Number} speed What to set it to.
 */
MusicPlayer.prototype.setSpeed = function(speed) {
    if (this.playing && this.audioContext) {
        this.pause();
        this.speed = (+speed);
        this.play();
    } else {
        this.speed = (+speed);
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
            this.time = 0;
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
    for (var i = this.data.length;i>0;i--) {
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
    var wasPlaying = this.playing;
    if (this.playing) {
        this.pause();
    }
    // group the songs by arranger
    var map = new Map();
    var arr = []; // temporary array
    for (var i=0;i<this.data.length;i++) {
        if (!map.has(this.data[i].arranger)) {
            map.set(this.data[i].arranger, []);
        }
        map.get(this.data[i].arranger).push(this.data[i]);
    }
    // for each song, give a random value
    map.forEach(function(value) {
        value.shuffle();
        for (var i=0;i<value.length;i++) {
            arr.push({song: value[i], rand: (i+Math.random())/value.length});
        }
    });
    // sort
    arr.sort(function(a, b) { return a.rand-b.rand; });
    this.data = [];
    for (var i=0;i<arr.length;i++) {
        this.data[i] = arr[i].song;
    }
    this.select(0); // reset selection
    this.time = 0; // reset time
    if (wasPlaying) {
        this.play();
    }
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
            title: "[No song selected]",
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
        duration: Math.round(this.data[this.songIndex].length)/1000, // seconds
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
    return Math.round(this.time + (new Date().getTime() - this.startTime)*this.speed);
};
/**
 * @deprecated in 3.0.0, use getTimeData instead.
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
            time: Math.round(this.time + (new Date().getTime() - this.startTime)*this.speed)/1000
        };
    } else {
        return {
            time: Math.round(this.time)/1000
        };
    }
};
/**
 * Get the time-related data of the current playing song.
 * @return {Object} data
 */
MusicPlayer.prototype.getTimeData = function() {
    if (this.songIndex === -1) {
        return {
            currentTime: 0,
            duration: 0,
        };
    }
    if (this.playing) {
        return {
            currentTime: Math.round(this.time + (new Date().getTime() - this.startTime)*this.speed)/1000,
            duration: Math.round(this.data[this.songIndex].length)/1000,
        };
    } else {
        return {
            currentTime: Math.round(this.time)/1000,
            duration: Math.round(this.data[this.songIndex].length)/1000,
        };
    }
};
/**
 * Returns some data, hopefully.
 * @return {String} "[Object MusicPlayer]"
 */
MusicPlayer.prototype.toString = function() {
    return "[Object MusicPlayer]";
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
