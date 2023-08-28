/* FlexFX
While the built-in facilities for creating sound-effects are impressively flexible,
they are insufficiently flexible for some contexts (such as to properly express moods and emotions.)

This extension allows the creation of more complex sounds, that have inflections in both pitch 
and volume. In the context of mood-sounds, this might include a laugh, a moan or an "Uh-oh" that indicates a problem.

To achieve this we have defined a flexible sound-effect class called a "FlexFX", which contains the recipe 
to compile a composite sound string involving up to three separate sound parts that will then be played
consecutively to give a smoothly varying result when spliced together.

The core function to playSoundEffect() offers a playInBackground option. Unfortunately, this 
does not allow a subsequent playSoundEffect() to queue sounds up. The FlexFX class therefore
implements its own play-list to achieve this.

*/
/* NOTE:    The built-in enums for sound effect parameters are hardly beginner-friendly!
            By renaming them we can expose somewhat simpler concepts, but this only works 
            if we pass them over a function-call as arguments of type: number.
*/

// Simplify the selection of wave-shape...
enum Wave {
    //%block="Pure"
    SINE = WaveShape.Sine,
    //%block="Buzzy"
    SQUARE = WaveShape.Square,
    //%block="Bright"
    TRIANGLE = WaveShape.Triangle,
    //%block="Harsh"
    SAWTOOTH = WaveShape.Sawtooth,
    //%block="Noisy"
    NOISE = WaveShape.Noise
}
// Simplify the selection of frequency interpolation trajectory...
enum Attack {
    //% block="Slow"
    SLOW = InterpolationCurve.Linear,
    //% block="Medium"
    MEDIUM = InterpolationCurve.Curve,
    //% block="Fast"
    FAST = InterpolationCurve.Logarithmic
}
// Simplify (slightly) the selection of modulation-style...
enum Effect {
    //% block="None"
    NONE = SoundExpressionEffect.None,
    //% block="Vibrato"
    VIBRATO = SoundExpressionEffect.Vibrato,
    //% block="Tremolo"
    TREMOLO = SoundExpressionEffect.Tremolo,
    //% block="Warble"
    WARBLE = SoundExpressionEffect.Warble
}

// list of built-in FlexFXs
enum BuiltInFlexFX {
    //% block="laugh"
    LAUGH,
    //% block="uh-oh"
    UHOH,
    //% block="scream"
    SCREAM,
    //% block="cry"
    CRY,
    //% block="moan"
    MOAN,
    //% block="shout"
    SHOUT,
    //% block="violin"
    VIOLIN,
    //% block="horn"
    HORN,
    //% block="sax"
    FLUTE,
    //% block="flute"
    SAX,
    //% block="tweet"
    TWEET,
    //% block="ting"
    TING,
    //% block="chime"
    CHIME,
    //% block="whale"
    WHALE,
    //% block="miaow"
    MIAOW,
    //% block="cluck"
    CLUCK,
    //% block="woof"
    WOOF,
    //% block="moo"
    MOO,
    //% block="motor"
    MOTOR,
    //% block="siren"
    SIREN
}

/**
 * Tools for creating composite sound-effects of class FlexFX that can be performed 
 * (either directly or queued-up) with dynamically-specified pitch, volume and duration.
 */

//% color=#70e030
//% icon="\uf0a1"
//% block="FlexFX"
//% groups="['Playing', 'Creating', 'Play-list']"
namespace flexFX {  
    // array of built-in FlexFX ids **** must precicely match the enum BuiltInFlexFX above ****
    let builtInId: string[] = [
        "laugh", "uh-oh", "scream", "cry", "moan",  // [0...4]
        "shout", "violin", "horn", "sax", "flute",  // [5...9]
        "tweet", "ting", "chime", "whale", "miaow", // [10...14]
        "cluck", "woof", "moo", "motor", "siren"];  // [15...19]

    // Each performance will comprise an array of the "compiled" sound-strings for its several parts.
    class Play {
        parts: string[];
        constructor() {
            this.parts = [];
        }
    }
    // Performances get queued on the play-list to ensure proper asynchronous sequencing
    let playList: Play[] = []; 
    
