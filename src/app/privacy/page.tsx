import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Privacy | CodaPet quality of life quiz" };

// PLACEHOLDER: replace with the policy approved by CodaPet before launch.
export default function Privacy() {
  return (
    <LegalPage title="Privacy">
      <p><strong>Draft. Replace with CodaPet’s approved privacy policy before launch.</strong></p>
      <p>
        When you take this quiz we save your answers, your email address (if you give it), and information about the
        ad or link that brought you here. We use it to send the summary you asked for, a short series of follow-up
        emails about your pet’s quality of life, and to improve our ads.
      </p>
      <p>We don’t sell your information and we won’t call you. Every email has a one-click unsubscribe link.</p>
      <p>We use the Meta Pixel to measure our Facebook and Instagram ads.</p>
      <p>Questions: contact CodaPet at the address in any of our emails.</p>
    </LegalPage>
  );
}
