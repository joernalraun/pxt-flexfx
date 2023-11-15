```package
pxt-flexfx=github:grandpabond/pxt-flexfx
```

# FlexFX - Flexible Sound-effect Recipes
Many microbit projects can be brought to life by adding sound-effects to indicate their state.

The ``||music:Music||`` category has a ``||music:micro:bit(V2)||`` section with blocks for **sound-expressions**. 
These let you build some amazing sounds, but sometimes you need something a bit more complex.

A ``flexFX:flexFX||`` provides a "sound journey", following a sonic path through time that 
flows smoothly between fixed [pitch, volume] points, simultaneously tracking the pitch-profile 
and the volume-profile. It stitches together multiple sound-expressions to be played one after the 
other, giving a smoothly varying result. 

As its name suggests, a ``flexFX:flexFX||`` recipe can be re-used flexibly, with different performances
(or ``flexFX:Plays||``) that independently scale these profiles and stretch or shrink their duration. 
You can choose which ``flexFX:flexFX||`` to play from a drop-down list of built-in sounds.

Any ``flexFX:flexFX||`` can also be used as the "instrument" on which to play a short melody.
You can choose from a small selection of built-in ``flexFX:Tunes||``, automatically creating a separate
``flexFX:Play||`` for each of its notes.

When playing a ``flexFX:flexFX||`` or a ``flexFX:Tune||``, you can either wait for it to finish, 
or you can let it continue playing in the background while executing other code. If it hasn't already finished when you 
play another one, the new ``flexFX:Play(s)||`` will be added to the ``flexFX:Play-list||``, so you can queue-up 
several sounds to happen in the background. You can interact with this ``flexFX:Play-list||`` to synchronise 
the sound-track with your other codes. (See ``flexFX:Background Play-list||`` below).

If you need a sound that is not built-in, you can create your own. (See ``flexFX:Building a FlexFX||`` below)

You can also compose your own Tunes, using a simple text notation. (See ``flexFX:Composing Tunes||`` below)

## Selecting a FlexFX #flexFX-builtInFlexFX 

```sig
    builtInFlexFX(fx): string 
```

Every ``flexFX:flexFX||`` has a unique name: its identifier. This reporter block (to be used as the first 
parameter of the ``flexFX:playFlexFX||`` block below) provides a drop-down list from which you can choose 
a built-in ``flexFX:flexFX||`` to hear.
 
## Playing a FlexFX #flexFX-playFlexFX 

 ```sig 
 playFlexFX(id, wait, pitch, volumeLimit, newDuration) { 
 ```
This lets you play a ``flexFX:flexFX||``, optionally changing some of its characteristics. 
  
 ``flexFX:id||`` says which one to play.
  
 ``flexFX:wait||`` is a switch. If **"True"**, the sound is played to completion. If **"False"**,  
 it is added to the ``flexFX:Play-list||`` to be played in the background. (If the ``flexFX:Play-list||`` is empty, 
 it will start playing immediately.) 
 
By repeatedly clicking on the "+" you can access three additional parameters to change the pitch, volume or duration of this Play. 
  
 ``flexFX:pitch||``  lets you specify a different **base-frequency** for this performance. 
 (The base-frequency is the average pitch across the whole sound). It is measured in Hertz, 
 and for convenience you can set the new ``flexFX:pitch||`` using any of the ``||music:Note||`` specifiers.
  
 ``flexFX:volumeLimit||`` sets the peak volume as a number in the range 0-255. 
  
 ``flexFX:newDuration||`` sets how long (in milliseconds) the overall performance will last. 
  
 The following example would play the built-in FlexFX called **"chime"** three times over,  
 with descending pitch, and increasing volume. The first two performances last just 0.4 seconds each,  
 while the final performance takes 1.6 seconds to complete. 
  
 ```block 
 flexFX.playFlexFX("chime", Music.G4, 100, 400); 
 flexFX.playFlexFX("chime", Music.E4, 175, 400); 
 flexFX.playFlexFX("chime", Music.C4, 250, 1600); 
 ``` 

## Selecting a Tune #flexFX-builtInTune 

```sig
    builtInTune(tune): string 
```
This reporter block (to be used as the first parameter  of the ``flexFX:playTune||`` block below) 
provides a drop-down list from which you can choose a built-in ``flexFX:Tune||`` to play.
  
