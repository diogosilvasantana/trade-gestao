from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from models import Base, engine
from routes import router

# Create DB Tables (Auto-run on start)
Base.metadata.create_all(bind=engine)

# 1. Garantir que a pasta existe
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app = FastAPI(title="Atom Manager V2")

# 2. Servir arquivos estáticos (para conseguir ver a imagem no navegador)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS Setup (Allowing all for MVP convenience)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Atom Manager API is running"}
