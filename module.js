//jshint esversion: 6
var HTMLAudio = (function() {
    if (!(window.AudioContext || window.webkitAudioContext)) {
        console.error("This will not work with the browser you are currently using due to this browser not supporting the Web Audio API. Please use Chrome, Firefox, Safari or Edge.");
    }
    /**
     * Constructs an priority queue.
     * @param {Function} lessThan function to compare elements. If undefined, compares using <.
     * @param {Object[]} createFrom array to create priority queue from, in O(length) time, if undefined, creates empty queue.
     */
    let PriorityQueue = function(lessThan, createFrom) {
        if (!(this instanceof PriorityQueue)) { 
            return new PriorityQueue(lessThan, createFrom);
        }
        this.data = [0];
        this.lessThan = lessThan || function(a, b) {
            return a < b;
        };
        if (createFrom) {
            for (let i=0;i<createFrom.length;i++) {
                this.data.push(createFrom[i]);
            }
            for (let i=(createFrom.length+1)<<1;i;i--) {
                this.fixHeap(i);
            }
        }
    };
    PriorityQueue.prototype.fixHeapHere = function(where) {
        let l = where<<1;
        if (l < this.data.length) {
            if (l+1 < this.data.length && this.lessThan(this.data[l], this.data[l+1])) {
                l++;
            }
            if (this.lessThan(this.data[where], this.data[l])) {
                let temp = this.data[where];
                this.data[where] = this.data[l];
                this.data[l] = temp;
                return l;
            }
        }
        return 0;
    };
    PriorityQueue.prototype.fixHeap = function(where) {
        let l = where<<1;
        if (l < this.data.length) {
            if (l+1 < this.data.length && this.lessThan(this.data[l], this.data[l+1])) {
                l++;
            }
            if (this.lessThan(this.data[where], this.data[l])) {
                let temp = this.data[where];
                this.data[where] = this.data[l];
                this.data[l] = temp;
                this.fixHeap(l);
                return l;
            }
        }
        return 0;
    };
    PriorityQueue.prototype.remove = function(where) {
        if (where + 1 === this.data.length) {
            this.data.pop();
            return;
        }
        this.data[where] = this.data.pop();
        while (where && this.fixHeapHere(where)) {
            where = where >> 1;
        }
    };
    /**
     * Returns the highest-priority element.
     */
    PriorityQueue.prototype.top = function() {
        return this.data[1];
    };
    /**
     * Removes the highest-priority element.
     */
    PriorityQueue.prototype.pop = function() {
        this.remove(1);
    };
    /**
     * Pushes the element into the priority queue.
     * @param {Object} what an element to push
     */
    PriorityQueue.prototype.push = function(what) {
        let position = this.data.length >> 1;
        this.data.push(what);
        while (position && this.fixHeapHere(position)) {
            position = position >> 1;
        }
    };
    /**
     * Returns if the priority queue is empty
     * @return {Boolean} true if the queue is empty, false otherwise
     */
    PriorityQueue.prototype.empty = function() {
        return this.data.length === 1;
    };
    /**
     * Returns the size of the priority queue
     * @return {Number} number of elements in the queue
     */
    PriorityQueue.prototype.size = function() {
        return this.data.length - 1;
    };
    /**
     * Fixes the heap formed from a 0-indexed array, meant to use iteratively.
     * How to use:
    let fixPoint = INIT_VALUE;                                                                                                                                                <br>
    while (fixPoint = fixHeapHere(arr, size, fixPoint, lessThan)) {}                                                                                                          <br>
    OR                                                                                                                                                                        <br>
    while (fixPoint >=0 && fixHeapHere(arr, size, fixPoint, lessThan)) {fixPoint = Math.floor((fixPoint-1)/2);}                                                                    <br>
     */
    PriorityQueue.fixHeapHere = function(arr, size, where, lessThan) {
        let l = (where<<1)+1;
        if (l < size) {
            if (l+1 < size && lessThan(arr[l], arr[l+1])) {
                l++;
            }
            if (lessThan(arr[where], arr[l])) {
                let temp = arr[where];
                arr[where] = arr[l];
                arr[l] = temp;
                return l;
            }
        }
        return null;
    };
    /**
     * Automatically fixes the heap recursively while there are swaps
     */
    PriorityQueue.fixHeap = function(arr, size, where, lessThan) {
        let l = (where<<1)+1;
        if (l < size) {
            if (l+1 < size && lessThan(arr[l], arr[l+1])) {
                l++;
            }
            if (lessThan(arr[where], arr[l])) {
                let temp = arr[where];
                arr[where] = arr[l];
                arr[l] = temp;
                PriorityQueue.fixHeap(arr, size, l, lessThan);
            }
        }
    };
    /**
     * Heapsorts an array.
     * @param {Object[]} arr array of elements
     * @param {Function} lessThan function to compare elements
     */
    PriorityQueue.heapsort = function(arr, lessThan) {
        lessThan = lessThan || function(a, b) {
            return a<b;
        };
        let l = arr.length;
        for (let i=(l+1)<<1;i>=0;i--) {
            PriorityQueue.fixHeapHere(arr, l, i, lessThan);
        }
        for (let i=l-1;i>=0;i--) {
            let temp = arr[i];
            arr[i] = arr[0];
            arr[0] = temp;
            PriorityQueue.fixHeap(arr, i, 0, lessThan);
        }
    };
    let shuffleArray = function(array) {
        let r, temp, i = array.length;
        for (i=array.length;i>1;i--) {
            r = Math.floor(Math.random()*i);
            temp = array[i-1];
            array[i-1] = array[r];
            array[r] = temp;
        }
    };
    /**
     * AudioContext manager
     * Lazy, keeps old instances.
     */
    let AudioContextManager = {
        AudioContext: (window.AudioContext || window.webkitAudioContext),
        getAudioContext: function() {
            if (!this.AudioContext.audioContextInstance) {
                this.AudioContext.audioContextInstance = new this.AudioContext();
            }
            return this.AudioContext.audioContextInstance;
        }
    };
    let Tuning = function(frequencies) {
        this.frequencies = frequencies;
    };
    Tuning.prototype.getTranslatorTo = function(that) {
        let lookupTable = [];
        let index = 0;
        for (let i=0;i<this.frequencies.length;i++) {
            while (index+1<that.frequencies.length && Math.abs(that.frequencies[index]-this.frequencies[i])>that.frequencies[index+1]-this.frequencies[i]) { index++; }
            lookupTable.push(index);
        }
        return lookupTable;
    };
    Tuning.equalTemperament = {};
    // Make sure all MIDI notes are supported
    for (let i=-9;i<=118;i++) {
        Tuning.equalTemperament[i] = 27.5*Math.pow(2, i/12);
    }
    Tuning.getEqualTemperamentTuning = function(config) {
        let baseFrequency = config.baseFrequency || 440;
        let divisions = config.divisions || 12;
        let baseFrequencyNoteNumber = config.baseFrequencyNoteNumber || 10;
        let baseRatio = config.baseRatio || 2;
        // build a tuning...
        // return
    };
    /**
     * Store instrument data and process it.
     */
    let Instruments = (function() {
        /**
         * Modifies an object storing waveforms
         * and make them into waves which can be
         * played later.
         * @param {Object} A hashtable of instruments.
         */
        let createInstruments = function(obj) {
            let audioContext = AudioContextManager.getAudioContext();
            for (let i in obj) {
                if (!obj[i].hasOwnProperty(i)) {
                    obj[i] = {
                        wave: audioContext.createPeriodicWave(obj[i].real, obj[i].imag),
                        ADSR: obj[i].ADSR
                    };
                }
            }
            return obj;
        };
        /**
         * An array of default instruments.
         */
        let instruments = createInstruments({
            sample1: {
                real: Float32Array.from([0, 1, 1.5, 0]),
                imag: Float32Array.from([0, 0, 0, 0]),
                ADSR: {
                    attack: 100,
                    decay: 100,
                    sustain: 0.9,
                    release: 100
                }
            },
            violin: {
                real: Float32Array.from([0.62144,0.57895,0.47158,0.31905,0.15253,0.00626,-0.09205,-0.12895,-0.10804,-0.04609,0.03530,0.11310,0.17038,0.19649,0.18810,0.14547,0.07607,-0.00906,-0.09445,-0.16319,-0.19995,-0.19556,-0.15453,-0.09045,-0.02598,0.01678,0.02718,0.00626,-0.03330,-0.07433,-0.10577,-0.12589,-0.14001,-0.15453,-0.16918,-0.17904,-0.17464,-0.15293,-0.11923,-0.08726,-0.07234,-0.08392,-0.11763,-0.15746,-0.18450,-0.18450,-0.15826,-0.11869,-0.08579,-0.07247,-0.07780,-0.08646,-0.07913,-0.04476,0.01172,0.07114,0.11163,0.12176,0.10484,0.07753,0.05502,0.04223,0.03237,0.01199,-0.02638,-0.07513,-0.11563,-0.12416,-0.08619,-0.00440,0.10297,0.21168,0.30080,0.35835,0.38685,0.39125,0.37473,0.33916,0.28348,0.21128,0.13455,0.07074,0.03690,0.04050,0.07806,0.13495,0.19223,0.23126,0.24085,0.21727,0.16798,0.10684,0.05102,0.02051,0.02851,0.07993,0.16958,0.28375,0.40018,0.49582]),
                imag: Float32Array.from([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
                ADSR: {
                    attack: 100,
                    decay: 100,
                    sustain: 0.9,
                    release: 100
                }
            },
            piano: {
                real: Float32Array.from([-0.28068,-0.28789,-0.28867,-0.28380,-0.27464,-0.26179,-0.24737,-0.23335,-0.22010,-0.20900,-0.19946,-0.19206,-0.18465,-0.17725,-0.16849,-0.15894,-0.14628,-0.13167,-0.11590,-0.09992,-0.08415,-0.06973,-0.05843,-0.05006,-0.04480,-0.04305,-0.04441,-0.04753,-0.05064,-0.05337,-0.05571,-0.05590,-0.05493,-0.05142,-0.04616,-0.03993,-0.03292,-0.02805,-0.02649,-0.02980,-0.03779,-0.05045,-0.06642,-0.08415,-0.10207,-0.11804,-0.13050,-0.13732,-0.13849,-0.13362,-0.12427,-0.11297,-0.09992,-0.08785,-0.07713,-0.06876,-0.06350,-0.06116,-0.06019,-0.05960,-0.05727,-0.05123,-0.04071,-0.02571,-0.00779,0.01091,0.02727,0.04051,0.04928,0.05220,0.05103,0.04733,0.04285,0.03837,0.03701,0.04013,0.04811,0.06233,0.08142,0.10382,0.12563,0.14511,0.15953,0.16849,0.17258,0.17141,0.16732,0.16070,0.15232,0.14453,0.13888,0.13401,0.13167,0.13031,0.12836,0.12525,0.11979,0.11142,0.10031,0.08726,0.07168,0.05532,0.03915,0.02513,0.01363,0.00370,-0.00331,-0.01013,-0.01675,-0.02357,-0.03097,-0.03857,-0.04538,-0.05240,-0.06058,-0.06934,-0.07791,-0.08726,-0.09583,-0.10246,-0.10577,-0.10518,-0.10129,-0.09311,-0.08142,-0.06623,-0.04733,-0.02513,-0.00058,0.02454,0.04928,0.07129,0.08882,0.10323,0.11297,0.12057,0.12758,0.13343,0.14024,0.14842,0.15544,0.16206,0.16790,0.17141,0.17199,0.16868,0.16147,0.15018,0.13440,0.11706,0.09759,0.07830,0.06058,0.04441,0.03058,0.01850,0.00760,-0.00584,-0.02240,-0.04383,-0.06973,-0.09953,-0.13109,-0.16342,-0.19634,-0.22751,-0.25575,-0.27971,-0.29704]),
                imag: Float32Array.from([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
                ADSR: {
                    attack: 100,
                    decay: 100,
                    sustain: 0.9,
                    release: 100
                }
            }
        });
        /**
         * An object to store all the instruments
         * which cannot be found.
         */
        let missingInstruments = {};
        /**
         * Get instrument by name
         * If missing, returns null
         */
        let getInstrument = function(name) {
            if (instruments[name]) {
                return instruments[name];
            }
            if (!missingInstruments[name]) {
                missingInstruments[name] = true;
                console.warn("No waveform for instrument \""+this.wave+"\".");
            }
            return null;
        };
        return {
            getInstrument: getInstrument
        };
    })();
    
    /**
     * Construct a note to play as part of a song.
     * Has no ASDR for better performance.
     * Wraps around OscillatorNode
     * @param {Object} config
     */
    let PlayableTone = function(config) {
        this.startTime = config.startTime;
        this.frequency = config.frequency;
        this.type = config.type;
        this.wave = this.type === "custom"?config.wave:undefined; // function
        if (!this.wave) {
            switch (this.type) {
                // known types, fallthrough
                case "sine":
                case "triangle":
                case "sawtooth":
                case "square": break;
                // cannot recognise wave
                default:
                    var instrument = Instruments.getInstrument(this.type);
                    if (instrument) {
                        this.wave = instrument.wave;
                    }
                    this.type = "sine";
            }
        }
        this.length = config.length; // in milliseconds
        this.volume = config.volume;
        if (typeof this.volume !== "number") {
            this.volume = 1;
        }
        this.node = null;
    };
    /**
     * Lightweight test:
     * new PlayableTone({type: "violin", frequency: 440, length: 1000, startTime: 0}).start(...)
     * Begins the note. Automatically stops it at the intended time.
     * Uses AudioContext.
     * @param {AudioContext} audioContext
     * @param {Object} destination Where to send the nodes to
     * @param {Number} speed Speed to play the note at
     */
    PlayableTone.prototype.start = function(audioContext, destination, speed) {
        return this.startAt(audioContext, destination, this.startTime, speed);
    };
    /**
     * Begins the note, assuming the current song time.
     * Automatically stops it at the intended time.
     * Uses AudioContext.
     * @param {AudioContext} audioContext
     * @param {Object} destination Where to send the nodes to
     * @param {Number} time Time to start the note at
     * @param {Number} speed Speed to play the note at
     * @return OscillatorNode
     */
    PlayableTone.prototype.startAt = function(audioContext, destination, time, speed) {
        speed = speed || 1; // set speed to 1 if missing
        this.node = audioContext.createGain();
        let offset = time-this.startTime;
        let noteLength = this.length/speed;
        let oscillator = audioContext.createOscillator();
        oscillator.connect(this.node);
        this.node.gain.value = this.volume;
        this.node.connect(destination || audioContext.destination);
        if (this.wave) {
            oscillator.setPeriodicWave(this.wave);
        } else {
            oscillator.type = this.type;
        }
        oscillator.frequency.setValueAtTime(this.frequency, audioContext.currentTime);
        oscillator.start(0);
        oscillator.stop(audioContext.currentTime+Math.max((noteLength-offset)/1000, 0));
        return this.node;
    };
    /**
     * Stops the note when the function is called.
     */
    PlayableTone.prototype.stop = function() {
        if (this.node) {
            this.node.gain.value = 0;
            this.node = null;
        }
    };
    /**
     * @return {String} "[Object PlayableTone]"
     */
    PlayableTone.prototype.toString = function() {
        return "[Object PlayableTone]";
    };
    
    /**
     * Construct a note to play as part of a song.
     * Wraps around OscillatorNode
     * @param {Object} config
     */
    let PlayableNote = function(config) {
        this.ADSR = PlayableNote.DEFAULT_ADSR;
        this.startTime = config.startTime;
        this.frequency = config.frequency;
        this.type = config.type;
        this.wave = this.type === "custom"?config.wave:undefined; // function
    
        if (!this.wave) {
            switch (this.type) {
                // known types, fallthrough
                case "sine":
                case "triangle":
                case "sawtooth":
                case "square": break;
                // cannot recognise wave
                default:
                    var instrument = Instruments.getInstrument(this.type);
                    if (instrument) {
                        this.wave = instrument.wave;
                        this.ADSR = instrument.ADSR;
                    }
                    this.type = "sine";
            }
        }
        this.length = config.length; // in milliseconds
        this.volume = config.volume;
        if (typeof this.volume !== "number") {
            this.volume = 1;
        }
        this.node = null;
    };
    PlayableNote.DEFAULT_ADSR = {
    	attack: 5, // milliseconds
    	decay: 5,
    	sustain: 0.9, // ratio
    	release: 10
    };
    /**
     * Prevents "cracking" of audio due to
     * inaccuraccies in the browser event
     * queue. This is a tradeoff between
     * accuracy and "cracking".
     */
    PlayableNote.EPSILON = 4; // empirically determined
    PlayableNote.prototype = Object.create(PlayableTone.prototype);
    /**
     * Begins the note, assuming the current song time.
     * Automatically stops it at the intended time.
     * Uses AudioContext.
     * @param {AudioContext} audioContext
     * @param {Object} destination Where to send the nodes to
     * @param {Number} time Time to start the note at
     * @param {Number} speed Speed to play the note at
     * @return OscillatorNode
     */
    PlayableNote.prototype.startAt = function(audioContext, destination, time, speed) {
        speed = speed || 1; // set speed to 1 if missing
        let gainNode = audioContext.createGain();
        let gain = gainNode.gain;
        let offset = time-this.startTime;
        if (offset < PlayableNote.EPSILON) offset = 0;
        let initValue = true;
        let noteLength = this.length/speed;
        let atk = this.ADSR.attack;
        let dk = Math.min(this.ADSR.decay, noteLength-atk); 
        let sus = this.ADSR.sustain;
        let rel = this.ADSR.release;
        // @TODO refactor??
        if (noteLength < atk) {
            if (offset < noteLength) {
                gain.setValueAtTime(this.volume*offset/atk, audioContext.currentTime);
                gain.linearRampToValueAtTime(this.volume*noteLength/atk, audioContext.currentTime+(noteLength-offset)/1000);
                gain.linearRampToValueAtTime(0, audioContext.currentTime+(noteLength-offset+rel)/1000);
            } else if (offset < noteLength+rel) {
                gain.setValueAtTime(this.volume*noteLength/atk*(rel-(offset-noteLength))/rel, audioContext.currentTime);
                gain.linearRampToValueAtTime(0, audioContext.currentTime+(noteLength+rel-offset)/1000);
            } else initValue = false;
        } else if (dk < this.ADSR.decay) {
            if (offset < atk) {
                gain.setValueAtTime(this.volume*offset/atk, audioContext.currentTime);
                gain.linearRampToValueAtTime(this.volume, audioContext.currentTime+(atk-offset)/1000);
                gain.linearRampToValueAtTime(this.volume*(1-(noteLength-atk)/this.ADSR.decay*(1-sus)), audioContext.currentTime+(noteLength-offset)/1000);
                gain.linearRampToValueAtTime(0, audioContext.currentTime+(noteLength+rel-offset)/1000);
            } else if (offset < noteLength) {
                gain.setValueAtTime(this.volume*(1-(offset-atk)/this.ADSR.decay*(1-sus)), audioContext.currentTime);
                gain.linearRampToValueAtTime(this.volume*(1-(noteLength-atk)/this.ADSR.decay*(1-sus)), audioContext.currentTime+(noteLength-offset)/1000);
                gain.linearRampToValueAtTime(0, audioContext.currentTime+(noteLength+rel-offset)/1000);
            } else if (offset < noteLength+rel) {
                gain.setValueAtTime(this.volume*(1-dk/this.ADSR.decay*(1-sus))*(offset-noteLength)/rel, audioContext.currentTime);
                gain.linearRampToValueAtTime(0, audioContext.currentTime+(noteLength+rel-offset)/1000);
            } else initValue = false;
        } else { // noteLength >= atk+dk
            if (offset < atk) {
                gain.setValueAtTime(this.volume*offset/atk, audioContext.currentTime);
                gain.linearRampToValueAtTime(this.volume, audioContext.currentTime+(atk-offset)/1000);
                gain.linearRampToValueAtTime(this.volume*sus, audioContext.currentTime+(atk+dk-offset)/1000);
                gain.linearRampToValueAtTime(this.volume*sus, audioContext.currentTime+(noteLength-offset)/1000);
                gain.linearRampToValueAtTime(0, audioContext.currentTime+(noteLength+rel-offset)/1000);
            } else if (offset < atk+dk) {
                gain.setValueAtTime(this.volume*(1-(offset-atk)/dk*(1-sus)), audioContext.currentTime);
                gain.linearRampToValueAtTime(this.volume*sus, audioContext.currentTime+(atk+dk-offset)/1000);
                gain.linearRampToValueAtTime(this.volume*sus, audioContext.currentTime+(noteLength-offset)/1000);
                gain.linearRampToValueAtTime(0, audioContext.currentTime+(noteLength+rel-offset)/1000);
            } else if (offset < noteLength) {
                gain.setValueAtTime(this.volume*sus, audioContext.currentTime);
                gain.linearRampToValueAtTime(this.volume*sus, audioContext.currentTime+(noteLength-offset)/1000);
                gain.linearRampToValueAtTime(0, audioContext.currentTime+(noteLength+rel-offset)/1000);
            } else if (offset<noteLength+rel) {
                gain.setValueAtTime(this.volume*sus*(offset-noteLength)/rel, audioContext.currentTime);
                gain.linearRampToValueAtTime(0, audioContext.currentTime+(noteLength+rel-offset)/1000);
            } else initValue = false;
        }
        if (!initValue) return null;
        let oscillator = audioContext.createOscillator();
        oscillator.connect(gainNode);
        this.node = audioContext.createGain();
        this.node.gain.value = 1;
        gainNode.connect(this.node);
        this.node.connect(destination || audioContext.destination);
        if (this.wave) {
            oscillator.setPeriodicWave(this.wave);
        } else {
            oscillator.type = this.type;
        }
        oscillator.frequency.setValueAtTime(this.frequency, audioContext.currentTime);
        oscillator.start(0);
        oscillator.stop(audioContext.currentTime+Math.max(this.ADSR.release+PlayableNote.EPSILON+(noteLength-offset)/1000, 0));
        return this.node;
    };
    /**
     * @return {String} "[Object PlayableNote]"
     */
    PlayableNote.prototype.toString = function() {
        return "[Object PlayableNote]";
    };
    
    /**
     * ShepardTone
     * A tone which allows you to "play rising frequencies" but still remain audible.
     * @param {Object} config
     */
    let ShepardTone = function(config) {
        this.startTime = config.startTime;
        this.frequency = config.frequency;
        this.type = config.type;
        this.mu = config.mu || ShepardTone.DEFAULT_SETTINGS.mu;
        this.sigma = config.sigma || ShepardTone.DEFAULT_SETTINGS.sigma;
        this.quality = config.quality || ShepardTone.DEFAULT_SETTINGS.quality;
        this.period = 1 || ShepardTone.DEFAULT_SETTINGS.period;
        this.wave = this.type === "custom"?config.wave:undefined;
        if (!this.wave) {
            switch (this.type) {
                // known types, fallthrough
                case "sine":
                case "triangle":
                case "sawtooth":
                case "square": break;
                // cannot recognise wave
                default:
                    var instrument = Instruments.getInstrument(this.type);
                    if (instrument) {
                        this.wave = instrument.wave;
                    }
                    this.type = "sine";
            }
        }
        this.length = config.length; // in milliseconds
        this.volume = config.volume;
        if (typeof this.volume !== "number") {
            this.volume = 1;
        }
        this.node = null;
    };
    ShepardTone.DEFAULT_SETTINGS = {
        mu: Math.log2(440),
        sigma: 1,
        quality: 20,
        period: 1 // octaves
    };
    ShepardTone.prototype = Object.create(PlayableTone.prototype);
    /**
     * Lightweight test:
     * new PlayableTone({type: "violin", frequency: 440, length: 1000, startTime: 0}).start(...)
     * Begins the note. Automatically stops it at the intended time.
     * Uses AudioContext.
     * @param {AudioContext} audioContext
     * @param {Object} destination Where to send the nodes to
     * @param {Number} speed Speed to play the note at
     */
    ShepardTone.prototype.start = function(audioContext, destination, speed) {
        return this.startAt(audioContext, destination, this.startTime, speed);
    };
    /**
     * Begins the note, assuming the current song time.
     * Automatically stops it at the intended time.
     * Uses AudioContext.
     * @param {AudioContext} audioContext
     * @param {Object} destination Where to send the nodes to
     * @param {Number} time Time to start the note at
     * @param {Number} speed Speed to play the note at
     * @return OscillatorNode
     */
    ShepardTone.prototype.startAt = function(audioContext, destination, time, speed) {
        speed = speed || 1; // set speed to 1 if missing
        this.node = audioContext.createGain();
        let offset = time-this.startTime;
        let noteLength = this.length/speed;
        let baseFreq = this.frequency * Math.pow(2, Math.round(this.mu-Math.log2(this.frequency)));
        for (let i=0;i<this.quality;i++) {
            let freq = baseFreq * Math.pow(2, (i%2?-(i-1)/2*this.period:i/2*this.period));
            if (freq > 24000) continue;
            let oscillator = audioContext.createOscillator();
            let gain = audioContext.createGain();
            let zValue = (Math.log2(baseFreq)-this.mu+(i%2?-(i-1)/2:i/2))/this.sigma;
            gain.gain.value = Math.exp(-zValue*zValue/2)/this.sigma/Math.sqrt(2*Math.PI);
            oscillator.connect(gain);
            if (this.wave) {
                oscillator.setPeriodicWave(this.wave);
            } else {
                oscillator.type = this.type;
            }
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.start(0);
            oscillator.stop(audioContext.currentTime+Math.max((noteLength-offset)/1000, 0));
            gain.connect(this.node);
        }
        this.node.gain.setTargetAtTime(this.volume, audioContext.currentTime, 0);
        this.node.connect(destination || audioContext.destination);
        return this.node;
    };
    /**
     * @return {String} "[Object ShepardTone]"
     */
    ShepardTone.prototype.toString = function() {
        return "[Object ShepardTone]";
    };
    // Token { type: "", value: "" }
    /**
     * Lexer for music representation
     */
    let NoteLexer = function(source, volumeControls) {
        this.position = 0;
        this.source = source;
        this.volumeSoft = (volumeControls && volumeControls.soft) || "";
        this.volumeLoud = (volumeControls && volumeControls.loud) || "";
    };
    NoteLexer.prototype.getNextToken = function() {
        let currentChar = this.source[this.position]; this.position++;
        if (currentChar === undefined) {
            return null;
        } else if (currentChar === this.volumeSoft || currentChar === this.volumeLoud) {
            let curVolume = currentChar === this.volumeSoft?-1:1;
            while (this.source[this.position] === this.volumeSoft || this.source[this.position] === "-") {
                curVolume += this.source[this.position]===this.volumeSoft?1:-1;
                this.position++;
            }
            return { type: "volume", value: curVolume };
        }
        switch (currentChar) {
            case ",": return { type: "chordEnd", value: "," };
            case "(": case ")": return { type: "section", value: currentChar };
            case "/": case "[": case "]": return { type: "settings", value: currentChar };
            case "+": case "-": // octave
                var octave = currentChar==="+"?1:-1;
                while (this.source[this.position] === "+" || this.source[this.position] === "-") {
                    octave += this.source[this.position]==="+"?1:-1;
                    this.position++;
                }
                return { type: "octave", value: octave }; 
            case "0": case "1": case "2": case "3": case "4":
            case "5": case "6": case "7": case "8": case "9":
                var curNumber = currentChar;
                var code = this.source.charCodeAt(this.position);
                while (code===46 || 48<=code && code<=57) {
                    curNumber += this.source[this.position++];
                    code = this.source.charCodeAt(this.position);
                }
                return { type: "number", value: +curNumber };
            default:
                return { type: "note", value: currentChar };
        }
    };
    /**
     * PlayableMixin which is supported by Track, PlayableMusic and ToneJSPlayableMusic
     */
    let PlayableMixin = {
        /**
         * Get the last frame of music before the time.
         * @param {Number} time in milliseconds
         * @return the last frame of music
         */
        getFrame: function(time) {
            let low = 0, high = this.timeFrames.length;
            while (low+1<high) {
                let mid = Math.floor((low+high)/2);
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
        },
        /**
         * With the help of a manager, play the music at a certain time.
         * @param {MusicPlayer} manager
         */
        play: function(manager) {
            let time = manager.getTime(), frame = this.getFrame(time), i, curFrame;
            manager.playingData = frame;
            // start notes
            if (frame<this.timeFrames.length) {
                i = (curFrame = this.timeFrames[frame]).onNotes.length;
                while (i--) {
                    curFrame.onNotes[i].startAt(manager.audioContext, manager.destination, time, manager.speed);
                }
                i = curFrame.sustainNotes.length;
                while (i--) {
                    curFrame.sustainNotes[i].startAt(manager.audioContext, manager.destination, time, manager.speed);
                }
                if (frame+1<this.timeFrames.length) {
                    manager.currentTimeout = setTimeout(function() {
                        manager.playingData++;
                        this.playFrame(manager);
                    }.bind(this), Math.max((this.timeFrames[frame+1].millis-manager.getTime())/manager.speed, 0));
                } else {
                    manager.currentTimeout = setTimeout(manager.endSong.bind(manager), Math.max((this.length-time)/manager.speed, 0));
                }
            } else {
                manager.currentTimeout = setTimeout(manager.endSong.bind(manager), Math.max((this.length-time)/manager.speed, 0));
            }
        },
        /**
         * With the help of a manager, play the music at a certain frame.
         * This should not be normally called.
         * @param {MusicPlayer} manager
         */
        playFrame: function(manager) {
            let frame = manager.playingData, time = manager.getTime(), i, curFrame;
            i = (curFrame = this.timeFrames[frame]).onNotes.length;
            while (i--) {
                curFrame.onNotes[i].startAt(manager.audioContext, manager.destination, time, manager.speed);
            }
            if (frame+1<this.timeFrames.length) {
                manager.currentTimeout = setTimeout(function() {
                    manager.playingData++;
                    this.playFrame(manager);
                }.bind(this), Math.max((this.timeFrames[frame+1].millis-manager.getTime())/manager.speed, 0));
            } else {
                manager.currentTimeout = setTimeout(manager.endSong.bind(manager), Math.max((this.length-time)/manager.speed, 0));
            }
        },
        /**
         * With the help of a manager, play the music at a certain time.
         * However, if frames are delayed, no notes are to be skipped or shortened considerably.
         * @param {MusicPlayer} manager
         */
        playWithoutSkipping: function(manager) {
            let time = manager.getTime(), frame = this.getFrame(time), i, curFrame;
            manager.playingData = frame;
            // start notes
            if (frame<this.timeFrames.length) {
                i = (curFrame = this.timeFrames[frame]).onNotes.length;
                while (i--) {
                    curFrame.onNotes[i].startAt(manager.audioContext, manager.destination, time, manager.speed);
                }
                i = curFrame.sustainNotes.length;
                while (i--) {
                    curFrame.sustainNotes[i].startAt(manager.audioContext, manager.destination, time, manager.speed);
                }
                if (frame+1<this.timeFrames.length) {
                    manager.setTime(time);
                    manager.currentTimeout = setTimeout(function() {
                        manager.playingData++;
                        this.playFrameWithoutSkipping(manager);
                    }.bind(this), Math.max((this.timeFrames[frame+1].millis-time)/manager.speed, 0));
                } else {
                    manager.currentTimeout = setTimeout(manager.endSong.bind(manager), Math.max((this.length-time)/manager.speed, 0));
                }
            } else {
                manager.currentTimeout = setTimeout(manager.endSong.bind(manager), Math.max((this.length-time)/manager.speed, 0));
            }
        },
        /**
         * With the help of a manager, play the music at a certain frame
         * However, if frames are delayed, no notes are to be skipped or shortened considerably.
         * This should not be normally called.
         * @param {MusicPlayer} manager
         */
        playFrameWithoutSkipping: function(manager) {
            let frame = manager.playingData, time, i, curFrame;
            i = (curFrame = this.timeFrames[frame]).onNotes.length;
            time = curFrame.millis;
            while (i--) {
                curFrame.onNotes[i].startAt(manager.audioContext, manager.destination, time, manager.speed);
            }
            if (frame+1<this.timeFrames.length) {
                manager.setTime(time);
                manager.currentTimeout = setTimeout(function() {
                    manager.playingData++;
                    this.playFrameWithoutSkipping(manager);
                }.bind(this), Math.max((this.timeFrames[frame+1].millis-time)/manager.speed, 0));
            } else {
                manager.currentTimeout = setTimeout(manager.endSong.bind(manager), Math.max((this.length-time)/manager.speed, 0));
            }
        },
        /**
         * With the help of a manager, stop the music now.
         * @param {MusicPlayer} manager
         */
        stop: function(manager) {
            clearTimeout(manager.currentTimeout); // should be responsible for it.
            let frame = manager.playingData, i, curFrame;
            if (frame<this.timeFrames.length) {
                // stop everything
                i = (curFrame = this.timeFrames[frame]).onNotes.length;
                while (i--) {
                    curFrame.onNotes[i].stop();
                }
                i = curFrame.sustainNotes.length;
                while (i--) {
                    curFrame.sustainNotes[i].stop();
                }
            }
        }
    };
    /**
     * Constructs a data structure to hold a song out of the data object.
     * This should be optimised as much as possible.
     * data has important properties that can be set:
     * data.title: title of the song
     * data.noteMapping: define a mapping between characters and notes for easy input, do not use the characters ()[]\,&+-1234567890 in the mapping
     * data.instruments: store what the instruments do
     * data.tuning: store the current tuning of the music
     * data.noteConstructor: store the note constructor [MARKED FOR POSSIBLE DEPRECATION]
     * data.defaultNoteConstructor: store default note constructor
     * @param {Object} data song data
     */
    let PlayableMusic = function(data) {
        this.title = data.title || "";
        this.minBPM = Infinity; this.maxBPM = 0;
        this.timeFrames = [];
        this.composer = data.composer || "";
        this.arranger = data.arranger || this.composer;
        this.transcriber = data.transcriber || "";
        this.length = 0;
        this.tuning = data.tuning || Tuning.equalTemperament;
        let defaultNoteConstructor = data.defaultNoteConstructor || data.noteConstructor || PlayableNote;
        let mapping = data.noteMapping; // hashtable
        let volumeChar = (data.volume && data.volume.characters) || {};
        let volumeMap = (data.volume && data.volume.mapping) || {};
        let EPSILON = 0.5;
        let initPQ = [];
        let i = data.instruments.length;
        while (i--) {
            let lexer = new NoteLexer(data.instruments[i].notes, volumeChar);
            initPQ.push({
                instrumentIndex: i,
                lexer: lexer,
                millis: 0,
                bpm: 0,
                volume: 0,
                parseState: "bpm entry",
                modifierStack: [{
                    timeMultiplier: 1,
                    octaveChange: 0,
                }],
            });
        }
        let pq = new PriorityQueue(function(a, b) {
            return a.millis>b.millis;
        }, initPQ);
        // array to store sustained notes.
        let sustainedArray = [];
        let lastSustained = -1;
        let lastTimeFrame = undefined; // array is empty iff this is undefined
        while (!pq.empty()) {
            let curTrack = pq.top(); pq.pop();
            if (!this.timeFrames.length || Math.floor(curTrack.millis)-lastTimeFrame.millis>EPSILON) {
                if (this.timeFrames.length && !lastTimeFrame.onNotes.length) { // pop last element (empty)
                    this.timeFrames.pop();
                }
                this.timeFrames.push(lastTimeFrame = {
                    millis: Math.round(curTrack.millis),
                    onNotes: [],
                    sustainNotes: []
                }); // produce new time frame
            }
            if (lastSustained<lastTimeFrame.millis) { // sustain notes
                lastSustained = lastTimeFrame.millis;
                let replaceSus = [];
                sustainedArray = sustainedArray.filter(function(note) {
                    return note.startTime + note.length > lastSustained;
                });
                lastTimeFrame.sustainNotes = sustainedArray.slice(0);
            }
            let noteConstructor = data.instruments[curTrack.instrumentIndex].noteConstructor || defaultNoteConstructor;
            let noteBuffer = {
                startTime: Math.round(curTrack.millis),
                noteNumber: NaN, // store note number
                frequency: 0,
                length: 0,
                volume: 1,
                type: data.instruments[curTrack.instrumentIndex].type,
                wave: data.instruments[curTrack.instrumentIndex].wave
            };
            let modifierBuffer = {
                timeMultiplier: 1,
                octaveChange: 0
            };
            let getToken = true;
            while (getToken) {
                let token = curTrack.lexer.getNextToken();
                if (!token) { getToken = false; break; }
                switch (token.type) {
                    case "volume":
                        curTrack.volume = token.value;
                        break;
                    case "chordEnd":
                        curTrack.millis += noteBuffer.length;
                        getToken = false;
                        continue;
                    case "octave":
                        if (curTrack.parseState === "settings") modifierBuffer.octaveChange += token.value; else noteBuffer.noteNumber += token.value*12;
                        break;
                    case "settings":
                        if (token.value === "/") {
                            curTrack.parseState = "settings";
                        } else if (token.value === "[") {
                            let modStackBack = curTrack.modifierStack[curTrack.modifierStack.length-1];
                            curTrack.modifierStack.push({
                                timeMultiplier: modStackBack.timeMultiplier*modifierBuffer.timeMultiplier,
                                octaveChange: modStackBack.octaveChange+modifierBuffer.octaveChange,
                            });
                            modifierBuffer.timeMultiplier = 1;
                            modifierBuffer.octaveChange = 0;
                            curTrack.parseState = "note entry";
                        } else { // "]"
                            curTrack.modifierStack.pop();
                        }
                        break;
                    case "section":
                        if (token.value === ")") {
                            curTrack.parseState = "bpm entry";
                            curTrack.millis += noteBuffer.length;
                            getToken = false;
                        } else { // "("
                            curTrack.parseState = "note entry";
                        }
                        break;
                    case "number":
                        if (curTrack.parseState === "bpm entry") {
                            curTrack.bpm = token.value;
                            this.minBPM = Math.min(this.minBPM, curTrack.bpm);
                            this.maxBPM = Math.max(this.maxBPM, curTrack.bpm);
                        } else if (curTrack.parseState === "settings") {
                            modifierBuffer.timeMultiplier *= token.value;
                        } else { // note entry
                            let modStackBack = curTrack.modifierStack[curTrack.modifierStack.length-1];
                            noteBuffer.length = token.value / modStackBack.timeMultiplier * (60000 / curTrack.bpm);
                            if (this.tuning[noteBuffer.noteNumber]) { // create note
                                noteBuffer.frequency = this.tuning[noteBuffer.noteNumber]*Math.pow(2, modStackBack.octaveChange);
                                noteBuffer.volume = volumeMap[curTrack.volume] || 1;
                                let newNote = new noteConstructor(noteBuffer);
                                lastTimeFrame.onNotes.push(newNote);
                                sustainedArray.push(newNote);
                                this.length = Math.max(this.length, curTrack.millis+newNote.length); // update length of song
                                noteBuffer.noteNumber = NaN; // ensure nothing gets played
                            }
                        }
                        break;
                    case "note":
                        noteBuffer.noteNumber = mapping[token.value] || NaN;
                        break;
                }
            }
            if (curTrack.lexer.position<curTrack.lexer.source.length) pq.push(curTrack); // more input
        }
        if (this.timeFrames.length && !lastTimeFrame.onNotes.length) this.timeFrames.pop(); // remove empty last timeframe
    };
    /**
     * Asynchronously constructs music from data.
     * @param {Object[]} musicData an array of song data
     * @param {Number} timeDelay how much time to wait between constructions
     * @return promise, returns the data using the resolve function.
     */
    PlayableMusic.async_construction = function(musicData, timeDelay) {
        timeDelay = timeDelay || 200;
        return new Promise(function(resolve, reject) {
            let index = 0;
            let constructionInterval = setInterval(function() {
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
    };
    Object.assign(PlayableMusic.prototype, PlayableMixin);
    /**
     * @return {String} "[Object PlayableMusic]"
     */
    PlayableMusic.prototype.toString = function() {
        return "[Object PlayableMusic]";
    };
    /**
     * Constructs from ToneJS
     * @param {Object} data
     * @param {Object} info
     */
    let ToneJSPlayableMusic = PlayableMusic.constructFromToneJS = function(data, info) {
        info = info || {};
        this.title = info.title || "";
        this.minBPM = data.header.bpm;
        this.maxBPM = data.header.bpm;
        this.timeFrames = []; // objects
        this.composer = info.composer || "";
        this.arranger = info.arranger || this.composer;
        this.transcriber = info.transcriber || "";
        this.length = 0;
        let noteConstructor = info.noteConstructor || PlayableTone;
        let i = data.tracks.length;
        let trackProtoNotes = [];
        while (i--) {
            let notes = data.tracks[i].notes;
            let j = notes.length;
            let instrument = data.tracks[i].instrument;
            while (j--) {
                if (notes[j].time || notes[j].midi || notes[j].duration) {
                    trackProtoNotes.push({
                        startTime: notes[j].time*1000,
                        frequency: Tuning.equalTemperament[notes[j].midi-9], // map correctly
                        length: notes[j].duration*1000,
                        volume: notes[j].velocity,
                        type: instrument,
                    });
                }
            }
        }
        trackProtoNotes.sort(function(a, b) {
            return b.startTime-a.startTime;
        }); // sort backwards
        let sustainedArray = [];
        let lastSustained = -1;
        let lastTimeFrame = undefined;
        i = trackProtoNotes.length;
        while (i--) { // loop backwards
            let note = trackProtoNotes[i];
            if (this.timeFrames.length === 0 || lastTimeFrame.millis != Math.round(note.startTime)) {
                this.timeFrames.push(lastTimeFrame = {
                    millis: Math.round(note.startTime), // round it
                    onNotes: [],
                    sustainNotes: []
                });
            }
            // manage sustained notes
            if (lastSustained<lastTimeFrame.millis) {
                lastSustained = lastTimeFrame.millis;
                let replaceSus = [];
                sustainedArray = sustainedArray.filter(function(note) {
                    return note.startTime + note.length > lastSustained;
                });
                lastTimeFrame.sustainNotes = sustainedArray.slice(0);
            }
            note = new noteConstructor(note);
            sustainedArray.push(note);
            lastTimeFrame.onNotes.push(note);
            this.length = Math.max(this.length, note.startTime+note.length);
        }
    };
    PlayableMusic.constructFromToneJS.prototype = Object.create(PlayableMusic.prototype);
    /**
     * Need to differentiate the playable music based on type
     * One unoptimised version for editing which edits the JSON format: Track
     * TrackPlayer?
     * a way that combines them: TrackGroup
     */
    /**
     * A track of music to separate from other tracks so that post processing can be done, and that it updates its internal string representation.
     * Needs to be a bit more rigid and gives status messages
     * Maybe use a more "intermediate representation"
     * @TODO TrackEditor class ???
     */
    let Track = function(data) {
        this.data = data;
        this.timeFrames = []; // maybe not??
        this.dataUnits = [];
        this.length = 0;
        this.tuning = data.tuning || Tuning.equalTemperament;
        this.noteConstructor = data.defaultNoteConstructor || data.noteConstructor || PlayableNote;
        // @TODO this.noteMapping
        let mapping = data.noteMapping; // hashtable
        this.volumeChar = (data.volume && data.volume.characters) || {};
        // @TODO this.volumeMap
        let volumeMap = (data.volume && data.volume.mapping) || {};
        let EPSILON = 0.5;
        // @TODO better note lexer encapsulating the current note lexer, also gives errors on unexpected output
        let lexer = new NoteLexer(data.instrument.notes, this.volumeChar);
        let track = {
            millis: 0,
            bpm: 0,
            volume: 0, // 0 is default volume, volume exists outside the stack
            parseState: "bpm entry",
            modifierStack: [{
                timeMultiplier: 1,
                octaveChange: 0,
            }],
        };
        let noteBuffer = {
            startTime: Math.round(track.millis),
            noteNumber: NaN, // store note number
            frequency: 0,
            length: 0,
            volume: 1,
            type: data.instruments[0].type,
            wave: data.instruments[0].wave
        };
        let modifierBuffer = {
            timeMultiplier: 1,
            octaveChange: 0
        };
        // array to store sustained notes.
        let sustainedArray = [];
        let lastSustained = -1;
        let lastTimeFrame = undefined;
        let newFrame = true;
        while (lexer.position < lexer.source.length) {
            if (newFrame) {
                if (!this.timeFrames.length || Math.floor(track.millis)-lastTimeFrame.millis>EPSILON) {
                    if (this.timeFrames.length && !lastTimeFrame.onNotes.length) { // pop last element (empty)
                        this.timeFrames.pop();
                    }
                    this.timeFrames.push(lastTimeFrame = {
                        millis: Math.round(track.millis),
                        onNotes: [],
                        sustainNotes: []
                    }); // produce new time frame
                }
                if (lastSustained<lastTimeFrame.millis) { // sustain notes
                    lastSustained = lastTimeFrame.millis;
                    lastTimeFrame.sustainNotes = sustainedArray = sustainedArray.filter(function(note) {
                        return note.startTime + note.length > lastSustained;
                    });
                }
                newFrame = false;
            }
            let token = lexer.getNextToken();
            if (!token) { break; }
            switch (token.type) {
                case "volume":
                    track.volume = token.value;
                    break;
                case "chordEnd":
                    track.millis += noteBuffer.length;
                    newFrame = true;
                    continue;
                case "octave":
                    if (track.parseState === "settings") modifierBuffer.octaveChange += token.value; else noteBuffer.noteNumber += token.value*12;
                    break;
                case "settings":
                    if (token.value === "/") {
                        track.parseState = "settings";
                    } else if (token.value === "[") {
                        let modStackBack = track.modifierStack[track.modifierStack.length-1];
                        track.modifierStack.push({
                            timeMultiplier: modStackBack.timeMultiplier*modifierBuffer.timeMultiplier,
                            octaveChange: modStackBack.octaveChange+modifierBuffer.octaveChange,
                        });
                        modifierBuffer.timeMultiplier = 1;
                        modifierBuffer.octaveChange = 0;
                        track.parseState = "note entry";
                    } else { // "]"
                        track.modifierStack.pop();
                    }
                    break;
                case "section":
                    if (token.value === ")") {
                        track.parseState = "bpm entry";
                        track.millis += noteBuffer.length;
                        newFrame = true;
                    } else { // "("
                        track.parseState = "note entry";
                    }
                    break;
                case "number":
                    if (track.parseState === "bpm entry") {
                        track.bpm = token.value;
                    } else if (track.parseState === "settings") {
                        modifierBuffer.timeMultiplier *= token.value;
                    } else { // note entry
                        let modStackBack = track.modifierStack[track.modifierStack.length-1]
                        noteBuffer.length = token.value / modStackBack.timeMultiplier * (60000 / track.bpm);
                        if (this.tuning[noteBuffer.noteNumber]) { // create note
                            noteBuffer.frequency = this.tuning[noteBuffer.noteNumber]*Math.pow(2, modStackBack.octaveChange);
                            noteBuffer.volume = volumeMap[track.volume] || 1;
                            let newNote = new this.noteConstructor(noteBuffer);
                            lastTimeFrame.onNotes.push(newNote);
                            sustainedArray.push(newNote);
                            this.length = Math.max(this.length, track.millis+newNote.length); // update length of song
                            noteBuffer.noteNumber = NaN; // ensure nothing gets played
                        }
                    }
                    break;
                case "note":
                    noteBuffer.noteNumber = mapping[token.value] || NaN;
                    break;
            }
        }
        if (this.timeFrames.length && !lastTimeFrame.onNotes.length) this.timeFrames.pop(); // remove empty last timeframe
    };
    Track.prototype = Object.create(PlayableMusic.prototype);
    /**
     * Extract a section as a copy.
     * @param {Number} start start time in milliseconds
     * @param {Number} stop stop time in milliseconds
     * @param {Object} options
     * options.includePreviousNotes: default true
     * options.stopAtStopTime: default true
     * @return {Track} A track which 
     */
    Track.prototype.section = function(start, stop, options) {
        options = options || {};
        //
    };
    /**
     * Pitchshift?
     * @TODO
     */
    Track.prototype.pitchShift = function() {
        //
    };
    /**
     * @return {String} "[Object Track]"
     */
    Track.prototype.toString = function() {
        return "[Object Track]";
    };
    
    /**
     * Make playable tracks, then combine them, as well as allow editing
     * Needs a custom play function, not like PlayableMixin.
     * @TODO
     */
    let TrackGroup = function(tracks) {
        //
    };
    /**
     * Extract a section as a copy.
     * @param {Number} start start time in milliseconds
     * @param {Number} stop stop time in milliseconds
     * @param {Object} options
     * options.includePreviousNotes: default true
     * options.stopAtStopTime: default true
     * @return {TrackGroup} extracted tracks 
     * @TODO
     */
    TrackGroup.prototype.section = function(start, stop, options) {
        options = options || {};
        //
    };
    TrackGroup.prototype.addTrack = function(track, offset) {
        //
    };
    TrackGroup.prototype.addTrackGroup = function(track, offset) {
        //
    };
    /**
     * This stores multiple PlayableMusic instances and works as a song selector.
     * @param {PlayableMusic[]} songData
     */
    let Playlist = function(songData) {
        this.data = songData || []; // store song data as array of playable music
        this.songIndex = 0; // decided to select 0 by default
        this.callbacks = {}; // manage callbacks in hash
    };
    /**
     * Bind a callback to call when an event happens.
     * The callback can accept 2 parameters: data and this (Playlist instance)
     * "listupdate"
     * "songupdate"
     * @param {Function} callback
     */
    Playlist.prototype.on = function(event, callback) {
        if (typeof event === "string") {
            this.callbacks[event] = callback;
        } else {
            let i = event.length;
            while (i--) {
                this.callbacks[event[i]] = callback;
            }
        }
    };
    Playlist.prototype.off = function(event) {
        if (typeof event === "string") {
            delete this.callbacks[event];
        } else {
            let i = event.length;
            while (i--) {
                delete this.callbacks[event[i]];
            }
        }
    };
    /**
     * Add a song to the current songs.
     * @param {PlayableMusic} songData
     */
    Playlist.prototype.addSong = function(songData) {
        this.data.push(songData);
        this.callbacks.listupdate && this.callbacks.listupdate(this.data, this);
    };
    /**
     * Add an array of songs to the current songs.
     * @param {PlayableMusic} songData
     */
    Playlist.prototype.addSongs = function(songData) {
        this.data = this.data.concat(songData);
        this.callbacks.listupdate && this.callbacks.listupdate(this.data, this);
    };
    /**
     * Select a song.
     * On failure, this.songIndex is -1.
     * On success, this.songIndex selects the song.
     * @param {Number|String} selector title of song or index
     */
    Playlist.prototype.select = function(selector) {
        if (typeof selector === "number") {
            if (this.data.length === 0) {
                this.songIndex = -1;
            } else {
                this.songIndex = (Math.floor(selector)%this.data.length+this.data.length)%this.data.length;
            }
        } else if (typeof selector === "string") {
            this.songIndex = -1;
            let i = this.data.length;
            while (i--) {
                if (this.data[i].title === selector) {
                    this.songIndex = i;
                    break;
                }
            }
        }
        this.callbacks.songchange && this.callbacks.songchange(this.songIndex, this);
    };
    /**
     * Naively shuffles all the songs
     * Use only if you want a real random shuffle.
     */
    Playlist.prototype.naiveShuffle = function() {
        for (let i = this.data.length;i>0;i--) {
            let index = Math.min(Math.floor(Math.random() * i), i-1);
            let temp = this.data[index];
            this.data[index] = this.data[i-1];
            this.data[i-1] = temp;
        }
        this.callbacks.listupdate && this.callbacks.listupdate(this.data, this);
    };
    Playlist.prototype.next = function() {
        this.songIndex = (this.songIndex+1)%this.data.length;
        this.callbacks.songchange && this.callbacks.songchange(this.songIndex, this);
    };
    /**
     * Sorts the songs based off a function
     * @param {sortFunc} a function to sort by.
     */
    Playlist.prototype.sort = function(sortFunc) {
        this.data.sort(sortFunc);
        this.callbacks.listupdate && this.callbacks.listupdate(this.data, this);
    };
    /**
     * Smartly shuffles all the songs
     * Used when you hate naive shuffles.
     */
    Playlist.prototype.smartShuffle = function() {
        let wasPlaying = this.playing, i;
        if (this.playing) {
            this.pause();
        }
        // group the songs by arranger
        let map = new Map(), arr = []; // temporary array
        i = this.data.length;
        while (i--) {
            if (!map.has(this.data[i].arranger)) {
                map.set(this.data[i].arranger, []);
            }
            map.get(this.data[i].arranger).push(this.data[i]);
        }
        // for each song, give a random value
        map.forEach(function(value) {
            shuffleArray(value);
            for (let i=0;i<value.length;i++) {
                arr.push({song: value[i], rand: (i+Math.random())/value.length});
            }
        });
        // sort
        arr.sort(function(a, b) { return a.rand-b.rand; });
        i = arr.length;
        while (i--) {
            this.data[i] = arr[i].song;
        }
        this.select(0); // reset selection
        if (wasPlaying) {
            this.play();
        }
        this.callbacks.listupdate && this.callbacks.listupdate(this.data, this);
    };
    /**
     * Get the titles of all the songs.
     * Helps with selecting the song.
     * @param {Function} sortFunc a function to sort the titles by
     * @return {String[]} array of titles
     */
    Playlist.prototype.getTitles = function(sortFunc) {
        this.titles = [];
        for (let i=0;i<this.data.length;i++) {
            this.titles.push(this.data[i].title);
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
    Playlist.prototype.getCurrentSongData = function() {
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
                }
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
            }
        };
    };
    /**
     * Gets the current song.
     */
    Playlist.prototype.currentSong = function() {
        return this.data[this.songIndex];
    };
    /**
     * @return {String} "[Object Playlist]"
     */
    Playlist.prototype.toString = function() {
        return "[Object Playlist]";
    };
    /**
     * MusicPlayer manages the playing of PlayableMusic
     * It can store multiple PlayableMusic as a song selector.
     * @param {PlayableMusic[], Playlist, PlayableMixin} songData
     */
    let MusicPlayer = function(songData) {
        // Playlist
        if (songData instanceof Playlist) {
            this.playlist = songData;
        } else if (Array.isArray(songData)) {
            this.playlist = new Playlist(songData);
        } else if (songData) {
            this.playlist = new Playlist([songData]);
        } else {
            this.playlist = new Playlist([]);
        }
        // If it lags, do we skip notes?
        this.skipWhenLag = true;
        this.loop = false;
        this.playAll = false;
        // Recommend to be left as read-only
        this.playing = false;
        this.time = 0;
        this.startTime = 0;
        this.currentTimeout = undefined;
        this.audioContext = AudioContextManager.getAudioContext();
        this.volume = 1; // volume multiplier
        this.destination = null; // volume node
        this.playingData = 0;
        this.speed = 1; // speed multiplier
        this.callbacks = {}; // manage callbacks in hash
        this.inSong = false;
        this.playLaterTimeout = undefined;
    };
    /**
     * Bind a callback to call when an event happens.
     * The callback can accept 2 parameters: data and this (MusicPlayer instance)
     * "play"
     * "pause"
     * "loop"
     * "speedupdate"
     * "volumeupdate"
     * "songend"
     * @param {Function} callback
     */
    MusicPlayer.prototype.on = function(event, callback) {
        if (typeof event === "string") {
            this.callbacks[event] = callback;
        } else {
            let i = event.length;
            while (i--) {
                this.callbacks[event[i]] = callback;
            }
        }
    };
    MusicPlayer.prototype.off = function(event) {
        if (typeof event === "string") {
            delete this.callbacks[event];
        } else {
            let i = event.length;
            while (i--) {
                delete this.callbacks[event[i]];
            }
        }
    };
    /**
     * Add a song to the current songs.
     * @param {PlayableMusic} songData
     */
    MusicPlayer.prototype.addSong = function(songData) {
        this.playlist.addSong(songData);
    };
    /**
     * Add an array of songs to the current songs.
     * @param {PlayableMusic} songData
     */
    MusicPlayer.prototype.addSongs = function(songData) {
        this.playlist.addSongs(songData);
    };
    /**
     * Set if the song should loop
     * @param {Boolean} loop
     */
    MusicPlayer.prototype.setLoop = function(loop) {
        this.loop = !!loop; // boolean cast
    };
    /**
     * Set if this should play all the songs.
     * @param {Boolean} playAll
     */
    MusicPlayer.prototype.setPlayAll = function(playAll) {
        this.playAll = !!playAll;
    };
    /**
     * Plays the selected song at time this.time.
     */
    MusicPlayer.prototype.play = function() {
        let currentSong = this.playlist.currentSong();
        if (!this.playing && currentSong) {
            if (this.audioContext.state === "suspended") this.audioContext.resume();
            this.destination = this.audioContext.createGain();
            this.destination.connect(this.audioContext.destination);
            this.destination.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0);
            // play
            this.playing = true;
            this.inSong = true;
            if (this.time >= currentSong.length) {
                this.time = 0;
            }
            this.startTime = Date.now();
            if (this.skipWhenLag) {
                currentSong.play(this);
            } else {
                currentSong.playWithoutSkipping(this);
            }
            this.callbacks.play && this.callbacks.play(currentSong, this);
        }
    };
    /**
     * Plays the selected song later from the start.
     * @param {Number} millis milliseconds to wait
     */
    MusicPlayer.prototype.playLater = function(millis) {
        let currentSong = this.playlist.currentSong();
        if (!this.playing && currentSong) {
            this.destination = this.audioContext.createGain();
            this.destination.connect(this.audioContext.destination);
            this.destination.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0);
            // play
            this.playing = true;
            this.inSong = true;
            this.time = -millis*this.speed;
            this.startTime = Date.now();
            this.playLaterTimeout = setTimeout(function() {
                this.time = 0;
                this.startTime = Date.now();
                if (this.skipWhenLag) {
                    currentSong.play(this);
                } else {
                    currentSong.playWithoutSkipping(this);
                }
                this.callbacks.play && this.callbacks.play(currentSong, this);
            }.bind(this), millis);
            return this.playLaterTimeout;
        }
    };
    /**
     * Set the volume of the music. 1 means original volume.
     * @param {Number} volume What to set it to.
     */
    MusicPlayer.prototype.setVolume = function(volume) {
        this.volume = (+volume);
        if (this.destination) {
            this.destination.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0);
        }
        this.callbacks.volumeupdate && this.callbacks.volumeupdate(this.volume, this);
    };
    /**
     * Set the speed of the music. 1 means original speed.
     * @param {Number} speed What to set it to.
     */
    MusicPlayer.prototype.setSpeed = function(speed) {
        if (this.playing && this.audioContext) {
            let tempPlay = this.callbacks.play; // store
            let tempPause = this.callbacks.pause; // store
            this.callbacks.play = undefined;
            this.callbacks.pause = undefined;
            this.pause();
            this.speed = (+speed);
            this.play();
            this.callbacks.play = tempPlay;
            this.callbacks.pause = tempPause;
        } else {
            this.speed = (+speed);
        }
        this.callbacks.speedupdate && this.callbacks.speedupdate(this.speed, this);
    };
    /**
     * A callback back to stop the current song playing.
     * Used by the song to tell the instance of MusicPlayer that it ended.
     */
    MusicPlayer.prototype.endSong = function() {
        let currentSong = this.playlist.currentSong();
        if (this.playing) {
            this.playing = false;
            this.startTime = Date.now();
            this.time = currentSong.length;
            this.inSong = false;
            if (this.playAll) {
                this.playlist.next();
                this.time = 0;
                if (this.playlist.songIndex === 0) {
                    this.loop && this.callbacks.loop && this.callbacks.loop(this.playlist.currentSong(), this);
                }
                this.callbacks.songend && this.callbacks.songend(currentSong, this);
                if (this.loop) this.play();
            } else if (this.loop) {
                this.callbacks.loop && this.callbacks.loop(currentSong, this);
                this.play(); // loop!
            } else {
                this.callbacks.songend && this.callbacks.songend(currentSong, this);
            }
        }
    };
    /**
     * Pauses the song.
     * Stores enough information to play the song
     * from this point when .play is called.
     */
    MusicPlayer.prototype.pause = function() {
        let currentSong = this.playlist.currentSong();
        if (this.playing) {
            if (this.playLaterTimeout !== undefined) {
                clearTimeout(this.playLaterTimeout);
                this.playLaterTimeout = undefined;
            }
            this.playing = false;
            this.time += (Date.now()-this.startTime)*this.speed;
            currentSong.stop(this); // this helps it stop
            this.callbacks.pause && this.callbacks.pause();
        }
    };
    /**
     * Set the point the song should be at.
     * @param {Number} time
     */
    MusicPlayer.prototype.seek = function(time) {
        if (this.playing) {
            this.pause();
            this.time = time*1000;
            this.play();
        } else {
            this.time = time*1000;
        }
    };
    /**
     * Select a song.
     * On failure, this.songIndex is -1.
     * On success, this.songIndex selects the song.
     * @param {Number|String} selector title of song or index
     */
    MusicPlayer.prototype.select = function(selector) {
        this.playlist.select(selector);
        this.time = 0;
    };
    /**
     * Naively shuffles all the songs
     * Use only if you want a real random shuffle.
     */
    MusicPlayer.prototype.naiveShuffle = function() {
        this.playlist.naiveShuffle();
        this.time = 0;
    };
    /**
     * Sorts the songs based off a function
     * @param {sortFunc} a function to sort by.
     */
    MusicPlayer.prototype.sort = function(sortFunc) {
        this.playlist.sort(sortFunc);
        this.time = 0;
    };
    /**
     * Smartly shuffles all the songs
     * Used when you hate naive shuffles.
     */
    MusicPlayer.prototype.smartShuffle = function() {
        this.playlist.smartShuffle();
        this.time = 0;
    };
    /**
     * Get the titles of all the songs.
     * Helps with selecting the song.
     * @param {Function} sortFunc a function to sort the titles by
     * @return {String[]} array of titles
     */
    MusicPlayer.prototype.getTitles = function(sortFunc) {
        return this.playlist.getTitles(); // array of titles
    };
    /**
     * Get the data of the current song.
     * @return {Object} data
     */
    MusicPlayer.prototype.getCurrentSongData = function() {
        return this.playlist.getCurrentSongData();
    };
    /**
     * Get the current time of the song. Used to calibrate PlayableMusic.
     * @return {Number} time
     */
    MusicPlayer.prototype.getTime = function() {
        return Math.round(this.time + (Date.now() - this.startTime)*this.speed);
    };
    /**
     * Set the current time of the song. Used to calibrate MusicPlayer when it lags.
     * @return {Number} time
     */
    MusicPlayer.prototype.setTime = function(time) {
        this.time = time;
        this.startTime = Date.now();
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
        let currentSong = this.playlist.currentSong();
        if (this.playing) {
            return {
                currentTime: Math.round(this.time + (Date.now() - this.startTime)*this.speed)/1000,
                duration: Math.round(currentSong.length)/1000,
            };
        } else {
            return {
                currentTime: Math.round(this.time)/1000,
                duration: Math.round(currentSong.length)/1000,
            };
        }
    };
    /**
     * @return {String} "[Object MusicPlayer]"
     */
    MusicPlayer.prototype.toString = function() {
        return "[Object MusicPlayer]";
    };
    return {
        PriorityQueue: PriorityQueue,
        AudioContextManager: AudioContextManager,
        Tuning: Tuning,
        Instruments: Instruments,
        PlayableTone: PlayableTone,
        PlayableNote: PlayableNote,
        ShepardTone: ShepardTone,
        MusicPlayer: MusicPlayer,
        NoteLexer: NoteLexer,
        PlayableMixin: PlayableMixin,
        PlayableMusic: PlayableMusic,
        Track: Track,
        TrackGroup: TrackGroup,
        Playlist: Playlist,
        MusicPlayer: MusicPlayer,
        version: "3.0.0b8"
    };
})();
