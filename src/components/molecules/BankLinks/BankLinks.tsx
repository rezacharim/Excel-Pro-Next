"use client";

/**
 * Quick links to the major Canadian banks' websites, shown on the e-transfer
 * instruction screens. Interac e-transfers can only be sent from the parent's
 * own online banking, so the best we can do is open their bank in a new tab
 * (they sign in there and send the transfer, then come back and confirm).
 */
const BANKS: { name: string; url: string }[] = [
  { name: "RBC", url: "https://www.rbcroyalbank.com" },
  { name: "TD", url: "https://www.td.com" },
  { name: "Scotiabank", url: "https://www.scotiabank.com" },
  { name: "BMO", url: "https://www.bmo.com" },
  { name: "CIBC", url: "https://www.cibc.com" },
  { name: "Tangerine", url: "https://www.tangerine.ca" },
  { name: "Simplii", url: "https://www.simplii.com" },
];

const BankLinks = () => (
  <div className="mt-4">
    <p className="text-sm font-medium text-gray-700 mb-2">
      Open your bank to send the e-transfer (opens in a new tab):
    </p>
    <div className="flex flex-wrap gap-2">
      {BANKS.map((b) => (
        <a
          key={b.name}
          href={b.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md text-gray-700 bg-white hover:border-primary hover:text-primary transition-colors"
        >
          {b.name}
        </a>
      ))}
    </div>
    <p className="mt-2 text-xs text-gray-500">
      Or use your banking app on your phone — then come back here and confirm.
    </p>
  </div>
);

export default BankLinks;
