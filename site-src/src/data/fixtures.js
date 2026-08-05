// Measurement provenance.
//
// Until 2026 every curve on this site came off one rig, so nothing needed to say which. That
// stops being true the moment the EARS Pro produces its first measurement, and a set of
// unlabelled curves is very hard to retro-tag once two populations are mixed. So: every curve
// carries a fixture id, and the site derives what it shows from this registry rather than from
// hardcoded strings scattered through the pages.
//
// The hard rule the display obeys: curves from two different fixtures are NEVER drawn on one
// axis. Different couplers and different heads sit on different baselines, and nobody has
// measured the offset between these two rigs, so a cross-fixture difference cannot be quoted.
// See src/pages/graphs.astro for the split-panel behaviour.
//
// This mirrors what the app should carry in its own curve store: attune/Assets/Curves is the
// upstream source of truth, and the web data is extracted from it.

export const FIXTURES = {
  hms2: {
    id: 'hms2',
    name: 'Head Acoustics HMS II.3',
    short: 'HMS II.3',
    stamp: 'HMS II.3 · 2005-2014',
    years: '2005 to 2014',
    operator: 'HeadRoom',
    // Shown on any page that plots a curve from this rig.
    caveat: 'Historical archive. Open backs read bass-light on this fixture.',
    limits:
      'Measured on a Head Acoustics HMS II.3 artificial head between roughly 2010 and 2013, on a ' +
      'fixture that no longer exists. Raw response, the two measured channels averaged for display, ' +
      'normalized to 0 dB at 1 kHz, one unit per model, and the seating procedure was not recorded. ' +
      'Re-seating moves this line by about ±0.4 dB from 200 Hz to 1 kHz, rising to about ±3.9 dB ' +
      'from 12 to 20 kHz; below 200 Hz the seating variance is not characterized. Open-back ' +
      'headphones read bass-light on this fixture: that is the fixture, not the headphone. ' +
      'Treat this as a historical reference, not as a Warren Labs measurement.',
  },
  earspro: {
    id: 'earspro',
    name: 'miniDSP EARS Pro',
    short: 'EARS PRO',
    stamp: 'EARS PRO · 2026',
    years: '2026 on',
    operator: 'Warren Labs',
    caveat: 'Our own bench. Not an industry reference.',
    limits:
      'Measured by Warren Labs on a miniDSP EARS Pro. The headphone is seated deliberately for the ' +
      'best fit — the way someone who cares about sound adjusts a headphone before they settle in ' +
      'to listen — rather than placed at random, and the published curve is a single real seating ' +
      'chosen by an objective rule, never a blend. Both channels are measured and stored ' +
      'separately; the line drawn here is their average. Raw response, normalized to 0 dB at 1 kHz. ' +
      'An EARS Pro is not an industry reference coupler such as a GRAS 45CA, so read this as a ' +
      'house reference: repeatable against our other EARS Pro measurements, not directly comparable ' +
      'to another lab. Seating repeatability on this bench is not characterized yet, so there is no ' +
      'variance figure to give.',
  },
};

// Default for anything that predates the field. Every published curve today is archive.
export const DEFAULT_FIXTURE = 'hms2';

/** Fixture record for a curve id, falling back to the archive rig. */
export function fixtureOf(curveId, map = CURVE_FIXTURES) {
  return FIXTURES[map[curveId] || DEFAULT_FIXTURE];
}

// curveId -> fixture id. Everything currently published came off the HMS II.3, so this map is
// intentionally empty and fixtureOf() falls through to DEFAULT_FIXTURE. Add an entry per curve
// as EARS Pro measurements land, e.g. 'hifiman-sundara': 'earspro'.
export const CURVE_FIXTURES = {};

/** True when a set of curve ids spans more than one fixture, which forces the split view. */
export function spansFixtures(curveIds, map = CURVE_FIXTURES) {
  const seen = new Set(curveIds.map((id) => map[id] || DEFAULT_FIXTURE));
  return seen.size > 1;
}

/** Group curve ids by fixture, in a stable chronological order (oldest bench first). */
export function groupByFixture(curveIds, map = CURVE_FIXTURES) {
  const order = ['hms2', 'earspro'];
  const groups = new Map();
  for (const id of curveIds) {
    const f = map[id] || DEFAULT_FIXTURE;
    if (!groups.has(f)) groups.set(f, []);
    groups.get(f).push(id);
  }
  return order.filter((f) => groups.has(f)).map((f) => ({ fixture: FIXTURES[f], curveIds: groups.get(f) }));
}
