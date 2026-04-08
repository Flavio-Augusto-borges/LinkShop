from typing import Generic, TypeVar

from pydantic import BaseModel


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    meta: PaginationMeta