    // control flags:
    let playerPlaying = false; // a performance is being played
    export function isPlaying(): boolean { return playerPlaying; } // accessor
    let playerActive = false;
    export function isActive(): boolean { return playerActive; } // accessor
    let playerStopped = false; // activation of player inhibited for now
    export function isStopped(): boolean { return playerStopped; } // accessor


    // activity events (for other components to synchronise with)
    const FLEXFX_ACTIVITY_ID = 1234 // TODO: Check this is a permissable value!
    enum PLAYER {
        STARTING = 1,
        FINISHED = 2,
        ALLPLAYED = 3,
    }
  
    //  array of all defined FlexFX objects (built-in and user-defined)
    let flexFXList: FlexFX[] = [];

    // A FlexFX contains the recipe to compile a composite sound.
    // It can specify up to three component soundExpressions, PartA, PartB & PartC
    // Each part has a start and an end [frequency,volume], but endA=startB and endB=startC,
    // so an n-part FlexFX moves through (n+1)) [frequency,volume,time] points
    class FlexFX {
        // properties
        id: string; // identifier
        // Points are defined to be fixed ratios of the "performance" [frequency,volume,duration] arguments
        playPartA: boolean;
        waveA: number;
        attackA: number;
        effectA: number;
        timeRatioA: number;

        skipPartB: boolean;     // marks a special "double" FlexFX, which has a silent gap in the middle
        playPartB: boolean;
        waveB: number;
        attackB: number;
        effectB: number;
        timeRatioB: number;

        playPartC: boolean;
        waveC: number;
        attackC: number;
        effectC: number;
        timeRatioC: number;  // (always set to 1.0 - timeRatioA - timeRatioB)

        // Point 0
        freqRatio0: number;
        volRatio0: number;
        // Point 1
        freqRatio1: number;
        volRatio1: number;
        // Point 2
        usesPoint2: boolean;
        freqRatio2: number;
        volRatio2: number;
        // Point 3
        usesPoint3: boolean;
        freqRatio3: number;
        volRatio3: number;

        // Performance defaults
        defaultFreq: number;
        defaultVol: number;
        defaultMs: number;

        constructor(id: string) {
            this.id = id;
            // until otherwise instructed...
            this.playPartA = false;
            this.playPartB = false;
            this.playPartC = false;
            this.usesPoint2 = false;
            this.usesPoint3 = false;
        }

        // internal tools...
        protected goodFreqRatio(freq: number): number{
            return Math.min(Math.max(freq, 0), 2000);
        }
        protected goodVolRatio(vol: number): number {
            return Math.min(Math.max(vol, 0), 100);
        }
        protected goodTimeRatio(time: number, timeLeft: number): number {
            return Math.min(Math.max(time, 0), timeLeft);
        }
        // methods...  
        // Sets up Part A:  (Point0)--PartA--(Point1)...
        // This implicitly sets the start values for any Part B that might follow
        setPartA(freq0: number, vol0: number, wave: Wave, attack: number, effect: number, freq1: number, vol1: number, ms1: number) {
            this.freqRatio0 = this.goodFreqRatio(freq0);
            this.volRatio0 = this.goodVolRatio(vol0);
            this.freqRatio1 = this.goodFreqRatio(freq1);
            this.volRatio1 = this.goodVolRatio(vol1);
            this.timeRatioA = this.goodTimeRatio(ms1,1.0);
            this.waveA = wave;
            this.attackA = attack;
            this.effectA = effect;    
            this.playPartA = true;
        // clear other flags for parts B & C that might have previously been set...
            this.playPartB = false;
            this.playPartC = false;
            this.usesPoint2 = false;
            this.usesPoint3 = false;
        }
        // Adds a  Part B:  (Point0)--PartA--(Point1)--PartB--(Point2)...
        // This also implicitly sets the start values for any Part C that might follow
        setPartB(wave: number, attack: number, effect: number, freq2: number, vol2: number, ms2: number) {
            this.freqRatio2 = this.goodFreqRatio(freq2);
            this.volRatio2 = this.goodVolRatio(vol2);
            this.timeRatioB = this.goodTimeRatio(ms2, 1.0 - this.timeRatioA);
            this.waveB = wave;
            this.attackB = attack;
            this.effectB = effect;
            this.playPartB = true;
            this.usesPoint2 = true;
        }
        // Adds a silent Part B:  (Point0)--PartA--(Point1)--silence--(Point2)...
        // This implicitly sets start values for the Part C that follows
        silentPartB(freq2: number, vol2: number, ms2: number) {
            this.freqRatio2 = this.goodFreqRatio(freq2);
            this.volRatio2 = this.goodVolRatio(vol2);
            this.timeRatioB = this.goodTimeRatio(ms2, 1.0 - this.timeRatioA);
            this.skipPartB = true;
        }

