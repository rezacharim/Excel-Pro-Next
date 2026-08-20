import Link from "next/link";

interface HeroSideCardProps {
  imageUrl: string;
  /** Rendered large at the bottom of the card. */
  title: string;
  /** Small line under the title. */
  subtitle?: string;
  /**
   * A sentence or two under the title — for Player of the Month this is the
   * reason they won it. Wraps to two lines instead of truncating, because
   * half a reason is worse than none.
   */
  note?: string;
  /** Optional red pill in the top-left corner, e.g. "Player of the Month". */
  badge?: string;
  href?: string;
  /**
   * Vertical focus of the photo, as a CSS object-position value. Portraits
   * put the face in the upper third, so the default crops from above centre.
   */
  focus?: string;
  alt: string;
  priority?: boolean;
}

/**
 * One of the two stacked cards beside the home-page hero.
 *
 * Both cards share this component so they always line up: same height, same
 * corners, same caption treatment. Captions sit ON the photo over a gradient
 * rather than in a separate white panel — the old panel had its own height and
 * made the two cards collide.
 */
const HeroSideCard = ({
  imageUrl,
  title,
  subtitle,
  note,
  badge,
  href,
  focus = "center 25%",
  alt,
  priority = false,
}: HeroSideCardProps) => {
  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        style={{ objectPosition: focus }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {badge && (
        <span className="absolute top-3 left-3 z-10 bg-primary text-white text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-md">
          {badge}
        </span>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pt-12 ${
          note ? "pb-4" : "pb-3"
        }`}
      >
        <p className="text-white text-base font-bold leading-tight truncate">
          {title}
        </p>
        {subtitle && (
          <p className="text-white/80 text-xs mt-0.5 truncate">{subtitle}</p>
        )}
        {note && (
          <p className="mt-1 text-[11px] leading-snug text-white/85 line-clamp-2">
            {note}
          </p>
        )}
      </div>
    </>
  );

  const shell =
    "group relative block flex-1 min-h-[150px] rounded-lg overflow-hidden shadow-xl bg-gray-900";

  return href ? (
    <Link href={href} className={shell} aria-label={`${badge || title}: ${title}`}>
      {content}
    </Link>
  ) : (
    <div className={shell}>{content}</div>
  );
};

export default HeroSideCard;
