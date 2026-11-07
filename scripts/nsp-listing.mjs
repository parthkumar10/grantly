const decodeHtml = (value) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16)),
    );

const textContent = (html) =>
  decodeHtml(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).trim();

const normalize = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const isHttpsLink = (link) => {
  if (typeof link?.url !== "string") return false;
  try {
    return new URL(link.url).protocol === "https:";
  } catch {
    return false;
  }
};

export function parseNspListing(html, previous = [], sourceChecked) {
  const headings = [...html.matchAll(/<h6\b[^>]*>([\s\S]*?)<\/h6>/gi)]
    .map((match) => ({
      index: match.index,
      name: textContent(match[1]),
    }))
    .filter(({ name }) =>
      /\((?:Merit Based Scheme|Welfare Based Scheme)\)/i.test(name),
    );
  const priorByName = new Map(
    previous.map((entry) => [normalize(entry.name), entry]),
  );
  const found = new Map();

  for (const [index, heading] of headings.entries()) {
    const end = headings[index + 1]?.index ?? html.length;
    const section = html.slice(heading.index, end);
    const key = normalize(heading.name);
    const prior = found.get(key) ?? priorByName.get(key);
    const listingDetails = [
      ...section.matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/gi),
    ]
      .map((match) => textContent(match[1]))
      .filter((text) =>
        /(?:scheme|application|verification).*(?:open|clos|till|on)/i.test(
          text,
        ),
      );
    const links = [
      ...section.matchAll(
        /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      ),
    ]
      .map((match) => ({
        label: textContent(match[2]).trim(),
        url: decodeHtml(match[1]).trim(),
      }))
      .filter(isHttpsLink);

    const currentWindow = { listingDetails, links };
    const previousWindows =
      prior?.listingWindows ??
      (prior?.listingDetails?.length
        ? [{ listingDetails: prior.listingDetails, links: prior.links ?? [] }]
        : []);
    const listingWindows = previousWindows.map((window) => ({
      ...window,
      links: (window.links ?? [])
        .map((link) => ({
          ...link,
          url: typeof link?.url === "string" ? link.url.trim() : "",
        }))
        .filter(isHttpsLink),
    }));
    const priorMetadata = prior
      ? Object.fromEntries(
          Object.entries(prior).filter(
            ([name]) => name !== "listingDetails" && name !== "links",
          ),
        )
      : {};
    const windows = [...listingWindows];
    if (
      !windows.some(
        (window) => JSON.stringify(window) === JSON.stringify(currentWindow),
      )
    ) {
      windows.push(currentWindow);
    }

    found.set(key, {
      ...priorMetadata,
      name: heading.name,
      type:
        heading.name.match(
          /\((Merit Based Scheme|Welfare Based Scheme)\)/i,
        )?.[1] ??
        prior?.type ??
        "Unclassified on NSP listing",
      source: "https://scholarships.gov.in/All-Scholarships",
      sourceChecked,
      listingWindows: windows,
      coverage:
        prior?.coverage ??
        "NSP listing verified; eligibility details not yet curated",
    });
  }

  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}
