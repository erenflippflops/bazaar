function Footer() {
  const commit = import.meta.env.VITE_COMMIT_SHA || 'dev';
  const shortCommit = commit.substring(0, 7);

  return (
    <footer style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      fontSize: '12px',
      color: 'var(--muted)',
      opacity: 0.6,
      fontFamily: 'monospace'
    }}>
      {shortCommit}
    </footer>
  );
}

export default Footer;
