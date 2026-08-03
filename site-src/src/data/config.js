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
  // Beta feedback pill (src/components/Feedback.astro). EMPTY until the form exists: the pill still
  // opens and accepts a report rather than POSTing nowhere, so this is safe to ship today. Create a
  // Formspree form and paste its endpoint here to start receiving them.
  feedback: '',
};
