from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator

class UserBase(BaseModel):
    email: str
    full_name: str
    flat_number: str
    phone_number: Optional[str] = None
    residency_type: Optional[str] = "Owner"
    role: Optional[str] = "member"
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        # Allow .local domains for development
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: str
    society_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
