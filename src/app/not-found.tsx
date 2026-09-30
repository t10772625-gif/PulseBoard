import Link from "next/link";

// Any URL that doesn't match a page. Signed-out visitors who follow "Go to Home"
// are sent to the login page by the app layout.
export default function NotFound() {
  return (
    <main className="nf-page">
      <div className="card">
        <div className="logo">
          <b></b>PulseBoard
        </div>
        <p className="nf-code">404</p>
        <h1 style={{ margin: 0 }}>Page not found</h1>
        <p className="mute">The link may be wrong or the page may have moved.</p>
        <Link className="btn" href="/dashboard">
          Go to Home
        </Link>
      </div>
    </main>
  );
}
