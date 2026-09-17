import os
import sys

# Ensure backend root is always present in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, migrate_db
from app import models
from app.routers import ai, applications, application_fields, application_document
from app.routers import business, approvals, roadmap, rag, compliance, government_webhooks

Base.metadata.create_all(bind=engine)
migrate_db()

app = FastAPI(title="BizClear", description="Authoritative Regulatory Approval Discovery & Real Government Application Processing System", version="2.5.0")

origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

for router in [business.router, approvals.router, roadmap.router, rag.router, ai.router, applications.router,
               application_fields.router, application_document.router, compliance.router, government_webhooks.router]:
    app.include_router(router)

@app.get("/")
def root():
    return {"message": "BizClear backend is running", "status": "online", "version": app.version}

@app.get("/api/health")
def health_check():
    from app.ai.service import ai_service
    return {"status": "healthy", "service": "BizClear API", "ai_mode": ai_service.ai_mode,
            "ai_available": ai_service.available, "regulatory_sources": "indexed",
            "government_integrations": "active"}

