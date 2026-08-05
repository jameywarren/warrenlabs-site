// The shared frequency axis: 128 log-spaced points, 20 Hz - 20 kHz. Every curve on this site is
// sampled on it, so it lives in one place rather than being repeated per data file.
//
// THE 40 CURATED ARCHIVE CURVES THAT USED TO LIVE HERE WERE REMOVED 2026-08-05. They were HeadRoom
// HMS II.3 data, and the site no longer publishes archive measurements — see
// warren-labs/docs/moat-strategy.md §1.2 and learn/why-two-rigs-cant-share-an-axis. The data still
// exists in the lab repo (warren-labs/measurements/corpus/hms-ii-3/, both channels), where it is a
// research reference. It should not come back to this repo.
//
// What replaced it: src/data/measurements.js (our own EARS Pro corpus, generated every build) and
// src/data/demo-curves.js (the same corpus, shaped for the demo widgets).

export const GRID_HZ = [20, 21.12, 22.3, 23.54, 24.86, 26.25, 27.72, 29.27, 30.9, 32.63, 34.45, 36.38, 38.41, 40.56, 42.83, 45.22, 47.75, 50.42, 53.24, 56.21, 59.36, 62.67, 66.18, 69.88, 73.78, 77.91, 82.26, 86.86, 91.72, 96.84, 102.26, 107.97, 114.01, 120.38, 127.11, 134.22, 141.72, 149.64, 158, 166.84, 176.16, 186.01, 196.41, 207.39, 218.98, 231.22, 244.14, 257.79, 272.2, 287.42, 303.48, 320.45, 338.36, 357.27, 377.24, 398.33, 420.6, 444.11, 468.93, 495.14, 522.82, 552.05, 582.9, 615.49, 649.89, 686.22, 724.58, 765.08, 807.85, 853, 900.69, 951.03, 1004.19, 1060.33, 1119.6, 1182.18, 1248.26, 1318.04, 1391.71, 1469.51, 1551.65, 1638.38, 1729.97, 1826.67, 1928.78, 2036.59, 2150.43, 2270.64, 2397.56, 2531.58, 2673.09, 2822.52, 2980.29, 3146.88, 3322.79, 3508.52, 3704.64, 3911.73, 4130.39, 4361.27, 4605.05, 4862.47, 5134.27, 5421.27, 5724.31, 6044.29, 6382.15, 6738.9, 7115.59, 7513.34, 7933.32, 8376.78, 8845.03, 9339.45, 9861.51, 10412.75, 10994.8, 11609.39, 12258.34, 12943.56, 13667.08, 14431.04, 15237.71, 16089.47, 16988.84, 17938.49, 18941.22, 20000];
