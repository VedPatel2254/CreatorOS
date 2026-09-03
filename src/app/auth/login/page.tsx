'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
      if (error) {
        toast.error(error.message === 'Invalid login credentials' ? 'Invalid email or password. Please try again.' : error.message)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLink = async () => {
    const email = document.querySelector<HTMLInputElement>('input[name="email"]')?.value
    if (!email) { toast.error('Please enter your email address first'); return }
    setIsMagicLinkLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
      if (error) { toast.error(error.message); return }
      toast.success('Magic link sent! Check your email inbox.')
    } catch {
      toast.error('Failed to send magic link. Please try again.')
    } finally {
      setIsMagicLinkLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-slate-700">
        <CardHeader className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-50">CreatorOS</h1>
          <CardTitle className="text-xl text-slate-50">Welcome back</CardTitle>
          <CardDescription className="text-slate-400">Your creative agency, organized.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input {...register('email')} type="email" placeholder="you@example.com" className="pl-10 bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500" />
              </div>
              {errors.email && <p role="alert" className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input {...register('password')} type="password" placeholder="••••••••" className="pl-10 bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500" />
              </div>
              {errors.password && <p role="alert" className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign in'}
            </Button>
          </form>
          <div className="relative"><div className="absolute inset-0 flex items-center"><Separator className="bg-slate-700" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-400">Or</span></div></div>
          <Button variant="outline" className="w-full border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={handleMagicLink} disabled={isMagicLinkLoading}>
            {isMagicLinkLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending magic link...</> : <><Mail className="mr-2 h-4 w-4" />Sign in with Magic Link</>}
          </Button>
          <p className="text-center text-sm text-slate-400">Don&apos;t have an account? <Link href="/auth/signup" className="text-violet-400 hover:text-violet-300 font-medium">Sign up</Link></p>
        </CardContent>
      </Card>
    </div>
  )
}
