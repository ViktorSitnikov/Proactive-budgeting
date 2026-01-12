"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"

const UNITS = [
  "шт.",
  "кв.м.",
  "м.",
  "кг.",
  "л.",
  "компл.",
  "час",
  "усл. ед."
]

interface Resource {
  id: string
  name?: string
  resource?: string
  quantity: number
  unit?: string
  estimatedCost?: number
  basePrice?: number
}

interface ResourceTableProps {
  resources: Resource[]
  onResourcesChange: (resources: Resource[]) => void
}

export function ResourceTable({ resources, onResourcesChange }: ResourceTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Resource | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newResource, setNewResource] = useState<Partial<Resource>>({
    name: "",
    resource: "",
    quantity: 1,
    unit: "шт.",
    estimatedCost: 0,
    basePrice: 0,
  })

  const getResourceName = (r: Resource) => r.resource || r.name || ""
  const getResourcePrice = (r: Resource) => r.basePrice ?? r.estimatedCost ?? 0

  const handleEdit = (resource: Resource) => {
    setEditingId(resource.id)
    setEditForm({ ...resource })
  }

  const handleSaveEdit = () => {
    if (editForm) {
      const updated = resources.map((r) => (r.id === editingId ? editForm : r))
      onResourcesChange(updated)
      setEditingId(null)
      setEditForm(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleDelete = (id: string) => {
    const updated = resources.filter((r) => r.id !== id)
    onResourcesChange(updated)
  }

  const handleAdd = () => {
    const price = getResourcePrice(newResource as Resource)
    const newRes: Resource = {
      id: `res-${Date.now()}`,
      name: newResource.name || newResource.resource || "",
      resource: newResource.resource || newResource.name || "",
      quantity: newResource.quantity || 1,
      unit: newResource.unit || "шт.",
      estimatedCost: price,
      basePrice: price,
    }
    onResourcesChange([...resources, newRes])
    setNewResource({ name: "", resource: "", quantity: 1, unit: "шт.", estimatedCost: 0, basePrice: 0 })
    setIsAdding(false)
  }

  return (
    <Card className="p-4 md:p-6 overflow-hidden">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800">Детализация ресурсов</h3>
          <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Ресурс</th>
                <th className="text-left p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Кол-во</th>
                <th className="text-left p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Ед.</th>
                <th className="text-left p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Цена</th>
                <th className="text-right p-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {resources.map((resource) => {
                const name = getResourceName(resource)
                const price = getResourcePrice(resource)
                
                return (
                  <tr key={resource.id} className="hover:bg-slate-50/50 transition-colors">
                  {editingId === resource.id && editForm ? (
                    <>
                      <td className="p-2">
                        <Input
                            value={getResourceName(editForm)}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value, resource: e.target.value })}
                            className="h-9"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                          className="h-9 w-20"
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={editForm.unit || "шт."}
                          onValueChange={(value) => setEditForm({ ...editForm, unit: value })}
                        >
                          <SelectTrigger className="h-9 w-24">
                            <SelectValue placeholder="Ед." />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={getResourcePrice(editForm)}
                          onChange={(e) => setEditForm({ ...editForm, basePrice: Number(e.target.value), estimatedCost: Number(e.target.value) })}
                          className="h-9 w-24"
                        />
                      </td>
                        <td className="p-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="h-8 w-8 text-green-600">
                              <Check className="h-4 w-4" />
                        </Button>
                            <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-8 w-8 text-red-600">
                              <X className="h-4 w-4" />
                        </Button>
                          </div>
                      </td>
                    </>
                  ) : (
                    <>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{name}</p>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">
                          {resource.quantity}
                        </td>
                        <td className="p-3 text-slate-400 font-medium uppercase text-[10px]">
                          {resource.unit || 'шт.'}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {(price || 0).toLocaleString()} ₽
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(resource)} className="h-8 w-8 text-slate-400 hover:text-blue-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(resource.id)} className="h-8 w-8 text-slate-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                        </Button>
                          </div>
                      </td>
                    </>
                  )}
                </tr>
                )
              })}

              {isAdding && (
                <tr className="bg-blue-50/50">
                  <td className="p-2">
                    <Input
                      placeholder="Название"
                      value={getResourceName(newResource as Resource)}
                      onChange={(e) => setNewResource({ ...newResource, name: e.target.value, resource: e.target.value })}
                      className="h-9"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      placeholder="0"
                      value={newResource.quantity}
                      onChange={(e) => setNewResource({ ...newResource, quantity: Number(e.target.value) })}
                      className="h-9 w-20"
                    />
                  </td>
                  <td className="p-2">
                    <Select
                      value={newResource.unit || "шт."}
                      onValueChange={(value) => setNewResource({ ...newResource, unit: value })}
                    >
                      <SelectTrigger className="h-9 w-24">
                        <SelectValue placeholder="Ед." />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      placeholder="0"
                      value={getResourcePrice(newResource as Resource)}
                      onChange={(e) => setNewResource({ ...newResource, basePrice: Number(e.target.value), estimatedCost: Number(e.target.value) })}
                      className="h-9 w-24"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={handleAdd} className="h-8 w-8 text-green-600">
                        <Check className="h-4 w-4" />
                    </Button>
                      <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)} className="h-8 w-8 text-red-600">
                        <X className="h-4 w-4" />
                    </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Итоговая стоимость</span>
          <span className="text-xl font-black text-blue-600">
            {resources.reduce((sum, r) => sum + (getResourcePrice(r) * r.quantity), 0).toLocaleString()} ₽
          </span>
        </div>
      </div>
    </Card>
  )
}
