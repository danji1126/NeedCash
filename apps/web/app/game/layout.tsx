import Script from "next/script";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7452986546914975"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}