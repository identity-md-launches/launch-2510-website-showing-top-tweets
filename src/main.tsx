import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import postsData from "./posts.json";
import "./styles.css";

type IconName =
  | "arrow"
  | "search"
  | "bookmark"
  | "spark"
  | "fire"
  | "clock"
  | "close"
  | "heart"
  | "reply"
  | "repost"
  | "link"
  | "info"
  | "chevron"
  | "check"
  | "grid"
  | "x"
  | "code";
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14m-6-6 6 6-6 6" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z" />,
    spark: (
      <>
        <path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z" />
        <path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5L20 2Z" />
      </>
    ),
    fire: (
      <path d="M13 3c1 6-4 6-2 10 2-1 3-3 3-5 4 3 6 5 5 8a7 7 0 0 1-14-1c0-4 4-6 8-12Z" />
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    heart: (
      <path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-4 4 1 9 8 15 7-6 12-11 8-15Z" />
    ),
    reply: <path d="M21 11a9 9 0 0 1-9 9H4l2-4a9 9 0 1 1 15-5Z" />,
    repost: (
      <>
        <path d="M4 8h12l-3-3m3 3-3 3M20 16H8l3 3m-3-3 3-3M4 8v6m16 2v-6" />
      </>
    ),
    link: (
      <>
        <path
          d="m10 14 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0"
          transform="translate(1 0)"
        />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10v.1" />
      </>
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
    check: <path d="m5 12 4 4L19 6" />,
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    x: <path d="m4 3 16 18h-4L0 3h4Zm14 0L2 21" transform="translate(2 0)" />,
    code: (
      <>
        <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

type Post = (typeof postsData)[number];
type Topic = "All posts" | "AI agents" | "Building" | "Community";
type View = "discover" | "saved";
const topics: Topic[] = ["All posts", "AI agents", "Building", "Community"];
const topicIcons: Record<Topic, IconName> = {
  "All posts": "grid",
  "AI agents": "spark",
  Building: "code",
  Community: "reply",
};
const storageKey = "identitymd-pond:bookmarks:v1";
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

function readSaved(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(value)
      ? Array.from(
          new Set(
            value.filter(
              (id): id is string =>
                typeof id === "string" && postsData.some((p) => p.id === id),
            ),
          ),
        )
      : [];
  } catch {
    return [];
  }
}

function TweetCard({
  post,
  rank,
  saved,
  onSave,
  onStatus,
}: {
  post: Post;
  rank: number;
  saved: boolean;
  onSave: (id: string) => void;
  onStatus: (text: string) => void;
}) {
  const [copyFallback, setCopyFallback] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const copyInput = useRef<HTMLInputElement>(null);
  const copyTrigger = useRef<HTMLButtonElement>(null);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(post.url);
      onStatus("Post link copied.");
      setCopyFallback(false);
    } catch {
      setCopyFallback(true);
      onStatus("Select and copy the post link below.");
    }
  }
  useEffect(() => {
    if (copyFallback) {
      copyInput.current?.focus();
      copyInput.current?.select();
    }
  }, [copyFallback]);
  const date = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(post.date));
  return (
    <article
      className={`tweet-card ${rank === 1 ? "featured" : ""}`}
      aria-labelledby={`title-${post.id}`}
    >
      {rank === 1 && (
        <div className="featured-heading">
          <span>
            <Icon name="fire" size={16} /> Top of the pond
          </span>
          <span>No. 01</span>
        </div>
      )}
      <div className="card-inner">
        <div className="author-row">
          <a
            className="author"
            href={`https://x.com/${post.handle}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`${post.author}, @${post.handle} on X (opens a new tab)`}
          >
            <img src={asset(post.avatar)} width="40" height="40" alt="" />
            <span>
              <strong>{post.author}</strong>
              <span className="handle">@{post.handle}</span>
            </span>
          </a>
          <button
            type="button"
            className={`icon-button save-button ${saved ? "is-saved" : ""}`}
            aria-label={`${saved ? "Unsave" : "Save"} ${post.title}`}
            aria-pressed={saved}
            onClick={() => onSave(post.id)}
            title={saved ? "Remove from saved posts" : "Save on this device"}
          >
            <Icon name="bookmark" />
          </button>
        </div>
        <div className="post-body">
          <h3 id={`title-${post.id}`}>{post.title}</h3>
          <p>{post.summary}</p>
          <div className="post-meta">
            <span className="topic-label">{post.topic}</span>
            <span>·</span>
            <time
              dateTime={post.date}
              title={new Date(post.date).toUTCString()}
            >
              {date}, 2026
            </time>
          </div>
          <button
            type="button"
            className="context-toggle"
            onClick={() => setContextOpen(!contextOpen)}
            aria-expanded={contextOpen}
            aria-controls={`context-${post.id}`}
          >
            {contextOpen ? "Hide context" : "Read context"}
            <Icon name="chevron" size={14} />
          </button>
          {contextOpen && (
            <div className="post-context" id={`context-${post.id}`}>
              <p>{post.context}</p>
              <span>Summary of the linked public post.</span>
            </div>
          )}
        </div>
        <div className="card-bottom">
          <div className="engagement" aria-label="Engagement at capture">
            <span title="Replies">
              <Icon name="reply" size={16} />
              <span className="sr-only">Replies: </span>
              {post.replies}
            </span>
            <span title="Reposts">
              <Icon name="repost" size={16} />
              <span className="sr-only">Reposts: </span>
              {post.reposts}
            </span>
            <span title="Likes">
              <Icon name="heart" size={16} />
              <span className="sr-only">Likes: </span>
              {post.likes}
            </span>
          </div>
          <div className="card-actions">
            <button
              type="button"
              className="icon-button copy-button"
              ref={copyTrigger}
              aria-label={`Copy link to ${post.title}`}
              onClick={copyLink}
              title="Copy post link"
            >
              <Icon name="link" size={16} />
            </button>
            <a
              className="open-post"
              href={post.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${post.title} on X (opens a new tab)`}
            >
              Open on X<Icon name="arrow" size={16} />
            </a>
          </div>
        </div>
        {copyFallback && (
          <div className="copy-fallback">
            <label htmlFor={`copy-${post.id}`}>Copy this post link</label>
            <input
              id={`copy-${post.id}`}
              ref={copyInput}
              readOnly
              value={post.url}
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setCopyFallback(false);
                copyTrigger.current?.focus();
              }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function App() {
  const [view, setView] = useState<View>("discover");
  const [topic, setTopic] = useState<Topic>("All posts");
  const [sort, setSort] = useState("top");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<string[]>(readSaved);
  const [status, setStatus] = useState("");
  const [storageWarning, setStorageWarning] = useState(false);
  const aboutDialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return postsData
      .filter(
        (post) =>
          (view !== "saved" || saved.includes(post.id)) &&
          (topic === "All posts" || post.topic === topic) &&
          `${post.title} ${post.summary} ${post.context} ${post.handle} ${post.author}`
            .toLowerCase()
            .includes(query),
      )
      .sort((a, b) =>
        sort === "latest"
          ? Date.parse(b.date) - Date.parse(a.date)
          : b.likes - a.likes || Date.parse(b.date) - Date.parse(a.date),
      );
  }, [view, topic, search, saved, sort]);
  const allSorted = useMemo(
    () => [...postsData].sort((a, b) => b.likes - a.likes),
    [],
  );
  const rankOf = (post: Post) =>
    allSorted.findIndex((p) => p.id === post.id) + 1;
  function switchView(next: View) {
    setView(next);
    setTopic("All posts");
    setSearch("");
    setStatus("");
    requestAnimationFrame(() => {
      heading.current?.scrollIntoView({ block: "start" });
      heading.current?.focus({ preventScroll: true });
    });
  }
  function toggleSave(id: string) {
    const exists = saved.includes(id);
    const next = exists ? saved.filter((item) => item !== id) : [...saved, id];
    setSaved(next);
    if (view === "saved" && exists)
      requestAnimationFrame(() =>
        heading.current?.focus({ preventScroll: true }),
      );
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageWarning(false);
      setStatus(
        exists
          ? "Post removed from saved posts."
          : "Post saved on this device.",
      );
    } catch {
      setStorageWarning(true);
      setStatus("Post updated for this visit. Browser storage is unavailable.");
    }
  }
  function resetFilters() {
    setTopic("All posts");
    setSearch("");
    setSort("top");
  }
  return (
    <>
      <a className="skip-link" href="#feed">
        Skip to tweets
      </a>
      <header className="site-header">
        <div className="header-content">
          <a
            className="brand"
            href="#"
            aria-label="Pond home"
            onClick={(e) => {
              e.preventDefault();
              setView("discover");
              resetFilters();
              window.scrollTo({ top: 0 });
            }}
          >
            <img src={asset("favicon.svg")} width="36" height="36" alt="" />
            <span>
              pond<span className="brand-dot">.</span>
            </span>
            <span className="brand-divider" />
            <span className="brand-project">IdentityMD</span>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            <button
              type="button"
              className={view === "discover" ? "active" : ""}
              aria-current={view === "discover" ? "page" : undefined}
              onClick={() => switchView("discover")}
            >
              <Icon name="grid" size={18} />
              <span>Discover</span>
            </button>
            <button
              type="button"
              className={view === "saved" ? "active" : ""}
              aria-current={view === "saved" ? "page" : undefined}
              onClick={() => switchView("saved")}
            >
              <Icon name="bookmark" size={18} />
              <span>Saved</span>
              {saved.length > 0 && (
                <span className="nav-count">{saved.length}</span>
              )}
            </button>
          </nav>
          <button
            type="button"
            className="about-trigger icon-button"
            aria-label="About this feed"
            onClick={() => aboutDialog.current?.showModal()}
          >
            <Icon name="info" />
          </button>
          <a
            className="x-header secondary-button"
            href="https://x.com/search?q=IdentityMD%20OR%20%24IMD&f=top"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="x" size={16} />
            Explore on X<Icon name="arrow" size={16} />
          </a>
        </div>
      </header>
      <main className="page-shell">
        <section className="hero" aria-labelledby="main-title">
          <div className="hero-copy">
            <h1 id="main-title">
              The signal in
              <br />
              the <span>swamp.</span>
            </h1>
            <p>Top tweets about IdentityMD.</p>
            <a
              className="primary-button"
              href="#feed"
              onClick={() => {
                if (view === "saved") switchView("discover");
              }}
            >
              Explore tweets
              <Icon name="arrow" size={18} />
            </a>
            <span className="hero-note">
              Frogs with an unfair AI advantage.
            </span>
          </div>
          <img
            className="hero-art"
            src={asset("pepe-ops.svg")}
            width="520"
            height="290"
            alt="Two Pepe operators equipped with an AI blaster, a cyber visor, and a floating frog drone."
          />
        </section>
        <div className="workspace">
          <section
            className="feed-section"
            aria-labelledby="feed-heading"
            id="feed"
          >
            <div className="feed-heading-row">
              <div>
                <h2 ref={heading} tabIndex={-1} id="feed-heading">
                  {view === "saved" ? "Saved tweets" : "The conversation"}
                  <span className="result-badge">{visiblePosts.length}</span>
                </h2>
                <p>
                  {view === "saved"
                    ? "A little signal to come back to."
                    : "Public posts. A clearer view of the pond."}
                </p>
              </div>
              <label className="sort-control">
                <Icon name={sort === "top" ? "fire" : "clock"} size={16} />
                <span className="sr-only">Sort tweets</span>
                <select
                  aria-label="Sort tweets"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="top">Top liked</option>
                  <option value="latest">Latest</option>
                </select>
              </label>
            </div>
            <div className="feed-controls">
              <div
                className="topic-filters"
                role="group"
                aria-label="Filter by topic"
              >
                {topics.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={topic === item ? "selected" : ""}
                    aria-pressed={topic === item}
                    onClick={() => setTopic(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="search-box">
                <Icon name="search" size={18} />
                <label className="sr-only" htmlFor="tweet-search">
                  Search tweets
                </label>
                <input
                  id="tweet-search"
                  name="search"
                  type="search"
                  autoComplete="off"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search the pond…"
                />
                {search && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="snapshot-note">
              <span>
                <span className="snapshot-dot" />
                Snapshot · 24 Oct 2026
              </span>
              <button
                type="button"
                className="text-button"
                onClick={() => aboutDialog.current?.showModal()}
              >
                Summaries, not live
                <Icon name="info" size={14} />
              </button>
            </div>
            <p className="sr-only" role="status">
              {visiblePosts.length}{" "}
              {visiblePosts.length === 1 ? "tweet" : "tweets"} shown
              {topic !== "All posts" ? ` about ${topic}` : ""}
              {search ? ` matching ${search}` : ""}.
            </p>
            {storageWarning && (
              <p className="storage-warning">
                Browser storage is unavailable. Saved posts will last for this
                visit only.
              </p>
            )}
            <div className="tweet-grid">
              {visiblePosts.map((post) => (
                <TweetCard
                  key={post.id}
                  post={post}
                  rank={rankOf(post)}
                  saved={saved.includes(post.id)}
                  onSave={toggleSave}
                  onStatus={setStatus}
                />
              ))}
            </div>
            {visiblePosts.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">
                  <Icon
                    name={
                      view === "saved" && saved.length === 0
                        ? "bookmark"
                        : "search"
                    }
                    size={28}
                  />
                </span>
                <h3>
                  {view === "saved" && saved.length === 0
                    ? "Keep the good stuff."
                    : "Quiet corner of the pond."}
                </h3>
                <p>
                  {view === "saved" && saved.length === 0
                    ? "Save a tweet with its bookmark button. Find it here whenever you return on this device."
                    : "No tweets match these filters. Try another topic or a shorter search."}
                </p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    view === "saved" && saved.length === 0
                      ? switchView("discover")
                      : resetFilters()
                  }
                >
                  {view === "saved" && saved.length === 0
                    ? "Explore tweets"
                    : "Clear filters"}
                  <Icon name="arrow" size={18} />
                </button>
              </div>
            )}
            {visiblePosts.length > 0 && (
              <div className="feed-end">
                <img src={asset("favicon.svg")} width="24" height="24" alt="" />
                <span>You’re all caught up in this corner of the pond.</span>
                <a
                  href="https://x.com/search?q=IdentityMD%20OR%20%24IMD&f=live"
                  target="_blank"
                  rel="noreferrer"
                >
                  Find more on X<Icon name="arrow" size={14} />
                </a>
              </div>
            )}
          </section>
          <aside className="sidebar" aria-label="Explore the ecosystem">
            <section className="radar-section">
              <div className="sidebar-title">
                <h2>On the radar</h2>
                <Icon name="spark" size={20} />
              </div>
              <p>The threads running through the feed.</p>
              <div className="radar-list">
                {topics
                  .filter((t) => t !== "All posts")
                  .map((item, index) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => {
                        setView("discover");
                        setTopic(item);
                        setSearch("");
                        requestAnimationFrame(() => {
                          heading.current?.scrollIntoView({ block: "start" });
                          heading.current?.focus({ preventScroll: true });
                        });
                      }}
                    >
                      <span className="radar-number">0{index + 1}</span>
                      <span className="radar-text">
                        <strong>{item}</strong>
                        <span>
                          {postsData.filter((p) => p.topic === item).length}{" "}
                          posts in this snapshot
                        </span>
                      </span>
                      <Icon name={topicIcons[item]} size={18} />
                    </button>
                  ))}
              </div>
            </section>
            <section className="network-section">
              <div className="network-art">
                <img
                  src={asset("pepe-ops.svg")}
                  width="260"
                  height="145"
                  alt=""
                />
              </div>
              <h2>Meet the swarm.</h2>
              <p>
                AI agents. Real contributors.
                <br />A network built to build things.
              </p>
              <a
                href="https://x.com/surfcoderepeat"
                className="network-link"
                target="_blank"
                rel="noreferrer"
              >
                Follow the builder
                <Icon name="arrow" size={18} />
              </a>
              <span className="independent-note">
                An independent community feed.
              </span>
            </section>
            <section className="feed-info">
              <Icon name="info" size={18} />
              <div>
                <h3>A snapshot, not a firehose.</h3>
                <p>
                  Ranked by captured likes across {postsData.length} public
                  posts. Counts and context can change.
                </p>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => aboutDialog.current?.showModal()}
                >
                  How this feed works
                  <Icon name="arrow" size={14} />
                </button>
              </div>
            </section>
          </aside>
        </div>
        <footer>
          <a className="footer-brand" href="#main-title">
            pond.
          </a>
          <p>A small pond for big IdentityMD ideas.</p>
          <button
            type="button"
            className="text-button"
            onClick={() => aboutDialog.current?.showModal()}
          >
            About & sources
            <Icon name="arrow" size={14} />
          </button>
          <span>Built for the curious.</span>
        </footer>
      </main>
      <div className="announcement" role="status">
        {status && (
          <span>
            <Icon name="check" size={16} />
            {status}
            <button
              className="icon-button"
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setStatus("")}
            >
              <Icon name="close" size={16} />
            </button>
          </span>
        )}
      </div>
      <dialog
        ref={aboutDialog}
        className="about-dialog"
        aria-labelledby="about-title"
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const controls = e.currentTarget.querySelectorAll<HTMLElement>(
            "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled])",
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) aboutDialog.current?.close();
        }}
      >
        <div className="dialog-content">
          <div className="dialog-heading">
            <img src={asset("favicon.svg")} width="36" height="36" alt="" />
            <button
              type="button"
              className="icon-button"
              aria-label="Close about this feed"
              onClick={() => aboutDialog.current?.close()}
            >
              <Icon name="close" />
            </button>
          </div>
          <h2 id="about-title">A little context.</h2>
          <p>
            Pond is an independent feed of public posts about IdentityMD. It is
            not affiliated with X or an official IdentityMD account.
          </p>
          <h3>Where the posts come from</h3>
          <p>
            These {postsData.length} posts and their engagement counts were
            captured from public X pages on 24 October 2026. Each card is a
            written summary, not a verbatim tweet. Open the original for the
            author’s words and linked media.
          </p>
          <h3>What “top” means here</h3>
          <p>
            Top liked sorts this snapshot by captured like count. Latest sorts
            by publication date. This is a selected collection, not a complete
            ranking of X. Counts do not refresh automatically.
          </p>
          <h3>Saved stays with you</h3>
          <p>
            Bookmarks are saved in this browser on this device. No account,
            wallet, or X sign-in is needed. Clearing browser data removes them.
          </p>
          <a
            className="secondary-button"
            href="https://x.com/search?q=IdentityMD%20OR%20%24IMD&f=top"
            target="_blank"
            rel="noreferrer"
          >
            Explore the original conversation
            <Icon name="arrow" size={18} />
          </a>
        </div>
      </dialog>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
