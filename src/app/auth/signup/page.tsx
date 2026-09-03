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

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({ email: data.email, password: data.password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
      if (error) { toast.error(error.message); return }
      toast.success('Account created! Check your email to confirm your account.')
      router.push('/auth/login')
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-slate-700">
        <CardHeader className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-50">CreatorOS</h1>
          <CardTitle className="text-xl text-slate-50">Create your account</CardTitle>
          <CardDescription className="text-slate-400">Your creative agency, organized.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input {...register('email')} type="email" placeholder="you@example.com" className="pl-10 bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500" /></div>
              {errors.email && <p role="alert" className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input {...register('password')} type="password" placeholder="••••••••" className="pl-10 bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500" /></div>
              {errors.password && <p role="alert" className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input {...register('confirmPassword')} type="password" placeholder="••••••••" className="pl-10 bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500" /></div>
              {errors.confirmPassword && <p role="alert" className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create account'}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-400">Already have an account? <Link href="/auth/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in</Link></p>
        </CardContent>
      </Card>
    </div>
  )
}