        // Adds an optional part C: (Point0)--PartA--(Point1)--PartB--(Point2)--PartC--(Point3)
        setPartC(wave: number, attack: number, effect: number, freq3: number, vol3: number, ms3: number) {
            this.freqRatio3 = this.goodFreqRatio(freq3);
            this.volRatio3 = this.goodVolRatio(vol3);
            this.timeRatioC = this.goodTimeRatio(ms3, 1.0 - this.timeRatioA - this.timeRatioB);
            this.waveC = wave;
            this.attackC = attack;
            this.effectC = effect;
            this.playPartC = true;
            this.usesPoint2 = true;
            this.usesPoint3 = true;
        }

        // Compiles a performance (called a Play) for this FlexFX and adds it to the Play-list
        compilePlay(freq: number, vol: number, ms: number) {
            // pick up performance defaults?
            if (freq == 0) { freq = this.defaultFreq; }
            if (vol == 0) { vol = this.defaultVol; }
            if (ms == 0) { ms = this.defaultMs; }
        
            // Point 0
            let f0 = freq * this.freqRatio0;
            let v0 = vol * this.volRatio0;
            // Point 1
            let f1 = freq * this.freqRatio1;
            let v1 = vol * this.volRatio1;
            let ms1 = ms * this.timeRatioA;
            // declarations required, even if unused...
            let f2 = 0;
            let v2 = 0;
            let ms2 = 0;
            let f3 = 0;
            let v3 = 0;
            let ms3 = 0;
            // Point 2
            if (this.usesPoint2) {
                f2 = freq * this.freqRatio2;
                v2 = vol * this.volRatio2;
                ms2 = ms * this.timeRatioB;
            }
            // Point 3
            if (this.usesPoint3) {
                f3 = freq * this.freqRatio3;
                v3 = vol * this.volRatio3;
                ms3 = ms * this.timeRatioC;
            }

            // now create the actual performance Play...
            let play = new Play;
            if (this.playPartA) {
                play.parts.push(music.createSoundEffect(this.waveA,f0,f1,v0,v1,ms1,this.effectA, this.attackA));
            }
            if (this.playPartB) {
                play.parts.push(music.createSoundEffect(this.waveB,f1,f2,v1,v2,ms2,this.effectB, this.attackB));
            } else {
                if (this.skipPartB) {   //   ...instruct a silent gap in the middle...
                play.parts.push("_"+ convertToText(Math.floor(ms * this.timeRatioB)));
                }
            }
            if (this.playPartC) {
                play.parts.push(music.createSoundEffect(this.waveC,f2,f3,v2,v3,ms3,this.effectC, this.attackC));
            }     
            //append new Play onto the end of the playList
            playList.push(play);
        }
        setDefaults(freq: number, vol: number, ms: number) {
            this.defaultFreq = freq;
            this.defaultVol = vol;
            this.defaultMs = ms;

        }
    }


    // Store a flexFX (overwriting any previous instance)
    // (When inititalising a built-in FlexFX, <builtIn> must be the BuiltInFlexFX
    // enum value that indexes its <id> in the BuiltInId[] array. Otherwise, it must be 1000)
        function storeFlexFX(builtIn: number, target: FlexFX) {
        // first delete any existing definition having this id (works even when missing!)
        flexFXList.splice(flexFXList.indexOf(flexFXList.find(i => i.id === target.id), 1), 1); 
        if (builtIn < 1000) {
            target.id = builtInId[builtIn]; // pick up its id
        }
        // add this new definition
        flexFXList.push(target); 
    }

    // kick off the background player (if not already running)
    function activatePlayer() {
        if (!(playerActive || playerStopped)){ 
            playerActive = true;
            control.inBackground(() => player());
        }
    }

