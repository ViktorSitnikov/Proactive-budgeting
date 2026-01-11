"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { MapPin, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProjectMap } from "../../../shared/ui/project-map"

interface MapSelectorProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void
  initialLocation?: { lat: number; lng: number; address: string }
}

export function MapSelector({ onLocationSelect, initialLocation }: MapSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || {
      lat: 56.8389,
      lng: 60.6057,
      address: "Екатеринбург, Россия",
    },
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setSelectedLocation(location)
    onLocationSelect(location)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ", Екатеринбург"
        )}&limit=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0]
        const newLocation = {
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          address: display_name,
        }
        handleLocationSelect(newLocation)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium">Выберите локацию на карте</span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск адреса (например, Ленина 5)..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching} variant="secondary">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Найти"}
          </Button>
        </div>

        <div className="h-64 rounded-lg overflow-hidden border border-slate-200 shadow-inner">
          <ProjectMap 
            mode="picker"
            initialCenter={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            initialZoom={15}
            onLocationSelect={handleLocationSelect}
            className="h-full w-full"
          />
        </div>

        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
          <span className="text-blue-600 font-bold uppercase text-[10px] block mb-1">Выбранная локация:</span>
          <p className="text-xs text-slate-700 leading-relaxed">{selectedLocation.address}</p>
        </div>
        
        <p className="text-[11px] text-slate-400 italic">
          * Вы можете найти адрес через поиск или просто кликнуть в нужное место на карте
        </p>
      </div>
    </Card>
  )
}
