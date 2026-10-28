import {
  AGREEMENT_TEXTS,
  type AgreementVariant,
} from "@/components/organisms/AgreementConsent/agreementTexts";
import type { Section } from "@/components/organisms/AgreementConsent/agreementText";

/**
 * /policies — the full text families agree to, in one public place.
 *
 * The registration forms show the same text (from the same files), so this
 * page can never say something different from what a parent signed. Linked
 * from the footer and from the short agreement on /trials.
 */

const Block = ({ s }: { s: Section }) => (
  <div className="mt-6">
    <h3 className="font-semibold text-[#020022]">{s.heading}</h3>
    {s.paras?.map((p, i) => (
      <p key={i} className="mt-2 text-gray-700">
        {p}
      </p>
    ))}
    {s.bullets && (
      <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
        {s.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    )}
    {s.note && (
      <p className="mt-2 border-l-2 border-[#E43125] pl-3 text-gray-600">{s.note}</p>
    )}
  </div>
);

const Agreement = ({
  id,
  variant,
  appliesTo,
}: {
  id: string;
  variant: AgreementVariant;
  appliesTo: string;
}) => {
  const T = AGREEMENT_TEXTS[variant];
  return (
    <section id={id} className="scroll-mt-48 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E43125]">{appliesTo}</p>
      <h2 className="mt-1 text-2xl font-bold text-[#020022]">{T.title}</h2>
      <p className="mt-1 text-xs text-gray-500">Version {T.version}</p>
      <p className="mt-4 font-medium text-gray-900">{T.intro}</p>
      {T.sections.map((s) => (
        <Block key={s.heading} s={s} />
      ))}
    </section>
  );
};

const Policies = () => (
  <section className="bg-gray-50">
    <div className="bg-[#020022] text-white">
      <div className="mx-auto max-w-4xl px-4 pb-12 pt-44 sm:px-6 sm:pt-52">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#E43125]">Policies</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Agreement, refunds &amp; photo policy</h1>
        <p className="mt-3 max-w-2xl text-gray-300">
          What every family agrees to when registering with Excel Pro Soccer Academy. The registration forms show
          this same text.
        </p>
      </div>
    </div>

    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <a href="#academy" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-[#E43125]">
          <p className="font-bold text-[#020022]">Refunds</p>
          <p className="mt-1 text-sm text-gray-600">
            Fees are not refunded in money. In some cases the academy may offer a credit toward future sessions.
          </p>
        </a>
        <a href="#academy" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-[#E43125]">
          <p className="font-bold text-[#020022]">Photos &amp; video</p>
          <p className="mt-1 text-sm text-gray-600">
            Registering gives the academy permission to use photos and video of players on its website and social
            media.
          </p>
        </a>
        <a href="#academy" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-[#E43125]">
          <p className="font-bold text-[#020022]">Risk &amp; concussion</p>
          <p className="mt-1 text-sm text-gray-600">
            Acknowledgement of risk under Ontario law, and the yearly Rowan&apos;s Law concussion confirmation.
          </p>
        </a>
      </div>

      <Agreement id="academy" variant="academy" appliesTo="Indoor season · memberships · trials & free sessions" />
      <Agreement id="league" variant="league" appliesTo="Winter League competitive teams" />

      <p className="text-center text-sm text-gray-500">
        Questions about these policies? Email{" "}
        <a className="underline" href="mailto:excelprosocceracademy@gmail.com">
          excelprosocceracademy@gmail.com
        </a>{" "}
        or call{" "}
        <a className="underline" href="tel:+16477037821">
          +1 647-703-7821
        </a>
        .
      </p>
    </div>
  </section>
);

export default Policies;
