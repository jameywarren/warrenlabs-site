// GENERATED from attune/Assets/Curves/targets.dat — do not hand-edit.
//
// The two Warren Labs reference curves, on the SAME 128-point log grid (20 Hz–20 kHz) as curves.js.
//
// BASELINE — the load-bearing fact. These are DERIVED, not measured headphones, and they sit on the
// HeadRoom HMS II.3 diffuse-field baseline (attune tags them kHeadRoomRig). That is the same
// baseline as the 40 Archive curves they are drawn against, so overlaying them is legal. It will
// NOT be legal for EARS Pro measurements: attune/docs/target-curves.md flags that the house target
// must be re-derived on the EARS Pro DF before those curves land here. Two fixtures never share an
// axis, and that applies to targets exactly as it does to headphones.
//
// The house curve is "a Dan Clark version of Harman" (target-curves.md v0.3, 2026-08-02):
// DF + low-shelf +7.0 dB @110 Hz Q0.70, presence trim -1.0 dB @1900 Hz Q1.40, and a FIXED in-room
// downtilt -3.0 dB high-shelf @4000 Hz Q0.85. A STARTING GOAL to be proven against our own rig,
// not a settled answer.
export const TARGETS = {
  "warren-labs-house": { name: "Warren Labs", db: [3.16, 3.15, 3.15, 3.15, 3.14, 3.14, 3.13, 3.12, 3.11, 3.1, 3.18, 3.16, 3.14, 3.11, 3.08, 3.03, 2.98, 2.92, 2.84, 2.75, 2.65, 2.52, 2.37, 2.19, 1.99, 1.76, 1.5, 1.22, 0.91, 0.59, 0.24, -0.11, -0.46, -0.81, -1.15, -1.47, -1.77, -1.95, -2.2, -2.42, -2.61, -2.78, -2.82, -2.95, -3.05, -3.03, -3.11, -3.07, -3.11, -3.06, -2.99, -2.92, -2.84, -2.76, -2.68, -2.49, -2.4, -2.21, -2.02, -1.83, -1.54, -1.34, -1.15, -0.86, -0.67, -0.48, -0.39, -0.2, -0.21, -0.13, -0.05, -0.07, 0.01, 0.07, 0.23, 0.49, 0.83, 1.26, 1.78, 2.29, 2.69, 2.79, 2.91, 3.25, 3.83, 4.55, 5.29, 6.15, 7.21, 8.34, 9.05, 9.92, 11.17, 11.47, 11.64, 11.88, 11.4, 10.9, 9.39, 8.28, 7.88, 8.1, 8.24, 8, 7.29, 5.3, 3.33, 1.88, 0.14, -0.69, -1.7, -3.32, -4.02, -1.33, 1.57, 1.88, 0.88, 2.99, 5.79, 6.3, 2.6, -2.69, -1.89, 1.02, 0.72, 2.23, 2.63, -4.27] },
  "diffuse-field-neutral": { name: "Diffuse Field (neutral)", db: [-4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.9, -3.8, -3.8, -3.8, -3.8, -3.8, -3.7, -3.7, -3.7, -3.6, -3.6, -3.5, -3.5, -3.4, -3.3, -3.2, -3.1, -3, -2.9, -2.7, -2.6, -2.4, -2.2, -2, -1.7, -1.5, -1.3, -1, -0.8, -0.6, -0.5, -0.3, -0.3, -0.2, -0.1, -0.1, 0, 0.1, 0.3, 0.6, 1, 1.5, 2.1, 2.7, 3.2, 3.4, 3.6, 4, 4.6, 5.3, 6, 6.8, 7.8, 8.9, 9.6, 10.5, 11.8, 12.2, 12.5, 12.9, 12.6, 12.3, 11, 10.1, 9.9, 10.3, 10.6, 10.5, 9.9, 8, 6.1, 4.7, 3, 2.2, 1.2, -0.4, -1.1, 1.6, 4.5, 4.8, 3.8, 5.9, 8.7, 9.2, 5.5, 0.2, 1, 3.9, 3.6, 5.1, 5.5, -1.4] },
};
