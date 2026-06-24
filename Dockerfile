# Onyx Meridian API — matches the onyx family base (python:3.11-slim, non-root).
FROM python:3.11-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install deps first for better layer caching.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# App source.
COPY meridian ./meridian

# Run as a non-root user.
RUN useradd --create-home --uid 10001 appuser
USER appuser

EXPOSE 8010

CMD ["uvicorn", "meridian.main:app", "--host", "0.0.0.0", "--port", "8010"]
