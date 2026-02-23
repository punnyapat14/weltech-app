/**
 * referenceRanges.js
 * จัดการเกณฑ์มาตรฐานผลเลือดภาษาไทย รองรับ Adaptive Reference Ranges
 */

export const REFERENCE_RANGES = {
  hb: { 
    name: "ความเข้มข้นเม็ดเลือดแดง (Hb)", unit: "g/dL", 
    male: { min: 13.0, max: 17.0 }, female: { min: 12.0, max: 15.0 }, child: { min: 11.0, max: 16.0 }, pregnant: { min: 11.0, max: 14.0 } 
  },
  hct: { 
    name: "เม็ดเลือดแดงอัดแน่น (Hct)", unit: "%", 
    male: { min: 40, max: 54 }, female: { min: 36, max: 47 }, child: { min: 31, max: 41 }, pregnant: { min: 33, max: 44 } 
  },
  mcv: { 
    name: "ปริมาตรเม็ดเลือดแดงเฉลี่ย (MCV)", unit: "fL", 
    male: { min: 80.0, max: 100.0 }, female: { min: 80.0, max: 100.0 }, child: { min: 78.0, max: 98.0 } 
  },
  plt: { 
    name: "เกล็ดเลือด (Platelet)", unit: "10^3/uL", 
    male: { min: 150, max: 450 }, female: { min: 150, max: 450 }, child: { min: 150, max: 450 } 
  },
  wbc: { 
    name: "เม็ดเลือดขาว (WBC)", unit: "cells/µL", 
    male: { min: 4000, max: 11000 }, female: { min: 4000, max: 11000 }, child: { min: 5000, max: 14500 } 
  },
  neut: { name: "นิวโทรฟิล (Neutrophil)", unit: "%", male: { min: 40, max: 75 }, female: { min: 40, max: 75 }, child: { min: 20, max: 45 } },
  lymph: { name: "ลิมโฟไซต์ (Lymphocyte)", unit: "%", male: { min: 20, max: 45 }, female: { min: 20, max: 45 }, child: { min: 45, max: 75 } },
  mono: { name: "โมโนไซต์ (Monocyte)", unit: "%", male: { min: 2, max: 10 }, female: { min: 2, max: 10 }, child: { min: 2, max: 10 } },
  eo: { name: "อีโอซิโนฟิล (Eosinophil)", unit: "%", male: { min: 1, max: 6 }, female: { min: 1, max: 6 }, child: { min: 1, max: 6 } },
  baso: { name: "เบโซฟิล (Basophil)", unit: "%", male: { min: 0, max: 1 }, female: { min: 0, max: 1 }, child: { min: 0, max: 1 } }
};

export const getRefRange = (testType, age, gender, isPregnant = false) => {
  const test = REFERENCE_RANGES[testType.toLowerCase()];
  if (!test) return { min: 0, max: 0, unit: "", ref: "N/A", name: testType };

  let range;
  if (age !== null && age < 12) {
    range = test.child;
  } else if (isPregnant && gender === 'female' && test.pregnant) {
    range = test.pregnant;
  } else {
    range = (gender && gender.toLowerCase() === 'male') ? test.male : test.female;
  }

  return {
    name: test.name,
    min: range.min,
    max: range.max,
    unit: test.unit,
    ref: `${range.min.toFixed(1)} - ${range.max.toFixed(1)}`
  };
};

export const evaluateResult = (value, testType, age, gender, isPregnant = false) => {
  const { min, max } = getRefRange(testType, age, gender, isPregnant);
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return { status: "Unknown", color: "gray", icon: "?" };
  if (numValue < min) return { status: "Low", color: "red", icon: "↓" };
  if (numValue > max) return { status: "High", color: "red", icon: "↑" };
  return { status: "Normal", color: "green", icon: "✓" };
};