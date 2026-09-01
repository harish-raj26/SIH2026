from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models.business import Business
from app.models.approval import Approval
from app.models.application import Application
from app.models.approval_requirement import ApprovalRequirement
from app.models.application_document import ApplicationDocument

from app.routers import ai
from app.routers import applications
from app.routers import application_fields
from app.routers import application_document
from app.routers import application_fields

from app.routers import (
    business,
    approvals,
    roadmap,
    rag
)

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="BizClear AI",
    description="AI-powered business approval and compliance platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(business.router)
app.include_router(approvals.router)
app.include_router(roadmap.router)
app.include_router(rag.router)
app.include_router(ai.router)
app.include_router(applications.router)
app.include_router(application_fields.router)
app.include_router(application_document.router)


@app.get("/")
def root():
    return {
        "message": "BizClear AI backend is running",
        "status": "online"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BizClear AI API"
    }