    // play everything on the playList in turn
    function player() {
        let play = new Play;
        while ((playList.length > 0) && !playerStopped) { 
            let sound = "";
            play = playList.shift();
            if (play.parts[0].charAt(0) == 's') {
                // this Play is just a queued pause, so doesn't count as "PLAYING"
                sound = play.parts.shift();
                pause(parseInt(sound.slice(1, sound.length)));
            } else {
                control.raiseEvent(FLEXFX_ACTIVITY_ID, PLAYER.STARTING);
                playerPlaying = true;
                while (play.parts.length > 0) {  // play its sounds in turn
                    sound = play.parts.shift();
                    if (sound.charAt(0) == '_') {
                    // this is a gap within a sound, so DOES still count as "PLAYING"
                        pause(parseInt(sound.slice(1, sound.length)));
                    } else {
                        music.playSoundEffect(sound, SoundExpressionPlayMode.UntilDone)
                    }
                }
                control.raiseEvent(FLEXFX_ACTIVITY_ID, PLAYER.FINISHED);
                playerPlaying = false;
            }
        }
        if (playList.length == 0) {
             control.raiseEvent(FLEXFX_ACTIVITY_ID, PLAYER.ALLPLAYED);
        } // else we were prematurely stopped
        playerActive = false;
    }

    // ---- UI BLOCKS ----

    /**
     * Perform a FlexFX (built-in)
     */
    //% block="play FlexFX $choice || at pitch $pitch with strength $volume lasting $duration ms || queued = $background"
    //% group="Playing"
    //% inlineInputMode=inline
    //% expandableArgumentMode="enabled"
    //% weight=300
    //% id.defl="Ting"
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% vol.min=0 vol.max=255 vol.defl=200
    //% ms.min=0 ms.max=10000 ms.defl=800
    //% background.defl=false
    export function playBuiltInFlexFX(choice: BuiltInFlexFX, pitch: number = 0, volume: number = 0, duration: number = 0, background: boolean = false) {
        playFlexFX(builtInId[choice], pitch, volume, duration, background);
    }

