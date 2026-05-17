'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Switch,
  Select,
  SelectItem,
  Textarea,
  Tooltip,
} from '@heroui/react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  Filter,
  MoreVertical,
  Star,
  RefreshCcw,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { validateData, itemSchema } from '@/lib/validations';
import ItemPreview from '@/components/admin/item-preview';

const emptyItem = {
  name_en: '',
  name_ar: '',
  desc_en: '',
  desc_ar: '',
  category_id: null,
  price: 0,
  image_url: '',
  has_combo: false,
  combo_price: 0,
  combo_desc_en: '',
  combo_desc_ar: '',
  available: true,
  rating: 0,
};

const statusOptions = [
  { name: 'Available', uid: 'available' },
  { name: 'Unavailable', uid: 'unavailable' },
];

export default function ItemsPage() {
  const supabase = createClient();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        supabase.from('items').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order'),
      ]);
      if (itemsRes.error) throw itemsRes.error;
      if (catsRes.error) throw catsRes.error;
      setItems(itemsRes.data || []);
      setCategories(catsRes.data || []);
    } catch (err) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filtered = [...items];
    if (hasSearchFilter) {
      filtered = filtered.filter((item) =>
        item.name_en.toLowerCase().includes(filterValue.toLowerCase()) ||
        item.name_ar.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) =>
        statusFilter === 'available' ? item.available : !item.available
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item) => item.category_id === categoryFilter);
    }
    return filtered;
  }, [items, filterValue, statusFilter, categoryFilter, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyItem);
    setErrors({});
    onOpen();
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...emptyItem, ...item });
    setErrors({});
    onOpen();
  };

  const save = async () => {
    const { success, errors: validationErrors, data: validData } = validateData(
      itemSchema,
      {
        ...form,
        price: Number(form.price) || 0,
        combo_price: form.has_combo ? Number(form.combo_price) || 0 : null,
        rating: Number(form.rating) || 0,
      }
    );

    if (!success) {
      setErrors(validationErrors);
      toast.error('Please fix validation errors');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...validData, category_id: form.category_id || null };
      const { error } = editing
        ? await supabase.from('items').update(payload).eq('id', editing.id)
        : await supabase.from('items').insert(payload);

      if (error) throw error;
      toast.success(editing ? 'Item updated' : 'Item added');
      onOpenChange(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this item?')) return;
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  const toggleAvail = async (it) => {
    const { error } = await supabase.from('items').update({ available: !it.available }).eq('id', it.id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, available: !p.available } : p)));
    toast.success(`${it.name_en} is now ${!it.available ? 'available' : 'unavailable'}`);
  };

  const renderCell = useCallback((item, columnKey) => {
    const cellValue = item[columnKey];
    switch (columnKey) {
      case 'name':
        return (
          <User
            avatarProps={{ radius: 'lg', src: item.image_url, size: 'lg' }}
            description={item.name_ar}
            name={item.name_en}
          >
            {item.name_en}
          </User>
        );
      case 'category':
        return (
          <Chip variant="flat" size="sm" color="warning">
            {categories.find((c) => c.id === item.category_id)?.name_en || '—'}
          </Chip>
        );
      case 'price':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm text-orange-500 font-mono">${Number(item.price).toFixed(2)}</p>
            {item.has_combo && (
              <p className="text-bold text-[10px] text-default-400 font-mono">Combo: ${item.combo_price}</p>
            )}
          </div>
        );
      case 'rating':
        return (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-warning text-warning" />
            <span className="text-xs font-mono">{Number(item.rating || 0).toFixed(1)}</span>
          </div>
        );
      case 'status':
        return (
          <Tooltip content={item.available ? "Click to disable" : "Click to enable"}>
            <Switch
              size="sm"
              color="warning"
              isSelected={item.available}
              onValueChange={() => toggleAvail(item)}
            />
          </Tooltip>
        );
      case 'actions':
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Tooltip content="Edit">
                <Button isIconOnly size="sm" variant="light" onPress={() => openEdit(item)}>
                <Pencil className="w-4 h-4 text-default-400" />
                </Button>
            </Tooltip>
            <Tooltip color="danger" content="Delete">
                <Button isIconOnly size="sm" variant="light" onPress={() => remove(item.id)}>
                <Trash2 className="w-4 h-4 text-danger" />
                </Button>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, [categories]);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name..."
            startContent={<Search className="w-4 h-4" />}
            value={filterValue}
            onClear={() => setFilterValue('')}
            onValueChange={setFilterValue}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDown className="text-small" />} variant="flat">
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={new Set([statusFilter])}
                selectionMode="single"
                onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0])}
              >
                 <DropdownItem key="all">All</DropdownItem>
                 <DropdownItem key="available">Available</DropdownItem>
                 <DropdownItem key="unavailable">Unavailable</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDown className="text-small" />} variant="flat">
                  Category
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Category filter"
                closeOnSelect={true}
                selectedKeys={new Set([categoryFilter])}
                selectionMode="single"
                onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0])}
              >
                <DropdownItem key="all">All Categories</DropdownItem>
                {categories.map((cat) => (
                  <DropdownItem key={cat.id}>{cat.name_en}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button color="warning" endContent={<Plus />} onPress={openNew} className="font-bold">
              Add Item
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">Total {items.length} items</span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small ml-1"
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [filterValue, statusFilter, categoryFilter, items.length, categories]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <Pagination
          isCompact
          showControls
          showShadow
          color="warning"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={() => setPage((prev) => (prev > 1 ? prev - 1 : prev))}>
            Previous
          </Button>
          <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={() => setPage((prev) => (prev < pages ? prev + 1 : prev))}>
            Next
          </Button>
        </div>
      </div>
    );
  }, [page, pages]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-1 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Menu Items</h1>
        <p className="text-muted-foreground">Manage your products, prices, and availability.</p>
      </div>

      <Table
        aria-label="Items table"
        isHeaderSticky
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{
          wrapper: "max-h-[700px] bg-content1/50 backdrop-blur-md shadow-xl rounded-2xl",
          th: "bg-content2 text-default-500 border-b border-divider",
        }}
        topContent={topContent}
        topContentPlacement="outside"
      >
        <TableHeader>
          <TableColumn key="name">ITEM</TableColumn>
          <TableColumn key="category">CATEGORY</TableColumn>
          <TableColumn key="price">PRICE</TableColumn>
          <TableColumn key="rating">RATING</TableColumn>
          <TableColumn key="status">STATUS</TableColumn>
          <TableColumn key="actions" align="end">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No items found"} items={paginatedItems} isLoading={loading} loadingContent={<RefreshCcw className="animate-spin" />}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        scrollBehavior="inside"
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
                <span className="text-xl font-bold">{editing ? 'Edit Item' : 'Add New Item'}</span>
                <p className="text-xs text-muted-foreground font-normal">Fill in the details for your product.</p>
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Form */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Name (English)"
                        placeholder="e.g. Classic Burger"
                        variant="bordered"
                        labelPlacement="outside"
                        value={form.name_en}
                        onValueChange={(v) => setForm({ ...form, name_en: v })}
                        isInvalid={!!errors.name_en}
                        errorMessage={errors.name_en}
                      />
                      <Input
                        label="Name (Arabic)"
                        placeholder="برجر كلاسيك"
                        variant="bordered"
                        labelPlacement="outside"
                        dir="rtl"
                        value={form.name_ar}
                        onValueChange={(v) => setForm({ ...form, name_ar: v })}
                        isInvalid={!!errors.name_ar}
                        errorMessage={errors.name_ar}
                      />
                      <Textarea
                        label="Description (English)"
                        placeholder="Describe the item..."
                        variant="bordered"
                        labelPlacement="outside"
                        className="md:col-span-2"
                        value={form.desc_en}
                        onValueChange={(v) => setForm({ ...form, desc_en: v })}
                      />
                      <Textarea
                        label="Description (Arabic)"
                        placeholder="وصف المنتج..."
                        variant="bordered"
                        labelPlacement="outside"
                        className="md:col-span-2"
                        dir="rtl"
                        value={form.desc_ar}
                        onValueChange={(v) => setForm({ ...form, desc_ar: v })}
                      />
                      <Select
                        label="Category"
                        placeholder="Select a category"
                        variant="bordered"
                        labelPlacement="outside"
                        selectedKeys={form.category_id ? [form.category_id] : []}
                        onSelectionChange={(keys) => setForm({ ...form, category_id: Array.from(keys)[0] })}
                      >
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name_en}</SelectItem>
                        ))}
                      </Select>
                      <Input
                        label="Price"
                        placeholder="0.00"
                        variant="bordered"
                        labelPlacement="outside"
                        type="number"
                        startContent={<div className="pointer-events-none flex items-center"><span className="text-default-400 text-small">$</span></div>}
                        value={form.price}
                        onValueChange={(v) => setForm({ ...form, price: v })}
                      />
                      <Input
                        label="Image URL"
                        placeholder="https://example.com/image.jpg"
                        variant="bordered"
                        labelPlacement="outside"
                        className="md:col-span-2"
                        value={form.image_url}
                        onValueChange={(v) => setForm({ ...form, image_url: v })}
                      />
                    </div>

                    <div className="p-4 rounded-2xl bg-content2/40 border border-divider space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">Combo Option</p>
                          <p className="text-xs text-muted-foreground">Enable this to offer a combo price.</p>
                        </div>
                        <Switch color="warning" isSelected={form.has_combo} onValueChange={(v) => setForm({ ...form, has_combo: v })} />
                      </div>
                      {form.has_combo && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                           <Input
                             label="Combo Price"
                             variant="bordered"
                             labelPlacement="outside"
                             type="number"
                             value={form.combo_price}
                             onValueChange={(v) => setForm({ ...form, combo_price: v })}
                           />
                           <div />
                           <Input label="Combo Desc (EN)" variant="bordered" labelPlacement="outside" value={form.combo_desc_en} onValueChange={(v) => setForm({ ...form, combo_desc_en: v })} />
                           <Input label="Combo Desc (AR)" variant="bordered" labelPlacement="outside" dir="rtl" value={form.combo_desc_ar} onValueChange={(v) => setForm({ ...form, combo_desc_ar: v })} />
                        </motion.div>
                      )}
                    </div>

                    <div className="flex gap-8">
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-medium">Available</span>
                         <Switch color="warning" isSelected={form.available} onValueChange={(v) => setForm({ ...form, available: v })} />
                       </div>
                       <div className="flex-1">
                          <Input
                            label="Rating"
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            variant="bordered"
                            labelPlacement="outside"
                            value={form.rating}
                            onValueChange={(v) => setForm({ ...form, rating: v })}
                          />
                       </div>
                    </div>
                  </div>

                  {/* Right Column: Preview */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="sticky top-0">
                      <p className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-orange-500" />
                        Live Preview
                      </p>
                      <div className="p-8 rounded-3xl bg-content2/20 border-2 border-dashed border-divider flex items-center justify-center">
                        <ItemPreview
                          item={form}
                          categoryName={categories.find(c => c.id === form.category_id)?.name_en}
                        />
                      </div>
                      <p className="mt-4 text-[10px] text-muted-foreground text-center uppercase tracking-widest">How it looks on the menu</p>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Cancel</Button>
                <Button color="warning" className="font-bold shadow-lg shadow-warning/20" isLoading={saving} onPress={save}>
                  {editing ? 'Update Product' : 'Create Product'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
