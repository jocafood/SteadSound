FROM python:3.14-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY requirements.txt .
RUN python -m pip install -r requirements.txt
RUN useradd --create-home --uid 10001 appuser

FROM base AS test
COPY requirements-dev.txt .
RUN python -m pip install -r requirements-dev.txt
COPY . .
USER appuser
CMD ["python", "-m", "pytest", "-q", "-p", "no:cacheprovider"]

FROM base AS runtime
COPY --chown=appuser:appuser app.py .
COPY --chown=appuser:appuser core ./core
COPY --chown=appuser:appuser data ./data
COPY --chown=appuser:appuser scripts ./scripts
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/images', timeout=2).close()"
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
