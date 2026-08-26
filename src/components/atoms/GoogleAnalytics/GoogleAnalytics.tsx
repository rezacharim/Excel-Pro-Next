import Script from "next/script";

/** GA4 property for excelproso.com. */
export const GA_MEASUREMENT_ID = "G-FP1TQ4TGCE";

/**
 * Google Analytics 4 tag. Rendered once per layout, after the page is
 * interactive so it never delays the first paint. GA4's enhanced measurement
 * tracks client-side route changes on its own, so no router hook is needed.
 */
const GoogleAnalytics = () => (
  <>
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      strategy="afterInteractive"
    />
    <Script id="google-analytics" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}');
      `}
    </Script>
  </>
);

export default GoogleAnalytics;
