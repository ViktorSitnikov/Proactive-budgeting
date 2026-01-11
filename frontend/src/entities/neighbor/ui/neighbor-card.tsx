"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import type { Neighbor } from "@/shared/lib/mock-data"

interface NeighborCardProps {
  neighbor: Neighbor
  onMessage?: () => void
}

export function NeighborCard({ neighbor, onMessage }: NeighborCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={neighbor.avatar || "/placeholder.svg"} />
            <AvatarFallback>{neighbor.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{neighbor.name}</h4>
            <p className="text-xs text-muted-foreground mb-2">{neighbor.distance} away</p>
            <p className="text-sm text-foreground/80 mb-3">{neighbor.idea}</p>
            <Button size="sm" variant="outline" className="gap-2 bg-transparent" onClick={onMessage}>
              <MessageCircle className="w-3 h-3" />
              Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
