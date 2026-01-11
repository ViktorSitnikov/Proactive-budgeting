"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Sparkles, ChevronRight } from "lucide-react"
import type { Opportunity } from "@/shared/lib/mock-data"

interface OpportunityCardProps {
  opportunity: Opportunity
  onApply?: () => void
}

export function OpportunityCard({ opportunity, onApply }: OpportunityCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{opportunity.title}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {opportunity.location}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
            <Sparkles className="w-3 h-3 mr-1" />
            {opportunity.status === "applied" ? "Applied" : "Match"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Budget</span>
          <span className="font-semibold text-emerald-600">{(opportunity.budget || 0).toLocaleString()} ₽</span>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700 font-medium mb-1">Why we recommended this</p>
          <p className="text-xs text-blue-600">{opportunity.matchReason}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {opportunity.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <Button className="w-full gap-2" onClick={onApply} disabled={opportunity.status === "applied"}>
          {opportunity.status === "applied" ? "Application Submitted" : "Apply to Partner"}
          {opportunity.status !== "applied" && <ChevronRight className="w-4 h-4" />}
        </Button>
      </CardContent>
    </Card>
  )
}
