from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class VisualPlan(BaseModel):
    scene: str = Field(..., description="What is in the scene, in plain structured terms.")
    style: str = Field(..., description="High-level visual style and realism target.")
    composition: str = Field(..., description="Framing, positioning, and camera composition.")
    constraints: List[str] = Field(default_factory=list)
    variations: List[str] = Field(default_factory=list)


class GenerationHints(BaseModel):
    resolution: str = Field("640x640", description="Target output resolution.")
    fidelity: str = Field("strict", description="How strongly to preserve textures.")
    mood: str = Field("neutral", description="Lighting and mood guidance.")
    steps: Optional[int] = None
    guidance: Optional[float] = None
    strength: Optional[float] = None
    seed: Optional[int] = None


class PlanRequest(BaseModel):
    user_request: str
    product_name: Optional[str] = None
    product_tags: List[str] = Field(default_factory=list)
    desired_output: Optional[str] = None


class PlanResponse(BaseModel):
    intent: str = "image_generation"
    visual_plan: VisualPlan
    generation_hints: GenerationHints
    plan_id: str = Field(default_factory=lambda: uuid4().hex)
    version: str = "v1"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


class RefineRequest(BaseModel):
    base_plan: PlanResponse
    deltas: List[str]


class RefineResponse(BaseModel):
    intent: str = "image_generation"
    visual_plan: VisualPlan
    generation_hints: GenerationHints
    plan_id: str = Field(default_factory=lambda: uuid4().hex)
    version: str = "v1"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
