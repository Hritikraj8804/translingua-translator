from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, TranslationCache
import services
import uvicorn

app = FastAPI(title="Translingua AI", description="Offline-First Multilingual Translation System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    cached: bool

@app.post("/translate", response_model=TranslationResponse)
def translate(request: TranslationRequest, db: Session = Depends(get_db)):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    # Check Cache
    cached_trans = db.query(TranslationCache).filter(
        TranslationCache.input_text == request.text,
        TranslationCache.source_lang == request.source_lang,
        TranslationCache.target_lang == request.target_lang
    ).first()
    
    if cached_trans:
        return {
            "original_text": request.text,
            "translated_text": cached_trans.translated_text,
            "source_lang": request.source_lang,
            "target_lang": request.target_lang,
            "cached": True
        }
    
    # Perform Translation
    try:
        translated_text = services.translate_text(
            request.text, 
            request.source_lang, 
            request.target_lang
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # Save to Cache
    new_cache = TranslationCache(
        input_text=request.text,
        translated_text=translated_text,
        source_lang=request.source_lang,
        target_lang=request.target_lang
    )
    db.add(new_cache)
    db.commit()
    
    return {
        "original_text": request.text,
        "translated_text": translated_text,
        "source_lang": request.source_lang,
        "target_lang": request.target_lang,
        "cached": False
    }

@app.get("/history")
def get_history(db: Session = Depends(get_db), limit: int = 50):
    history = db.query(TranslationCache).order_by(TranslationCache.created_at.desc()).limit(limit).all()
    return history

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
