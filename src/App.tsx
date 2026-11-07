import { Assistant } from "./components/Assistant";
import { Deadlines } from "./components/Deadlines";
import { AccountPanel } from "./components/AccountPanel";
import { EligibilityFields } from "./components/EligibilityFields";
import { useAccount } from "./AccountContext";
import {
  eligibilityStatus,
  daysLeft,
  deadlineLabel,
} from "../lib/scholarships";
import { PreparationPlanner } from "./components/PreparationPlanner";
("use client");
import { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Bookmark,
  Search,
  SlidersHorizontal,
  GraduationCap,
  LayoutDashboard,
  Compass,
  ClipboardList,
  FolderCheck,
  User,
  Check,
  Plus,
  X,
  Leaf,
  Calendar,
  ChevronRight,
  Sparkles,
  Download,
} from "lucide-react";
import {
  opportunities,
  money,
  initialProfile,
  incomeRanges,
  eligibilityChecks,
  matchScore,
  documentReadiness,
  compareDeadlines,
} from "../lib/scholarships";
import { readPlan, planCsv } from "../lib/plan";
type NspScheme = (typeof import("../data/nsp-schemes.json"))[number];
export default function Home() {
  const { session } = useAccount();
  const storageKey = "grantly-v2-" + (session?.user.id || "guest");
  const [locationFilter, setLocationFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [eligibilityFilter, setEligibilityFilter] = useState("");
  const [incomeFilter, setIncomeFilter] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);
  const openDetail = (id: number) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setDetail(id);
  };
  const [tab, setTab] = useState("Discover");
  const [navExpanded, setNavExpanded] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All opportunities");
  const [sort, setSort] = useState("Best match");
  const [saved, setSaved] = useState<number[]>([]);
  const [compare, setCompare] = useState<number[]>([]);
  const [profile, setProfile] = useState(initialProfile);
  const [draftProfile, setDraftProfile] = useState(initialProfile);
  const [incomeEntryMode, setIncomeEntryMode] = useState<"exact" | "range">(
    "exact",
  );
  useEffect(() => {
    if (tab === "Profile") {
      setDraftProfile({ ...profile });
      setIncomeEntryMode(profile.incomeRange ? "range" : "exact");
    }
  }, [tab, profile]);
  const [cloudRevision, setCloudRevision] = useState(0);
  const [apps, setApps] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [docs, setDocs] = useState<string[]>([]);
  const [detail, setDetail] = useState<number | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [ready, setReady] = useState(false);
  const [nspSchemes, setNspSchemes] = useState<NspScheme[]>([]);
  const [nspError, setNspError] = useState("");
  useEffect(() => {
    let active = true;
    import("../data/nsp-schemes.json")
      .then(({ default: schemes }) => {
        if (active) setNspSchemes(schemes);
      })
      .catch((error: unknown) => {
        console.error("Could not load the NSP inventory.", error);
        if (active)
          setNspError("The NSP listing inventory could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);
  const curatedNspCount = nspSchemes.filter(
    (scheme) => scheme.catalogId,
  ).length;
  useEffect(() => {
    try {
      const d = readPlan(localStorage.getItem(storageKey));
      setSaved(d.saved);
      setApps(d.apps);
      setDocs(d.docs);
      setProfile(d.profile);
      setNotes(d.notes);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ saved, apps, docs, profile, notes }),
        );
      } catch {
        setStorageError(true);
      }
    }
  }, [saved, apps, docs, profile, notes, ready]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const checks = (s: (typeof opportunities)[0]) =>
    eligibilityChecks(s, profile);
  const score = (s: (typeof opportunities)[0]) => matchScore(s, profile);
  const list = opportunities
    .filter(
      (s) =>
        (tab !== "Saved" || saved.includes(s.id)) &&
        (!levelFilter || s.level === levelFilter) &&
        (!locationFilter || s.location === locationFilter) &&
        (!typeFilter || s.type === typeFilter) &&
        (!eligibilityFilter ||
          eligibilityStatus(s, profile) === eligibilityFilter) &&
        (!incomeFilter || s.income >= Number(incomeFilter)) &&
        (!deadlineFilter ||
          (deadlineFilter === "Verified upcoming"
            ? Number.isFinite(daysLeft(s)) && daysLeft(s) >= 0
            : deadlineFilter === "Expired"
              ? daysLeft(s) < 0
              : !Number.isFinite(daysLeft(s)))) &&
        `${s.name} ${s.org} ${s.field}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (filter === "All opportunities" ||
          (filter === "Strong matches" && score(s) === 100) ||
          (filter === "Closing soon" &&
            daysLeft(s) >= 0 &&
            daysLeft(s) <= 30) ||
          filter === s.field),
    )
    .sort((a, b) =>
      sort === "Deadline soonest"
        ? compareDeadlines(a, b)
        : sort === "Highest funding"
          ? b.amount - a.amount
          : score(b) - score(a),
    );
  const toggleSave = (id: number) =>
    setSaved((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const start = (id: number) => {
    setApps((v) => ({ ...v, [id]: v[id] || "Planning" }));
    setDetail(null);
    setTab("Applications");
    setToast("Added to your application workspace");
  };
  useEffect(() => {
    if (!detail && !showCompare) return;
    const previous = returnFocus.current;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetail(null);
        setShowCompare(false);
      }
      if (e.key === "Tab") {
        const nodes = Array.from(
          document.querySelectorAll<HTMLElement>(
            "[role=dialog] button,[role=dialog] input,[role=dialog] select,[role=dialog] a",
          ),
        ).filter((n) => !n.hasAttribute("disabled"));
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, [detail, showCompare]);
  const selected = opportunities.find((s) => s.id === detail);
  const download = () => {
    const data = planCsv(apps, docs, notes);
    const url = URL.createObjectURL(
      new Blob([data], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "grantly-application-plan.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className={navExpanded ? "shell nav-expanded" : "shell"}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <button
          className="brand"
          type="button"
          aria-label={
            navExpanded ? "Hide navigation names" : "Show navigation names"
          }
          aria-expanded={navExpanded}
          aria-controls="primary-navigation"
          title={
            navExpanded ? "Hide navigation names" : "Show navigation names"
          }
          onClick={() => {
            if (window.matchMedia("(max-width: 780px)").matches)
              setNavExpanded((expanded) => !expanded);
            else setTab("Discover");
          }}
        >
          <span className="brandmark">
            <GraduationCap size={26} />
          </span>
          grantly<span className="dot">.</span>
        </button>
        <div className="workspace-label">YOUR NEXT CHAPTER</div>
        <nav id="primary-navigation" aria-label="Main navigation">
          {[
            { n: "Overview", i: LayoutDashboard },
            { n: "Discover", i: Compass },
            { n: "Saved", i: Bookmark },
            { n: "Applications", i: ClipboardList },
            { n: "Documents", i: FolderCheck },
            { n: "Deadlines", i: Calendar },
            { n: "Assistant", i: Sparkles },
            { n: "Account", i: User },
          ].map(({ n, i: I }) => (
            <button
              key={n}
              className={tab === n ? "nav active" : "nav"}
              aria-label={n}
              title={n}
              aria-current={tab === n ? "page" : undefined}
              onClick={() => {
                setTab(n);
                setNavExpanded(false);
              }}
            >
              <I size={19} />
              {n}
              {n === "Saved" && saved.length > 0 && (
                <span className="badge">{saved.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="little-spark">✧</div>
          <h3>
            Big dreams.
            <br />A little support.
          </h3>
          <p>
            Your next opportunity
            <br />
            could change everything.
          </p>
          <button onClick={() => setTab("Profile")}>
            Build your profile <ArrowRight size={16} />
          </button>
        </div>
        <button className="person" onClick={() => setTab("Profile")}>
          <span className="avatar">{profile.name.slice(0, 1) || "Y"}</span>
          <span>
            <b>{profile.name || "Your profile"}</b>
            <small>{session ? "Signed-in workspace" : "Guest workspace"}</small>
          </span>
          <ChevronRight size={16} />
        </button>
      </aside>
      <div className="body">
        <header>
          <div>
            My workspace <span>/</span> <b>{tab}</b>
          </div>
          <div className="header-right">
            <button className="demo" onClick={() => setTab("Account")}>
              {session ? "Account workspace" : "Local workspace"}
            </button>
            <button
              aria-label="Edit profile"
              className="avatar"
              onClick={() => setTab("Profile")}
            >
              {profile.name.slice(0, 1) || "Y"}
            </button>
          </div>
        </header>
        <main id="main">
          {!profile.level && (
            <div className="onboarding">
              <b>Start with your story.</b>
              <span>
                Complete your profile to check real scholarships against sourced
                rules.
              </span>
              <button className="primary" onClick={() => setTab("Profile")}>
                Set up my profile →
              </button>
            </div>
          )}
          {storageError && (
            <div className="storage-alert" role="alert">
              Your browser cannot save this session. Keep this tab open and
              export your application plan before leaving.
            </div>
          )}
          <div className="page-heading">
            <div className="eyebrow">
              <span /> A LITTLE SUPPORT. A WORLD OF POSSIBILITY.
            </div>
            <h1>
              {tab === "Discover"
                ? "Your future, within reach."
                : tab === "Saved"
                  ? "Good finds. Kept close."
                  : tab === "Applications"
                    ? "Small steps. Big possibilities."
                    : tab === "Documents"
                      ? "A little preparation goes far."
                      : tab === "Profile"
                        ? "Your story starts here."
                        : tab === "Deadlines"
                          ? "Stay a step ahead."
                          : tab === "Assistant"
                            ? "Clarity for your next chapter."
                            : tab === "Account"
                              ? "Take your progress with you."
                              : `You've got this, ${profile.name}.`}
            </h1>
            <p>
              {tab === "Discover"
                ? "Discover scholarships that see your potential. Find your fit, take your next step."
                : tab === "Saved"
                  ? "Your shortlist of opportunities worth coming back to."
                  : tab === "Applications"
                    ? "One calm place to keep your next chapter moving."
                    : tab === "Documents"
                      ? "Prepare once. Feel ready for every opportunity."
                      : tab === "Profile"
                        ? "Tell us a little about yourself to make every match more meaningful."
                        : "Here’s where you are—and where you can go next."}
            </p>
          </div>
          {tab === "Deadlines" && (
            <Deadlines
              saved={saved}
              apps={apps}
              onOpen={openDetail}
              storageKey={storageKey}
            />
          )}
          {tab === "Assistant" && <Assistant />}
          {tab === "Account" && (
            <AccountPanel
              revision={cloudRevision}
              onRevision={setCloudRevision}
              plan={{ profile, saved, apps, docs, notes }}
              onLoad={(value) => {
                const p = readPlan(JSON.stringify(value));
                setProfile(p.profile);
                setSaved(p.saved);
                setApps(p.apps);
                setDocs(p.docs);
                setNotes(p.notes);
              }}
            />
          )}
          {tab === "Discover" && (
            <section className="hero">
              <div>
                <span className="hero-label">
                  <Sparkles size={14} /> MADE FOR YOUR NEXT CHAPTER
                </span>
                <h2>
                  Less searching.
                  <br />
                  More <em>possibility.</em>
                </h2>
                <p>
                  Understand your fit. Compare your options.
                  <br className="desktop" /> Prepare once, then track every
                  application.
                </p>
                <button
                  className="cream-btn"
                  onClick={() => {
                    if (!profile.level) {
                      setTab("Profile");
                      return;
                    }
                    setFilter("Strong matches");
                    setTab("Discover");
                    document
                      .getElementById("results")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Explore my matches <ArrowUpRight size={17} />
                </button>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="orbit o1" />
                <div className="orbit o2" />
                <div className="star s1">✧</div>
                <div className="star s2">✦</div>
                <div className="art-card">
                  <span>YOUR POTENTIAL</span>
                  <GraduationCap size={54} strokeWidth={1.3} />
                  <b>Limitless.</b>
                  <div>One opportunity can open a world.</div>
                </div>
                <div className="floating-tag">
                  <span>✓</span> A brighter future is possible
                </div>
                <div className="sun" />
              </div>
            </section>
          )}
          {(tab === "Discover" || tab === "Overview") && (
            <div className="stats">
              <div>
                <span className="stat-icon">
                  <Compass />
                </span>
                <span>
                  <strong>
                    {opportunities.filter((s) => score(s) === 100).length}
                  </strong>
                  <small>Strong matches for you</small>
                </span>
                <span className="stat-caption">Based on your profile</span>
              </div>
              <div>
                <span className="stat-icon peach">
                  <Bookmark />
                </span>
                <span>
                  <strong>{saved.length.toString().padStart(2, "0")}</strong>
                  <small>Saved opportunities</small>
                </span>
                <button
                  aria-label="See saved opportunities"
                  onClick={() => setTab("Saved")}
                >
                  <ArrowUpRight size={20} />
                </button>
              </div>
              <div>
                <span className="stat-icon lavender">
                  <ClipboardList />
                </span>
                <span>
                  <strong>
                    {Object.keys(apps).length.toString().padStart(2, "0")}
                  </strong>
                  <small>Applications in motion</small>
                </span>
                <button
                  aria-label="See applications"
                  onClick={() => setTab("Applications")}
                >
                  <ArrowUpRight size={20} />
                </button>
              </div>
            </div>
          )}
          {["Discover", "Saved"].includes(tab) && (
            <section id="results">
              <div className="section-title">
                <div>
                  <h2>
                    {tab === "Saved"
                      ? "Your shortlist"
                      : "Opportunities for your next chapter"}
                  </h2>
                  <p>
                    {tab === "Saved"
                      ? "Your shortlist of source-linked opportunities."
                      : "A small, manually curated set of Indian opportunities."}
                  </p>
                </div>
                <label className="sort">
                  Sort by{" "}
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option>Best match</option>
                    <option>Deadline soonest</option>
                    <option>Highest funding</option>
                  </select>
                </label>
              </div>
              {tab === "Discover" && (
                <>
                  <p className="catalog-scope">
                    {nspError
                      ? nspError
                      : nspSchemes.length
                        ? `Eligibility matching currently covers ${opportunities.length} researched records. Of ${nspSchemes.length} schemes in the NSP listing snapshot, ${curatedNspCount} have curated records; the rest are not yet eligibility-checked and are excluded from match rankings.`
                        : "Loading the official NSP listing inventory…"}
                  </p>
                  <p className="catalog-scope">
                    To discover additional Central and State/UT government
                    schemes, also search{" "}
                    <a
                      href="https://www.myscheme.gov.in/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      myScheme, the Government of India scheme discovery portal
                      ↗
                    </a>
                    . Those results are not yet imported into Grantly matching.
                  </p>
                  <details className="nsp-inventory">
                    <summary>
                      View the NSP scheme inventory (checked 7 Nov 2026)
                    </summary>
                    <p>
                      Listing on NSP verifies that a scheme is named there; it
                      does not verify current eligibility, award amount, or
                      availability. Check each scheme with its provider.
                    </p>
                    <ul>
                      {nspSchemes.map((scheme) => (
                        <li key={scheme.name}>
                          <span>{scheme.name}</span>
                          <small>
                            {scheme.type}
                            {scheme.catalogId
                              ? " · Eligibility record available"
                              : ` · ${scheme.coverage}`}
                          </small>
                          {scheme.listingWindows.map((window, windowIndex) => (
                            <small key={`${scheme.name}-window-${windowIndex}`}>
                              NSP listing:{" "}
                              {window.listingDetails
                                .filter((detail) =>
                                  /^student application\b/i.test(detail),
                                )
                                .join(" / ") || "No student deadline listed"}
                            </small>
                          ))}
                          {scheme.catalogId &&
                            opportunities
                              .find((record) => record.id === scheme.catalogId)
                              ?.supportingSources?.map((url) => (
                                <a
                                  key={`${scheme.name}-support-${url}`}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Supporting official source ↗
                                </a>
                              ))}
                          {scheme.listingWindows.flatMap(
                            (window, windowIndex) =>
                              window.links
                                .filter((link) =>
                                  /guideline|specification|faq/i.test(
                                    link.label,
                                  ),
                                )
                                .map((link, linkIndex) => (
                                  <a
                                    key={`${windowIndex}-${linkIndex}-${link.url}`}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {link.label} ↗
                                  </a>
                                )),
                          )}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="https://scholarships.gov.in/All-Scholarships"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open the official NSP listing ↗
                    </a>
                  </details>
                </>
              )}
              <div className="toolbar">
                <label className="search">
                  <Search size={18} />
                  <input
                    aria-label="Search scholarships"
                    placeholder="Search by scholarship, provider, or field..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label className="filter-select">
                  <SlidersHorizontal size={17} />
                  <select
                    aria-label="Filter scholarships"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    {[
                      "All opportunities",
                      "Strong matches",
                      "Closing soon",
                      "Technical",
                      "Any field",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              </div>
              <details className="advanced-filters">
                <summary>
                  Refine by level, eligibility, funding and deadline
                </summary>
                <div className="filter-grid">
                  <label>
                    Education
                    <select
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                    >
                      <option value="">All levels</option>
                      <option>Undergraduate</option>
                      <option>Postgraduate</option>
                      <option>Diploma</option>
                    </select>
                  </label>
                  <label>
                    Location
                    <select
                      aria-label="Location"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    >
                      <option value="">All catalog locations</option>
                      <option value="India">India</option>
                      <option value="Outside India">Outside India</option>
                    </select>
                  </label>
                  <label>
                    Type
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="">All types</option>
                      {[...new Set(opportunities.map((s) => s.type))].map(
                        (t) => (
                          <option key={t}>{t}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Eligibility
                    <select
                      value={eligibilityFilter}
                      onChange={(e) => setEligibilityFilter(e.target.value)}
                    >
                      <option value="">All outcomes</option>
                      {[
                        "Eligible",
                        "Potentially Eligible",
                        "Ineligible",
                        "Insufficient Information",
                      ].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Income ceiling at least
                    <select
                      value={incomeFilter}
                      onChange={(e) => setIncomeFilter(e.target.value)}
                    >
                      <option value="">Any ceiling</option>
                      <option value="450000">₹4.5 lakh</option>
                      <option value="800000">₹8 lakh</option>
                    </select>
                  </label>
                  <label>
                    Deadline
                    <select
                      value={deadlineFilter}
                      onChange={(e) => setDeadlineFilter(e.target.value)}
                    >
                      <option value="">Any deadline</option>
                      <option>Verified upcoming</option>
                      <option>Expired</option>
                      <option>Needs confirmation</option>
                    </select>
                  </label>
                  <button
                    className="outline"
                    onClick={() => {
                      setLevelFilter("");
                      setLocationFilter("");
                      setTypeFilter("");
                      setEligibilityFilter("");
                      setIncomeFilter("");
                      setDeadlineFilter("");
                      setQuery("");
                      setFilter("All opportunities");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              </details>
              <div className="chips">
                {["All opportunities", "Strong matches", "Closing soon"].map(
                  (x) => (
                    <button
                      className={filter === x ? "chip selected" : "chip"}
                      key={x}
                      onClick={() => setFilter(x)}
                    >
                      {x === "Strong matches" && <Sparkles size={13} />} {x}
                    </button>
                  ),
                )}
                <span>{list.length} opportunities</span>
              </div>
              <div className="cards">
                {list.map((s) => (
                  <article className="card" key={s.id}>
                    <div className="card-top">
                      <div className={"org-icon " + s.color}>{s.symbol}</div>
                      <span
                        className={score(s) === 100 ? "match" : "match partial"}
                      >
                        {eligibilityStatus(s, profile)}
                      </span>
                      <button
                        className={
                          "bookmark " + (saved.includes(s.id) ? "is-saved" : "")
                        }
                        aria-label={
                          (saved.includes(s.id) ? "Unsave " : "Save ") + s.name
                        }
                        onClick={() => toggleSave(s.id)}
                      >
                        <Bookmark
                          size={19}
                          fill={saved.includes(s.id) ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
                    <p className="org">{s.org}</p>
                    <button
                      className="card-title"
                      onClick={() => openDetail(s.id)}
                    >
                      {s.name}
                    </button>
                    <div className="tags">
                      <span>{s.level}</span>
                      <span>{s.field}</span>
                    </div>
                    <div className="funding">
                      <strong>{money(s.amount)}</strong>
                      <span>annual base benefit</span>
                    </div>
                    <div className="card-bottom">
                      <span className={daysLeft(s) <= 8 ? "urgent" : ""}>
                        <Calendar size={14} /> {deadlineLabel(s)}
                      </span>
                      <button onClick={() => openDetail(s.id)}>
                        View details <ArrowUpRight size={16} />
                      </button>
                    </div>
                    <label className="compare-check">
                      <input
                        type="checkbox"
                        checked={compare.includes(s.id)}
                        onChange={(e) => {
                          if (compare.includes(s.id)) {
                            setCompare((v) => v.filter((x) => x !== s.id));
                          } else if (e.target.checked) {
                            if (compare.length >= 3) {
                              setToast("Compare up to 3 opportunities");
                              return;
                            }
                            setCompare((v) => [...v, s.id]);
                          }
                        }}
                      />{" "}
                      Compare opportunity
                    </label>
                  </article>
                ))}
              </div>
              {!list.length && (
                <div className="empty">
                  <Search size={32} />
                  <h2>No opportunities here yet.</h2>
                  <p>
                    {tab === "Saved"
                      ? "Save a scholarship with the bookmark icon to build your shortlist."
                      : "Try a different search or broaden your filters."}
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      setQuery("");
                      setLevelFilter("");
                      setLocationFilter("");
                      setTypeFilter("");
                      setEligibilityFilter("");
                      setIncomeFilter("");
                      setDeadlineFilter("");
                      setFilter("All opportunities");
                      setTab("Discover");
                    }}
                  >
                    Explore all opportunities
                  </button>
                </div>
              )}
            </section>
          )}
          {tab === "Overview" && (
            <section className="overview-grid">
              <div className="planner-full">
                <PreparationPlanner
                  apps={apps}
                  docs={docs}
                  onReady={(document) => {
                    setDocs((v) =>
                      v.includes(document) ? v : [...v, document],
                    );
                    setToast(
                      "Document ready. Your preparation plan has updated.",
                    );
                  }}
                  onDiscover={() => setTab("Discover")}
                />
              </div>
              <div className="next-step">
                <div className="eyebrow">YOUR NEXT BEST STEP</div>
                <h2>
                  {Object.keys(apps).length
                    ? "Turn intention into progress."
                    : "Find the opportunity that fits."}
                </h2>
                <p>
                  {Object.keys(apps).length
                    ? "A complete document checklist makes your next application feel a little lighter."
                    : "Start with a scholarship that matches your profile. Understand the criteria before you invest your time."}
                </p>
                <button
                  className="primary"
                  onClick={() =>
                    setTab(Object.keys(apps).length ? "Documents" : "Discover")
                  }
                >
                  {Object.keys(apps).length
                    ? "Prepare my documents"
                    : "Find my first match"}{" "}
                  <ArrowRight size={17} />
                </button>
                <div className="journey-steps">
                  {[
                    { n: "Discover your fit", done: true },
                    { n: "Build a shortlist", done: saved.length > 0 },
                    { n: "Start document checklist", done: docs.length > 0 },
                    {
                      n: "Start your application",
                      done: Object.keys(apps).length > 0,
                    },
                  ].map((step, i) => (
                    <div
                      className={step.done ? "step complete" : "step"}
                      key={step.n}
                    >
                      <span>{step.done ? <Check size={13} /> : i + 1}</span>
                      <b>{step.n}</b>
                      {step.done && <small>Done</small>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="deadline-panel">
                <div className="section-title">
                  <div>
                    <h2>A little sooner. A little calmer.</h2>
                    <p>Verified upcoming deadlines</p>
                  </div>
                  <Calendar size={22} />
                </div>
                {opportunities
                  .filter(
                    (s) =>
                      (saved.includes(s.id) ||
                        apps[s.id] ||
                        score(s) === 100) &&
                      Number.isFinite(daysLeft(s)) &&
                      daysLeft(s) >= 0,
                  )
                  .sort((a, b) => daysLeft(a) - daysLeft(b))
                  .slice(0, 4)
                  .map((s) => (
                    <button
                      className="deadline-row"
                      key={s.id}
                      onClick={() => openDetail(s.id)}
                    >
                      <span className="date-tile">
                        <strong>
                          {Number.isFinite(daysLeft(s)) ? daysLeft(s) : "?"}
                        </strong>
                        <small>DAYS</small>
                      </span>
                      <span>
                        <b>{s.name}</b>
                        <small>
                          {apps[s.id]
                            ? "In your application plan"
                            : saved.includes(s.id)
                              ? "On your shortlist"
                              : "Matches your profile"}
                        </small>
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                <p className="note">
                  Dates are sourced from NSP. Confirm applicable dates with
                  providers before applying.
                </p>
              </div>
              <div className="readiness-panel">
                <div>
                  <span className="eyebrow">PREPARE ONCE. USE AGAIN.</span>
                  <h2>Your preparation pays forward.</h2>
                  <p>
                    {docs.length} documents marked ready across{" "}
                    {
                      opportunities.filter((s) =>
                        s.docs.some((d) => docs.includes(d)),
                      ).length
                    }{" "}
                    opportunities.
                  </p>
                </div>
                <button className="outline" onClick={() => setTab("Documents")}>
                  Open checklist <ArrowRight size={16} />
                </button>
              </div>
            </section>
          )}
          {tab === "Applications" && (
            <>
              <div className="tracker-header">
                <span>
                  {Object.keys(apps).length} applications ·{" "}
                  {money(
                    opportunities
                      .filter((s) => apps[s.id])
                      .reduce((n, s) => n + s.amount, 0),
                  )}{" "}
                  potential support
                </span>
                <button className="outline" onClick={download}>
                  <Download size={16} /> Export plan
                </button>
              </div>
              {!Object.keys(apps).length ? (
                <div className="empty">
                  <ClipboardList size={38} />
                  <h2>Your next chapter starts with one application.</h2>
                  <p>Open a scholarship and add it to your application plan.</p>
                  <button
                    className="primary"
                    onClick={() => setTab("Discover")}
                  >
                    Find an opportunity <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="application-list">
                  {opportunities
                    .filter((s) => apps[s.id])
                    .map((s) => (
                      <article className="application" key={s.id}>
                        <div className={"org-icon " + s.color}>{s.symbol}</div>
                        <div className="application-main">
                          <small>{s.org}</small>
                          <h3>{s.name}</h3>
                          <p>
                            {money(s.amount)} · {deadlineLabel(s)}
                          </p>
                          <div className="progress">
                            <i
                              style={{
                                width: `${documentReadiness(s, docs)}%`,
                              }}
                            />
                          </div>
                          <small>
                            {s.docs.filter((d) => docs.includes(d)).length} of{" "}
                            {s.docs.length} documents ready
                          </small>
                        </div>
                        <label>
                          Status
                          <select
                            value={apps[s.id]}
                            onChange={(e) =>
                              setApps({ ...apps, [s.id]: e.target.value })
                            }
                          >
                            {[
                              "Saved",
                              "Planning",
                              "In Progress",
                              "Preparing",
                              "Ready to submit",
                              "Submitted",
                              "Decision Pending",
                              "Awarded",
                              "Not selected",
                            ].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </label>
                        <button
                          className="outline"
                          onClick={() => openDetail(s.id)}
                        >
                          Review
                        </button>
                        <button
                          className="icon-button"
                          aria-label={"Remove application " + s.name}
                          onClick={() => {
                            const next = { ...apps };
                            delete next[s.id];
                            setApps(next);
                            setToast("Application removed from plan");
                          }}
                        >
                          <X size={17} />
                        </button>
                        <details className="application-notes">
                          <summary>
                            Personal notes{" "}
                            <span>
                              {notes[s.id]
                                ? "Saved in this browser"
                                : "Add a reminder or next step"}
                            </span>
                          </summary>
                          <label className="sr-only" htmlFor={"note-" + s.id}>
                            Notes for {s.name}
                          </label>
                          <textarea
                            id={"note-" + s.id}
                            maxLength={2000}
                            rows={3}
                            placeholder="e.g. Ask my college office for an enrollment certificate…"
                            value={notes[s.id] || ""}
                            onChange={(e) =>
                              setNotes((v) => ({
                                ...v,
                                [s.id]: e.target.value,
                              }))
                            }
                          />
                          <small>
                            {(notes[s.id] || "").length}/2000 · Saved
                            automatically
                          </small>
                        </details>
                      </article>
                    ))}
                </div>
              )}
              <p className="note">
                This is your personal planning tracker. Changing status does not
                submit an application to a provider.
              </p>
            </>
          )}
          {tab === "Documents" && (
            <section className="document-panel">
              <PreparationPlanner
                apps={apps}
                docs={docs}
                onReady={(document) => {
                  setDocs((v) => (v.includes(document) ? v : [...v, document]));
                  setToast(
                    "Document ready. Your preparation plan has updated.",
                  );
                }}
                onDiscover={() => setTab("Discover")}
              />
              <div className="section-title">
                <div>
                  <h2>Your readiness checklist</h2>
                  <p>
                    Mark what you already have. No sensitive files need to be
                    uploaded.
                  </p>
                </div>
                <span>{docs.length} ready</span>
              </div>
              {Array.from(new Set(opportunities.flatMap((s) => s.docs))).map(
                (d) => (
                  <label className="document-row" key={d}>
                    <span className="stat-icon">
                      <FolderCheck size={20} />
                    </span>
                    <span>
                      <b>{d}</b>
                      <small>
                        {opportunities.filter((s) => s.docs.includes(d)).length}{" "}
                        listed opportunities use this checklist item
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={docs.includes(d)}
                      onChange={() =>
                        setDocs((v) =>
                          v.includes(d) ? v.filter((x) => x !== d) : [...v, d],
                        )
                      }
                    />
                    <span>{docs.includes(d) ? "Ready" : "To prepare"}</span>
                  </label>
                ),
              )}
            </section>
          )}
          {tab === "Profile" && (
            <form
              className="profile-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draftProfile.name.trim()) {
                  setToast("Please enter your name.");
                  return;
                }
                setProfile({ ...draftProfile, name: draftProfile.name.trim() });
                setToast("Profile saved. Your matches have been updated.");
                setTab("Discover");
              }}
            >
              <div className="section-title">
                <div>
                  <h2>A better fit begins with you.</h2>
                  <p>
                    Your profile · saved locally until you choose account sync
                  </p>
                </div>
                <User size={28} />
              </div>
              <div className="form-grid">
                <label>
                  Preferred name
                  <input
                    required
                    maxLength={40}
                    value={draftProfile.name}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Study level
                  <select
                    required
                    value={draftProfile.level}
                    onChange={(e) =>
                      setDraftProfile({
                        ...draftProfile,
                        level: e.target.value,
                      })
                    }
                  >
                    <option value="">Select a study level</option>
                    <option>Undergraduate</option>
                    <option>Postgraduate</option>
                    <option>Diploma</option>
                  </select>
                </label>
                <label>
                  Field of study
                  <select
                    value={draftProfile.field}
                    onChange={(e) =>
                      setDraftProfile({
                        ...draftProfile,
                        field: e.target.value,
                      })
                    }
                  >
                    {[
                      "Engineering",
                      "Design",
                      "Science",
                      "Arts",
                      "Commerce",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <div className="income-field">
                  <label htmlFor="income-entry-mode">
                    How would you like to share your annual household income?
                  </label>
                  <select
                    id="income-entry-mode"
                    value={incomeEntryMode}
                    onChange={(e) => {
                      const mode = e.target.value as "exact" | "range";
                      setIncomeEntryMode(mode);
                      setDraftProfile({
                        ...draftProfile,
                        income: mode === "exact" ? draftProfile.income : -1,
                        incomeRange: "",
                      });
                    }}
                  >
                    <option value="exact">Enter an exact amount</option>
                    <option value="range">Choose an approximate range</option>
                  </select>
                  {incomeEntryMode === "range" ? (
                    <>
                      <label htmlFor="annual-household-income-range">
                        Approximate annual household income
                      </label>
                      <select
                        id="annual-household-income-range"
                        required
                        value={draftProfile.incomeRange}
                        onChange={(e) =>
                          setDraftProfile({
                            ...draftProfile,
                            incomeRange: e.target.value,
                          })
                        }
                      >
                        <option value="">Select an income range</option>
                        {incomeRanges.map((range) => (
                          <option key={range.value} value={range.value}>
                            {range.label}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label htmlFor="annual-household-income">
                        Exact annual household income (₹)
                      </label>
                      <input
                        id="annual-household-income"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="100000000"
                        step="1"
                        required
                        placeholder="For example, 350000"
                        value={
                          draftProfile.income < 0 ? "" : draftProfile.income
                        }
                        onChange={(e) =>
                          setDraftProfile({
                            ...draftProfile,
                            income:
                              e.target.value === ""
                                ? -1
                                : Number(e.target.value),
                          })
                        }
                      />
                    </>
                  )}
                  <p className="field-help">
                    If you are unsure, choose the closest range. If a range
                    crosses a scholarship income limit, Grantly will mark that
                    requirement as uncertain rather than assume eligibility.
                  </p>
                </div>
                <label>
                  Gender (optional)
                  <select
                    value={draftProfile.gender}
                    onChange={(e) =>
                      setDraftProfile({
                        ...draftProfile,
                        gender: e.target.value,
                      })
                    }
                  >
                    <option>Prefer not to say</option>
                    <option>Woman</option>
                    <option>Man</option>
                    <option>Non-binary</option>
                  </select>
                </label>
              </div>
              <EligibilityFields
                profile={draftProfile}
                onChange={setDraftProfile}
              />
              <p className="note">
                Match scores reflect listed criteria only, not your chance of
                receiving an award. Optional criteria left unspecified appear as
                unconfirmed.
              </p>
              <button className="primary" type="submit">
                Update my matches <ArrowRight size={17} />
              </button>
              <button
                type="button"
                className="outline"
                style={{ marginLeft: 12 }}
                onClick={() => {
                  setDraftProfile({ ...profile });
                  setTab("Discover");
                }}
              >
                Cancel
              </button>
            </form>
          )}
          <footer>
            <span>
              <Leaf size={14} /> A little support goes a long way.
            </span>
            <span>
              Official-source catalog · Checked 7 Nov 2026 · Confirm with
              provider
            </span>
          </footer>
        </main>
      </div>
      {compare.length > 0 && (
        <div className="compare-bar">
          <span>
            <b>{compare.length} selected</b> · See what fits you best
          </span>
          <button
            className="primary"
            disabled={compare.length < 2}
            onClick={() => {
              returnFocus.current = document.activeElement as HTMLElement;
              setShowCompare(true);
            }}
          >
            Compare side by side <ArrowRight size={16} />
          </button>
          <button aria-label="Clear comparison" onClick={() => setCompare([])}>
            <X size={18} />
          </button>
        </div>
      )}
      {(selected || showCompare) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setDetail(null);
            setShowCompare(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={showCompare ? "Compare scholarships" : selected?.name}
            className={"modal " + (showCompare ? "wide" : "")}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDetail(null);
                setShowCompare(false);
              }
            }}
          >
            <button
              autoFocus
              className="close"
              aria-label="Close dialog"
              onClick={() => {
                setDetail(null);
                setShowCompare(false);
              }}
            >
              <X />
            </button>
            {showCompare ? (
              <>
                <div className="eyebrow">MAKE A CONFIDENT CHOICE</div>
                <h2>A clearer view of your options.</h2>
                <div className="comparison">
                  {opportunities
                    .filter((s) => compare.includes(s.id))
                    .map((s) => (
                      <div key={s.id}>
                        <div className={"org-icon " + s.color}>{s.symbol}</div>
                        <h3>{s.name}</h3>
                        <strong>{money(s.amount)}</strong>
                        <p>{deadlineLabel(s)}</p>
                        <p>{eligibilityStatus(s, profile)}</p>
                        {checks(s).map((c) => (
                          <p className={c.pass ? "pass" : "fail"} key={c.label}>
                            {c.pass === null ? "?" : c.pass ? "✓" : "×"}{" "}
                            {c.label}
                            <small>{c.info}</small>
                          </p>
                        ))}
                        <button
                          className="primary"
                          onClick={() => {
                            setShowCompare(false);
                            start(s.id);
                          }}
                        >
                          Start planning
                        </button>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              selected && (
                <>
                  <div className={"org-icon " + selected.color}>
                    {selected.symbol}
                  </div>
                  <p className="org">{selected.org} · Official-source record</p>
                  <h2>{selected.name}</h2>
                  <p className="description">{selected.desc}</p>
                  <div className="detail-amount">
                    <strong>{money(selected.amount)}</strong>
                    <span>{deadlineLabel(selected)}</span>
                  </div>
                  <p className="note">{selected.benefits}</p>
                  <div className="source-card">
                    <b>
                      {eligibilityStatus(selected, profile)} — preliminary check
                    </b>
                    <p>{selected.verificationNote}</p>
                    <p>
                      Checked {selected.lastVerified}. Deadline status:{" "}
                      {selected.deadlineStatus}.
                    </p>
                    <a
                      href={selected.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Read official guidelines ↗
                    </a>{" "}
                    ·{" "}
                    <a
                      href={selected.deadlineSource}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Check deadline source ↗
                    </a>
                  </div>
                  <h3>
                    Criteria confirmed{" "}
                    <span className="match">{score(selected)}%</span>
                  </h3>
                  <p className="note">
                    Checks use sourced rules and your answers. Missing answers
                    are marked below. This is not official eligibility,
                    selection, or an award guarantee.
                  </p>
                  {checks(selected).map((c) => (
                    <div className="criterion" key={c.label}>
                      <span className={c.pass ? "pass" : "fail"}>
                        {c.pass === null ? "?" : c.pass ? "✓" : "×"} {c.label}
                      </span>
                      <span>{c.info}</span>
                    </div>
                  ))}
                  <h3>How to apply</h3>
                  <ol className="application-instructions">
                    {selected.process.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <a
                    className="outline"
                    href={selected.applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open official NSP application portal ↗
                  </a>
                  <h3>Your preparation checklist</h3>
                  <p className="note">{selected.documentStatus}</p>
                  {selected.docs.map((d) => (
                    <label className="check-row" key={d}>
                      <input
                        type="checkbox"
                        checked={docs.includes(d)}
                        onChange={() =>
                          setDocs((v) =>
                            v.includes(d)
                              ? v.filter((x) => x !== d)
                              : [...v, d],
                          )
                        }
                      />
                      {d}
                    </label>
                  ))}
                  <div className="modal-actions">
                    <button
                      className="primary"
                      onClick={() => start(selected.id)}
                    >
                      {apps[selected.id]
                        ? "Open application plan"
                        : "Start application plan"}{" "}
                      <ArrowRight size={16} />
                    </button>
                    <button
                      className="outline"
                      onClick={() => toggleSave(selected.id)}
                    >
                      <Bookmark size={16} />
                      {saved.includes(selected.id) ? "Saved" : "Save"}
                    </button>
                  </div>
                </>
              )
            )}
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
