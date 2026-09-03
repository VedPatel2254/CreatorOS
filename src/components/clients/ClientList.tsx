'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Plus, Search, Archive, ArchiveRestore } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useClients, useArchiveClient, useUnarchiveClient } from '@/hooks/useClients'
import { ClientSheet } from './ClientSheet'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

export function ClientList() {
  const { data: clients = [], isLoading } = useClients()
  const archiveClient = useArchiveClient()
  const unarchiveClient = useUnarchiveClient()

  const [showSheet, setShowSheet] = useState(false)
  const [editingClient, setEditingClient] = useState(null as any)
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const filteredClients = clients.filter((c) => {
    const matchesSearch = !search || c.business_name.toLowerCase().includes(search.toLowerCase()) || c.contact_name?.toLowerCase().includes(search.toLowerCase())
    const matchesArchive = showArchived ? c.status === 'archived' : c.status === 'active'
    return matchesSearch && matchesArchive
  })

  const activeClients = clients.filter((c) => c.status === 'active')
  const archivedClients = clients.filter((c) => c.status === 'archived')

  const handleArchive = async (id: string) => {
    await archiveClient.mutateAsync(id)
    toast.success('Client archived')
  }

  const handleUnarchive = async (id: string) => {
    await unarchiveClient.mutateAsync(id)
    toast.success('Client restored')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between"><Skeleton className="h-8 w-32 bg-slate-800" /><Skeleton className="h-9 w-24 bg-slate-800" /></div>
        <Skeleton className="h-12 w-full bg-slate-800" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full bg-slate-800" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Clients</h1>
          <p className="text-sm text-slate-400 mt-1">{activeClients.length} active · {archivedClients.length} archived</p>
        </div>
        <Button onClick={() => { setEditingClient(null); setShowSheet(true) }} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="mr-2 h-4 w-4" />New Client
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="pl-10 bg-slate-800 border-slate-700 text-slate-50" />
        </div>
        <Button variant="outline" onClick={() => setShowArchived(!showArchived)} className={cn("border-slate-700", showArchived ? "text-violet-400" : "text-slate-400")}>
          <Archive className="mr-2 h-4 w-4" />{showArchived ? 'Show Active' : 'Archived'}
        </Button>
      </div>

      {filteredClients.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No clients found</h3>
            <p className="text-sm text-slate-400 mt-1">
              {search ? 'Try a different search term' : showArchived ? 'No archived clients' : 'Add your first client to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredClients.map((client) => (
            <div key={client.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700 hover:bg-slate-800/50 transition-colors group">
              <Link href={`/clients/${client.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-violet-400">{client.business_name.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-slate-50 truncate">{client.business_name}</h3>
                    <p className="text-xs text-slate-400 truncate">{client.contact_name || client.email || 'No contact info'}</p>
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-2 ml-3">
                <Badge variant={client.billing_type === 'monthly_package' ? 'default' : 'secondary'} className="text-xs hidden sm:inline-flex">
                  {client.billing_type === 'monthly_package' ? 'Package' : client.billing_type === 'per_item' ? 'Per Item' : 'One Off'}
                </Badge>
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className={cn("text-xs", client.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/20 text-slate-400')}>
                  {client.status}
                </Badge>
                {client.status === 'active' ? (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100" onClick={(e) => { e.preventDefault(); handleArchive(client.id) }}>
                    <Archive className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100" onClick={(e) => { e.preventDefault(); handleUnarchive(client.id) }}>
                    <ArchiveRestore className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientSheet open={showSheet} onOpenChange={setShowSheet} client={editingClient} />
    </div>
  )
}
