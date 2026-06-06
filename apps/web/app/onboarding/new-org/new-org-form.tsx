'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const schema = z.object({
  name: z.string().min(2, 'Store name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
})
type FormValues = z.infer<typeof schema>

export default function NewOrgForm() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', slug: '' } })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    const { data, error } = await authClient.organization.create({ name: values.name, slug: values.slug })
    if (error || !data) {
      setIsPending(false)
      toast.error(error?.message ?? 'Could not create store (slug may be taken)')
      return
    }
    await authClient.organization.setActive({ organizationId: data.id })
    toast.success('Store created')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Set up your store</CardTitle>
        <CardDescription>Name your store — this becomes your subdomain.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Store name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane's Boutique" {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      if (!form.formState.dirtyFields.slug) form.setValue('slug', slugify(e.target.value))
                    }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="slug" render={({ field }) => (
              <FormItem>
                <FormLabel>Store URL</FormLabel>
                <FormControl><Input placeholder="janes-boutique" {...field} onChange={(e) => field.onChange(slugify(e.target.value))} /></FormControl>
                <FormDescription>{field.value || 'your-store'}.yourplatform.com</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create store
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
