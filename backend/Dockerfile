FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml ./
COPY src ./src
RUN pip install --no-cache-dir -e .
EXPOSE 5501
ENV PORT=5501
CMD ["uvicorn", "openpip_backend.app:app", "--host", "0.0.0.0", "--port", "5501", "--app-dir", "src"]
