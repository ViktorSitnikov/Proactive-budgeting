"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Handshake, Loader2 } from "lucide-react"
import type { NPO } from "@/src/shared/lib/mock-data"
import { getImageUrl } from "@/src/shared/api/base"

interface NPOCardProps {
  npo: NPO
  onRequest?: () => void
  isLoading?: boolean
}

export function NPOCard({ npo, onRequest, isLoading }: NPOCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={getImageUrl(npo.avatar)} />
            <AvatarFallback>{npo.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-semibold">{npo.name}</h4>
            <div className="flex items-center gap-1 my-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < npo.rating ? "bg-yellow-400" : "bg-gray-200"}`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {npo.expertise.map((skill: string) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
            <Button size="sm" className="gap-2" onClick={onRequest} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
              <Handshake className="w-3 h-3" />
              )}
              {isLoading ? "Отправка..." : "Запросить помощь"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
