// ─────────────────────────────────────────────────────────────────────────────
// CodaPet QOL quiz: settings. This is the only file you need to edit to launch.
// ─────────────────────────────────────────────────────────────────────────────
window.QOL_CONFIG = {
  // Where each email lead is sent (a POST with form fields; see README.md).
  // Paste a Zapier "Catch Hook" URL, a Make.com webhook URL, or any endpoint
  // that accepts a form POST. Leave empty to run the funnel without saving leads.
  leadWebhookUrl: "",

  // Meta Pixel ID (numbers only). Leave empty to turn tracking off.
  metaPixelId: "",

  // Where "Get my pet's score" sends people.
  qolUrl: "https://www.codapet.com/quality-of-life-scale",

  // Show a "Skip for now" link under the email field.
  allowSkip: false,
};
