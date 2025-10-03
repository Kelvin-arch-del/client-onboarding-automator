# document-processor/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies: poppler-utils for PDF conversion and tesseract-ocr for OCR
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       poppler-utils \
       tesseract-ocr \
       libtesseract-dev \
       libleptonica-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Start the Flask application
CMD ["python", "app.py"]
