export default function RetargetingPixels() {
  const gadsId = import.meta.env.VITE_GADS_ID;
  const naverAccountId = import.meta.env.VITE_NAVER_ACCOUNT_ID;

  return (
    <>
      {/* Google Ads Remarketing Tag */}
      {gadsId && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${gadsId}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gadsId}');
              `,
            }}
          />
        </>
      )}

      {/* Naver Conversion Tracking */}
      {naverAccountId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (!window.wcs_add) window.wcs_add = {};
              window.wcs_add["wa"] = "${naverAccountId}";
              if (!window._nasa) window._nasa = {};
              if (window.wcs) {
                wcs.inflow("nolcool.com");
                wcs_do(window._nasa);
              }
            `,
          }}
        />
      )}

      {/* Naver WCS Script */}
      {naverAccountId && (
        <script async src="https://wcs.naver.net/wcslog.js" />
      )}
    </>
  );
}
