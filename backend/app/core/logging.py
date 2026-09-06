import logging

from app.core.config import settings

_FORMAT = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"


def configure_logging() -> None:
    logging.basicConfig(level=settings.log_level.upper(), format=_FORMAT)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
