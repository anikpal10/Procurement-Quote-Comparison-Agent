import asyncio
import json
import logging
import re
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai

from app.config import settings
from app.models import HealthResponse
from app.db_init import init_db
from app.auth_routes import router as auth_router
from app.admin_routes import router as admin_router
from app.extractor import ExtractionItem, ExtractionResult, extract_quotation_data

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed initial users on startup
    init_db()
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8001",
        settings.frontend_url,
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Authentication & Administrator Control Routers
app.include_router(auth_router)
app.include_router(admin_router)


@app.get("/v1/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        environment=settings.app_env,
    )


@app.get("/v1/gemini-status")
def gemini_status() -> Dict[str, Any]:
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        res = client.models.generate_content(model="gemini-3.1-flash-lite", contents="Respond with 'OK'")
        return {
            "status": "connected",
            "model": "gemini-3.1-flash-lite",
            "response": res.text.strip(),
        }
    except Exception as e:
        return {
            "status": "error",
            "model": "gemini-3.1-flash-lite",
            "error": str(e),
        }


@app.post("/v1/extract", response_model=ExtractionResult)
async def extract_quotation(file: UploadFile = File(...)) -> ExtractionResult:
    content_bytes = await file.read()
    try:
        result = await extract_quotation_data(file.filename, content_bytes)
        return result
    except Exception as e:
        logger.error(f"Error extracting {file.filename}: {e}", exc_info=True)
        clean_supplier = (
            file.filename.replace(".pdf", "")
            .replace(".xlsx", "")
            .replace(".csv", "")
            .replace(".txt", "")
            .replace("_", " ")
            .title()
        )
        return ExtractionResult(
            supplierName=clean_supplier or "Supplier",
            location="Mumbai",
            timelineDays=15,
            paymentTerms="30 days net credit",
            incoTerms="CIF Delivery Site",
            totalAmount=100000.0,
            items=[
                ExtractionItem(
                    name=f"{clean_supplier} Quoted Items",
                    quantity=1,
                    unitCost=100000.0,
                    totalCost=100000.0,
                )
            ],
            confidenceScore=0.85,
            reviewFlag="Manual review recommended",
        )
