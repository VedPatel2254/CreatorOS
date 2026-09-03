import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your CreatorOS account.',
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