## Playing a Tune #flexFX-playTune

```sig
playTune(title, flexId, wait, transpose, volumeLimit, tuneDuration)
```

 ``flexFX:title||`` is the name of the ``flexFX:Tune||` to be played.
 
 ``flexFX:flexId||`` is the name of the``flexFX:FlexFX||`` to be used to play it.

 ``flexFX:wait||`` is a switch. If **"True"**, the ``flexFX:Tune||` is played to completion. If **"False"**,  
 its sequence of ``flexFX:Plays||`` all get added to the ``flexFX:Play-list||`` to be played in the background. 
 (If the ``flexFX:Play-list||`` is currently empty, the ``flexFX:Tune||` will start playing immediately.) 
 
By repeatedly clicking on the "+" you can access three additional parameters to change the pitch, volume or duration
of this performance of the ``flexFX:Tune||`. 
  
 ``flexFX:transpose||`` specifies a number of semitone steps by which to raise (or, if negative, lower) all notes in the ``flexFX:Tune||`.
  
 ``flexFX:volumeLimit||`` sets the peak volume for every note, as a number in the range 0-255. 
  
 ``flexFX:tuneDuration||`` sets how long (in milliseconds) the overall performance will last. 


# Background Play-list 
 Often, a sound-effect or melody is intended to accompany other actions that require codes to be executed. 
  
 By switching the **wait** parameter of ``flexFX:playFlexFX||`` or ``flexFX:playTune||``  
 to **true**, the function will return immediately, and queue-up the FlexFX performance(s)  
 (which we call ``flexFX:Plays||``) so that they happen in the background.  
  
 You can queue-up many different ``flexFX:Plays||`` on the internal ``flexFX:Play-list||``,  
 and the background process will just work steadily through them, one-at-a-time,  
 allowing your code to get on with something else.

### ~reminder
 Obviously, the queue of ``flexFX:Plays||`` take up memory: if the ``flexFX:Play-list||`` is allowed to get too long there will come a point at
 which this runs out! 
### ~


 Sometimes you might want tighter control over exactly when each queued ``flexFX:Play||`` occurs, so various blocks  
 are provided that let you interact with the ``flexFX:Play-list||``. 
  
 ## Spacing-out background Plays  #flexFX-playSilence                 
 ```sig 
    flexFX.playSilence(ms) 
 ``` 
  
 When queueing-up a series of ``flexFX:Plays||``, you may not always want them to follow-on straightaway.  
 Use this function to space-out your ``flexFX:Plays||``, by adding a silent pause onto the ``flexFX:Play-list||``. 
 
    ``flexFX:ms||`` : specifies the length of the gap in milliseconds.
   
 This example plays three bell-sounds in the background, separated by gaps of 1.5 seconds: 
 ```block 
     flexFX.playFlexFX("ting", Note.G5, 100, 400, true); 
     flexFX.playSilence(1500); 
     flexFX.playFlexFX("ting", Note.E5, 175, 400, true); 
     flexFX.playSilence(1500); 
     flexFX.playFlexFX("ting", Note.C5, 250, 1600, true); 
 ``` 
  
 ## Waiting for the Play-list... 
 If your codes need to synchronise other activites (such as servo-actions or display-changes) precisely  
 to the performance of a queued sequence of sound-effects, you can use one of these **wait** blocks: 
  
 ## Waiting for the next Play to start  #flexFX-awaitPlayStart 
 ```sig 
    flexFX.awaitPlayStart()   
 ``` 
 Awaits start of the next FlexFX performance on the ``flexFX:Play-list||``. (Returns immediately if there are none.) 
  
 ## Waiting for the current Play to finish  #flexFX-awaitPlayFinish 
 ```sig 
    flexFX.awaitPlayFinish()  
 ``` 
 Awaits completion of the FlexFX performance currently playing. (Returns immediately if there are none.) 
  
 ## Waiting for the whole Play-list to finish  #flexFX-awaitAllFinished 
 ```sig 
    flexFX.awaitAllFinished()   
 ``` 
 Awaits completion of everything on the ``flexFX:Play-list||``.  (Returns immediately if there are none.) 
  
 ## Pausing play-back of the Play-list  #flexFX-stopPlaying 
 ```sig 
    flexFX.stopPlaying()  
 ``` 
 You can also pause (and later re-start) the background ``flexFX:Play-list||``: 
 ``flexFX:stopPlaying||`` suspends future background playing from the ``flexFX:Play-list||`` 
 (once any currently active ``flexFX:Play||`` has finished). 
  
 ## Playing the rest of the Play-list  #flexFX-startPlaying 
 ```sig 
    flexFX.startPlaying()  
 ``` 
 This unlocks the ``flexFX:Play-list||``, resuming background playing of any queued (or future) ``flexFX:Plays||``.   
  
 ## Checking how many Plays remain on the Play-list  #flexFX-waitingToPlay 
 ```sig 
    flexFX.waitingToPlay(): number  
 ``` 
 Sometimes it may be important for your codes to know how far the ``flexFX:Play-list||`` has got. 
 This reporter block returns the current length of the (unplayed) ``flexFX:Play-list||``. 
  
 ## Abandoning a Play-list you don't need any more  #flexFX-deletePlaylist 
 ```sig  
    flexFX.deletePlaylist()   
 ``` 
 Deletes from the ``flexFX:Play-list||`` everything left unplayed. 
  
  
 # Play-list Example:  Lip-sync
 So for example this code snippet would choreograph a crying face, alternating the two icons to achieve lip-sync.  
  
 The code queues up some ``flexFX:Plays||`` of the built-in FlexFX "cry" on the ``flexFX:Play-list||``,  
 with different pauses queued in-between. Note that by calling ``flexFX:stopPlaying||`` first,  
 we prevent the first ``flexFX:Plays||`` happening until we are ready to call ``flexFX:startPlaying||``.  
 Within the loop, we use ``flexFX:awaitPlayStart||`` and ``flexFX:awaitPlayFinish||`` to synchronise the mouth-changes. 

 ```block 
 // first queue up some Plays on the Play-list, with pauses queued in-between 
 flexFX.stopPlaying();  // don't start Playing yet... 
 flexFX.playFlexFX("cry", 200, 250, 1000, true); 
 flexFX.playSilence(2000); 
 flexFX.playFlexFX("cry", 300, 250, 1000, true); 
 flexFX.playSilence(1500); 
 flexFX.playFlexFX("cry", 400, 250, 1000, true); 
 flexFX.playSilence(1000); 
 flexFX.playFlexFX("cry", 600, 250, 1000, true); 
 flexFX.playSilence(800); 
 flexFX.playFlexFX("cry", 800, 250, 1000, true); 
 basic.showNumber(flexFX.waitingToPlay()); 
 basic.pause(500);

 // use events to choreograph faces to sounds 
 basic.showIcon(IconNames.Sad); 
 basic.pause(1000) 
 flexFX.startPlaying(); // kick off the Play-list 
 while(flexFX.waitingToPlay() > 0) { 
     flexFX.awaitPlayStart(); // starting the next (non-silent) Play... 
     basic.showIcon(IconNames.Surprised); // ... so open the mouth 
     flexFX.awaitPlayFinish(); 
     basic.showIcon(IconNames.Sad); // close the mouth again 
     // (the background Player now "plays" the queued silence) 
 } 
 basic.pause(500); 
 basic.showIcon(IconNames.Happy); 
 ``` 
  
 # Building a FlexFX 
 There are lots of ``flexFX:flexFX||`` sounds already built-in, but if you wanted something different 
 there are some advanced blocks (under ``flexFX:more...||``) that will let you build your own from scratch. 
  
 ## Anatomy of a FlexFX 
 The basic idea is that a FlexFX is built from one or more **parts**. 
  
 Each part is a sound-expression that takes a particular **style** of sound and varies its **[pitch,volume]**  
 parameters from a start-point to an end-point, over some period of time. Successive parts inherit the previous end-point as their own start-point.
 
Note that each part can use a different style of sound, specified by its own **wave-shape** and **attack**, plus a possible **effect**. 
  
 ### Style: Wave-shape 
 The wave-shape sets the basic tonal quality: the spikier the wave, the harsher the sound. There are six shapes available: 
  
 ``flexFX:Pure||`` selects a Sine-wave, a smooth, clean shape giving a smooth, clean tone. 
  
 ``flexFX:Buzzy||`` selects a Square-wave containing harmonics, partial tones that are multiples (in this case 3,5,7...) of the main frequency. This gives a square wave a richer and buzzier sound. 
  
 ``flexFX:Bright||`` selects a Triangular-wave containing the same odd harmonics as a square wave, but with the higher ones tapering off. It sounds clear and bright. 
  
 ``flexFX:Harsh||`` selects a Sawtooth-wave which is the richest in terms of harmonics, making it sound even harsher than a square wave, 
  
 ``flexFX:Noisy||`` selects a randomised wave-shape that takes harshness to the extreme: it doesn't have any real pitch left at all! 
  
 ``flexFX:Silence||`` is an option that allows you to put silent gaps into your sound, while specify the start-point for the next part. 
  
 ### Style: Attack 
 The attack chooses how fast the pitch moves from the start-point to the end-point of the FlexFX part. 
  
 ``flexFX:Fast||`` gives an extreme percussive attack, moving very rapidly away from the start-point towards the end-point.  
  
 ``flexFX:Medium||`` follows a curved path, changing more quickly to start with, then gradually slowing down. 
  
 ``flexFX:Slow||`` selects a simple straight-line path, changing evenly over time. 
  
 ``flexFX:Delayed||`` moves slowly away from the start-point, accelerating with time. 
  
 ### Style: Effect 
 There are three special-effects that can optionally be added. 
  
 ``flexFX:Vibrato||`` wobbles the pitch up and down as it progresses. 
  
 ``flexFX:Tremolo||`` flutters the volume throughout. 
  
 ``flexFX:Warble||`` is a rather more extreme version of Vibrato. 
  
 ``flexFX:None||`` skips any of these effects. 
  
 There is currently no control of how rapidly or deeply these effects are applied. (This functionality would be a welcome upgrade
 to the core system). 
  
 ### Profiles 
A FlexFX stitches its parts together, so that the end-point of one part forms the start-point of the next part. This means that its 
pitch will vary smoothly across the parts, as will the volume. We call these sets of fixed points the **pitch-profile** and the **volume-profile**. 
  
 ## Creating a FlexFX #flexFX-createFlexFX 
  
 ```sig 
 flexFX.createFlexFX() 
 ``` 
A new ``flexFX:FlexFX||`` has just one part (so is really just a tuneable version of a standard sound-expression).
     * Specify the first (or only) part of a new FlexFX.
     * Any existing FlexFX with the same "id" is first deleted.
     * @param id  the identifier of the flexFX to be created or changed
     * @param startPitch  the initial frequency of the sound (in Hz)
     * @param startVolume  the initial volume of the sound (0 to 255)
     * @param wave  chooses the wave-form that characterises this sound
     * @param attack  chooses how fast the sound moves from its initial to final pitch
     * @param effect  chooses a possible modification to the sound, such as vibrato
     * @param endPitch  the final frequency of the sound (in Hz)
     * @param endVolume  the final volume of the sound (0 to 255)
     * @param duration  the duration of the sound (in ms)   



 ## Extending a FlexFX #flexFX-extendFlexFX 
Every call to  ``flexFX:extendFlexFX||`` adds another part to your ``flexFX:FlexFX||``.
* Add another part to an existing FlexFX, continuing from its current final frequency and volume.
     * 
     * @param id  - the identifier of the flexFX to be extended
     * @param wave  - chooses the wave-form that characterises this next part
     * @param attack  - chooses how fast this part moves from its initial to final pitch
     * @param effect  - chooses a possible modification to this part, such as vibrato
     * @param endPitch  - the new final frequency of the FlexFX (in Hz)
     * @param endVolume  - the new final volume of the FlexFX (0 to 255)
     * @param duration  - the additional duration of this new part (in ms)
    
  

### ~reminder
 By specifying it by name (its **id**), any ``flexFX:FlexFX||`` can be freely modified using  ``flexFX:createFlexFX||`` 
 or ``flexFX:extendFlexFX||``. The basic rule is that if it exists, it gets changed; otherwise it is created from scratch. 
 Obviously, each ``flexFX:FlexFX||`` you create will take up memory:  if you create too many, there will come a point 
 at which memory runs out! 
### ~
 
  





 ## EKO-notation 
 FlexFX Tunes are written out as text-strings using a special code that we call **EKO_notation**. 
 Notes are defined by three-part EKO codes, separated by spaces. 
  
  ``flexFX:Extent||``: The first part of the code is a number showing how long the note should last (measured in quarter-beat ticks). 
  
  ``flexFX:Key||``: This is followed by the key-letter [CDEFGAB]. For the black keys (on a piano) you add "#" (sharp) to the key below, or "b" (flat) to the key above. 
  
  ``flexFX:Octave||``: The last part of the code gives the octave-number [1‐8], where C4 is middle-C. 
  
  
 So, the first line of "Happy Birthday" might be scored as  "2G4 1G4 3A4 3G4 3C5 6B4". 
  
 ### Tempo 
 The length of a tick controls how fast a ``flexFX:Tune||`` is played. The initial default speed of 120 beats-per-minute (BPM) 
 means that the default quarter-beat tick lasts 125 ms. 
 At this default tempo, the following table shows how the ``flexFX:Extent||`` relates to conventional musical note-lengths: 
  
  
 | Extent | length          |ms    |per-Sec|per-Min| 
 | ---:   | :-------------- | ---: | ----: | ----: | 
 |   1         | semi-quaver           |  125 |  8.00 |   480 | 
 |   2         | quaver          |  250 |  4.00 |   240 | 
 |   4         | crotchet        |  500 |  2.00 |   120 | 
 |   6         | dotted-crotchet |  750 |  1.33 |    80 | 
 |   8         | minim           | 1000 |  1.00 |    60 | 
 |  12         | dotted-minim    | 1500 |  0.67 |    40 | 
 |  16         | semibreve       | 2000 |  0.50 |    30 | 
  
  
  
  
 ###reminder 
 In the past, melodies have often been written down as text using **ABC-notation**. This scheme lists the notes to be played quite simply, 
 but involves many complex rhythmic and octave-selection conventions that require a fair degree of musical expertise to master.
 Although not as compact, our EKO-notation is far more logical and straightforward, and is much easier for beginners to use. 
 ### 
  
## Composing a new Tune #flexFX-composeTune 

 ```sig 
 composeTune(title, score)
 ```
 This block lets you compose a new Tune, using EKO-notation (Extent-Key-Octave).
   
 ``flexFX:title||`` is the song-title  
 ``flexFX:score||`` is simply a list of the notes in the melody, defined as EKO codes.
  
## Extending a Tune #flexFX-extendTune 

 ```sig 
 extendTune(title, score) 
``` 

For all but the shortest melody, the score would get unmanageably long (and confusing) to specify on just a single call.
By following ``flexFX:composeTune||`` with one or more calls to ``flexFX:extendTune||``, you can write it out more conveniently,
 one line at a time.	

 ``flexFX:title||`` identifies the song to be added-to.  
 ``flexFX:score||`` is an EKO-codes list of the notes to be added to the end of the Tune.
  
### ~reminder
 By specifying its title, any ``flexFX:Tune||`` can be freely modified using  ``flexFX:composeTune||``, or ``flexFX:extendTune||``.
 The basic rule is that if it exists, it gets changed; otherwise it is created from scratch. Obviously, each ``flexFX:Tune||`` 
 you create will take up memory: the longer the tune, the more memory required to hold it. If you get too creative, there will come 
 a point at which memory runs out! 
### ~
 
 

-----------------------------------------------------------------------
-----------------------------------------------------------------------
# Acknowledgements 
Credit must go to Bill Siever (on the Micro:bit Developer Slack Forum) for his experienced insights into the workings 
of the Micro:bit run-time, and his unstinting assistance in navigating the complex process of publishing an Extension.
Credit must also go to Martin Williams (of the Micro:bit Educational Foundation) for his meticulous appraisals 
and generous inputs that have been invaluable in developoing and evolving the FlexFX design.


> Open this page at [https://grandpabond.github.io/pxt-flexfx/](https://grandpabond.github.io/pxt-flexfx/)

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **https://github.com/grandpabond/pxt-flexfx** and import

## Edit this project

To edit this repository in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/grandpabond/pxt-flexfx** and click import

#### Metadata (used for search, rendering)

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
