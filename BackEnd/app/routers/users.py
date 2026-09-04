from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserOut, UserStats
from app.services.prediction_service import get_user_stats

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("/me/stats", response_model=UserStats)
def read_current_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserStats:
    """Powers the Profile page's stat cards (predictions count, best adherence, max loss)."""
    return get_user_stats(db, user=current_user)
