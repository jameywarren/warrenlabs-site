// Site config.
//
// Formspree endpoints for the two signup surfaces. The Signup modal
// (src/components/Signup.astro) POSTs to one of these depending on the page: the Attune landing
// uses the Attune form; every other page uses the Sonic Temple form. Both live in the Warren Labs
// Formspree account. Swap an endpoint here and every CTA on that surface goes live.
//
// If an endpoint is left empty, the modal still opens and validates but shows a friendly
// "you're on the list" message instead of POSTing nowhere, so the site is safe to deploy early.
//
// `measure` is the /measure send-in intake (make/model/name/email/shipping): its OWN dedicated
// Formspree form, kept separate from `sonicTemple` so intakes don't mix into the newsletter list.
export const FORMSPREE = {
  sonicTemple: 'https://formspree.io/f/xbdngbol',
  attune: 'https://formspree.io/f/mwvglzoe',
  measure: 'https://formspree.io/f/mzdngqjo',
  // Beta feedback pill (src/components/Feedback.astro). The comment here used to say this was
  // EMPTY until a form existed; it has an endpoint, so that note was stale and made the pill look
  // inert when it was live.
  feedback: 'https://formspree.io/f/xkoddkko',

  // Changes beta waitlist. DIFFERENT PRODUCT: the Changes iOS app, not the audio line, and the
  // consent does not transfer. Someone here agreed to hear about the Changes beta and nothing
  // else, so do not merge this list into `sonicTemple` for a Warren Labs announcement.
  //
  // NOT read by anything in this project. /changes is hand-written HTML outside the Astro build
  // (sync.mjs deliberately skips it), so the endpoint is inline in changes/index.html. It is
  // recorded here because this file is where anyone will look for it, and an endpoint that exists
  // in exactly one hand-written file is the kind that gets lost. Change it in BOTH places.
  changesBeta: 'https://formspree.io/f/xppzavao',
};
