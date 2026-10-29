import React, { useMemo } from 'react';

/**
 * StudentCharacter
 * High-fidelity 3D Pixar/Disney-inspired young adult student character.
 * Features:
 * - Volumetric styled dark hair with highlights
 * - Expressive 3D face (friendly, determined, shocked during fall, sorrowful during pause, victorious at summit)
 * - Olive green hoodie jacket over white inner t-shirt collar with realistic fabric folds & zipper
 * - Royal blue commuter backpack with padded straps & buckles
 * - Dark indigo denim jeans with knee creases
 * - Classic black & white sneakers with rubber toe caps, white soles, and laces
 * - Continuous physical kinematics for climbing, reaching, falling, sitting, rising, power ascent, and summit triumph.
 */
export default function StudentCharacter({
  pose = 'ambition', // 'ambition' | 'climbing' | 'reaching' | 'stumble' | 'paused' | 'rising' | 'power_ascent' | 'summit'
  x = 160,
  y = 540,
  scale = 1.15,
  animTime = 0, // continuous time in ms for continuous walking & breathing cycles
  dissolving = false,
}) {
  // Continuous walk cycle calculation for fluid climbing & running
  const walkCycle = (animTime / 180) % (Math.PI * 2);
  const breathCycle = Math.sin(animTime / 350);

  // Calculate kinematics based on pose
  const kinematics = useMemo(() => {
    switch (pose) {
      case 'ambition':
        // Standing at base looking up 40 degrees
        return {
          torsoAngle: -8 + breathCycle * 1.5,
          headAngle: -35,
          leftLegAngle: -10,
          leftKneeAngle: 12,
          rightLegAngle: 8,
          rightKneeAngle: 6,
          leftArmAngle: -12,
          rightArmAngle: 15,
          eyeType: 'focused_up',
          mouthType: 'determined_smile',
          backpackBounce: breathCycle * 1.5,
          hipY: breathCycle * 1.5,
        };

      case 'climbing': {
        // Continuous, natural alternating climbing gait
        const legSwing = Math.sin(walkCycle) * 26;
        const kneeBend = Math.max(0, Math.cos(walkCycle) * 35);
        const altLegSwing = -legSwing;
        const altKneeBend = Math.max(0, -Math.cos(walkCycle) * 35);
        const armSwing = -Math.sin(walkCycle) * 28;
        const bob = Math.abs(Math.sin(walkCycle)) * 4;

        return {
          torsoAngle: -14 + Math.sin(walkCycle) * 2,
          headAngle: -22,
          leftLegAngle: legSwing - 10,
          leftKneeAngle: kneeBend + 10,
          rightLegAngle: altLegSwing + 12,
          rightKneeAngle: altKneeBend + 10,
          leftArmAngle: armSwing - 10,
          rightArmAngle: -armSwing + 15,
          eyeType: 'focused_up',
          mouthType: 'determined_smile',
          backpackBounce: bob * 0.8,
          hipY: bob,
        };
      }

      case 'reaching':
        // Straining forward, right arm reaching high toward floating books
        return {
          torsoAngle: -24 + breathCycle * 2,
          headAngle: -32,
          leftLegAngle: -24,
          leftKneeAngle: 30,
          rightLegAngle: 16,
          rightKneeAngle: 18,
          leftArmAngle: -30,
          rightArmAngle: -75, // stretched out high
          eyeType: 'straining',
          mouthType: 'effort',
          backpackBounce: 2,
          hipY: 3,
        };

      case 'stumble':
        // Sudden slip! Body pitches backward -32deg, arms flail, legs kick up
        return {
          torsoAngle: 34,
          headAngle: 25,
          leftLegAngle: -38,
          leftKneeAngle: 45,
          rightLegAngle: 42,
          rightKneeAngle: 20,
          leftArmAngle: 55, // arms flailing backward
          rightArmAngle: -60,
          eyeType: 'shocked',
          mouthType: 'gasp',
          backpackBounce: 5,
          hipY: -6,
        };

      case 'paused':
        // Sitting/kneeling on stone step, head down, arms on knees, disappointed
        return {
          torsoAngle: 22 + breathCycle * 1.5,
          headAngle: 38, // head down between shoulders
          leftLegAngle: -45,
          leftKneeAngle: 90, // bent to sit
          rightLegAngle: -15,
          rightKneeAngle: 85,
          leftArmAngle: 18,
          rightArmAngle: 22,
          eyeType: 'sad_closed',
          mouthType: 'sorrow',
          backpackBounce: 0,
          hipY: 18, // lowered down onto the step
        };

      case 'rising':
        // Pushing up with hands on knees, head lifting, resolve returning
        return {
          torsoAngle: -8 + breathCycle * 1.5,
          headAngle: -15,
          leftLegAngle: -20,
          leftKneeAngle: 35,
          rightLegAngle: 5,
          rightKneeAngle: 25,
          leftArmAngle: -5,
          rightArmAngle: 10,
          eyeType: 'determined_up',
          mouthType: 'firm_resolve',
          backpackBounce: 0,
          hipY: 8,
        };

      case 'power_ascent': {
        // High-energy, fast athletic power climb
        const fastCycle = (animTime / 130) % (Math.PI * 2);
        const legSwing = Math.sin(fastCycle) * 34;
        const kneeBend = Math.max(0, Math.cos(fastCycle) * 45);
        const altLegSwing = -legSwing;
        const altKneeBend = Math.max(0, -Math.cos(fastCycle) * 45);
        const armSwing = -Math.sin(fastCycle) * 38;
        const bob = Math.abs(Math.sin(fastCycle)) * 6;

        return {
          torsoAngle: -22,
          headAngle: -26,
          leftLegAngle: legSwing - 14,
          leftKneeAngle: kneeBend + 15,
          rightLegAngle: altLegSwing + 16,
          rightKneeAngle: altKneeBend + 15,
          leftArmAngle: armSwing - 15,
          rightArmAngle: -armSwing + 20,
          eyeType: 'heroic',
          mouthType: 'confident_grin',
          backpackBounce: bob * 1.2,
          hipY: bob,
        };
      }

      case 'summit':
        // Standing tall on summit dais, right arm raised high in victory!
        return {
          torsoAngle: 2,
          headAngle: -38,
          leftLegAngle: -8,
          leftKneeAngle: 4,
          rightLegAngle: 10,
          rightKneeAngle: 4,
          leftArmAngle: 18,
          rightArmAngle: -145, // Arm raised straight up high to the sky
          eyeType: 'triumphant',
          mouthType: 'joy_smile',
          backpackBounce: breathCycle * 1.2,
          hipY: breathCycle * 1.2,
        };

      default:
        return {
          torsoAngle: 0,
          headAngle: 0,
          leftLegAngle: 0,
          leftKneeAngle: 0,
          rightLegAngle: 0,
          rightKneeAngle: 0,
          leftArmAngle: 0,
          rightArmAngle: 0,
          eyeType: 'focused_up',
          mouthType: 'determined_smile',
          backpackBounce: 0,
          hipY: 0,
        };
    }
  }, [pose, animTime, walkCycle, breathCycle]);

  return (
    <g
      className={`cpe-character cpe-pose-${pose}`}
      transform={`translate(${x}, ${y + kinematics.hipY}) scale(${scale})`}
      style={{
        transition: 'opacity 0.6s ease-out, filter 0.6s ease-out',
        opacity: dissolving ? 0 : 1,
        filter: dissolving ? 'blur(16px)' : 'none',
        willChange: 'transform',
      }}
    >
      <defs>
        {/* Soft Contact Drop Shadow on Steps */}
        <radialGradient id="charContactShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0, 0, 0, 0.75)" />
          <stop offset="60%" stopColor="rgba(3, 8, 22, 0.45)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
        </radialGradient>

        {/* Realistic Skin Shader (Pixar warm peach with ambient occlusion) */}
        <linearGradient id="charSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff5eb" />
          <stop offset="35%" stopColor="#fed7aa" />
          <stop offset="75%" stopColor="#fba36e" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        <radialGradient id="charCheekBlush" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
        </radialGradient>

        {/* Volumetric Dark Hair Gradient */}
        <linearGradient id="charHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#44403c" />
          <stop offset="45%" stopColor="#292524" />
          <stop offset="100%" stopColor="#1c1917" />
        </linearGradient>

        {/* Olive Green Hoodie Gradient (matching reference image) */}
        <linearGradient id="charHoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#84cc16" />
          <stop offset="40%" stopColor="#65a30d" />
          <stop offset="85%" stopColor="#4d7c0f" />
          <stop offset="100%" stopColor="#365314" />
        </linearGradient>

        <linearGradient id="charHoodieDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4d7c0f" />
          <stop offset="100%" stopColor="#1a2e05" />
        </linearGradient>

        {/* Royal Blue Commuter Backpack */}
        <linearGradient id="charBackpackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Indigo Denim Jeans Shader */}
        <linearGradient id="charDenimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="20%" stopColor="#334155" />
          <stop offset="70%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Sneaker Rubber Sole & Canvas */}
        <linearGradient id="charSneakerSole" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Atmospheric Cyan Rim Light (reflects environment lighting) */}
        <filter id="cpeCyanRim" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="-1" dy="-1" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Dynamic contact shadow on step beneath feet */}
      <ellipse
        cx="4"
        cy="4"
        rx="26"
        ry="7"
        fill="url(#charContactShadow)"
        opacity={pose === 'stumble' ? 0.2 : 0.75}
      />

      {/* ===================================================================
          CHARACTER SKELETAL RIG
          Render order:
          1. Left (Back) Arm & Leg
          2. Backpack body
          3. Torso (Green Hoodie & White Collar)
          4. Right (Front) Leg
          5. Head & Facial Features
          6. Right (Front) Arm & Hand
          7. Backpack Front Strap
          =================================================================== */}

      {/* 1. BACK LEG (Left Leg) */}
      <g transform={`rotate(${kinematics.leftLegAngle}, -4, -36)`}>
        {/* Thigh */}
        <path
          d="M -7,-36 C -12,-20 -10,-10 -6, -8 L 0, -8 C -2,-12 -1,-22 2, -36 Z"
          fill="url(#charDenimGrad)"
          stroke="#0f172a"
          strokeWidth="0.8"
        />
        {/* Lower Leg & Knee */}
        <g transform={`translate(-3, -8) rotate(${kinematics.leftKneeAngle}, 0, 0)`}>
          <path
            d="M -3,0 L -5, 24 L 2, 24 L 3,0 Z"
            fill="url(#charDenimGrad)"
            stroke="#0f172a"
            strokeWidth="0.8"
          />
          {/* Sneaker */}
          <g transform="translate(-2, 24)">
            {/* Black Canvas */}
            <path d="M -5,0 L -5,9 L 10,9 L 9,4 L 0,0 Z" fill="#0f172a" />
            {/* White Rubber Toe Cap */}
            <path d="M 6,4 Q 10,6 10,9 L 7,9 Z" fill="#ffffff" />
            {/* White Rubber Sole */}
            <rect x="-6" y="9" width="17" height="3.5" rx="1.5" fill="url(#charSneakerSole)" />
            {/* Laces */}
            <line x1="1" y1="2" x2="3" y2="4" stroke="#ffffff" strokeWidth="1" />
            <line x1="3" y1="4" x2="5" y2="6" stroke="#ffffff" strokeWidth="1" />
          </g>
        </g>
      </g>

      {/* 2. BACK ARM (Left Arm) */}
      <g transform={`rotate(${kinematics.leftArmAngle}, -8, -64)`}>
        <path
          d="M -10,-64 L -14,-46 L -7,-44 L -5,-62 Z"
          fill="url(#charHoodieDark)"
        />
        {/* Forearm & Hand */}
        <g transform="translate(-11, -45) rotate(25)">
          <path d="M -2,0 L -3,14 L 3,13 L 2,0 Z" fill="url(#charHoodieDark)" />
          {/* Fist / Hand */}
          <circle cx="0" cy="17" r="4.5" fill="url(#charSkinGrad)" />
        </g>
      </g>

      {/* 3. BLUE COMMUTER BACKPACK */}
      <g transform={`translate(-18, ${-66 + kinematics.backpackBounce}) rotate(${kinematics.torsoAngle * 0.4})`}>
        {/* Main curved pack body */}
        <path
          d="M -12,4 Q -16,18 -10,32 Q -4,38 4,36 Q 10,26 8,8 Q 6,-2 -4,0 Z"
          fill="url(#charBackpackGrad)"
          stroke="#1e3a8a"
          strokeWidth="1.2"
          filter="url(#cpeCyanRim)"
        />
        {/* Front utility pouch */}
        <path
          d="M -10,12 Q -13,22 -8,28 Q -4,30 2,28 Q 4,20 2,12 Z"
          fill="#1e3a8a"
          stroke="#3b82f6"
          strokeWidth="0.8"
        />
        {/* Zipper pulls & cyan neon status bar */}
        <line x1="-8" y1="14" x2="0" y2="14" stroke="#00f0ff" strokeWidth="1.5" />
        <circle cx="-4" cy="22" r="1.8" fill="#38bdf8" />
      </g>

      {/* 4. TORSO (Green Hoodie & White Shirt) */}
      <g transform={`rotate(${kinematics.torsoAngle}, 0, -42)`}>
        {/* Hoodie Body with realistic volume */}
        <path
          d="M -10,-42 Q -12,-62 0,-68 Q 12,-66 12,-42 Q 6,-38 0,-38 Q -6,-38 -10,-42 Z"
          fill="url(#charHoodieGrad)"
          stroke="#365314"
          strokeWidth="1"
          filter="url(#cpeCyanRim)"
        />

        {/* White inner t-shirt collar visible at neck */}
        <polygon points="-2,-68 4,-68 2,-62 0,-62" fill="#ffffff" />

        {/* Center zipper track & seams */}
        <line x1="1" y1="-64" x2="1" y2="-40" stroke="#4d7c0f" strokeWidth="1.2" strokeDasharray="2,2" />

        {/* Hoodie bottom ribbing waistband */}
        <rect x="-9" y="-42" width="20" height="5" rx="2" fill="#365314" />

        {/* Kangaroo pocket */}
        <path
          d="M -6,-48 L 8,-48 L 7,-42 L -5,-42 Z"
          fill="url(#charHoodieDark)"
          opacity="0.85"
        />

        {/* Backpack shoulder strap crossing front */}
        <path
          d="M -3,-68 Q 1,-54 3,-42"
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line x1="-1" y1="-56" x2="3" y2="-55" stroke="#ffffff" strokeWidth="1.5" />
      </g>

      {/* 5. FRONT LEG (Right Leg - Closest to Camera) */}
      <g transform={`rotate(${kinematics.rightLegAngle}, 4, -36)`}>
        {/* Denim Thigh */}
        <path
          d="M 1,-36 C -2,-20 0,-10 3, -6 L 10, -6 C 8,-12 9,-22 9, -36 Z"
          fill="url(#charDenimGrad)"
          stroke="#0f172a"
          strokeWidth="0.8"
        />
        {/* Lower Leg & Knee */}
        <g transform={`translate(6, -6) rotate(${kinematics.rightKneeAngle}, 0, 0)`}>
          <path
            d="M -3,0 L -4, 24 L 4, 24 L 3,0 Z"
            fill="url(#charDenimGrad)"
            stroke="#0f172a"
            strokeWidth="0.8"
          />
          {/* Sneaker */}
          <g transform="translate(-1, 24)">
            {/* Black Canvas */}
            <path d="M -5,0 L -5,9 L 11,9 L 10,4 L 0,0 Z" fill="#0f172a" />
            {/* White Rubber Toe Cap */}
            <path d="M 6,4 Q 11,6 11,9 L 7,9 Z" fill="#ffffff" />
            {/* White Rubber Sole */}
            <rect x="-6" y="9" width="18" height="3.5" rx="1.5" fill="url(#charSneakerSole)" />
            {/* Laces */}
            <line x1="1" y1="2" x2="3" y2="4" stroke="#ffffff" strokeWidth="1" />
            <line x1="3" y1="4" x2="5" y2="6" stroke="#ffffff" strokeWidth="1" />
          </g>
        </g>
      </g>

      {/* 6. HEAD, FACE & HAIR */}
      <g transform={`translate(2, -74) rotate(${kinematics.headAngle})`}>
        {/* Neck */}
        <rect x="-4" y="0" width="8" height="9" rx="3" fill="url(#charSkinGrad)" />

        {/* Head Base */}
        <ellipse cx="2" cy="-9" rx="12" ry="14" fill="url(#charSkinGrad)" />

        {/* Soft Cheek Blush */}
        <circle cx="8" cy="-6" r="4.5" fill="url(#charCheekBlush)" />

        {/* Ear */}
        <ellipse cx="-7" cy="-7" rx="3" ry="4.5" fill="url(#charSkinGrad)" stroke="#d97706" strokeWidth="0.6" />

        {/* 3D Volumetric Dark Hair (styled side quiff like Pixar reference) */}
        <path
          d="M -11,-10 Q -14,-22 0,-25 Q 14,-26 15,-14 Q 15,-6 14,-1 Q 12,-1 10,-4 Q 10,-12 3,-15 Q -4,-18 -8,-7 Z"
          fill="url(#charHairGrad)"
        />
        {/* Hair soft highlight tuft */}
        <path
          d="M -4,-21 Q 4,-24 10,-18 Q 6,-19 -2,-17 Z"
          fill="#475569"
          opacity="0.8"
        />

        {/* EYEBROWS */}
        {kinematics.eyeType === 'shocked' ? (
          <path d="M 2,-16 Q 7,-20 12,-16" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        ) : kinematics.eyeType === 'sad_closed' ? (
          <path d="M 2,-13 Q 7,-16 12,-14" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        ) : (
          /* Confident determined brow */
          <path d="M 2,-15 Q 7,-17 12,-14" stroke="#1e293b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        )}

        {/* EYES (Expressive 3D Pixar eyes with specular highlights) */}
        {kinematics.eyeType === 'sad_closed' ? (
          /* Closed sad eye curve */
          <path d="M 4,-9 Q 8,-6 11,-9" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : (
          <g transform="translate(4, -11)">
            {/* White Sclera */}
            <ellipse cx="4" cy="2" rx="4.5" ry="5.5" fill="#ffffff" />
            {/* Dark Brown Iris */}
            <circle cx={kinematics.eyeType === 'shocked' ? 4 : 5} cy="2" r="3.2" fill="#3b2314" />
            {/* Pupil */}
            <circle cx={kinematics.eyeType === 'shocked' ? 4 : 5.5} cy="2" r="1.8" fill="#0f172a" />
            {/* Crisp Specular Catchlight (brings eye to life) */}
            <circle cx={kinematics.eyeType === 'shocked' ? 3 : 4.5} cy="0.8" r="1.2" fill="#ffffff" />
            <circle cx="6" cy="2.8" r="0.6" fill="#ffffff" />
          </g>
        )}

        {/* Nose (Cute stylized 3D nose) */}
        <path d="M 11,-8 Q 13,-6 11,-4" stroke="#d97706" strokeWidth="1.4" fill="none" strokeLinecap="round" />

        {/* MOUTH (Expressive morphing) */}
        {kinematics.mouthType === 'determined_smile' && (
          <path d="M 6,-1 Q 10,2 13,-1" stroke="#991b1b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        )}
        {kinematics.mouthType === 'confident_grin' && (
          <path d="M 5,-1 Q 9,4 14,0 Z" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.8" />
        )}
        {kinematics.mouthType === 'gasp' && (
          <ellipse cx="10" cy="1" rx="3.5" ry="4.5" fill="#7f1d1d" stroke="#450a0a" strokeWidth="0.8" />
        )}
        {kinematics.mouthType === 'sorrow' && (
          <path d="M 6,1 Q 10,-2 13,0" stroke="#991b1b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}
        {kinematics.mouthType === 'effort' && (
          <line x1="6" y1="0" x2="13" y2="-1" stroke="#991b1b" strokeWidth="1.8" strokeLinecap="round" />
        )}
        {kinematics.mouthType === 'firm_resolve' && (
          <path d="M 6,0 Q 9,-1 13,1" stroke="#991b1b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}
        {kinematics.mouthType === 'joy_smile' && (
          <path d="M 5,-2 Q 9,5 14,-1 Z" fill="#ffffff" stroke="#991b1b" strokeWidth="1.2" />
        )}
      </g>

      {/* 7. FRONT ARM (Right Arm - Closest to camera) */}
      <g transform={`rotate(${kinematics.rightArmAngle}, 4, -64)`}>
        {/* Upper Arm Sleeve */}
        <path
          d="M 1,-64 L 6,-46 L 13,-45 L 8,-63 Z"
          fill="url(#charHoodieGrad)"
          stroke="#365314"
          strokeWidth="0.8"
        />
        {/* Forearm & Hand */}
        <g transform="translate(9, -46) rotate(-22)">
          {/* Forearm Sleeve */}
          <path d="M -2,0 L -1,15 L 5,14 L 4,0 Z" fill="url(#charHoodieGrad)" />
          {/* Wrist cuff */}
          <rect x="-2" y="14" width="7" height="2" rx="0.8" fill="#365314" />

          {/* Expressive Hand */}
          {pose === 'reaching' ? (
            /* Open reaching hand with individual fingers stretching */
            <g transform="translate(2, 17)">
              <circle cx="0" cy="0" r="3.5" fill="url(#charSkinGrad)" />
              <line x1="-1" y1="2" x2="2" y2="8" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="1" y1="2" x2="4" y2="9" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="3" y1="2" x2="6" y2="8" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          ) : pose === 'summit' ? (
            /* Victorious fist raised high */
            <g transform="translate(1, 16)">
              <circle cx="0" cy="0" r="5" fill="url(#charSkinGrad)" stroke="#d97706" strokeWidth="0.8" />
              {/* Thumbs up / fist knuckle lines */}
              <line x1="-2" y1="-2" x2="2" y2="-2" stroke="#b45309" strokeWidth="1" />
            </g>
          ) : (
            /* Clenched determined fist */
            <circle cx="1" cy="18" r="4.5" fill="url(#charSkinGrad)" stroke="#d97706" strokeWidth="0.6" />
          )}
        </g>
      </g>
    </g>
  );
}