    /**
     * Perform a FlexFX (user-created)
     */
    //% block="play FlexFX $id || at pitch $pitch with strength $volume lasting $duration ms || queued = $background"
    //% group="Playing"
    //% inlineInputMode=inline
    //% expandableArgumentMode="enabled"
    //% weight=300
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% vol.min=0 vol.max=255 vol.defl=200
    //% ms.min=0 ms.max=10000 ms.defl=800
    //% background.defl=false
    export function playFlexFX(id: string, pitch: number = 0, volume: number = 0, duration: number = 0, background: boolean = false) {
        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target != null) {
            // first compile and add our Play onto the playList
            target.compilePlay(pitch, volume, duration);
            activatePlayer();  // make sure it will get played
            if (!background) { // ours was the lastest Play, so simply await completion of player.
                control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.ALLPLAYED);
            }
        }
    }

    /**
     * Create a simple custom FlexFX 
     */
    //% block="create simple FlexFX: $id| using wave-shape $wave|      with attack $attack|       and effect $effect|  pitch profile goes from $startPitchPercent|                       to $endPitchPercent|volume profile goes from $startVolPercent|                       to $endVolPercent|default    pitch=$pitch|default   volume=$volume|default duration=$duration"
    //% group="Creating"
    //% inlineInputMode=external
    //% weight=230
    //% id.defl="simple"
    //% startPitchPercent.min=25 startPitchPercent.max=400 startPitchPercent.defl=100
    //% startVolPercent.min=0 startVolPercent.max=100 startVolPercent.defl=100
    //% endPitchPercent.min=10 endPitchPercent.max=400 endPitchPercent.defl=100
    //% endVolPercent.min=0 endVolPercent.max=100 endVolPercent.defl=100
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% volume.min=0 volume.max=255 volume.defl=200
    //% duration.min=0 duration.max=10000 duration.defl=800
    export function createFlexFX(
        id: string, startPitchPercent: number, startVolPercent: number,
        wave: Wave, attack: Attack, effect: Effect, endPitchPercent: number, endVolPercent: number,
        pitch: number, volume: number, duration: number, builtIn: number = 1000) {
        let target = new FlexFX(id);
        target.setPartA(startPitchPercent / 100, startVolPercent / 100, wave, attack, effect, endPitchPercent / 100, endVolPercent / 100, 1.0);
        target.setDefaults(pitch,volume,duration);
        storeFlexFX(builtIn, target);
    }


    /**
     * Create a more complex two-part custom FlexFX 
     */
    //% block="create 2-part FlexFX: $id| first using wave-shape $waveA            with attack $attackA             and effect $effectA|  then using wave-shape $waveB            with attack $attackB             and effect $effectB|  pitch profile goes from $startPitchPercent                       to $midPitchPercent                       to $endPitchPercent|volume profile goes from $startVolPercent                       to $midVolPercent                       to $endVolPercent|duration used for 1st part: $timePercentA|default    pitch=$pitch|default   volume=$volume|default duration=$duration"
    //% group="Creating"
    //% inlineInputMode=external
    //% weight=220
    //% id.defl="2-part"
    //% startPitchPercent.min=10 startPitchPercent.max=400 startPitchPercent.defl=100
    //% startVolPercent.min=0 startVolPercent.max=100 startVolPercent.defl=100
    //% midPitchPercent.min=10 midPitchPercent.max=400 midPitchPercent.defl=100
    //% midVolPercent.min=0 midVolPercent.max=100 midVolPercent.defl=100
    //% endPitchPercent.min=10 endPitchPercent.max=400 endPitchPercent.defl=100
    //% endVolPercent.min=0 endVolPercent.max=100 endVolPercent.defl=100
    //% timePercentA.min=0 timePercentA.max=100 timePercentA.defl=50
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% volume.min=0 volume.max=255 volume.defl=200
    //% duration.min=0 duration.max=10000 duration.defl=800
    export function create2PartFlexFX(
        id: string, startPitchPercent: number, startVolPercent: number,
        waveA: Wave, attackA: Attack, effectA: Effect, midPitchPercent: number, midVolPercent: number,
        waveB: Wave, attackB: Attack, effectB: Effect, endPitchPercent: number, endVolPercent: number, timePercentA: number,
        pitch: number, volume: number, duration: number, builtIn: number = 1000) {
        let target = new FlexFX(id);
        target.setPartA(startPitchPercent / 100, startVolPercent / 100, waveA, attackA, effectA, midPitchPercent / 100, midVolPercent / 100, timePercentA / 100);
        target.setPartB(waveB, attackB, effectB, endPitchPercent / 100, endVolPercent / 100,
            (100 - timePercentA / 100));
        target.setDefaults(pitch, volume, duration);
        storeFlexFX(builtIn, target);

    }

    /**
     * Create a really complex three-part custom FlexFX 
     */
    //% block="create 3-part FlexFX: $id|  first using wave-shape $waveA             with attack $attackA              and effect $effectA|   then using wave-shape $waveB             with attack $attackB              and effect $effectB|lastly using wave-shape $waveC             with attack $attackC              and effect $effectC|  pitch profile goes from $startPitchPercent                       to $pitchABPercent                       to $pitchBCPercent                       to $endPitchPercent|volume profile goes from $startVolPercent                       to $volABPercent                       to $volBCPercent                       to $endVolPercent|duration used for 1st part:$timePercentA|                   2nd part: $timePercentB|default    pitch=$pitch|default   volume=$volume|default duration=$duration"
    //% group="Creating"
    //% inlineInputMode=external
    //% weight=210
    //% id.defl="3-part"
    //% startPitchPercent.min=10 startPitchPercent.max=400 startPitchPercent.defl=100
    //% startVolPercent.min=0 startVolPercent.max=100 startVolPercent.defl=100
    //% pitchABPercent.min=10 pitchABPercent.max=400 pitchABPercent.defl=100
    //% volABPercent.min=0 volABPercent.max=100 volABPercent.defl=100
    //% pitchBCPercent.min=10 pitchBCPercent.max=400 pitchBCPercent.defl=100
    //% volBCPercent.min=0 volBCPercent.max=100 volBCPercent.defl=100
    //% endPitchPercent.min=10 endPitchPercent.max=400 endPitchPercent.defl=100
    //% endVolPercent.min=0 endVolPercent.max=100 endVolPercent.defl=100
    //% timePercentA.min=0 timePercentA.max=100 timePercentA.defl=33
    //% timePercentB.min=0 timePercentB.max=100 timePercentB.defl=33
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% volume.min=0 volume.max=255 volume.defl=200
    //% duration.min=0 duration.max=10000 duration.defl=800
    export function create3PartFlexFX(
        id: string, startPitchPercent: number, startVolPercent: number,
        waveA: Wave, attackA: Attack, effectA: Effect, pitchABPercent: number, volABPercent: number,
        waveB: Wave, attackB: Attack, effectB: Effect, pitchBCPercent: number, volBCPercent: number,
        waveC: Wave, attackC: Attack, effectC: Effect, endPitchPercent: number, endVolPercent: number,
        timePercentA: number, timePercentB: number,
        pitch: number, volume: number, duration: number, builtIn: number = 1000) {
        let target = new FlexFX(id);
        target.setPartA(startPitchPercent / 100, startVolPercent / 100, waveA, attackA, effectA, pitchABPercent / 100, volABPercent / 100, timePercentA / 100);
        target.setPartB(waveB, attackB, effectB, pitchBCPercent / 100, volBCPercent / 100, timePercentB / 100);
        target.setPartC(waveC, attackC, effectC, endPitchPercent / 100, endVolPercent / 100, (100 - timePercentA - timePercentB) / 100);
        target.setDefaults(pitch, volume, duration);
        storeFlexFX(builtIn, target);
    }

    /**
     * Create a FlexFx with two parts separated by a silence.
    */
    // NOTE: Since it's the second actual sound, PartC is called PartB in the UI
    //% block="create double FlexFX: $id|1st part using wave-shape $waveA               with attack $attackA                and effect $effectA|  pitch profile goes from $startPitchAPercent                       to $endPitchAPercent|volume profile goes from $startVolAPercent                       to $endVolAPercent|duration used for 1st part:$timePercentA|duration used for silence:  $timeGapPercent|2nd part using wave-shape $waveB               with attack $attackB                and effect $effectB|  pitch profile goes from $startPitchBPercent                       to $endPitchBPercent|volume profile goes from $startVolBPercent                       to $endVolBPercent|default    pitch=$pitch|default   volume=$volume|default duration=$duration"
    //% group="Creating"
    //% help=pxt-flexfx/createDoubleFlexFX
    //% inlineInputMode=external
    //% weight=200
    //% id.defl="double"
    //% startPitchAPercent.min=10 startPitchAPercent.max=400 startPitchAPercent.defl=100
    //% startVolAPercent.min=0 startVolAPercent.max=100 startVolAPercent.defl=100
    //% endPitchAPercent.min=10 endPitchAPercent.max=400 endPitchAPercent.defl=100
    //% endVolAPercent.min=0 endVolAPercent.max=100 endVolAPercent.defl=100
    //% startPitchBPercent.min=10 startPitchBPercent.max=400 startPitchBPercent.defl=75
    //% startVolBPercent.min=0 startVolBPercent.max=100 startVolBPercent.defl=100
    //% endPitchBPercent.min=10 endPitchBPercent.max=400 endPitchBPercent.defl=75
    //% endVolBPercent.min=0 endVolBPercent.max=100 endVolBPercent.defl=100
    //% timePercentA.min=0 timePercentA.max=100 timePercentA.defl=40
    //% timeGapPercent.min=0 timeGapPercent.max=100 timeGapPercent.defl=20
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% volume.min=0 volume.max=255 volume.defl=200
    //% duration.min=0 duration.max=10000 duration.defl=800
    export function createDoubleFlexFX(
        id: string, startPitchAPercent: number, startVolAPercent: number,
        waveA: Wave, attackA: Attack, effectA: Effect, endPitchAPercent: number, endVolAPercent: number,
        startPitchBPercent: number, startVolBPercent: number,
        waveB: Wave, attackB: Attack, effectB: Effect, endPitchBPercent: number, endVolBPercent: number,
        timePercentA: number, timeGapPercent: number,
        pitch: number, volume: number, duration: number, builtIn: number = 1000) {
        let target = new FlexFX(id);
        target.setPartA(startPitchAPercent / 100, startVolAPercent / 100, waveA, attackA, effectA, endPitchAPercent / 100, endVolAPercent / 100, timePercentA / 100);
        target.silentPartB(startPitchBPercent / 100, startVolBPercent / 100, timeGapPercent / 100);
        target.setPartC(waveB, attackB, effectB, endPitchBPercent / 100, endVolBPercent / 100, (100 - timePercentA - timeGapPercent) / 100);
        target.setDefaults(pitch, volume, duration);
        storeFlexFX(builtIn, target);
    }

    /**
     * Add a silent pause to the play-list
     */
    //% block="add a pause of $ms ms next in the play-list"
    //% group="Play-list"
    //% advanced=true
    //% weight=170
    export function performSilence(ms: number) {
        let play = new Play;
        play.parts.push("s" + convertToText(Math.floor(ms)));
        playList.push(play);
        activatePlayer();  // make sure it gets played
    }

    /**
     * Await start of next FLexFX on the play-list
     */
    //% block="wait until next FlexFX starts"
    //% group="Play-list"
    //% advanced=true
    //% weight=160
    export function awaitPlayStart() {
        if (playList.length >= 0) {
            playerStopped = false; // in case it was
            activatePlayer(); // it case it wasn't
            control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.STARTING);
        } // else nothing to wait for
    }

    /**
     * Await completion of FLexFX currently playing
     */
    //% block="wait until current FlexFX finished"
    //% group="Play-list"
    //% advanced=true
    //% weight=150
    export function awaitPlayFinish() {
        if (playerPlaying) {
            control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.FINISHED);
        } // else nothing to wait for
    }

    /**
     * Await completion of everything on the play-list
     */
    //% block="wait until everything played"
    //% group="Play-list"
    //% advanced=true
    //% weight=140
    export function awaitAllFinished() {
        if (playList.length >= 0) {
            playerStopped = false; // in case it was
            activatePlayer(); // it case it wasn't
            control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.ALLPLAYED);
        } // else nothing to wait for
    }

    /**
     * Check the length of the play-list
     */
    //% block="length of play-list"
    //% group="Play-list"
    //% advanced=true
    //% weight=130
    export function waitingToPlay(): number {
        return playList.length;
    }

    /**
     * Suspend background playing from the play-list
     */
    //% block="pause play-list"
    //% group="Play-list"
    //% advanced=true
    //% weight=120
    export function stopPlaying() {
        playerStopped = true;
    }
    
    /**
     * Resume background playing from the play-list
     */
    //% block="play play-list"
    //% group="Play-list"
    //% advanced=true
    //% weight=110
    export function startPlaying() {
        playerStopped = false;
        activatePlayer();
    }


    /**
     * Delete from the play-list everything left unplayed
     */
    //% block="forget play-list"
    //% group="Play-list"
    //% advanced=true
    //% weight=100
    export function deletePlaylist() {
        while (playList.length > 0) { playList.pop() }
    }

