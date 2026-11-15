FROM python:3.12-alpine

WORKDIR /app

# Ensure unbuffered output for clean Docker logs
ENV PYTHONUNBUFFERED=1
ENV PORT=8856
ENV DATA_DIR=/app/data

# Copy application files
COPY schema.sql app.py /app/
COPY static /app/static

# Create persistent storage directories
RUN mkdir -p /app/data /app/data/uploads

EXPOSE 8856

VOLUME ["/app/data"]

CMD ["python", "app.py"]
