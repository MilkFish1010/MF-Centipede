/**
 * Plush Centipede Crawler
 * Creepy Ragdoll Interactive Simulation
 *
 * Features:
 * - Proper left/right mirrored cloth limb anatomy matching photo proportions
 * - Fixed idle audio spamming with landing transition latch & movement gating
 * - Poop attached clone mechanic with multi-stage birth animation:
 *   (head stretch -> pop snap -> torso extrusion -> wing-like limb unfolding)
 * - Articulated snake chain kinematics
 * - Desynchronized alternating crawling gait (Evens synced together, Odds synced together)
 * - Creepy choral singing synthesizer with distinct pitch for each segment & animated opening mouths
 */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIS ENGINE ---
  class CrawlerAudio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.voices = new Map(); // Active singing voices by segment index
      this.droneOsc = null;
      this.droneGain = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.startAmbientDrone();
    }

    // Subtle low-frequency eerie ambient drone
    startAmbientDrone() {
      if (!this.enabled || this.droneOsc || !this.ctx) return;
      try {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 sub-hum

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(56.5, this.ctx.currentTime); // Slight binaural beat

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(110, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.025, this.ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();
        this.droneOsc = osc1;
        this.droneGain = gain;
      } catch (e) {
        // AudioContext may still need user gesture
      }
    }

    // Padded cloth limb tap or sharp chitin needle scuttle against floor
    playCrawlTap(isHand = true, speed = 1.0, isSharp = false) {
      if (!this.enabled) return;
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      if (isSharp) {
        // Sharp insectoid chitin needle tick
        osc.type = 'sawtooth';
        const startFreq = isHand ? 340 + Math.random() * 40 : 260 + Math.random() * 30;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.04);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, now);
        filter.Q.setValueAtTime(2.8, now);

        const vol = (isHand ? 0.12 : 0.16) * Math.min(speed, 1.5);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
        return;
      }

      osc.type = isHand ? 'triangle' : 'sine';
      const startFreq = isHand ? 120 + Math.random() * 20 : 75 + Math.random() * 15;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now);

      const vol = (isHand ? 0.16 : 0.22) * Math.min(speed, 1.5);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    }

    // Subtle fabric slide rustle
    playFabricSlide() {
      if (!this.enabled || Math.random() > 0.35) return;
      this.init();
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(620, now);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    }

    // Elastic tension stretch sound during head emergence
    playStretchSound(progress) {
      if (!this.enabled || Math.random() > 0.4) return;
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      const baseFreq = 160 + progress * 240 + (Math.random() - 0.5) * 20;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.linearRampToValueAtTime(baseFreq + 40, now + 0.07);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450 + progress * 300, now);
      filter.Q.setValueAtTime(3.5, now);

      gain.gain.setValueAtTime(0.06 * progress, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    }

    // Fleshy / cloth pop snap when the head breaks free
    playPopSound() {
      if (!this.enabled) return;
      this.init();
      const now = this.ctx.currentTime;

      // Pop oscillator
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);

      // Squelch / snap transient burst
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(900, now);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.18, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
    }

    // Wing / fabric unfurling sound
    playWingUnfurlSound() {
      if (!this.enabled) return;
      this.init();
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        const env = Math.sin(t * Math.PI) * (1 - t * 0.3);
        data[i] = (Math.random() * 2 - 1) * env;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.35);
      filter.Q.setValueAtTime(2.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    }

    // Formant vocal synthesizer for creepy multi-pitch choir
    startSinging(voiceId, pitchHz) {
      if (!this.enabled) return;
      this.init();
      if (this.voices.has(voiceId)) return;

      const now = this.ctx.currentTime;

      // Rich harmonic oscillator (sawtooth/triangle blend for human vocal cord buzz)
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitchHz, now);

      // Vibrato LFO for eerie human instability
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.4 + Math.random() * 0.6, now);
      lfoGain.gain.setValueAtTime(pitchHz * 0.025, now); // ~2.5% vibrato depth
      lfo.connect(osc.frequency);
      lfo.start(now);

      // Dual formant bandpass filters simulating mouth / vocal tract resonance ("aaah" / "oooh")
      const formant1 = this.ctx.createBiquadFilter();
      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(700, now);
      formant1.Q.setValueAtTime(3.8, now);

      const formant2 = this.ctx.createBiquadFilter();
      formant2.type = 'bandpass';
      formant2.frequency.setValueAtTime(1250, now);
      formant2.Q.setValueAtTime(4.2, now);

      const voiceGain = this.ctx.createGain();
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.12, now + 0.18); // Soft attack

      osc.connect(formant1);
      osc.connect(formant2);
      formant1.connect(voiceGain);
      formant2.connect(voiceGain);
      voiceGain.connect(this.ctx.destination);

      osc.start(now);

      this.voices.set(voiceId, {
        osc,
        lfo,
        voiceGain,
        now
      });
    }

    stopSinging(voiceId) {
      const v = this.voices.get(voiceId);
      if (!v || !this.ctx) return;
      const now = this.ctx.currentTime;
      try {
        v.voiceGain.gain.cancelScheduledValues(now);
        v.voiceGain.gain.setValueAtTime(v.voiceGain.gain.value, now);
        v.voiceGain.gain.linearRampToValueAtTime(0.0001, now + 0.22); // Smooth release

        v.osc.stop(now + 0.25);
        v.lfo.stop(now + 0.25);
      } catch (e) {}
      this.voices.delete(voiceId);
    }

    stopAllSinging() {
      for (const id of Array.from(this.voices.keys())) {
        this.stopSinging(id);
      }
    }
  }

  const audio = new CrawlerAudio();

  // Canvas setup
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Angle utilities
  function angleDiff(target, source) {
    let diff = target - source;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return diff;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // 2-Bone Analytical Inverse Kinematics for limbs
  function solveIK(originX, originY, targetX, targetY, len1, len2, bendSign = 1) {
    const dx = targetX - originX;
    const dy = targetY - originY;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const clampedDist = Math.min(dist, len1 + len2 - 0.5);

    const baseAngle = Math.atan2(dy, dx);
    const cosA = (len1 * len1 + clampedDist * clampedDist - len2 * len2) / (2 * len1 * clampedDist);
    const safeCosA = Math.max(-1, Math.min(1, cosA));
    const angleA = Math.acos(safeCosA);

    const jointAngle = baseAngle + bendSign * angleA;
    const jointX = originX + Math.cos(jointAngle) * len1;
    const jointY = originY + Math.sin(jointAngle) * len1;

    return {
      joint: { x: jointX, y: jointY },
      end: { x: targetX, y: targetY }
    };
  }

  // Eerie scale frequencies for choir (creepy minor/diminished intervals)
  // A2, C3, Eb3, F3, Ab3, A3, C4, Eb4, F#4, A4...
  const PITCH_SCALE = [110.0, 130.81, 155.56, 174.61, 207.65, 220.0, 261.63, 311.13, 369.99, 440.0];
  function getSegmentPitch(index) {
    if (index < PITCH_SCALE.length) {
      return PITCH_SCALE[index];
    }
    const octave = Math.floor(index / PITCH_SCALE.length);
    const modIdx = index % PITCH_SCALE.length;
    return PITCH_SCALE[modIdx] * Math.pow(2, octave);
  }

  // --- PATH TRAIL FOR SMOOTH SNAKE FOLLOWING ---
  class PathTrail {
    constructor() {
      this.points = [];
      this.totalDist = 0;
    }

    reset(startX, startY, startHeading, maxLen = 3500) {
      this.points = [];
      this.totalDist = 0;
      const fwdX = Math.cos(startHeading);
      const fwdY = Math.sin(startHeading);

      const step = 4;
      const count = Math.ceil(maxLen / step);
      for (let i = count; i >= 0; i--) {
        const d = (count - i) * step;
        this.points.push({
          x: startX - fwdX * (i * step),
          y: startY - fwdY * (i * step),
          heading: startHeading,
          dist: d
        });
      }
      this.totalDist = count * step;
    }

    addPoint(x, y, heading) {
      const last = this.points[this.points.length - 1];
      if (!last) {
        this.points.push({ x, y, heading, dist: 0 });
        return;
      }

      const dx = x - last.x;
      const dy = y - last.y;
      const d = Math.hypot(dx, dy);

      // Record point if moved at least 2px along path
      if (d >= 2.0) {
        this.totalDist += d;
        this.points.push({
          x,
          y,
          heading,
          dist: this.totalDist
        });

        // Keep maximum 4500px history with amortized bulk pruning (avoids O(N) shift every frame)
        if (this.points.length > 2200) {
          const pruneTarget = this.totalDist - 4500;
          let cutIdx = 0;
          while (cutIdx < this.points.length - 100 && this.points[cutIdx].dist < pruneTarget) {
            cutIdx++;
          }
          if (cutIdx > 50) {
            this.points.splice(0, cutIdx);
          }
        }
      } else {
        // Update head heading when pivoting
        last.heading = heading;
      }
    }

    getPointAtDistance(distBehind) {
      const targetDist = this.totalDist - distBehind;

      if (this.points.length === 0) {
        return { x: 0, y: 0, heading: 0 };
      }
      if (targetDist <= this.points[0].dist) {
        return this.points[0];
      }
      if (targetDist >= this.points[this.points.length - 1].dist) {
        return this.points[this.points.length - 1];
      }

      let low = 0;
      let high = this.points.length - 1;

      while (low <= high) {
        const mid = (low + high) >> 1;
        if (this.points[mid].dist < targetDist) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      const i1 = Math.max(0, high);
      const i2 = Math.min(this.points.length - 1, low);

      if (i1 === i2) {
        return this.points[i1];
      }

      const p1 = this.points[i1];
      const p2 = this.points[i2];
      const span = p2.dist - p1.dist || 0.0001;
      const t = Math.max(0, Math.min(1, (targetDist - p1.dist) / span));

      return {
        x: lerp(p1.x, p2.x, t),
        y: lerp(p1.y, p2.y, t),
        heading: p1.heading + angleDiff(p2.heading, p1.heading) * t
      };
    }
  }

  // --- CENTIPEDE SEGMENT CLASS ---
  class CentipedeSegment {
    constructor(x, y, index = 0, parent = null) {
      this.x = x;
      this.y = y;
      this.index = index;
      this.parent = parent;
      this.child = null;

      this.heading = parent ? parent.heading : -Math.PI / 2;
      this.speed = 0;
      this.turnSpeed = 0;

      // Torso anatomy dimensions
      this.chestDist = 32;
      this.pelvisDist = 36;
      this.neckDist = 52;
      this.headDist = 88;

      // Limbs segment lengths:
      // Leader (index === 0) keeps original plush doll cloth limb proportions
      // Follower segments (index > 0) have shorter and sharper needle/talon limbs
      this.isSharpLimb = this.index > 0;
      if (this.isSharpLimb) {
        this.armUpperLen = 29;
        this.armLowerLen = 27;
        this.legUpperLen = 34;
        this.legLowerLen = 31;
      } else {
        this.armUpperLen = 50;
        this.armLowerLen = 54;
        this.legUpperLen = 58;
        this.legLowerLen = 54;
      }

      // Limb state: position, target plant, and landing latch to PREVENT AUDIO SPAM
      const initArmOut = this.isSharpLimb ? 58 : 90;
      const initArmFwd = this.isSharpLimb ? 26 : 50;
      const initLegOut = this.isSharpLimb ? 52 : 80;
      const initLegBack = this.isSharpLimb ? 55 : 95;

      this.handL = { x: x - initArmOut, y: y - initArmFwd, plantedX: x - initArmOut, plantedY: y - initArmFwd, progress: 1, hasLanded: true };
      this.handR = { x: x + initArmOut, y: y - initArmFwd, plantedX: x + initArmOut, plantedY: y - initArmFwd, progress: 1, hasLanded: true };
      this.footL = { x: x - initLegOut, y: y + initLegBack, plantedX: x - initLegOut, plantedY: y + initLegBack, progress: 1, hasLanded: true };
      this.footR = { x: x + initLegOut, y: y + initLegBack, plantedX: x + initLegOut, plantedY: y + initLegBack, progress: 1, hasLanded: true };

      // Head ragdoll inertia
      this.headPos = { x: x, y: y - this.headDist };
      this.headVel = { x: 0, y: 0 };
      this.spineWiggle = 0;

      // Birth State Machine:
      // 'born' (normal), 'stretching_head', 'popping_head', 'emerging_torso', 'opening_wings'
      this.birthState = parent ? 'stretching_head' : 'born';
      this.birthTimer = 0;
      this.stretchDist = 0;
      this.headPopped = !parent;
      this.torsoProgress = parent ? 0 : 1;
      this.wingProgress = parent ? 0 : 1; // 0 = tucked tight against body, 1 = fully open like wings

      // Singing state
      this.isSinging = false;
      this.mouthOpen = 0;
      this.singPitch = getSegmentPitch(index);
      this.vocalTremor = 0;

      // Interactive drag point
      this.dragTarget = null;
      this.dragOffset = { x: 0, y: 0 };

      if (!parent) {
        this.syncRestPose();
      }
    }

    // Returns world coordinates of the lower tip of the butt
    getButtPosition() {
      const fwdX = Math.cos(this.heading);
      const fwdY = Math.sin(this.heading);
      return {
        x: this.x - fwdX * 58,
        y: this.y - fwdY * 58
      };
    }

    // Returns butt coordinate for attaching the terminal dinosaur tail
    getEffectiveTailButt() {
      if (this.birthState === 'stretching_head' || this.birthState === 'popping_head') {
        return this.parent ? this.parent.getButtPosition() : this.getButtPosition();
      }
      if (this.birthState === 'emerging_torso') {
        const fwdX = Math.cos(this.heading);
        const fwdY = Math.sin(this.heading);
        const neckX = this.x + fwdX * 52;
        const neckY = this.y + fwdY * 52;
        const curLen = (36 + 16) * 2 * this.torsoProgress;
        return {
          x: neckX - fwdX * curLen,
          y: neckY - fwdY * curLen
        };
      }
      return this.getButtPosition();
    }

    // Splayed rest pose (doll arms for leader, sharp insectoid stance for followers)
    syncRestPose() {
      const fwdX = Math.cos(this.heading);
      const fwdY = Math.sin(this.heading);
      const rightX = -fwdY;
      const rightY = fwdX;

      const chestX = this.x + fwdX * this.chestDist;
      const chestY = this.y + fwdY * this.chestDist;
      const pelvisX = this.x - fwdX * this.pelvisDist;
      const pelvisY = this.y - fwdY * this.pelvisDist;

      const handOut = this.isSharpLimb ? 58 : 98;
      const handFwd = this.isSharpLimb ? 6 : -8;
      const footOut = this.isSharpLimb ? 52 : 85;
      const footBack = this.isSharpLimb ? 36 : 55;

      // Outstretched arms / claws
      this.handL.x = this.handL.plantedX = chestX - rightX * handOut + fwdX * handFwd;
      this.handL.y = this.handL.plantedY = chestY - rightY * handOut + fwdY * handFwd;
      this.handL.hasLanded = true;

      this.handR.x = this.handR.plantedX = chestX + rightX * handOut + fwdX * handFwd;
      this.handR.y = this.handR.plantedY = chestY + rightY * handOut + fwdY * handFwd;
      this.handR.hasLanded = true;

      // Outward pointing feet / talons
      this.footL.x = this.footL.plantedX = pelvisX - rightX * footOut - fwdX * footBack;
      this.footL.y = this.footL.plantedY = pelvisY - rightY * footOut - fwdY * footBack;
      this.footL.hasLanded = true;

      this.footR.x = this.footR.plantedX = pelvisX + rightX * footOut - fwdX * footBack;
      this.footR.y = this.footR.plantedY = pelvisY + rightY * footOut - fwdY * footBack;
      this.footR.hasLanded = true;

      this.headPos.x = this.x + fwdX * (this.parent ? 30 : this.headDist);
      this.headPos.y = this.y + fwdY * (this.parent ? 30 : this.headDist);
    }

    // Updates birth state machine
    // 1. Head stretches until popped
    // 2. Torso comes from the head
    // 3. Limbs come out like stretching wings AFTER torso is complete
    updateBirth(dt) {
      if (this.birthState === 'born') return;

      this.birthTimer += dt;

      // 1. Head stretching phase (0 to 1.1s)
      if (this.birthState === 'stretching_head') {
        const progress = Math.min(1.0, this.birthTimer / 1.1);
        this.stretchDist = lerp(0, 48, progress);
        audio.playStretchSound(progress);

        if (this.birthTimer >= 1.1) {
          this.birthState = 'popping_head';
          this.birthTimer = 0;
          this.headPopped = true;
          audio.playPopSound();
        }
      }
      // 2. Popping snap phase (0 to 0.35s)
      else if (this.birthState === 'popping_head') {
        if (this.birthTimer >= 0.35) {
          this.birthState = 'emerging_torso';
          this.birthTimer = 0;
        }
      }
      // 3. Torso emerging backward FROM the head (0 to 1.3s)
      else if (this.birthState === 'emerging_torso') {
        this.torsoProgress = Math.min(1.0, this.birthTimer / 1.3);
        this.wingProgress = 0; // Limbs do not appear until torso is complete!
        audio.playFabricSlide();

        if (this.birthTimer >= 1.3) {
          this.torsoProgress = 1.0;
          this.birthState = 'opening_wings';
          this.birthTimer = 0;
          audio.playWingUnfurlSound();
        }
      }
      // 4. Limbs emerging and opening like wings AFTER torso is complete (0 to 1.2s)
      else if (this.birthState === 'opening_wings') {
        this.torsoProgress = 1.0;
        const p = Math.min(1.0, this.birthTimer / 1.2);
        this.wingProgress = Math.sin(p * Math.PI * 0.5);

        if (this.birthTimer >= 1.2) {
          this.wingProgress = 1.0;
          this.birthState = 'born';
          this.handL.plantedX = this.handL.x; this.handL.plantedY = this.handL.y; this.handL.hasLanded = true;
          this.handR.plantedX = this.handR.x; this.handR.plantedY = this.handR.y; this.handR.hasLanded = true;
          this.footL.plantedX = this.footL.x; this.footL.plantedY = this.footL.y; this.footL.hasLanded = true;
          this.footR.plantedX = this.footR.x; this.footR.plantedY = this.footR.y; this.footR.hasLanded = true;
        }
      }
    }

    // Follows the exact path trail recorded by the leader
    // When the leader turns anywhere, each clone reaches that exact spot and turns smoothly!
    updateSnakeFollow(pathTrail, timeScale = 1.0) {
      if (!this.parent) return;

      const segSpacing = 88; // Distance between segment centers along path
      const targetDistBehind = this.index * segSpacing;
      const parentButt = this.parent.getButtPosition();

      if (this.birthState === 'stretching_head') {
        const pFwdX = Math.cos(this.parent.heading);
        const pFwdY = Math.sin(this.parent.heading);
        this.heading = this.parent.heading;
        this.headPos.x = parentButt.x - pFwdX * (8 + this.stretchDist);
        this.headPos.y = parentButt.y - pFwdY * (8 + this.stretchDist);
        this.x = this.headPos.x - pFwdX * 64;
        this.y = this.headPos.y - pFwdY * 64;
        return;
      }

      if (this.dragTarget) {
        return;
      }

      if (pathTrail) {
        // Sample exact position and heading along the leader's traversed path trail!
        const pathPoint = pathTrail.getPointAtDistance(targetDistBehind);

        if (this.birthState === 'born') {
          this.x = pathPoint.x;
          this.y = pathPoint.y;
          this.heading = pathPoint.heading;
        } else {
          // Smoothly ease into trail during birth
          const easeRate = 1 - Math.pow(1 - 0.35, timeScale);
          this.x += (pathPoint.x - this.x) * easeRate;
          this.y += (pathPoint.y - this.y) * easeRate;
          this.heading += angleDiff(pathPoint.heading, this.heading) * easeRate;
        }

        // Head position touches parent butt directly along path
        const fwdX = Math.cos(this.heading);
        const fwdY = Math.sin(this.heading);
        this.headPos.x = this.x + fwdX * 30;
        this.headPos.y = this.y + fwdY * 30;
      }
    }

    update(pathTrail, leaderCrawlPhase, isMoving, isShift, isSpace, dt = 0.016, timeScale = 1.0) {
      this.updateBirth(dt);

      // Handle singing vocalization & mouth animation
      if (this.isSinging && this.birthState === 'born') {
        this.mouthOpen = Math.min(1.0, this.mouthOpen + 0.12 * timeScale);
        this.vocalTremor = (Math.random() - 0.5) * 1.5;
      } else {
        this.mouthOpen = Math.max(0.0, this.mouthOpen - 0.14 * timeScale);
        this.vocalTremor = 0;
      }

      if (this.parent) {
        this.updateSnakeFollow(pathTrail, timeScale);
      }

      const fwdX = Math.cos(this.heading);
      const fwdY = Math.sin(this.heading);
      const rightX = -fwdY;
      const rightY = fwdX;

      // Propagating sinusoidal snake undulation down the centipede chain
      const snakePhase = leaderCrawlPhase - this.index * 1.35;
      const snakeAmp = isMoving && this.birthState === 'born' ? 8.0 : 0;
      const wiggleSpeed = 1 - Math.pow(1 - 0.22, timeScale);
      this.spineWiggle += (Math.sin(snakePhase) * snakeAmp - this.spineWiggle) * wiggleSpeed;

      // Main skeletal anchor coordinates
      const chestX = this.x + fwdX * this.chestDist + rightX * this.spineWiggle;
      const chestY = this.y + fwdY * this.chestDist + rightY * this.spineWiggle;
      const pelvisX = this.x - fwdX * this.pelvisDist - rightX * (this.spineWiggle * 0.6);
      const pelvisY = this.y - fwdY * this.pelvisDist - rightY * (this.spineWiggle * 0.6);

      const shoulderL = { x: chestX - rightX * 26, y: chestY - rightY * 26 };
      const shoulderR = { x: chestX + rightX * 26, y: chestY + rightY * 26 };
      const hipL = { x: pelvisX - rightX * 22, y: pelvisY - rightY * 22 };
      const hipR = { x: pelvisX + rightX * 22, y: pelvisY + rightY * 22 };

      const crawlSpeedFactor = isShift ? 1.75 : 1.0;
      const phaseOffset = this.index % 2 === 0 ? 0 : Math.PI;
      const segmentCrawlPhase = leaderCrawlPhase + phaseOffset;
      const stepCycle = Math.sin(segmentCrawlPhase);

      // Shorter limb reach & stride bounds for follower segments
      const defaultHandOut = this.isSharpLimb ? 58 : 95;
      const defaultHandFwd = this.isSharpLimb ? 10 : 15;
      const defaultFootOut = this.isSharpLimb ? 52 : 85;
      const defaultFootBack = this.isSharpLimb ? 34 : 50;
      const reachDist = (this.isSharpLimb ? 24 : 42) * crawlSpeedFactor;

      // During birth: wings start tucked, then open smoothly like wings
      if (this.birthState === 'stretching_head' || this.birthState === 'popping_head' || this.birthState === 'emerging_torso') {
        this.handL.x = shoulderL.x; this.handL.y = shoulderL.y;
        this.handR.x = shoulderR.x; this.handR.y = shoulderR.y;
        this.footL.x = hipL.x; this.footL.y = hipL.y;
        this.footR.x = hipR.x; this.footR.y = hipR.y;
      } else if (this.birthState === 'opening_wings') {
        // Unfolding outward smoothly like wings!
        const w = this.wingProgress;
        this.handL.x = shoulderL.x - rightX * (defaultHandOut * w) + fwdX * (defaultHandFwd * w);
        this.handL.y = shoulderL.y - rightY * (defaultHandOut * w) + fwdY * (defaultHandFwd * w);
        this.handR.x = shoulderR.x + rightX * (defaultHandOut * w) + fwdX * (defaultHandFwd * w);
        this.handR.y = shoulderR.y + rightY * (defaultHandOut * w) + fwdY * (defaultHandFwd * w);

        this.footL.x = hipL.x - rightX * (defaultFootOut * w) - fwdX * (defaultFootBack * w);
        this.footL.y = hipL.y - rightY * (defaultFootOut * w) - fwdY * (defaultFootBack * w);
        this.footR.x = hipR.x + rightX * (defaultFootOut * w) - fwdX * (defaultFootBack * w);
        this.footR.y = hipR.y + rightY * (defaultFootOut * w) - fwdY * (defaultFootBack * w);
      } else if (isSpace) {
        this.syncRestPose();
      } else {
        // Normal crawling gait with landing latch to PREVENT AUDIO SPAM
        this.updateLimbStep(this.handL, shoulderL, rightX, rightY, fwdX, fwdY, -defaultHandOut, defaultHandFwd, stepCycle > 0, reachDist, true, isMoving, timeScale);
        this.updateLimbStep(this.footR, hipR, rightX, rightY, fwdX, fwdY, defaultFootOut, -defaultFootBack, stepCycle > 0, reachDist, false, isMoving, timeScale);

        this.updateLimbStep(this.handR, shoulderR, rightX, rightY, fwdX, fwdY, defaultHandOut, defaultHandFwd, stepCycle <= 0, reachDist, true, isMoving, timeScale);
        this.updateLimbStep(this.footL, hipL, rightX, rightY, fwdX, fwdY, -defaultFootOut, -defaultFootBack, stepCycle <= 0, reachDist, false, isMoving, timeScale);
      }

      // Head inertia for leader
      if (!this.parent) {
        const targetHeadX = this.x + fwdX * this.headDist + rightX * (this.spineWiggle * 1.2);
        const targetHeadY = this.y + fwdY * this.headDist + rightY * (this.spineWiggle * 1.2);
        const headSpring = 0.22;
        const headDamp = 0.72;

        this.headVel.x = (this.headVel.x + (targetHeadX - this.headPos.x) * (headSpring * timeScale)) * Math.pow(headDamp, timeScale);
        this.headVel.y = (this.headVel.y + (targetHeadY - this.headPos.y) * (headSpring * timeScale)) * Math.pow(headDamp, timeScale);
        this.headPos.x += this.headVel.x * timeScale;
        this.headPos.y += this.headVel.y * timeScale;
      }
    }

    // Solves stepping & ground contact for each limb, with sound latching
    updateLimbStep(limb, baseJoint, rightX, rightY, fwdX, fwdY, outOffset, fwdOffset, isMovingPhase, reachDist, isHand, isMoving, timeScale = 1.0) {
      const targetX = baseJoint.x + rightX * outOffset + fwdX * (fwdOffset + (isMovingPhase ? reachDist : -reachDist * 0.4));
      const targetY = baseJoint.y + rightY * outOffset + fwdY * (fwdOffset + (isMovingPhase ? reachDist : -reachDist * 0.4));

      if (this.dragTarget === limb) return;

      const distToPlant = Math.hypot(limb.x - targetX, limb.y - targetY);

      if (isMovingPhase) {
        // Swing phase
        limb.progress = Math.min(1.0, limb.progress + 0.16 * timeScale);
        const swingSpeed = 1 - Math.pow(1 - 0.32, timeScale);
        limb.x += (targetX - limb.x) * swingSpeed;
        limb.y += (targetY - limb.y) * swingSpeed;

        // Play tap ONLY ONCE on landing transition, and ONLY WHEN MOVING!
        const hitThreshold = this.isSharpLimb ? 10 : 14;
        if (distToPlant < hitThreshold && limb.progress > 0.75 && !limb.hasLanded && isMoving) {
          limb.hasLanded = true;
          audio.playCrawlTap(isHand, 1.0, this.isSharpLimb);
          limb.plantedX = limb.x;
          limb.plantedY = limb.y;
        }
      } else {
        // Stance phase (planted)
        limb.progress = 0;
        limb.hasLanded = false; // Reset latch so it can tap on next step
        const stanceSpeed = 1 - Math.pow(1 - 0.14, timeScale);
        limb.x += (targetX - limb.x) * stanceSpeed;
        limb.y += (targetY - limb.y) * stanceSpeed;
      }
    }

    render(ctx) {
      const fwdX = Math.cos(this.heading);
      const fwdY = Math.sin(this.heading);
      const rightX = -fwdY;
      const rightY = fwdX;

      const chestX = this.x + fwdX * this.chestDist + rightX * this.spineWiggle;
      const chestY = this.y + fwdY * this.chestDist + rightY * this.spineWiggle;
      const pelvisX = this.x - fwdX * this.pelvisDist - rightX * (this.spineWiggle * 0.6);
      const pelvisY = this.y - fwdY * this.pelvisDist - rightY * (this.spineWiggle * 0.6);
      const neckX = this.x + fwdX * this.neckDist + rightX * (this.spineWiggle * 0.8);
      const neckY = this.y + fwdY * this.neckDist + rightY * (this.spineWiggle * 0.8);

      const shoulderL = { x: chestX - rightX * 26, y: chestY - rightY * 26 };
      const shoulderR = { x: chestX + rightX * 26, y: chestY + rightY * 26 };
      const hipL = { x: pelvisX - rightX * 22, y: pelvisY - rightY * 22 };
      const hipR = { x: pelvisX + rightX * 22, y: pelvisY + rightY * 22 };

      // Solve IK for limbs with proper anatomical bend signs:
      // Left arm bends backward/inward (-1); Right arm mirrors (1);
      // Legs bend outward into iconic frog pose: Left leg (-1); Right leg (1).
      const armL = solveIK(shoulderL.x, shoulderL.y, this.handL.x, this.handL.y, this.armUpperLen, this.armLowerLen, -1);
      const armR = solveIK(shoulderR.x, shoulderR.y, this.handR.x, this.handR.y, this.armUpperLen, this.armLowerLen, 1);
      const legL = solveIK(hipL.x, hipL.y, this.footL.x, this.footL.y, this.legUpperLen, this.legLowerLen, -1);
      const legR = solveIK(hipR.x, hipR.y, this.footR.x, this.footR.y, this.legUpperLen, this.legLowerLen, 1);

      // Render surgical sutures connecting mouth to parent butt (once popped)
      if (this.parent && this.birthState !== 'stretching_head') {
        this.renderConnectionSutures(ctx, this.parent);
      }

      // Special rendering during stretching head birth state
      if (this.birthState === 'stretching_head') {
        this.renderStretchingHead(ctx, this.parent);
        return;
      }

      // 1. Soft atmospheric floor shadows (fast multi-pass alpha, zero GPU blur stall)
      this.renderShadows(ctx, chestX, chestY, pelvisX, pelvisY, armL, armR, legL, legR);

      // 2. Humanoid Limbs (for leader) or Sharp Chitin Limbs (for follower segments)
      // Only render AFTER torso is complete (during wing opening or born)
      if (this.birthState === 'opening_wings' || this.birthState === 'born') {
        if (this.isSharpLimb) {
          this.renderSharpLimb(ctx, shoulderL, armL.joint, armL.end, 9, 5, 'arm', false);
          this.renderSharpLimb(ctx, shoulderR, armR.joint, armR.end, 9, 5, 'arm', true);
          this.renderSharpLimb(ctx, hipL, legL.joint, legL.end, 11, 6, 'leg', false);
          this.renderSharpLimb(ctx, hipR, legR.joint, legR.end, 11, 6, 'leg', true);
        } else {
          this.renderHumanoidLimb(ctx, shoulderL, armL.joint, armL.end, 'arm', false);
          this.renderHumanoidLimb(ctx, shoulderR, armR.joint, armR.end, 'arm', true);
          this.renderHumanoidLimb(ctx, hipL, legL.joint, legL.end, 'leg', false);
          this.renderHumanoidLimb(ctx, hipR, legR.joint, legR.end, 'leg', true);
        }
      }

      // 3. Stuffed Muslin Torso (emerges directly from head during birth)
      if (this.torsoProgress > 0.05) {
        this.renderTorso(ctx, chestX, chestY, pelvisX, pelvisY, neckX, neckY, this.torsoProgress);
      }

      // 4. Stuffed Round Head with embroidered face & creepy singing mouth
      if (this.headPopped || this.birthState === 'born') {
        this.renderHead(ctx, this.headPos.x + this.vocalTremor, this.headPos.y + this.vocalTremor, neckX, neckY);
      }
    }

    // Renders elastic stretched head during the first phase of birth
    renderStretchingHead(ctx, parent) {
      if (!parent) return;
      const parentButt = parent.getButtPosition();
      const buttX = parentButt.x;
      const buttY = parentButt.y;
      const headX = this.headPos.x;
      const headY = this.headPos.y;

      ctx.save();
      const midX = (buttX + headX) / 2;
      const midY = (buttY + headY) / 2;
      const angle = Math.atan2(headY - buttY, headX - buttX);
      const len = Math.hypot(headX - buttX, headY - buttY);

      ctx.translate(midX, midY);
      ctx.rotate(angle);

      ctx.beginPath();
      const halfLen = Math.max(10, len / 2);
      const bulgeW = 26 - Math.min(12, this.stretchDist * 0.25);

      ctx.moveTo(-halfLen, -12);
      ctx.quadraticCurveTo(0, -bulgeW, halfLen, 0);
      ctx.quadraticCurveTo(0, bulgeW, -halfLen, 12);
      ctx.closePath();

      const grad = ctx.createLinearGradient(-halfLen, 0, halfLen, 0);
      grad.addColorStop(0, '#dad2c2');
      grad.addColorStop(0.5, '#f7f3ec');
      grad.addColorStop(1, '#ebe4d5');

      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#c4bbaa';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Elastic stress stretch lines
      ctx.strokeStyle = 'rgba(120, 100, 80, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      for (let offset of [-6, 0, 6]) {
        ctx.beginPath();
        ctx.moveTo(-halfLen + 4, offset);
        ctx.lineTo(halfLen - 4, offset * 0.4);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Renders medical / surgical cross stitches connecting child's mouth to parent's lower butt tip
    renderConnectionSutures(ctx, parent) {
      const parentButt = parent.getButtPosition();
      const pFwdX = Math.cos(parent.heading);
      const pFwdY = Math.sin(parent.heading);
      const pRightX = -pFwdY;
      const pRightY = pFwdX;

      const buttX = parentButt.x;
      const buttY = parentButt.y;
      // Connect to top perimeter / mouth of child head
      const fwdX = Math.cos(this.heading);
      const fwdY = Math.sin(this.heading);
      const headX = this.headPos.x + fwdX * 24;
      const headY = this.headPos.y + fwdY * 24;

      ctx.save();
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';

      // Ladder / cross-stitch pattern linking mouth directly to butt tip
      const steps = 4;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = lerp(buttX, headX, t);
        const cy = lerp(buttY, headY, t);
        const w = 8;

        // Cross stitch tick
        ctx.beginPath();
        ctx.moveTo(cx - pRightX * w, cy - pRightY * w);
        ctx.lineTo(cx + pRightX * w, cy + pRightY * w);
        ctx.stroke();

        // Diagonal surgical suture crosses
        if (i < steps) {
          const nextCx = lerp(buttX, headX, (i + 1) / steps);
          const nextCy = lerp(buttY, headY, (i + 1) / steps);
          ctx.beginPath();
          ctx.moveTo(cx - pRightX * (w * 0.75), cy - pRightY * (w * 0.75));
          ctx.lineTo(nextCx + pRightX * (w * 0.75), nextCy + pRightY * (w * 0.75));
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Optimized multi-pass soft vector shadows (100x faster than ctx.filter blur)
    renderShadows(ctx, cx, cy, px, py, armL, armR, legL, legR) {
      ctx.save();

      // Torso shadow: soft layered concentric ellipses
      const midX = (cx + px) / 2;
      const midY = (cy + py) / 2 + 5;
      const tw = 48 * this.torsoProgress;
      const th = 38 * this.torsoProgress;

      ctx.beginPath();
      ctx.ellipse(midX, midY, tw + 8, th + 8, this.heading, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(midX, midY, tw, th, this.heading, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.fill();

      // Head shadow: soft dual pass
      ctx.beginPath();
      ctx.arc(this.headPos.x, this.headPos.y + 4, 42, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.headPos.x, this.headPos.y + 4, 34, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.fill();

      // Limb contact shadows
      const drawLimbShadow = (p0, p1, p2, w) => {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer ambient contact shadow
        ctx.lineWidth = w + 6;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y + 3);
        ctx.lineTo(p1.x, p1.y + 3);
        ctx.lineTo(p2.x, p2.y + 3);
        ctx.stroke();

        // Inner core contact shadow
        ctx.lineWidth = w;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y + 2);
        ctx.lineTo(p1.x, p1.y + 2);
        ctx.lineTo(p2.x, p2.y + 2);
        ctx.stroke();
      };

      if (this.wingProgress > 0.1) {
        const armW = this.isSharpLimb ? 10 : 20;
        const legW = this.isSharpLimb ? 12 : 24;
        drawLimbShadow(armL.joint, armL.end, this.handL, armW);
        drawLimbShadow(armR.joint, armR.end, this.handR, armW);
        drawLimbShadow(legL.joint, legL.end, this.footL, legW);
        drawLimbShadow(legR.joint, legR.end, this.footR, legW);
      }

      ctx.restore();
    }

    // Renders short, sharp chitinous/bone limb with elbow/knee thorn spur and razor sickle talon
    renderSharpLimb(ctx, p0, p1, p2, r0, r1, type, isRight = false) {
      ctx.save();

      const flipSign = isRight ? 1 : -1;

      // 1. Upper Limb Segment (p0 to p1): Tapers from r0 to r1 with dark chitin tones
      const dx0 = p1.x - p0.x;
      const dy0 = p1.y - p0.y;
      const ang0 = Math.atan2(dy0, dx0);
      const perp0X = -Math.sin(ang0);
      const perp0Y = Math.cos(ang0);

      ctx.beginPath();
      ctx.moveTo(p0.x + perp0X * r0, p0.y + perp0Y * r0);
      ctx.lineTo(p1.x + perp0X * r1, p1.y + perp0Y * r1);
      ctx.arc(p1.x, p1.y, r1, ang0 - Math.PI / 2, ang0 + Math.PI / 2);
      ctx.lineTo(p0.x - perp0X * r0, p0.y - perp0Y * r0);
      ctx.arc(p0.x, p0.y, r0, ang0 + Math.PI / 2, ang0 - Math.PI / 2);
      ctx.closePath();

      const gradUpper = ctx.createLinearGradient(
        p0.x + perp0X * r0, p0.y + perp0Y * r0,
        p0.x - perp0X * r0, p0.y - perp0Y * r0
      );
      gradUpper.addColorStop(0, '#1c1815');
      gradUpper.addColorStop(0.35, '#3a3129');
      gradUpper.addColorStop(0.7, '#241f1a');
      gradUpper.addColorStop(1, '#151210');
      ctx.fillStyle = gradUpper;
      ctx.fill();

      ctx.strokeStyle = '#0e0c0a';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Transverse chitinous carapace ridges on upper limb
      ctx.strokeStyle = 'rgba(10, 8, 6, 0.7)';
      ctx.lineWidth = 1.1;
      for (const t of [0.3, 0.6, 0.85]) {
        const segX = lerp(p0.x, p1.x, t);
        const segY = lerp(p0.y, p1.y, t);
        const curR = lerp(r0, r1, t);
        ctx.beginPath();
        ctx.moveTo(segX - perp0X * curR * 0.9, segY - perp0Y * curR * 0.9);
        ctx.lineTo(segX + perp0X * curR * 0.9, segY + perp0Y * curR * 0.9);
        ctx.stroke();
      }

      // Surgical anchor sutures around the root socket (p0)
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(p0.x - perp0X * (r0 + 3), p0.y - perp0Y * (r0 + 3));
      ctx.lineTo(p0.x + perp0X * (r0 + 3), p0.y + perp0Y * (r0 + 3));
      ctx.stroke();

      // 2. Sharp Knee/Elbow Thorn Spur at p1
      // Spur points backward and outward from the joint
      const dx1 = p2.x - p1.x;
      const dy1 = p2.y - p1.y;
      const ang1 = Math.atan2(dy1, dx1);
      const spurAngle = ang0 + Math.PI + flipSign * 0.52;
      const spurLen = type === 'arm' ? 12 : 15;
      const spurTipX = p1.x + Math.cos(spurAngle) * spurLen;
      const spurTipY = p1.y + Math.sin(spurAngle) * spurLen;
      const spurBaseW = r1 * 0.9;
      const spurPerpX = -Math.sin(spurAngle);
      const spurPerpY = Math.cos(spurAngle);

      ctx.beginPath();
      ctx.moveTo(p1.x - spurPerpX * spurBaseW, p1.y - spurPerpY * spurBaseW);
      ctx.lineTo(spurTipX, spurTipY);
      ctx.lineTo(p1.x + spurPerpX * spurBaseW, p1.y + spurPerpY * spurBaseW);
      ctx.closePath();
      ctx.fillStyle = '#1e1a16';
      ctx.fill();
      ctx.strokeStyle = '#0a0908';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Glint highlight on spur spine
      ctx.strokeStyle = 'rgba(215, 195, 170, 0.55)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(spurTipX, spurTipY);
      ctx.stroke();

      // 3. Lower Limb Segment (p1 to p2): Needle taper down to 1.2px
      const perp1X = -Math.sin(ang1);
      const perp1Y = Math.cos(ang1);
      const tipR = 1.2;

      ctx.beginPath();
      ctx.moveTo(p1.x + perp1X * r1, p1.y + perp1Y * r1);
      ctx.lineTo(p2.x + perp1X * tipR, p2.y + perp1Y * tipR);
      ctx.arc(p2.x, p2.y, tipR, ang1 - Math.PI / 2, ang1 + Math.PI / 2);
      ctx.lineTo(p1.x - perp1X * r1, p1.y - perp1Y * r1);
      ctx.closePath();

      const gradLower = ctx.createLinearGradient(
        p1.x, p1.y,
        p2.x, p2.y
      );
      gradLower.addColorStop(0, '#2c251e');
      gradLower.addColorStop(0.6, '#181512');
      gradLower.addColorStop(1, '#0b0a08');
      ctx.fillStyle = gradLower;
      ctx.fill();

      ctx.strokeStyle = '#0a0907';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Fine needle spine line along lower limb
      ctx.strokeStyle = 'rgba(180, 160, 140, 0.45)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // 4. Terminal Curved Razor Sickle Talon / Needle Claw at p2
      // Hooks outward/backward to dig into the ground
      const talonLen = type === 'arm' ? 14 : 17;
      const hookAngle = ang1 + flipSign * 0.72;
      const clawTipX = p2.x + Math.cos(hookAngle) * talonLen;
      const clawTipY = p2.y + Math.sin(hookAngle) * talonLen;

      // Arc curve control point
      const midAngle = ang1 + flipSign * 0.15;
      const ctrlDist = talonLen * 0.65;
      const ctrlX = p2.x + Math.cos(midAngle) * ctrlDist + perp1X * (flipSign * 4.5);
      const ctrlY = p2.y + Math.sin(midAngle) * ctrlDist + perp1Y * (flipSign * 4.5);

      // Back spine control point
      const backCtrlX = p2.x + Math.cos(midAngle) * ctrlDist - perp1X * (flipSign * 1.5);
      const backCtrlY = p2.y + Math.sin(midAngle) * ctrlDist - perp1Y * (flipSign * 1.5);

      ctx.beginPath();
      ctx.moveTo(p2.x - perp1X * 2.5, p2.y - perp1Y * 2.5);
      ctx.quadraticCurveTo(ctrlX, ctrlY, clawTipX, clawTipY);
      ctx.quadraticCurveTo(backCtrlX, backCtrlY, p2.x + perp1X * 2.5, p2.y + perp1Y * 2.5);
      ctx.closePath();

      ctx.fillStyle = '#080706';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Sharp blade glint on outer curve of talon
      ctx.strokeStyle = 'rgba(240, 230, 210, 0.8)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.quadraticCurveTo(ctrlX, ctrlY, clawTipX, clawTipY);
      ctx.stroke();

      // Secondary rear barb on talon heel for sinister arachnid look
      const barbAngle = ang1 + Math.PI - flipSign * 0.65;
      const barbX = p2.x + Math.cos(barbAngle) * 5.5;
      const barbY = p2.y + Math.sin(barbAngle) * 5.5;
      ctx.strokeStyle = '#0e0c0a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(barbX, barbY);
      ctx.stroke();

      // Tiny surgical thread tie wrapped right around the base of the talon
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p2.x - perp1X * 3.5, p2.y - perp1Y * 3.5);
      ctx.lineTo(p2.x + perp1X * 3.5, p2.y + perp1Y * 3.5);
      ctx.stroke();

      ctx.restore();
    }

    // Renders realistic humanoid arms (with 5 fingers & nails) and legs (with kneecaps, ankles & 5 toes)
    renderHumanoidLimb(ctx, p0, p1, p2, type, isRight = false) {
      ctx.save();

      const medialSign = isRight ? -1 : 1; // Vector direction towards medial (inner) body axis

      if (type === 'arm') {
        // --- HUMANOID ARM (Brachium, Forearm, and 5-Fingered Hand) ---
        const dx0 = p1.x - p0.x;
        const dy0 = p1.y - p0.y;
        const ang0 = Math.atan2(dy0, dx0);
        const perp0X = -Math.sin(ang0);
        const perp0Y = Math.cos(ang0);

        const dx1 = p2.x - p1.x;
        const dy1 = p2.y - p1.y;
        const ang1 = Math.atan2(dy1, dx1);
        const perp1X = -Math.sin(ang1);
        const perp1Y = Math.cos(ang1);

        // 1. Upper Arm (Deltoid -> Biceps/Triceps -> Elbow)
        ctx.beginPath();
        const rShoulder = 16.5;
        const rBicep = 14.5;
        const rElbow = 11.0;
        const mid0X = (p0.x + p1.x) / 2;
        const mid0Y = (p0.y + p1.y) / 2;

        ctx.moveTo(p0.x + perp0X * rShoulder, p0.y + perp0Y * rShoulder);
        ctx.quadraticCurveTo(mid0X + perp0X * rBicep, mid0Y + perp0Y * rBicep, p1.x + perp0X * rElbow, p1.y + perp0Y * rElbow);
        ctx.arc(p1.x, p1.y, rElbow, ang0 - Math.PI / 2, ang0 + Math.PI / 2);
        ctx.quadraticCurveTo(mid0X - perp0X * rBicep, mid0Y - perp0Y * rBicep, p0.x - perp0X * rShoulder, p0.y - perp0Y * rShoulder);
        ctx.arc(p0.x, p0.y, rShoulder, ang0 + Math.PI / 2, ang0 - Math.PI / 2);
        ctx.closePath();

        const armGrad0 = ctx.createLinearGradient(
          mid0X + perp0X * rShoulder, mid0Y + perp0Y * rShoulder,
          mid0X - perp0X * rShoulder, mid0Y - perp0Y * rShoulder
        );
        armGrad0.addColorStop(0, '#f5ece0');
        armGrad0.addColorStop(0.35, '#ebdccb');
        armGrad0.addColorStop(0.7, '#dec9b2');
        armGrad0.addColorStop(1, '#c2ab91');
        ctx.fillStyle = armGrad0;
        ctx.fill();
        ctx.strokeStyle = '#9d866f';
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // 2. Forearm (Brachioradialis -> Narrow Wrist)
        ctx.beginPath();
        const rForearm = 13.0;
        const rWrist = 8.5;
        const mid1X = (p1.x + p2.x) / 2;
        const mid1Y = (p1.y + p2.y) / 2;

        ctx.moveTo(p1.x + perp1X * rElbow, p1.y + perp1Y * rElbow);
        ctx.quadraticCurveTo(mid1X + perp1X * rForearm, mid1Y + perp1Y * rForearm, p2.x + perp1X * rWrist, p2.y + perp1Y * rWrist);
        ctx.arc(p2.x, p2.y, rWrist, ang1 - Math.PI / 2, ang1 + Math.PI / 2);
        ctx.quadraticCurveTo(mid1X - perp1X * rForearm, mid1Y - perp1Y * rForearm, p1.x - perp1X * rElbow, p1.y - perp1Y * rElbow);
        ctx.closePath();

        const armGrad1 = ctx.createLinearGradient(
          mid1X + perp1X * rForearm, mid1Y + perp1Y * rForearm,
          mid1X - perp1X * rForearm, mid1Y - perp1Y * rForearm
        );
        armGrad1.addColorStop(0, '#f7eee2');
        armGrad1.addColorStop(0.4, '#eddccc');
        armGrad1.addColorStop(0.75, '#dec9b2');
        armGrad1.addColorStop(1, '#beaa92');
        ctx.fillStyle = armGrad1;
        ctx.fill();
        ctx.strokeStyle = '#9d866f';
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Subtle subcutaneous blue vein running down forearm
        ctx.beginPath();
        ctx.moveTo(p1.x + perp1X * (medialSign * 2), p1.y + perp1Y * (medialSign * 2));
        ctx.quadraticCurveTo(mid1X + perp1X * (medialSign * 5), mid1Y + perp1Y * (medialSign * 5), p2.x + perp1X * (medialSign * 1.5), p2.y + perp1Y * (medialSign * 1.5));
        ctx.strokeStyle = 'rgba(100, 125, 155, 0.22)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Elbow bone knob (olecranon process)
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 4.8, 0, Math.PI * 2);
        ctx.fillStyle = '#fbf7ee';
        ctx.fill();
        ctx.strokeStyle = 'rgba(157, 134, 111, 0.6)';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Reddish crawl friction blush on elbow
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 8.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(190, 75, 75, 0.14)';
        ctx.fill();

        // Wrist crease lines
        ctx.beginPath();
        ctx.moveTo(p2.x - perp1X * 7, p2.y - perp1Y * 7);
        ctx.lineTo(p2.x + perp1X * 7, p2.y + perp1Y * 7);
        ctx.strokeStyle = 'rgba(140, 115, 95, 0.55)';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // 3. Realistic Humanoid Hand with 5 Articulated Fingers
        // Palm pad
        ctx.beginPath();
        ctx.ellipse(p2.x, p2.y, 9.5, 8.0, ang1, 0, Math.PI * 2);
        ctx.fillStyle = '#f0e0d0';
        ctx.fill();
        ctx.strokeStyle = '#9d866f';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Helper to draw an articulated humanoid finger with joints and nail
        const drawFinger = (rootOffsetPerp, rootFwd, splayAngle, fingerLen, fingerW, isThumb = false) => {
          const fwdX = Math.cos(ang1);
          const fwdY = Math.sin(ang1);
          const rx = p2.x + perp1X * rootOffsetPerp + fwdX * rootFwd;
          const ry = p2.y + perp1Y * rootOffsetPerp + fwdY * rootFwd;
          const fAngle = ang1 + splayAngle;

          const fCos = Math.cos(fAngle);
          const fSin = Math.sin(fAngle);
          const fPerpX = -fSin;
          const fPerpY = fCos;

          const tipX = rx + fCos * fingerLen;
          const tipY = ry + fSin * fingerLen;

          // Finger body
          ctx.beginPath();
          ctx.moveTo(rx + fPerpX * fingerW, ry + fPerpY * fingerW);
          ctx.lineTo(tipX + fPerpX * (fingerW * 0.75), tipY + fPerpY * (fingerW * 0.75));
          ctx.arc(tipX, tipY, fingerW * 0.75, fAngle - Math.PI / 2, fAngle + Math.PI / 2);
          ctx.lineTo(rx - fPerpX * fingerW, ry - fPerpY * fingerW);
          ctx.closePath();

          ctx.fillStyle = '#eedecf';
          ctx.fill();
          ctx.strokeStyle = '#9d866f';
          ctx.lineWidth = 0.95;
          ctx.stroke();

          // Knuckle crease lines
          const numJoints = isThumb ? 1 : 2;
          for (let j = 1; j <= numJoints; j++) {
            const jt = j / (numJoints + 1);
            const jx = lerp(rx, tipX, jt);
            const jy = lerp(ry, tipY, jt);
            ctx.beginPath();
            ctx.moveTo(jx - fPerpX * (fingerW * 0.7), jy - fPerpY * (fingerW * 0.7));
            ctx.lineTo(jx + fPerpX * (fingerW * 0.7), jy + fPerpY * (fingerW * 0.7));
            ctx.strokeStyle = 'rgba(135, 105, 85, 0.55)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }

          // Fingernail plate
          const nailLen = isThumb ? 4.2 : 3.6;
          const nailW = fingerW * 0.55;
          const nailX = tipX - fCos * (nailLen * 0.5);
          const nailY = tipY - fSin * (nailLen * 0.5);
          ctx.beginPath();
          ctx.ellipse(nailX, nailY, nailLen * 0.5, nailW, fAngle, 0, Math.PI * 2);
          ctx.fillStyle = '#fffefb';
          ctx.fill();
          ctx.strokeStyle = 'rgba(140, 100, 90, 0.6)';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        };

        // 5 Fingers:
        // Thumb (medial), Index (medial-forward), Middle (forward), Ring (lateral-forward), Pinky (lateral)
        // Medial side is medialSign * perp1
        drawFinger(medialSign * 7.5, 0, medialSign * 0.88, 14, 2.5, true); // Thumb
        drawFinger(medialSign * 4.2, 4.0, medialSign * 0.28, 18.5, 2.1, false); // Index
        drawFinger(medialSign * 0.8, 5.5, medialSign * 0.04, 20.5, 2.2, false); // Middle
        drawFinger(-medialSign * 2.8, 4.8, -medialSign * 0.24, 18.0, 2.0, false); // Ring
        drawFinger(-medialSign * 6.2, 2.2, -medialSign * 0.62, 13.5, 1.8, false); // Pinky

      } else {
        // --- HUMANOID LEG (Thigh, Knee with Kneecap, Calf with Ankle, and 5-Toed Foot) ---
        const dx0 = p1.x - p0.x;
        const dy0 = p1.y - p0.y;
        const ang0 = Math.atan2(dy0, dx0);
        const perp0X = -Math.sin(ang0);
        const perp0Y = Math.cos(ang0);

        const dx1 = p2.x - p1.x;
        const dy1 = p2.y - p1.y;
        const ang1 = Math.atan2(dy1, dx1);
        const perp1X = -Math.sin(ang1);
        const perp1Y = Math.cos(ang1);

        // 1. Thigh (Hip socket -> Quadriceps curve -> Knee)
        ctx.beginPath();
        const rHip = 21.0;
        const rQuad = 19.5;
        const rKnee = 14.0;
        const mid0X = (p0.x + p1.x) / 2;
        const mid0Y = (p0.y + p1.y) / 2;

        ctx.moveTo(p0.x + perp0X * rHip, p0.y + perp0Y * rHip);
        ctx.quadraticCurveTo(mid0X + perp0X * rQuad, mid0Y + perp0Y * rQuad, p1.x + perp0X * rKnee, p1.y + perp0Y * rKnee);
        ctx.arc(p1.x, p1.y, rKnee, ang0 - Math.PI / 2, ang0 + Math.PI / 2);
        ctx.quadraticCurveTo(mid0X - perp0X * rQuad, mid0Y - perp0Y * rQuad, p0.x - perp0X * rHip, p0.y - perp0Y * rHip);
        ctx.arc(p0.x, p0.y, rHip, ang0 + Math.PI / 2, ang0 - Math.PI / 2);
        ctx.closePath();

        const legGrad0 = ctx.createLinearGradient(
          mid0X + perp0X * rHip, mid0Y + perp0Y * rHip,
          mid0X - perp0X * rHip, mid0Y - perp0Y * rHip
        );
        legGrad0.addColorStop(0, '#f5ece0');
        legGrad0.addColorStop(0.35, '#ebdccb');
        legGrad0.addColorStop(0.7, '#dec9b2');
        legGrad0.addColorStop(1, '#beaa92');
        ctx.fillStyle = legGrad0;
        ctx.fill();
        ctx.strokeStyle = '#9d866f';
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // 2. Lower Leg (Calf Gastrocnemius -> Narrow Ankle)
        ctx.beginPath();
        const rCalf = 16.5;
        const rAnkle = 9.5;
        const mid1X = (p1.x + p2.x) / 2;
        const mid1Y = (p1.y + p2.y) / 2;

        ctx.moveTo(p1.x + perp1X * rKnee, p1.y + perp1Y * rKnee);
        ctx.quadraticCurveTo(mid1X + perp1X * rCalf, mid1Y + perp1Y * rCalf, p2.x + perp1X * rAnkle, p2.y + perp1Y * rAnkle);
        ctx.arc(p2.x, p2.y, rAnkle, ang1 - Math.PI / 2, ang1 + Math.PI / 2);
        ctx.quadraticCurveTo(mid1X - perp1X * rCalf, mid1Y - perp1Y * rCalf, p1.x - perp1X * rKnee, p1.y - perp1Y * rKnee);
        ctx.closePath();

        const legGrad1 = ctx.createLinearGradient(
          mid1X + perp1X * rCalf, mid1Y + perp1Y * rCalf,
          mid1X - perp1X * rCalf, mid1Y - perp1Y * rCalf
        );
        legGrad1.addColorStop(0, '#f7eee2');
        legGrad1.addColorStop(0.4, '#eddccc');
        legGrad1.addColorStop(0.75, '#dec9b2');
        legGrad1.addColorStop(1, '#baa58d');
        ctx.fillStyle = legGrad1;
        ctx.fill();
        ctx.strokeStyle = '#9d866f';
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Knee Cap (Patella)
        ctx.beginPath();
        ctx.ellipse(p1.x, p1.y, 8.5, 10.5, ang0, 0, Math.PI * 2);
        ctx.fillStyle = '#faf4ea';
        ctx.fill();
        ctx.strokeStyle = 'rgba(157, 134, 111, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Reddened crawl pressure friction on kneecap
        ctx.beginPath();
        ctx.ellipse(p1.x, p1.y, 11.5, 13.0, ang0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(195, 70, 70, 0.16)';
        ctx.fill();

        // Patellar tendon line running down to tibia
        const fwd0X = Math.cos(ang0);
        const fwd0Y = Math.sin(ang0);
        ctx.beginPath();
        ctx.moveTo(p1.x + fwd0X * 7, p1.y + fwd0Y * 7);
        ctx.lineTo(p1.x + fwd0X * 14, p1.y + fwd0Y * 14);
        ctx.strokeStyle = 'rgba(130, 105, 85, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Ankle bones (malleoli)
        ctx.beginPath();
        ctx.arc(p2.x + perp1X * (medialSign * 7), p2.y + perp1Y * (medialSign * 7), 3.5, 0, Math.PI * 2);
        ctx.arc(p2.x - perp1X * (medialSign * 7), p2.y - perp1Y * (medialSign * 7), 3.0, 0, Math.PI * 2);
        ctx.fillStyle = '#f8f1e6';
        ctx.fill();
        ctx.strokeStyle = 'rgba(157, 134, 111, 0.6)';
        ctx.lineWidth = 0.9;
        ctx.stroke();

        // 3. Realistic Human Foot (Heel, Metatarsal Pad, and 5 Toes with Toenails)
        // Calcaneus (Heel bone pad extending backwards)
        const fwd1X = Math.cos(ang1);
        const fwd1Y = Math.sin(ang1);
        const heelX = p2.x - fwd1X * 10;
        const heelY = p2.y - fwd1Y * 10;
        ctx.beginPath();
        ctx.ellipse(heelX, heelY, 7.5, 6.5, ang1, 0, Math.PI * 2);
        ctx.fillStyle = '#eedecf';
        ctx.fill();
        ctx.strokeStyle = '#9d866f';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Ball of foot & arch
        ctx.beginPath();
        ctx.ellipse(p2.x + fwd1X * 3, p2.y + fwd1Y * 3, 9.5, 8.0, ang1, 0, Math.PI * 2);
        ctx.fillStyle = '#eedecf';
        ctx.fill();
        ctx.strokeStyle = '#9d866f';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Helper to draw a human toe with cuticle and toenail
        const drawToe = (rootOffsetPerp, rootFwd, splayAngle, toeLen, toeW, isBigToe = false) => {
          const rx = p2.x + perp1X * rootOffsetPerp + fwd1X * rootFwd;
          const ry = p2.y + perp1Y * rootOffsetPerp + fwd1Y * rootFwd;
          const tAngle = ang1 + splayAngle;
          const tCos = Math.cos(tAngle);
          const tSin = Math.sin(tAngle);
          const tPerpX = -tSin;
          const tPerpY = tCos;

          const tipX = rx + tCos * toeLen;
          const tipY = ry + tSin * toeLen;

          // Toe body
          ctx.beginPath();
          ctx.moveTo(rx + tPerpX * toeW, ry + tPerpY * toeW);
          ctx.lineTo(tipX + tPerpX * (toeW * 0.8), tipY + tPerpY * (toeW * 0.8));
          ctx.arc(tipX, tipY, toeW * 0.8, tAngle - Math.PI / 2, tAngle + Math.PI / 2);
          ctx.lineTo(rx - tPerpX * toeW, ry - tPerpY * toeW);
          ctx.closePath();

          ctx.fillStyle = '#eedecf';
          ctx.fill();
          ctx.strokeStyle = '#9d866f';
          ctx.lineWidth = 0.95;
          ctx.stroke();

          // Toenail plate
          const nailLen = isBigToe ? 4.6 : 3.2;
          const nailW = toeW * 0.65;
          const nailX = tipX - tCos * (nailLen * 0.45);
          const nailY = tipY - tSin * (nailLen * 0.45);
          ctx.beginPath();
          ctx.ellipse(nailX, nailY, nailLen * 0.5, nailW, tAngle, 0, Math.PI * 2);
          ctx.fillStyle = '#fffefb';
          ctx.fill();
          ctx.strokeStyle = 'rgba(140, 100, 90, 0.6)';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        };

        // 5 Human Toes:
        // Big Toe (Hallux) is on medial side (medialSign * perp1)
        // Little Toe (Pinky Toe) is on lateral side (-medialSign * perp1)
        drawToe(medialSign * 6.5, 4.0, medialSign * 0.18, 14.5, 3.2, true); // Big Toe (Hallux)
        drawToe(medialSign * 3.2, 5.0, medialSign * 0.08, 14.0, 2.3, false); // Toe 2
        drawToe(medialSign * 0.2, 4.8, 0, 12.8, 2.1, false); // Toe 3
        drawToe(-medialSign * 2.8, 4.2, -medialSign * 0.12, 11.2, 2.0, false); // Toe 4
        drawToe(-medialSign * 5.6, 2.6, -medialSign * 0.32, 9.2, 1.8, false); // Little Toe 5
      }

      ctx.restore();
    }

    drawClothSegment(ctx, p0, p1, r0, r1) {
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const angle = Math.atan2(dy, dx);
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);

      ctx.beginPath();
      ctx.moveTo(p0.x + perpX * r0, p0.y + perpY * r0);
      ctx.lineTo(p1.x + perpX * r1, p1.y + perpY * r1);
      ctx.arc(p1.x, p1.y, r1, angle - Math.PI / 2, angle + Math.PI / 2);
      ctx.lineTo(p0.x - perpX * r0, p0.y - perpY * r0);
      ctx.arc(p0.x, p0.y, r0, angle + Math.PI / 2, angle - Math.PI / 2);
      ctx.closePath();

      // Soft muslin cylindrical 3D lighting gradient
      const grad = ctx.createLinearGradient(
        p0.x + perpX * r0,
        p0.y + perpY * r0,
        p0.x - perpX * r0,
        p0.y - perpY * r0
      );
      grad.addColorStop(0, '#faf8f3');
      grad.addColorStop(0.35, '#f4efe4');
      grad.addColorStop(0.85, '#e4dccf');
      grad.addColorStop(1, '#cdc3b4');

      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#c5bcab';
      ctx.stroke();

      // Stitched seam running along limb axis
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = 'rgba(130, 120, 105, 0.35)';
      ctx.stroke();
      ctx.setLineDash([]);
    }

    renderTorso(ctx, cx, cy, px, py, nx, ny, progress = 1.0) {
      ctx.save();
      const len = Math.hypot(px - cx, py - cy);

      if (progress < 0.99) {
        // Torso extrudes backward directly FROM the neck / head
        ctx.translate(nx, ny);
        ctx.rotate(this.heading + Math.PI / 2);

        const curLen = (len * 0.55 + 16) * 2 * progress;
        const wTop = 28 * Math.min(1.0, progress * 1.5);
        const wBelly = 46 * progress;
        const wHip = 38 * Math.max(0.1, (progress - 0.2) / 0.8);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(wTop, 0, wBelly, curLen * 0.4, wBelly, curLen * 0.7);
        ctx.bezierCurveTo(wBelly, curLen * 0.95, wHip, curLen + 4, 0, curLen + 6);
        ctx.bezierCurveTo(-wHip, curLen + 4, -wBelly, curLen * 0.95, -wBelly, curLen * 0.7);
        ctx.bezierCurveTo(-wBelly, curLen * 0.4, -wTop, 0, 0, 0);
        ctx.closePath();

        const grad = ctx.createRadialGradient(-6, curLen * 0.3, 8, 0, curLen * 0.5, curLen + 10);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#f7f4ed');
        grad.addColorStop(0.8, '#eae3d5');
        grad.addColorStop(1, '#cfc5b3');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#c6bcab';
        ctx.stroke();

        // Belly seam embroiders down as it extrudes
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(0, curLen + 4);
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(110, 100, 85, 0.45)';
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Fully formed torso
        const midX = (cx + px) / 2;
        const midY = (cy + py) / 2;
        ctx.translate(midX, midY);
        ctx.rotate(this.heading - Math.PI / 2);

        ctx.beginPath();
        const wTop = 30;
        const wBelly = 46;
        const wHip = 38;
        const hHalf = len * 0.55 + 16;

        ctx.moveTo(0, -hHalf);
        ctx.bezierCurveTo(wTop + 6, -hHalf, wBelly + 4, -hHalf * 0.2, wBelly, hHalf * 0.35);
        ctx.bezierCurveTo(wBelly - 4, hHalf * 0.85, wHip, hHalf + 6, 0, hHalf + 8);
        ctx.bezierCurveTo(-wHip, hHalf + 6, -wBelly + 4, hHalf * 0.85, -wBelly, hHalf * 0.35);
        ctx.bezierCurveTo(-wBelly - 4, -hHalf * 0.2, -wTop - 6, -hHalf, 0, -hHalf);
        ctx.closePath();

        const grad = ctx.createRadialGradient(-8, -12, 10, 0, 0, hHalf * 1.3);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#f7f4ed');
        grad.addColorStop(0.8, '#eae3d5');
        grad.addColorStop(1, '#cfc5b3');

        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#c6bcab';
        ctx.stroke();

        // Characteristic center vertical belly seam from photo
        ctx.beginPath();
        ctx.moveTo(0, -hHalf + 2);
        ctx.quadraticCurveTo(this.spineWiggle * 0.4, 0, 0, hHalf + 6);
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(110, 100, 85, 0.45)';
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }

    renderHead(ctx, hx, hy, nx, ny) {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(this.heading - Math.PI / 2);

      const r = 38;

      // Concentric singing sound ripples
      if (this.mouthOpen > 0.1) {
        ctx.save();
        const rippleTime = performance.now() * 0.005;
        for (let i = 0; i < 3; i++) {
          const ripR = r + 10 + ((rippleTime + i * 16) % 45);
          const ripAlpha = (1 - (ripR - r - 10) / 45) * 0.35 * this.mouthOpen;
          ctx.strokeStyle = `rgba(147, 197, 253, ${ripAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 16, ripR * 0.7, 0.2 * Math.PI, 0.8 * Math.PI);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Round cloth stuffed cushion head
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(-6, -8, 6, 0, 0, r + 4);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#f7f4eb');
      grad.addColorStop(0.85, '#ede6d8');
      grad.addColorStop(1, '#cec5b2');

      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#c4bbaa';
      ctx.stroke();

      // Vertical forehead-to-chin stitch line
      ctx.beginPath();
      ctx.moveTo(0, -r + 2);
      ctx.lineTo(0, r - 2);
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = 'rgba(125, 115, 95, 0.4)';
      ctx.stroke();
      ctx.setLineDash([]);

      // Embroidered sleeping face details in dark embroidery thread
      ctx.strokeStyle = '#18181b';
      ctx.lineCap = 'round';

      // Left Eye: Delicate upward-curving sleeping arch
      ctx.beginPath();
      ctx.arc(-14, -4, 9, 0.95 * Math.PI, 1.95 * Math.PI, false);
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Left eye outer lash tick
      ctx.beginPath();
      ctx.moveTo(-22, -3);
      ctx.lineTo(-26, -1);
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Right Eye: Delicate upward-curving sleeping arch
      ctx.beginPath();
      ctx.arc(14, -4, 9, 1.05 * Math.PI, 0.05 * Math.PI, false);
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Right eye outer lash tick
      ctx.beginPath();
      ctx.moveTo(22, -3);
      ctx.lineTo(26, -1);
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Stitched horizontal nose dash
      ctx.beginPath();
      ctx.moveTo(-3, 8);
      ctx.lineTo(3, 8);
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // MOUTH: Either peaceful stitched dash OR GAPING CREEPY SINGING VOID!
      if (this.mouthOpen > 0.05) {
        // Gaping singing cavity
        const openY = 18;
        const openRadiusX = 6 + this.mouthOpen * 3;
        const openRadiusY = this.mouthOpen * 11;

        ctx.beginPath();
        ctx.ellipse(0, openY, openRadiusX, openRadiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0f'; // Dark void
        ctx.fill();

        ctx.lineWidth = 2.0;
        ctx.strokeStyle = '#27272a';
        ctx.stroke();

        // Stitched lips rim around opening
        ctx.setLineDash([2, 3]);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(120, 50, 50, 0.6)';
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Peaceful stitched horizontal mouth dash from photo
        ctx.beginPath();
        ctx.moveTo(-4, 18);
        ctx.lineTo(4, 18);
        ctx.lineWidth = 2.4;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // --- SKELETAL DINOSAUR TAIL ---
  // --- SKELETAL DINOSAUR TAIL ---
  // A massive articulated fossil dinosaur tail attached strictly to the rear tip of the last segment
  class SkeletalDinosaurTail {
    constructor(numVertebrae = 18) {
      this.numVertebrae = numVertebrae;
      this.vertebrae = [];
      for (let i = 0; i < numVertebrae; i++) {
        const t = i / (numVertebrae - 1);
        this.vertebrae.push({
          x: 0,
          y: 0,
          angle: Math.PI / 2,
          len: 38 * (1 - t * 0.52) + 12, // 50px down to 23px per vertebra (380px total tail)
          width: 52 * Math.pow(1 - t * 0.82, 0.85) + 8, // 60px down to 10px wide massive centrum
          spikeLen: 46 * (1 - t * 0.76) + 6 // 52px down to 10px swept fossil rib chevrons
        });
      }
      this.tip = this.vertebrae[this.numVertebrae - 1];
    }

    reset(startX, startY, startAngle) {
      for (let i = 0; i < this.numVertebrae; i++) {
        const v = this.vertebrae[i];
        v.angle = startAngle;
        v.x = startX + Math.cos(startAngle) * (i * 20);
        v.y = startY + Math.sin(startAngle) * (i * 20);
      }
    }

    update(tailSegment, isMoving, crawlPhase, dt = 0.016, timeScale = 1.0) {
      if (!tailSegment) return;
      const butt = tailSegment.getEffectiveTailButt ? tailSegment.getEffectiveTailButt() : tailSegment.getButtPosition();
      const baseAngle = tailSegment.heading + Math.PI;

      // Root vertebra is attached to the butt tip with heavy rotational inertia
      this.vertebrae[0].x = butt.x;
      this.vertebrae[0].y = butt.y;
      const rootTurnSpeed = 1 - Math.pow(1 - 0.28, timeScale);
      this.vertebrae[0].angle += angleDiff(baseAngle, this.vertebrae[0].angle) * rootTurnSpeed;

      const tremor = tailSegment.isSinging ? (Math.random() - 0.5) * 2.5 : 0;

      // Heavy serpentine whipping wave with massive tail mass and inertia
      const waveTurnSpeed = 1 - Math.pow(1 - 0.26, timeScale);
      for (let i = 1; i < this.numVertebrae; i++) {
        const prev = this.vertebrae[i - 1];
        const curr = this.vertebrae[i];

        // Eerie heavy reptilian serpentine whip
        const wave = Math.sin(crawlPhase * 0.72 - i * 0.35) * (0.24 * Math.sin((i / this.numVertebrae) * Math.PI)) * (isMoving ? 1.0 : 0.16) + tremor * 0.06;
        let targetAngle = prev.angle + wave;

        curr.angle += angleDiff(targetAngle, curr.angle) * waveTurnSpeed;

        // Limit intervertebral bend angle to 35 degrees to keep massive bone spine plausible
        const diff = angleDiff(curr.angle, prev.angle);
        const maxBend = 0.60;
        if (Math.abs(diff) > maxBend) {
          curr.angle = prev.angle + Math.sign(diff) * maxBend;
        }

        curr.x = prev.x + Math.cos(curr.angle) * prev.len;
        curr.y = prev.y + Math.sin(curr.angle) * prev.len;
      }
    }

    render(ctx, tailSegment) {
      if (!tailSegment) return;

      // 1. Heavy dual-layer floor shadows under massive vertebrae and rib chevrons
      ctx.save();
      for (let i = 1; i < this.numVertebrae; i++) {
        const prev = this.vertebrae[i - 1];
        const curr = this.vertebrae[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2 + 10;
        const w = curr.width;

        // Outer soft ambient shadow
        ctx.beginPath();
        ctx.ellipse(midX, midY, Math.max(6, w * 1.35), Math.max(4, prev.len * 0.85), curr.angle, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.fill();

        // Inner heavy core contact shadow
        ctx.beginPath();
        ctx.ellipse(midX, midY - 2, Math.max(4, w * 0.85), Math.max(3, prev.len * 0.65), curr.angle, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
        ctx.fill();
      }
      ctx.restore();

      // 2. Heavy surgical attachment harness at root vertebra connecting to plush rear
      const root = this.vertebrae[0];
      const butt = tailSegment.getEffectiveTailButt ? tailSegment.getEffectiveTailButt() : tailSegment.getButtPosition();
      ctx.save();
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      const pX = -Math.sin(root.angle);
      const pY = Math.cos(root.angle);
      for (let s = -22; s <= 22; s += 5.5) {
        ctx.beginPath();
        ctx.moveTo(butt.x + pX * s - Math.cos(root.angle) * 4, butt.y + pY * s - Math.sin(root.angle) * 4);
        ctx.lineTo(root.x + pX * (s * 0.9) + Math.cos(root.angle) * 6, root.y + pY * (s * 0.9) + Math.sin(root.angle) * 6);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Render vertebrae segments from tail tip to base
      for (let i = this.numVertebrae - 1; i >= 1; i--) {
        const prev = this.vertebrae[i - 1];
        const curr = this.vertebrae[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        const angle = curr.angle;
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        const w = curr.width;
        const spike = curr.spikeLen;

        ctx.save();

        // Massive transverse rib / chevron spikes
        if (spike > 3.0) {
          const barbAngleL = angle - Math.PI * 0.68;
          const barbAngleR = angle + Math.PI * 0.68;
          const spikeDist = spike + w * 0.55;

          // Left fossil chevron spike
          ctx.beginPath();
          ctx.moveTo(midX + perpX * (w * 0.45), midY + perpY * (w * 0.45));
          ctx.lineTo(midX + Math.cos(barbAngleL) * spikeDist, midY + Math.sin(barbAngleL) * spikeDist);
          ctx.lineTo(prev.x + perpX * (w * 0.38), prev.y + perpY * (w * 0.38));
          ctx.closePath();
          ctx.fillStyle = '#eae2d3';
          ctx.fill();
          ctx.strokeStyle = '#9d8e7a';
          ctx.lineWidth = 1.3;
          ctx.stroke();

          // Highlight on spine
          ctx.beginPath();
          ctx.moveTo(midX + perpX * (w * 0.45), midY + perpY * (w * 0.45));
          ctx.lineTo(midX + Math.cos(barbAngleL) * spikeDist, midY + Math.sin(barbAngleL) * spikeDist);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 0.9;
          ctx.stroke();

          // Right fossil chevron spike
          ctx.beginPath();
          ctx.moveTo(midX - perpX * (w * 0.45), midY - perpY * (w * 0.45));
          ctx.lineTo(midX + Math.cos(barbAngleR) * spikeDist, midY + Math.sin(barbAngleR) * spikeDist);
          ctx.lineTo(prev.x - perpX * (w * 0.38), prev.y - perpY * (w * 0.38));
          ctx.closePath();
          ctx.fillStyle = '#eae2d3';
          ctx.fill();
          ctx.strokeStyle = '#9d8e7a';
          ctx.lineWidth = 1.3;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(midX - perpX * (w * 0.45), midY - perpY * (w * 0.45));
          ctx.lineTo(midX + Math.cos(barbAngleR) * spikeDist, midY + Math.sin(barbAngleR) * spikeDist);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }

        // Massive Centrum (Vertebral drum body with condyle knobs)
        ctx.beginPath();
        const rPrev = w * 0.88;
        const rCurr = w * 0.72;
        const waist = w * 0.56;

        ctx.moveTo(prev.x + perpX * rPrev, prev.y + perpY * rPrev);
        ctx.quadraticCurveTo(midX + perpX * waist, midY + perpY * waist, curr.x + perpX * rCurr, curr.y + perpY * rCurr);
        ctx.arc(curr.x, curr.y, rCurr, angle - Math.PI / 2, angle + Math.PI / 2);
        ctx.quadraticCurveTo(midX - perpX * waist, midY - perpY * waist, prev.x - perpX * rPrev, prev.y - perpY * rPrev);
        ctx.arc(prev.x, prev.y, rPrev, angle + Math.PI / 2, angle - Math.PI / 2);
        ctx.closePath();

        // Fossilized bone gradient shading
        const boneGrad = ctx.createLinearGradient(
          midX + perpX * w, midY + perpY * w,
          midX - perpX * w, midY - perpY * w
        );
        boneGrad.addColorStop(0, '#fcf9f2');
        boneGrad.addColorStop(0.35, '#ede3d3');
        boneGrad.addColorStop(0.75, '#dbcaba');
        boneGrad.addColorStop(1, '#b09e86');
        ctx.fillStyle = boneGrad;
        ctx.fill();

        ctx.strokeStyle = '#988975';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Dorsal neural spine fin ridge down the center
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.strokeStyle = 'rgba(90, 75, 60, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Aged bone micro-fractures
        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(midX - perpX * (w * 0.25), midY - perpY * (w * 0.25));
          ctx.lineTo(midX + perpX * (w * 0.35) + Math.cos(angle) * 3, midY + perpY * (w * 0.35) + Math.sin(angle) * 3);
          ctx.strokeStyle = 'rgba(65, 50, 40, 0.4)';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }

        // Surgical thread wraps binding the joint
        ctx.beginPath();
        ctx.moveTo(curr.x - perpX * (rCurr * 0.92), curr.y - perpY * (rCurr * 0.92));
        ctx.lineTo(curr.x + perpX * (rCurr * 0.92), curr.y + perpY * (rCurr * 0.92));
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        ctx.restore();
      }

      // 4. Formidable Terminal Dinosaur Thagomizer Spiked Bone Club
      const tipVert = this.vertebrae[this.numVertebrae - 1];
      const tipAngle = tipVert.angle;
      const tipPerpX = -Math.sin(tipAngle);
      const tipPerpY = Math.cos(tipAngle);

      ctx.save();

      // Armored bone bulb mace
      ctx.beginPath();
      ctx.ellipse(tipVert.x, tipVert.y, 16, 13, tipAngle, 0, Math.PI * 2);
      const bulbGrad = ctx.createRadialGradient(tipVert.x, tipVert.y, 2, tipVert.x, tipVert.y, 16);
      bulbGrad.addColorStop(0, '#fefbf5');
      bulbGrad.addColorStop(0.5, '#eae0d0');
      bulbGrad.addColorStop(1, '#9b8b76');
      ctx.fillStyle = bulbGrad;
      ctx.fill();
      ctx.strokeStyle = '#7c6d59';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Helper to render a massive thagomizer bone spike
      const drawThagomizerSpike = (angleOffset, spikeLen, baseW) => {
        const a = tipAngle + angleOffset;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        const pA_X = -sinA;
        const pA_Y = cosA;

        const tipX = tipVert.x + cosA * spikeLen;
        const tipY = tipVert.y + sinA * spikeLen;

        ctx.beginPath();
        ctx.moveTo(tipVert.x + pA_X * (baseW * 0.5), tipVert.y + pA_Y * (baseW * 0.5));
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(tipVert.x - pA_X * (baseW * 0.5), tipVert.y - pA_Y * (baseW * 0.5));
        ctx.closePath();

        const spGrad = ctx.createLinearGradient(tipVert.x, tipVert.y, tipX, tipY);
        spGrad.addColorStop(0, '#eae2d3');
        spGrad.addColorStop(0.7, '#f7f2e8');
        spGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = spGrad;
        ctx.fill();
        ctx.strokeStyle = '#857663';
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Sharp glint ridge
        ctx.beginPath();
        ctx.moveTo(tipVert.x, tipVert.y);
        ctx.lineTo(tipX, tipY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      };

      // 2 Massive primary backward-pointing thagomizer spikes (like Stegosaurus)
      drawThagomizerSpike(-0.68, 44, 9.0);
      drawThagomizerSpike(0.68, 44, 9.0);

      // 2 Secondary lateral swept spikes
      drawThagomizerSpike(-1.62, 28, 7.5);
      drawThagomizerSpike(1.62, 28, 7.5);

      // 1 Terminal apex spear spike
      drawThagomizerSpike(0, 36, 7.0);

      // Suture reinforcement wraps at the neck of the club
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tipVert.x - tipPerpX * 12, tipVert.y - tipPerpY * 12);
      ctx.lineTo(tipVert.x + tipPerpX * 12, tipVert.y + tipPerpY * 12);
      ctx.stroke();

      ctx.restore();
    }
  }

  // --- CRAWLER CENTIPEDE CONTROLLER ---
  class PlushCentipedeCrawler {
    constructor(x, y) {
      this.speedMultiplier = 1.0;
      this.pathTrail = new PathTrail();
      this.pathTrail.reset(x, y, -Math.PI / 2);
      this.segments = [new CentipedeSegment(x, y, 0, null)];
      this.crawlPhase = 0;
      // Single skeletal dinosaur tail attached to the very end of the centipede
      this.dinoTail = new SkeletalDinosaurTail();
      this.dinoTail.reset(x, y + 58, Math.PI / 2);
    }

    get leader() {
      return this.segments[0];
    }

    get tail() {
      return this.segments[this.segments.length - 1];
    }

    // Spawns/poops an attached clone from the butt of the tail
    poopClone() {
      // Prevent pooping more clones while the current birth animation is not complete!
      for (const seg of this.segments) {
        if (seg.birthState !== 'born') {
          return null;
        }
      }

      const tailSeg = this.tail;
      const fwdX = Math.cos(tailSeg.heading);
      const fwdY = Math.sin(tailSeg.heading);

      const spawnX = tailSeg.x - fwdX * 90;
      const spawnY = tailSeg.y - fwdY * 90;

      const newIndex = this.segments.length;
      const newChild = new CentipedeSegment(spawnX, spawnY, newIndex, tailSeg);
      tailSeg.child = newChild;
      this.segments.push(newChild);

      audio.init();
      audio.playFabricSlide();

      // Update segment counter in HUD
      const countEl = document.getElementById('hud-segments');
      if (countEl) {
        countEl.textContent = `Segments: ${this.segments.length}`;
      }

      return newChild;
    }

    update(keys, isShift, isSpace, virtualKeys, dt = 0.016, timeScale = 1.0) {
      let moveInput = 0;
      let turnInput = 0;

      if (keys['ArrowUp'] || keys['KeyW'] || virtualKeys.up) moveInput += 1;
      if (keys['ArrowDown'] || keys['KeyS'] || virtualKeys.down) moveInput -= 0.7;
      if (keys['ArrowLeft'] || keys['KeyA'] || virtualKeys.left) turnInput -= 1;
      if (keys['ArrowRight'] || keys['KeyD'] || virtualKeys.right) turnInput += 1;

      // Natural slithering arc when steering without forward/backward key
      let effectiveMove = moveInput;
      if (Math.abs(moveInput) < 0.01 && Math.abs(turnInput) > 0.01) {
        effectiveMove = 0.65;
      }

      const mult = (this.speedMultiplier !== undefined) ? this.speedMultiplier : speedMultiplier;
      const crawlSpeedFactor = isShift ? 1.75 : 1.0;
      const baseMoveVelocity = effectiveMove * 2.6 * crawlSpeedFactor * mult;
      const moveVelocity = baseMoveVelocity * timeScale;
      const turnVelocity = turnInput * 0.045 * (isShift ? 1.3 : 1.0) * Math.min(2.5, Math.max(0.5, Math.sqrt(mult))) * timeScale;

      // Turn leader heading
      this.leader.heading += turnVelocity;

      const fwdX = Math.cos(this.leader.heading);
      const fwdY = Math.sin(this.leader.heading);

      // Move body root center
      this.leader.x += fwdX * moveVelocity;
      this.leader.y += fwdY * moveVelocity;

      const isMoving = Math.abs(effectiveMove) > 0.01 || Math.abs(turnInput) > 0.01;
      if (isMoving) {
        // Record leader position & heading into the path trail
        this.pathTrail.addPoint(this.leader.x, this.leader.y, this.leader.heading);
        const gaitRate = Math.max(Math.abs(baseMoveVelocity) * 0.08, Math.abs(turnInput * 0.045) * 1.8) * timeScale;
        this.crawlPhase += gaitRate;
        audio.playFabricSlide();
      }

      // Update all segments in chain along the trail
      for (const seg of this.segments) {
        seg.update(this.pathTrail, this.crawlPhase, isMoving, isShift, isSpace, dt, timeScale);
      }

      // Update the massive skeletal dinosaur tail attached to the butt of the last segment
      if (this.dinoTail) {
        this.dinoTail.update(this.tail, isMoving, this.crawlPhase, dt, timeScale);
      }

      // Real-time button feedback while birthing animation is incomplete
      const isBirthing = this.segments.some(s => s.birthState !== 'born');
      const poopBtn = document.getElementById('btn-poop');
      const mPoopBtn = document.getElementById('m-poop');
      if (isBirthing) {
        if (poopBtn && poopBtn.textContent !== 'Birthing...') {
          poopBtn.classList.add('disabled');
          poopBtn.textContent = 'Birthing...';
        }
        if (mPoopBtn && mPoopBtn.textContent !== 'WAIT') {
          mPoopBtn.classList.add('disabled');
          mPoopBtn.textContent = 'WAIT';
        }
      } else {
        if (poopBtn && poopBtn.textContent !== 'Poop Clone [P]') {
          poopBtn.classList.remove('disabled');
          poopBtn.textContent = 'Poop Clone [P]';
        }
        if (mPoopBtn && mPoopBtn.textContent !== 'POOP') {
          mPoopBtn.classList.remove('disabled');
          mPoopBtn.textContent = 'POOP';
        }
      }
    }

    render(ctx) {
      // Render the single dinosaur tail attached to the butt of the very last segment
      if (this.dinoTail) {
        this.dinoTail.render(ctx, this.tail);
      }

      // Render from tail to head so front segments cleanly overlap rear segments
      for (let i = this.segments.length - 1; i >= 0; i--) {
        this.segments[i].render(ctx);
      }
    }

    reset(cx, cy) {
      audio.stopAllSinging();
      this.pathTrail.reset(cx, cy, -Math.PI / 2);
      this.segments = [new CentipedeSegment(cx, cy, 0, null)];
      this.crawlPhase = 0;
      if (this.dinoTail) {
        this.dinoTail.reset(cx, cy + 58, Math.PI / 2);
      }
      const countEl = document.getElementById('hud-segments');
      if (countEl) countEl.textContent = `Segments: 1`;
    }

    setSinging(active) {
      audio.init();
      for (const seg of this.segments) {
        seg.isSinging = active;
        if (active && seg.birthState === 'born') {
          audio.startSinging(`seg_${seg.index}`, seg.singPitch);
        } else {
          audio.stopSinging(`seg_${seg.index}`);
        }
      }
    }
  }

  const crawler = new PlushCentipedeCrawler(width / 2, height / 2);
  window.crawler = crawler;

  // Speed Multiplier & Input states
  let speedMultiplier = 1.0;
  const keys = {};
  const virtualKeys = { up: false, down: false, left: false, right: false, shift: false, space: false };
  let isSingingGlobal = false;

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    audio.init();

    if (e.code === 'KeyR') {
      crawler.reset(width / 2, height / 2);
    }
    if (e.code === 'KeyP') {
      crawler.poopClone();
    }
    if (e.code === 'KeyV' && !isSingingGlobal) {
      isSingingGlobal = true;
      crawler.setSinging(true);
      const singBtn = document.getElementById('btn-sing');
      if (singBtn) singBtn.style.background = 'rgba(147, 197, 253, 0.35)';
    }
    if (e.code === 'KeyB') {
      cycleBackground();
    }
    if (e.code === 'KeyH') {
      toggleUI();
    }
    if (e.code === 'Equal' || e.code === 'NumpadAdd') {
      setZoom(camera.targetZoom * 1.25);
    }
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
      setZoom(camera.targetZoom * 0.8);
    }
    if (e.code === 'Digit0' || e.code === 'Numpad0') {
      resetZoom();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'KeyV' && isSingingGlobal) {
      isSingingGlobal = false;
      crawler.setSinging(false);
      const singBtn = document.getElementById('btn-sing');
      if (singBtn) singBtn.style.background = '';
    }
  });

  // Camera Zoom & Pan State
  const camera = {
    zoom: 1.0,
    targetZoom: 1.0,
    minZoom: 0.35,
    maxZoom: 3.2,
    panX: 0,
    panY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0
  };

  function screenToWorld(sx, sy) {
    const cx = width / 2 + camera.panX;
    const cy = height / 2 + camera.panY;
    return {
      x: (sx - cx) / camera.zoom + width / 2,
      y: (sy - cy) / camera.zoom + height / 2
    };
  }

  function setZoom(newZoom) {
    camera.targetZoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, newZoom));
    updateZoomHUD();
  }

  function resetZoom() {
    camera.targetZoom = 1.0;
    camera.panX = 0;
    camera.panY = 0;
    updateZoomHUD();
  }

  function updateZoomHUD() {
    const zoomResetBtn = document.getElementById('btn-zoom-reset');
    if (zoomResetBtn) {
      zoomResetBtn.textContent = `Zoom: ${Math.round(camera.targetZoom * 100)}%`;
    }
  }

  // Mouse wheel zoom
  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(camera.targetZoom * zoomDelta);
  }, { passive: false });

  // Touch pinch-to-zoom
  let touchStartDist = 0;
  let touchStartZoom = 1.0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist = Math.hypot(dx, dy);
      touchStartZoom = camera.targetZoom;
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && touchStartDist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / touchStartDist;
      setZoom(touchStartZoom * ratio);
    }
  }, { passive: false });

  // Pan with middle click or right-click drag
  window.addEventListener('mousedown', (e) => {
    if (e.button === 1 || e.button === 2) {
      camera.isPanning = true;
      camera.panStartX = e.clientX - camera.panX;
      camera.panStartY = e.clientY - camera.panY;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (camera.isPanning) {
      camera.panX = e.clientX - camera.panStartX;
      camera.panY = e.clientY - camera.panStartY;
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 1 || e.button === 2) {
      camera.isPanning = false;
    }
  });

  window.addEventListener('contextmenu', (e) => {
    if (camera.isPanning) e.preventDefault();
  });

  // Joint dragging across any segment or the dinosaur tail
  function findInteractivePoint(px, py, maxDist = 48) {
    let closest = null;
    let minD = maxDist;

    for (const seg of crawler.segments) {
      const candidates = [
        { seg, obj: seg.handL, x: seg.handL.x, y: seg.handL.y, name: 'handL' },
        { seg, obj: seg.handR, x: seg.handR.x, y: seg.handR.y, name: 'handR' },
        { seg, obj: seg.footL, x: seg.footL.x, y: seg.footL.y, name: 'footL' },
        { seg, obj: seg.footR, x: seg.footR.x, y: seg.footR.y, name: 'footR' },
        { seg, obj: seg.headPos, x: seg.headPos.x, y: seg.headPos.y, name: 'head' },
        { seg, obj: seg, x: seg.x, y: seg.y, name: 'body' }
      ];

      for (const c of candidates) {
        const d = Math.hypot(c.x - px, c.y - py);
        if (d < minD) {
          minD = d;
          closest = c;
        }
      }
    }

    // Dinosaur tail tip draggable
    if (crawler.dinoTail && crawler.dinoTail.tip) {
      const tip = crawler.dinoTail.tip;
      const d = Math.hypot(tip.x - px, tip.y - py);
      if (d < minD) {
        minD = d;
        closest = { seg: crawler.tail, obj: tip, x: tip.x, y: tip.y, name: 'dinoTail' };
      }
    }

    return closest;
  }

  let draggedItem = null;
  let mousePos = { x: 0, y: 0 };

  function onPointerDown(px, py) {
    audio.init();
    mousePos = { x: px, y: py };
    const worldPt = screenToWorld(px, py);
    const found = findInteractivePoint(worldPt.x, worldPt.y, 48 / camera.zoom);
    if (found) {
      draggedItem = found;
      found.seg.dragTarget = found.obj;
    }
  }

  function onPointerMove(px, py) {
    mousePos = { x: px, y: py };
    if (draggedItem) {
      const worldPt = screenToWorld(px, py);
      if (draggedItem.name === 'body' || draggedItem.name === 'head') {
        const dx = worldPt.x - draggedItem.seg.x;
        const dy = worldPt.y - draggedItem.seg.y;
        const distMoved = Math.hypot(dx, dy);

        if (draggedItem.seg === crawler.leader) {
          if (distMoved > 2) {
            draggedItem.seg.heading = Math.atan2(dy, dx);
            draggedItem.seg.x = worldPt.x;
            draggedItem.seg.y = worldPt.y;
            crawler.pathTrail.addPoint(crawler.leader.x, crawler.leader.y, crawler.leader.heading);
            crawler.crawlPhase += distMoved * 0.08;
            audio.playFabricSlide();
          }
        } else {
          draggedItem.seg.x = worldPt.x;
          draggedItem.seg.y = worldPt.y;
        }
      } else {
        draggedItem.obj.x = worldPt.x;
        draggedItem.obj.y = worldPt.y;
      }
    }
  }

  function onPointerUp() {
    if (draggedItem) {
      draggedItem.seg.dragTarget = null;
      draggedItem = null;
    }
  }

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) onPointerDown(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onPointerUp);

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches[0];
      onPointerDown(t.clientX, t.clientY);
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      onPointerMove(t.clientX, t.clientY);
    }
  }, { passive: false });

  window.addEventListener('touchend', onPointerUp);

  // Mobile D-Pad touch binding
  const bindTouchButton = (id, keyName) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const start = (e) => {
      e.preventDefault();
      virtualKeys[keyName] = true;
      audio.init();
    };
    const end = (e) => {
      e.preventDefault();
      virtualKeys[keyName] = false;
    };
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', end, { passive: false });
  };

  bindTouchButton('m-up', 'up');
  bindTouchButton('m-down', 'down');
  bindTouchButton('m-left', 'left');
  bindTouchButton('m-right', 'right');
  bindTouchButton('m-shift', 'shift');
  bindTouchButton('m-space', 'space');

  // Poop Button
  const poopBtn = document.getElementById('btn-poop');
  if (poopBtn) {
    poopBtn.addEventListener('click', () => {
      crawler.poopClone();
    });
  }
  const mPoopBtn = document.getElementById('m-poop');
  if (mPoopBtn) {
    mPoopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      crawler.poopClone();
    });
    mPoopBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      crawler.poopClone();
    }, { passive: false });
  }

  // Sing Button (press / hold or click toggle)
  const singBtn = document.getElementById('btn-sing');
  if (singBtn) {
    singBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isSingingGlobal = true;
      crawler.setSinging(true);
      singBtn.style.background = 'rgba(147, 197, 253, 0.35)';
    });
    singBtn.addEventListener('mouseup', (e) => {
      e.preventDefault();
      isSingingGlobal = false;
      crawler.setSinging(false);
      singBtn.style.background = '';
    });
    singBtn.addEventListener('mouseleave', () => {
      if (isSingingGlobal) {
        isSingingGlobal = false;
        crawler.setSinging(false);
        singBtn.style.background = '';
      }
    });
  }
  const mSingBtn = document.getElementById('m-sing');
  if (mSingBtn) {
    mSingBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      crawler.setSinging(true);
    }, { passive: false });
    mSingBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      crawler.setSinging(false);
    }, { passive: false });
  }

  // Reset Button
  const resetBtn = document.getElementById('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      crawler.reset(width / 2, height / 2);
    });
  }

  // Pose Button
  let isFrogged = false;
  const poseBtn = document.getElementById('btn-pose');
  if (poseBtn) {
    poseBtn.addEventListener('click', () => {
      isFrogged = !isFrogged;
      for (const seg of crawler.segments) {
        seg.syncRestPose();
      }
      poseBtn.textContent = isFrogged ? 'Pose: Reset' : 'Pose: Frog [Space]';
    });
  }

  // Sound Toggle
  const soundBtn = document.getElementById('btn-sound');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      audio.enabled = !audio.enabled;
      soundBtn.textContent = `Audio: ${audio.enabled ? 'On' : 'Off'}`;
      if (audio.enabled) audio.init();
    });
  }

  // Zoom HUD buttons
  const zoomInBtn = document.getElementById('btn-zoom-in');
  if (zoomInBtn) zoomInBtn.addEventListener('click', () => setZoom(camera.targetZoom * 1.25));

  const zoomOutBtn = document.getElementById('btn-zoom-out');
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => setZoom(camera.targetZoom * 0.8));

  const zoomResetBtn = document.getElementById('btn-zoom-reset');
  if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);

  // Speed Slider Control
  const speedSlider = document.getElementById('speed-slider');
  const speedVal = document.getElementById('speed-value');
  if (speedSlider) {
    speedSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      speedMultiplier = val;
      if (crawler) crawler.speedMultiplier = val;
      if (speedVal) {
        speedVal.textContent = `${val.toFixed(1)}x`;
      }
    });
  }

  // Background selection (Default: Plain Black)
  const BG_MODES = [
    { id: 'black', label: 'BG: Plain Black' },
    { id: 'dark', label: 'BG: Dark Room' },
    { id: 'wood', label: 'BG: Wood Floor' },
    { id: 'tile', label: 'BG: Asylum Tile' }
  ];
  let currentBgIndex = 0; // Default: Plain Black!

  function cycleBackground() {
    currentBgIndex = (currentBgIndex + 1) % BG_MODES.length;
    const bgBtn = document.getElementById('btn-bg');
    if (bgBtn) {
      bgBtn.textContent = BG_MODES[currentBgIndex].label;
    }
  }

  const bgBtn = document.getElementById('btn-bg');
  if (bgBtn) bgBtn.addEventListener('click', cycleBackground);

  // Hide UI Toggle
  function toggleUI() {
    const isHidden = document.body.classList.toggle('ui-hidden');
    const hideBtn = document.getElementById('btn-hide-ui');
    if (hideBtn) {
      hideBtn.textContent = isHidden ? 'Show UI [H]' : 'Hide UI [H]';
    }
  }

  const hideBtn = document.getElementById('btn-hide-ui');
  if (hideBtn) hideBtn.addEventListener('click', toggleUI);

  const showBtn = document.getElementById('btn-show-ui');
  if (showBtn) showBtn.addEventListener('click', toggleUI);

  // Floor atmosphere for Dark Room
  const ambientDust = [];
  for (let i = 0; i < 50; i++) {
    ambientDust.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 1.4 + 0.6,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.25 + 0.08
    });
  }

  function renderFloor(ctx, camera) {
    const mode = BG_MODES[currentBgIndex].id;

    // Plain Black Mode (Default)
    if (mode === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    // Dark Room Mode
    if (mode === 'dark') {
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        90,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.82
      );
      bgGrad.addColorStop(0, '#0a0a0d');
      bgGrad.addColorStop(0.65, '#040406');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#ffffff';
      for (const p of ambientDust) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      return;
    }

    // Wood Floor Mode
    if (mode === 'wood') {
      ctx.fillStyle = '#110d0a';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2 + camera.panX, height / 2 + camera.panY);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-width / 2, -height / 2);

      const plankHeight = 72;
      const startY = Math.floor(-1500 / plankHeight) * plankHeight;
      const endY = Math.ceil((height + 1500) / plankHeight) * plankHeight;

      for (let y = startY; y <= endY; y += plankHeight) {
        const rowIdx = Math.floor(y / plankHeight);
        ctx.fillStyle = (rowIdx % 2 === 0) ? '#18130e' : '#140f0a';
        ctx.fillRect(-1500, y, width + 3000, plankHeight);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-1500, y);
        ctx.lineTo(width + 3000, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        for (let x = -1200 + (Math.abs(rowIdx) % 3) * 120; x < width + 1500; x += 320) {
          ctx.beginPath();
          ctx.arc(x, y + 8, 2, 0, Math.PI * 2);
          ctx.arc(x, y + plankHeight - 8, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      const vig = ctx.createRadialGradient(
        width / 2, height / 2, 120,
        width / 2, height / 2, Math.max(width, height) * 0.75
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
      return;
    }

    // Asylum Tile Mode
    if (mode === 'tile') {
      ctx.fillStyle = '#080a0c';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2 + camera.panX, height / 2 + camera.panY);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-width / 2, -height / 2);

      const tileSize = 64;
      const startX = Math.floor(-1500 / tileSize) * tileSize;
      const endX = Math.ceil((width + 1500) / tileSize) * tileSize;
      const startY = Math.floor(-1500 / tileSize) * tileSize;
      const endY = Math.ceil((height + 1500) / tileSize) * tileSize;

      for (let y = startY; y <= endY; y += tileSize) {
        for (let x = startX; x <= endX; x += tileSize) {
          const tileMod = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
          const shade = Math.floor(18 + Math.abs(tileMod) * 8);
          ctx.fillStyle = `rgb(${shade}, ${shade + 3}, ${shade + 5})`;
          ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
        }
      }

      ctx.strokeStyle = 'rgba(4, 5, 7, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += tileSize) {
        ctx.moveTo(x, startY); ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += tileSize) {
        ctx.moveTo(startX, y); ctx.lineTo(endX, y);
      }
      ctx.stroke();
      ctx.restore();

      const vig = ctx.createRadialGradient(
        width / 2, height / 2, 100,
        width / 2, height / 2, Math.max(width, height) * 0.78
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.88)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
      return;
    }
  }

  // Animation Loop
  let lastTimestamp = 0;
  function animate(currentTime = performance.now()) {
    if (!lastTimestamp) lastTimestamp = currentTime;
    const rawDt = (currentTime - lastTimestamp) / 1000;
    lastTimestamp = currentTime;
    // Clamp dt between 1ms and 50ms to maintain stability during tab pauses
    const dt = Math.min(0.05, Math.max(0.001, rawDt));
    const timeScale = dt * 60.0; // Exactly 1.0 at standard 60 FPS

    // Smooth camera zoom lerp with delta-time scaling
    camera.zoom += (camera.targetZoom - camera.zoom) * Math.min(1.0, 0.2 * timeScale);

    renderFloor(ctx, camera);

    const isShift = keys['ShiftLeft'] || keys['ShiftRight'] || virtualKeys.shift;
    const isSpace = keys['Space'] || virtualKeys.space;

    crawler.update(keys, isShift, isSpace, virtualKeys, dt, timeScale);

    // Apply camera transform for world entities
    ctx.save();
    ctx.translate(width / 2 + camera.panX, height / 2 + camera.panY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-width / 2, -height / 2);

    // Visual drag spring feedback in world space
    if (draggedItem) {
      const worldMouse = screenToWorld(mousePos.x, mousePos.y);
      ctx.save();
      ctx.strokeStyle = 'rgba(252, 211, 77, 0.4)';
      ctx.lineWidth = 1.5 / camera.zoom;
      ctx.setLineDash([4 / camera.zoom, 4 / camera.zoom]);
      ctx.beginPath();
      ctx.moveTo(worldMouse.x, worldMouse.y);
      ctx.lineTo(draggedItem.obj.x || draggedItem.seg.x, draggedItem.obj.y || draggedItem.seg.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(worldMouse.x, worldMouse.y, 8 / camera.zoom, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(252, 211, 77, 0.8)';
      ctx.fill();
      ctx.restore();
    }

    crawler.render(ctx);

    ctx.restore();

    requestAnimationFrame(animate);
  }

  window.onload = function () {
    animate();
  };
})();

