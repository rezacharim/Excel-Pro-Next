/**
 * Sponsors & Partners of Excel Pro Soccer Academy
 * ------------------------------------------------
 * HOW TO ADD A SPONSOR (Reza):
 *
 *   1. Drop the sponsor's logo file into:  public/images/sponsors/
 *      (PNG with transparent background works best, roughly 400x200px)
 *   2. Add an entry to the `sponsors` array below, for example:
 *
 *      {
 *        name: "Markham Auto Group",
 *        logo: "/images/sponsors/markham-auto-group.png",
 *        url: "https://www.markhamautogroup.ca",   // optional - omit if no website
 *        tier: "gold",                             // "gold" | "silver" | "community"
 *      },
 *
 *   3. Save the file - the /sponsors page updates automatically.
 *      Gold sponsors are shown first with the largest cards, then Silver,
 *      then Community.
 */

export type SponsorTier = "gold" | "silver" | "community";

export interface Sponsor {
  name: string;
  /** Path under public/, e.g. "/images/sponsors/my-logo.png" */
  logo: string;
  /** Optional website - the logo links here when provided */
  url?: string;
  tier: SponsorTier;
}

export const sponsors: Sponsor[] = [
  // Example entry (remove the // to activate once you have a real sponsor):
  // {
  //   name: "Example Business Inc.",
  //   logo: "/images/sponsors/example-business.png",
  //   url: "https://www.example.com",
  //   tier: "gold",
  // },
];
