from pydantic import BaseModel

class CodeRequest(BaseModel):
    cuda_code: str
