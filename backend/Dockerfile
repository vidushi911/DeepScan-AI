FROM python:3.11-slim

WORKDIR /app

# System deps for OpenCV, PostGIS client, and python-magic
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libpq-dev gdal-bin libgdal-dev \
    libmagic1 && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --no-cache-dir -e ".[dev]"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
