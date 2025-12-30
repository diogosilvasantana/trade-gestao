from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import Base, engine
from routes import router

# Create DB Tables (Auto-run on start)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Atom Manager V2")

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
