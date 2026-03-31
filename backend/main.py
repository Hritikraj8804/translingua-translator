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
    session_id: str = "default_session"

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
        session_id=request.session_id,
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
    return [{"id": h.id, "session_id": h.session_id, "input_text": h.input_text, "translated_text": h.translated_text, "source_lang": h.source_lang, "target_lang": h.target_lang, "created_at": h.created_at.isoformat() if h.created_at else None} for h in history]

@app.get("/sessions")
def get_sessions(db: Session = Depends(get_db)):
    # Group locally, avoiding complex inner joins which might fail on some SQLite engine versions
    all_messages = db.query(TranslationCache).order_by(TranslationCache.created_at.desc()).all()
    seen = set()
    unique_sessions = []
    for msg in all_messages:
        if msg.session_id and msg.session_id not in seen:
            seen.add(msg.session_id)
            unique_sessions.append({
                "id": msg.id,
                "session_id": msg.session_id,
                "input_text": msg.input_text,
                "translated_text": msg.translated_text,
                "source_lang": msg.source_lang,
                "target_lang": msg.target_lang,
                "created_at": msg.created_at.isoformat() if msg.created_at else None
            })
    return unique_sessions

@app.get("/session/{session_id}")
def get_session_details(session_id: str, db: Session = Depends(get_db)):
    messages = db.query(TranslationCache).filter(
        TranslationCache.session_id == session_id
    ).order_by(TranslationCache.created_at.asc()).all()
    return [{"id": msg.id, "session_id": msg.session_id, "input_text": msg.input_text, "translated_text": msg.translated_text, "source_lang": msg.source_lang, "target_lang": msg.target_lang, "created_at": msg.created_at.isoformat() if msg.created_at else None} for msg in messages]

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
