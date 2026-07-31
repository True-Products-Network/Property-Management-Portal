export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages don't have the portal shell - they use their own layout
  return <>{children}</>;
}
