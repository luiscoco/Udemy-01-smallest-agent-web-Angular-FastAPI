from pydantic import BaseModel, ConfigDict, Field


class PromptRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    prompt: str = Field(min_length=1, max_length=4000)


class AgentResponse(BaseModel):
    result: str
    num_turns: int
    duration_ms: int
    total_cost_usd: float | None
    is_error: bool
