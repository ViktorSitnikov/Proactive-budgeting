from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from geoalchemy2.elements import WKTElement

from models import DBProject
from schemas import Draft, Resource


def build_point_wkt(coordinates: Dict) -> Optional[WKTElement]:
    if not coordinates:
        return None
    lat = coordinates.get("lat")
    lng = coordinates.get("lng")
    if lat is None or lng is None:
        return None
    return WKTElement(f"POINT({float(lng)} {float(lat)})", srid=4326)


def build_polygon_wkt(points: List[List[float]]) -> WKTElement:
    if len(points) < 3:
        raise HTTPException(status_code=400, detail="Polygon must contain at least 3 points")
    try:
        normalized = [
            (float(p[0]), float(p[1]))
            for p in points
            if isinstance(p, list) and len(p) == 2
        ]
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Each polygon point must be [lng, lat]")
    if len(normalized) < 3:
        raise HTTPException(status_code=400, detail="Each polygon point must be [lng, lat]")
    if normalized[0] != normalized[-1]:
        normalized.append(normalized[0])
    ring = ", ".join([f"{lng} {lat}" for lng, lat in normalized])
    return WKTElement(f"POLYGON(({ring}))", srid=4326)


def derive_coordinates_from_polygon(points: Optional[List[List[float]]]) -> Optional[Dict[str, float]]:
    if not points:
        return None
    normalized: List[List[float]] = []
    for point in points:
        if isinstance(point, list) and len(point) == 2:
            try:
                normalized.append([float(point[0]), float(point[1])])
            except (TypeError, ValueError):
                continue
    if len(normalized) < 3:
        return None
    if normalized[0][0] == normalized[-1][0] and normalized[0][1] == normalized[-1][1]:
        normalized = normalized[:-1]
    if not normalized:
        return None
    lng = sum(point[0] for point in normalized) / len(normalized)
    lat = sum(point[1] for point in normalized) / len(normalized)
    return {"lat": lat, "lng": lng}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def draft_resources_to_schema(raw: Any) -> List[Resource]:
    if not raw:
        return []
    out: List[Resource] = []
    for index, item in enumerate(raw):
        if not isinstance(item, dict):
            continue
        data = dict(item)
        if not data.get("id"):
            data["id"] = f"draft-res-{index}"
        try:
            out.append(Resource.model_validate(data))
        except Exception:
            out.append(
                Resource(
                    id=data.get("id", f"draft-res-{index}"),
                    resource=data.get("resource") or data.get("name"),
                    category=data.get("category") or "Прочее",
                    basePrice=float(data.get("basePrice") or 0),
                    quantity=float(data.get("quantity") or 0),
                )
            )
    return out


def project_row_to_draft(project: DBProject) -> Draft:
    ts = project.updated_at or project.created_at or utcnow()
    project_photos = list(project.project_photos) if project.project_photos else (list(project.photos) if project.photos else [])
    analysis_photos = list(project.analysis_photos) if project.analysis_photos else []
    return Draft(
        id=project.id,
        initiatorId=project.initiatorId,
        title=project.title,
        description=project.description or "",
        lastModified=ts.isoformat(),
        status="DRAFT",
        step=project.draft_step or 1,
        resources=draft_resources_to_schema(project.resources),
        type=project.type,
        photos=project_photos,
        projectPhotos=project_photos,
        analysisPhotos=analysis_photos,
        location=project.location,
        coordinates=project.coordinates,
        polygon=project.polygon,
        proposalDocumentHtml=project.proposal_document_html,
        proposalDocumentPath=project.proposal_document_path,
    )
