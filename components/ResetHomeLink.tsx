'use client';

import Link from 'next/link';

type Props = {
  className?: string;
  children: React.ReactNode;
};

export default function ResetHomeLink({ className, children }: Props) {
  function handleClick(e: React.MouseEvent) {
    try {
      window.dispatchEvent(new CustomEvent('opendict:reset'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // ignore
    }
  }
  return (
    <Link href="/" onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
