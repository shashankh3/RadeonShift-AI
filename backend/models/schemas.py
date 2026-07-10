from pydantic import BaseModel, Field

class CodeRequest(BaseModel):
    cuda_code: str

class BenchmarkRequest(BaseModel):
    size: int = Field(default=16777216, ge=1048576, le=33554432)
    iterations: int = Field(default=200, ge=10, le=1000)
