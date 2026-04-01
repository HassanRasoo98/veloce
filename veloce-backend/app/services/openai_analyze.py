from __future__ import annotations

import json
import logging
from typing import Literal

from openai import AsyncOpenAI
from pydantic import BaseModel, Field, ValidationError, field_validator, model_validator

from app.config import settings

logger = logging.getLogger(__name__)

ProjectCategory = Literal["Web App", "Mobile", "AI/ML", "Automation", "Integration"]


class ParsedAnalysis(BaseModel):
    features: list[str] = Field(min_length=1)
    category: ProjectCategory
    effort_hours_min: int = Field(gt=0)
    effort_hours_max: int = Field(gt=0)
    tech_stack: list[str] = Field(min_length=1)
    complexity: Literal[1, 2, 3, 4, 5]

    @field_validator("complexity", mode="before")
    @classmethod
    def complexity_int(cls, v: object) -> object:
        if isinstance(v, float):
            return int(v)
        return v

    @model_validator(mode="after")
    def effort_order(self) -> ParsedAnalysis:
        if self.effort_hours_max < self.effort_hours_min:
            raise ValueError("effort_hours_max must be >= effort_hours_min")
        return self


SYSTEM_PROMPT = """You analyze software project briefs for an agency. Respond with a single JSON object only (no markdown), using exactly these keys:
- "features": array of 3-8 short requirement strings derived from the brief
- "category": exactly one of: "Web App", "Mobile", "AI/ML", "Automation", "Integration"
- "effort_hours_min": positive integer (estimated engineering hours, lower bound)
- "effort_hours_max": positive integer (upper bound, must be >= effort_hours_min)
- "tech_stack": array of 3-8 suggested technologies
- "complexity": integer from 1 to 5 (5 = hardest)"""


async def analyze_brief(
    *,
    title: str,
    description_rich: str,
    budget_tier: str,
    timeline_urgency: str,
) -> tuple[ParsedAnalysis | None, str | None]:
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    user_content = (
        f"Title: {title}\n"
        f"Budget tier: {budget_tier}\n"
        f"Timeline urgency: {timeline_urgency}\n\n"
        f"Description:\n{description_rich}"
    )
    last_err: str | None = None
    for attempt in range(3):
        try:
            resp = await client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                response_format={"type": "json_object"},
            )
            raw = resp.choices[0].message.content
            if not raw:
                last_err = "Empty model response"
                continue
            data = json.loads(raw)
            parsed = ParsedAnalysis.model_validate(data)
            return parsed, None
        except (json.JSONDecodeError, ValidationError, ValueError) as e:
            last_err = str(e)
            logger.warning("OpenAI parse attempt %s failed: %s", attempt + 1, e)
        except Exception as e:  # noqa: BLE001
            last_err = str(e)
            logger.warning("OpenAI API attempt %s failed: %s", attempt + 1, e)
    return None, last_err or "Analysis failed"
