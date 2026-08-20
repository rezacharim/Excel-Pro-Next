/**
 * What parents and players have said about the academy.
 *
 * Managed from Dashboard -> Testimonials. Before this the section showed four
 * quotes that came with the website template — invented people in Vancouver,
 * Calgary and Montreal recommending a Markham academy.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Visible testimonials, in display order.
 *
 * Returns an empty list on any failure, and the section renders nothing.
 * There is deliberately no hardcoded fallback: an unreachable API showing a
 * blank space is a small problem, and an unreachable API showing invented
 * quotes from people who do not exist is a much larger one.
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  if (!API_URL) return [];
  try {
    // No caching hints: this is called from the browser as well as the
    // server, and `next: { revalidate }` is meaningless in a client component.
    const response = await fetch(`${API_URL}/testimonials`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data.filter((t) => t?.isActive) : [];
  } catch {
    return [];
  }
}

/** "Somayeh Hosseini" -> "SH". Used when there is no photo. */
export const initials = (name: string): string =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
