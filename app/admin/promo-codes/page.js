'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  Button,
  Input,
  Switch,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  SelectItem,
  Tooltip,
} from '@heroui/react'
import { Plus, Pencil, Trash2, RefreshCcw, TicketPercent, AlertCircle, Save } from 'lucide-react'
import { toast } from 'sonner'
import { validateData, promoCodeSchema } from '@/lib/validations'

const empty = { code: '', discount_type: 'percent', value: 10, active: true, used_count: 0, usage_limit: null }

export default function PromoCodesPage() {
  const supabase = createClient()
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
    setPromos(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const { success, errors: validationErrors, data: validData } = validateData(promoCodeSchema, {
      ...form,
      discount_value: Number(form.value),
      max_uses: form.usage_limit ? Number(form.usage_limit) : null
    })

    if (!success) {
      setErrors(validationErrors)
      toast.error('Please fix validation errors')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: validData.code,
        discount_type: validData.discount_type,
        value: validData.discount_value,
        active: validData.active,
        usage_limit: validData.max_uses,
      }

      const { error } = editing
        ? await supabase.from('promo_codes').update(payload).eq('id', editing.id)
        : await supabase.from('promo_codes').insert(payload)

      if (error) throw error
      toast.success(editing ? 'Promo code updated' : 'Promo code created')
      onOpenChange(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to save promo code')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (p) => {
    if (!confirm(`Delete "${p.code}"?`)) return
    const { error } = await supabase.from('promo_codes').delete().eq('id', p.id)
    if (error) return toast.error(error.message)
    toast.success('Deleted'); load()
  }

  const toggle = async (p) => {
    const { error } = await supabase.from('promo_codes').update({ active: !p.active }).eq('id', p.id)
    if (error) return toast.error(error.message)
    setPromos((prev) => prev.map((x) => x.id === p.id ? { ...x, active: !x.active } : x))
    toast.success(`${p.code} is now ${!p.active ? 'active' : 'inactive'}`)
  }

  const openNew = () => { setEditing(null); setForm(empty); setErrors({}); onOpen() }
  const openEdit = (p) => { setEditing(p); setForm({ ...empty, ...p }); setErrors({}); onOpen() }

  const renderCell = useCallback((p, columnKey) => {
    switch (columnKey) {
      case 'code':
        return <span className="font-black text-orange-500 tracking-tighter text-lg">{p.code}</span>
      case 'type':
        return <Chip size="sm" variant="flat" color={p.discount_type === 'percent' ? 'primary' : 'secondary'} className="font-bold uppercase tracking-widest">{p.discount_type}</Chip>
      case 'value':
        return <span className="font-mono font-bold">{p.discount_type === 'percent' ? `${p.value}%` : `$${Number(p.value).toFixed(2)}`}</span>
      case 'usage':
        return <span className="text-xs font-medium text-default-500">{p.used_count || 0}{p.usage_limit ? ` / ${p.usage_limit}` : ' (∞)'}</span>
      case 'status':
        return <Switch size="sm" color="warning" isSelected={p.active} onValueChange={() => toggle(p)} />
      case 'actions':
        return (
          <div className="flex gap-1 justify-end">
            <Button isIconOnly size="sm" variant="light" onPress={() => openEdit(p)}><Pencil className="w-4 h-4 text-default-400" /></Button>
            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => remove(p)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        )
      default: return p[columnKey]
    }
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight">Promo Codes</h1>
          <p className="text-muted-foreground mt-1">Manage discounts and seasonal offers.</p>
        </div>
        <Button color="warning" onPress={openNew} startContent={<Plus className="w-4 h-4" />} className="font-bold shadow-lg shadow-warning/20">
          New Promo
        </Button>
      </div>

      <Table
        aria-label="Promo codes table"
        classNames={{
          wrapper: "bg-content1/50 backdrop-blur-md shadow-xl rounded-3xl border border-divider",
          th: "bg-content2 text-default-500 font-bold",
        }}
      >
        <TableHeader>
          <TableColumn>CODE</TableColumn>
          <TableColumn>TYPE</TableColumn>
          <TableColumn>VALUE</TableColumn>
          <TableColumn>USAGE</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn align="end">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No promo codes found." isLoading={loading} loadingContent={<RefreshCcw className="animate-spin" />}>
          {promos.map((p) => (
            <TableRow key={p.id}>
              {(columnKey) => <TableCell>{renderCell(p, columnKey)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" classNames={{ base: "bg-background border border-divider", header: "border-b border-divider", footer: "border-t border-divider" }}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <TicketPercent className="w-5 h-5 text-orange-500" />
                <span className="font-bold">{editing ? 'Edit Promo Code' : 'Create Promo Code'}</span>
              </ModalHeader>
              <ModalBody className="py-6 space-y-4">
                <Input
                  label="Promo Code"
                  placeholder="e.g. SUMMER25"
                  variant="bordered"
                  labelPlacement="outside"
                  value={form.code}
                  onValueChange={(v) => setForm({ ...form, code: v.toUpperCase() })}
                  isInvalid={!!errors.code}
                  errorMessage={errors.code}
                  className="font-mono uppercase"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Discount Type"
                    variant="bordered"
                    labelPlacement="outside"
                    selectedKeys={[form.discount_type]}
                    onSelectionChange={(keys) => setForm({ ...form, discount_type: Array.from(keys)[0] })}
                  >
                    <SelectItem key="percent">Percent (%)</SelectItem>
                    <SelectItem key="fixed">Fixed ($)</SelectItem>
                  </Select>
                  <Input
                    label="Value"
                    type="number"
                    variant="bordered"
                    labelPlacement="outside"
                    value={form.value}
                    onValueChange={(v) => setForm({ ...form, value: v })}
                    isInvalid={!!errors.discount_value}
                    errorMessage={errors.discount_value}
                  />
                </div>
                <Input
                  label="Usage Limit"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  variant="bordered"
                  labelPlacement="outside"
                  value={form.usage_limit || ''}
                  onValueChange={(v) => setForm({ ...form, usage_limit: v })}
                />
                <div className="flex items-center justify-between p-4 rounded-2xl bg-content2/40 border border-divider mt-2">
                  <p className="text-sm font-bold">Active Status</p>
                  <Switch color="warning" isSelected={form.active} onValueChange={(v) => setForm({ ...form, active: v })} />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Cancel</Button>
                <Button color="warning" className="font-bold shadow-lg shadow-warning/20" isLoading={saving} onPress={save} startContent={!saving && <Save className="w-4 h-4" />}>
                  {editing ? 'Update' : 'Create'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
