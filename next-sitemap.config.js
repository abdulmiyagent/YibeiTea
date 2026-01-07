/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://yibeitea.be",
  generateRobotsTxt: false, // We created it manually
  exclude: ["/admin/*", "/api/*", "/login/*", "/checkout/*", "/order/*"],
  alternateRefs: [
    {
      href: "https://yibeitea.be",
      hreflang: "nl",
    },
    {
      href: "https://yibeitea.be/en",
      hreflang: "en",
    },
  ],
};
