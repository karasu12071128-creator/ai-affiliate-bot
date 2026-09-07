/**
 * Evidence grades.
 *
 * Every article states, on the page, what its claims are actually built on.
 * This is the on-page half of `/editorial-methodology/` and `/how-we-test/`:
 * a reader (or an affiliate program reviewer) should not have to take the
 * methodology page on faith to know whether a given article was hands-on.
 *
 * `hands-on` may only be set on an article where a real account was used.
 * There is no grade that means "we implied experience we did not have".
 */

export type EvidenceGrade = "official-sources" | "hands-on" | "not-yet-tested";

export const evidenceGrades: [EvidenceGrade, ...EvidenceGrade[]] = [
  "official-sources",
  "hands-on",
  "not-yet-tested"
];

type EvidenceCopy = {
  label: string;
  meaning: string;
};

const copy: Record<EvidenceGrade, EvidenceCopy> = {
  "official-sources": {
    label: "Official sources reviewed",
    meaning:
      "Facts come from the vendor's own pricing, product, help, and program pages, cross-read against verified public review consensus. No hands-on account use is claimed."
  },
  "hands-on": {
    label: "Hands-on",
    meaning:
      "We used the product in a real account and the article says which parts we exercised. Anything outside that scope is still sourced and labelled as such."
  },
  "not-yet-tested": {
    label: "Not yet tested",
    meaning:
      "Listed for completeness from official information only. We have not evaluated it closely enough to recommend or rule out."
  }
};

export function getEvidenceLabel(grade: EvidenceGrade): string {
  return copy[grade].label;
}

export function getEvidenceMeaning(grade: EvidenceGrade): string {
  return copy[grade].meaning;
}
