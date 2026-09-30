import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Terms | CodaPet quality of life quiz" };

// PLACEHOLDER: replace with the terms approved by CodaPet before launch.
export default function Terms() {
  return (
    <LegalPage title="Terms">
      <p><strong>Draft. Replace with CodaPet’s approved terms before launch.</strong></p>
      <p>
        This quiz and the emails that follow are for education only. They are not a diagnosis and don’t replace a visit
        with a veterinarian. If your pet is in pain or distress, contact a vet right away.
      </p>
    </LegalPage>
  );
}
