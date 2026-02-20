"use client"

import { useState } from "react"
import { Search, MapPin, Building2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { BusinessInput } from "@/lib/types"

const CATEGORIES = [
  "dentista",
  "veterinario",
  "clinica estetica",
  "restaurante",
  "abogado",
  "fontanero",
  "electricista",
  "peluqueria",
  "gimnasio",
  "farmacia",
]

interface BusinessFormProps {
  onSubmit: (data: BusinessInput) => void
  isLoading: boolean
}

export function BusinessForm({ onSubmit, isLoading }: BusinessFormProps) {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !location.trim() || !category) return
    onSubmit({ name: name.trim(), location: location.trim(), category })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-sm font-medium text-foreground/80">
          Nombre del negocio
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            placeholder="Ej: Clinica Dental Sonrisa"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="location" className="text-sm font-medium text-foreground/80">
          Ubicacion (ciudad/direccion)
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="location"
            placeholder="Ej: Madrid"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="category" className="text-sm font-medium text-foreground/80">
          Categoria del negocio
        </Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger id="category" className="bg-secondary border-border text-foreground">
            <SelectValue placeholder="Selecciona una categoria" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !name.trim() || !location.trim() || !category}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analizando...
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Analizar visibilidad
          </>
        )}
      </Button>
    </form>
  )
}
