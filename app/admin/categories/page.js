'use client'
import { useEffect, useState, useCallback } from 'react'
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
  Card,
  CardBody,
  Tooltip,
} from '@heroui/react'
import { Plus, GripVertical, Pencil, Trash2, RefreshCcw, AlertCircle, Save } from 'lucide-react'
import { toast } from 'sonner'
import { validateData, categorySchema } from '@/lib/validations'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableRow({ cat, onEdit, onDelete, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`mb-3 border-none bg-content1/50 backdrop-blur-md transition-all ${
          isDragging ? 'shadow-2xl ring-2 ring-orange-500/50 opacity-90 scale-[1.02]' : 'hover:bg-content2/80'
        }`}
      >
        <CardBody className="flex flex-row items-center gap-4 p-4">
          <div
            {...attributes}
            {...listeners}
            className="p-2 -ml-2 cursor-grab active:cursor-grabbing text-default-400 hover:text-orange-500 transition-colors touch-none"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-base">{cat.name_en}</h4>
            <p className="text-xs text-default-400 font-medium" dir="rtl">{cat.name_ar || '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content={cat.active ? "Active" : "Inactive"}>
                <Switch
                size="sm"
                color="warning"
                isSelected={cat.active}
                onValueChange={() => onToggle(cat)}
                />
            </Tooltip>
            <div className="flex gap-1">
                <Button isIconOnly size="sm" variant="light" onPress={() => onEdit(cat)}>
                    <Pencil className="w-4 h-4 text-default-400" />
                </Button>
                <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => onDelete(cat)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default function CategoriesPage() {
  const supabase = createClient()
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name_en: '', name_ar: '', active: true })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Hold and drag feel
      },
    })
  )

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
    if (!error) setCats(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const handleDragEnd = async (ev) => {
    const { active, over } = ev
    if (!over || active.id === over.id) return

    const oldIdx = cats.findIndex((c) => c.id === active.id)
    const newIdx = cats.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(cats, oldIdx, newIdx)
    setCats(reordered)

    try {
      const updates = reordered.map((c, idx) =>
        supabase.from('categories').update({ sort_order: idx }).eq('id', c.id)
      )
      await Promise.all(updates)
      toast.success('Order saved successfully')
    } catch (err) {
      toast.error('Failed to save new order')
    }
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name_en: '', name_ar: '', active: true })
    setErrors({})
    onOpen()
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm(c)
    setErrors({})
    onOpen()
  }

  const save = async () => {
    const { success, errors: validationErrors, data: validData } = validateData(categorySchema, form)
    if (!success) {
      setErrors(validationErrors)
      toast.error('Please fix validation errors')
      return
    }

    setSaving(true)
    try {
      let error
      if (editing) {
        ({ error } = await supabase.from('categories').update(validData).eq('id', editing.id))
      } else {
        ({ error } = await supabase.from('categories').insert({
          ...validData,
          sort_order: cats.length,
        }))
      }
      if (error) throw error
      toast.success(editing ? 'Category updated' : 'Category created')
      onOpenChange(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (c) => {
    if (!confirm(`Delete "${c.name_en}"?`)) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) return toast.error(error.message)
    toast.success('Deleted')
    load()
  }

  const toggle = async (c) => {
    const { error } = await supabase.from('categories').update({ active: !c.active }).eq('id', c.id)
    if (error) return toast.error(error.message)
    setCats((prev) => prev.map((p) => p.id === c.id ? { ...p, active: !p.active } : p))
    toast.success(`${c.name_en} is now ${!c.active ? 'active' : 'inactive'}`)
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your menu by dragging sections.</p>
        </div>
        <Button color="warning" onPress={openNew} startContent={<Plus className="w-4 h-4" />} className="font-bold shadow-lg shadow-warning/20">
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <RefreshCcw className="w-8 h-8 animate-spin text-orange-500" />
           <p className="text-sm text-muted-foreground animate-pulse">Loading categories...</p>
        </div>
      ) : cats.length === 0 ? (
        <Card className="bg-content1/50 border-2 border-dashed border-divider">
          <CardBody className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-content2 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-default-400" />
            </div>
            <p className="text-muted-foreground font-medium">No categories found yet.</p>
            <Button variant="flat" color="warning" onPress={openNew}>Create your first category</Button>
          </CardBody>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={cats.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {cats.map((c, idx) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <SortableRow cat={c} onEdit={openEdit} onDelete={remove} onToggle={toggle} />
                </motion.div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        classNames={{
            base: "bg-background border border-divider",
            header: "border-b border-divider",
            footer: "border-t border-divider",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-xl font-bold">{editing ? 'Edit Category' : 'New Category'}</span>
              </ModalHeader>
              <ModalBody className="py-6 space-y-4">
                <Input
                  label="Name (English)"
                  placeholder="e.g. Appetizers"
                  variant="bordered"
                  labelPlacement="outside"
                  value={form.name_en}
                  onValueChange={(v) => setForm({ ...form, name_en: v })}
                  isInvalid={!!errors.name_en}
                  errorMessage={errors.name_en}
                />
                <Input
                  label="Name (Arabic)"
                  placeholder="المقبلات"
                  variant="bordered"
                  labelPlacement="outside"
                  dir="rtl"
                  value={form.name_ar}
                  onValueChange={(v) => setForm({ ...form, name_ar: v })}
                />
                <div className="flex items-center justify-between p-4 rounded-2xl bg-content2/40 border border-divider mt-4">
                  <div>
                    <p className="text-sm font-bold">Active Status</p>
                    <p className="text-xs text-muted-foreground">Visible on the customer menu.</p>
                  </div>
                  <Switch
                    color="warning"
                    isSelected={form.active}
                    onValueChange={(v) => setForm({ ...form, active: v })}
                  />
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