// Populate the FlexFX array with a selection of built-in sounds

    // cat-like 2-part flexFX
    flexFX.create2PartFlexFX("", 70, 50,
        Wave.SAWTOOTH, Attack.MEDIUM, Effect.NONE, 100, 100,
        Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 90, 80, 30,
        900, 255, 1000, BuiltInFlexFX.MIAOW);
    // Horn 2-part flexFX
    flexFX.create2PartFlexFX("", 5, 50,
        Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 100, 100,
        Wave.SINE, Attack.SLOW, Effect.NONE, 100, 80, 7,
        250, 255, 500, BuiltInFlexFX.HORN);
    // Police siren is a double flexFX
    flexFX.createDoubleFlexFX("",
        95, 80, Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 100,
        70, 100, Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 75, 80, 45, 10,
        800, 200, 1000, BuiltInFlexFX.SIREN);

    // Violin-like 3-part flexFX
    flexFX.create3PartFlexFX("", 1, 100,
        Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 100, 75,
        Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 75,
        Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 10, 100, 10, 85,
        440, 200, 500, BuiltInFlexFX.VIOLIN);

    /*
    SNORE       700  10%
    NOI VIB LIN  14 100%   | 50%
    NOI VIB LIN 100   0%   | 50%
    NOTE: The noise-generator is highly sensitive to the chosen frequency-trajectory, and these strange values have been experimentally derived.
    Always invoke Snore.performUsing() with the lowest (freq=50)
    */
}
